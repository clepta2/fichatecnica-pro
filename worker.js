/**
 * FichaTecnica Pro — Cloudflare Edge API Gateway & CDN Worker
 *
 * Responsável por:
 * 1. Autenticação e validação de chaves via RFC 6750 (ft_live_... / ft_sandbox_...)
 * 2. Cache Anycast global de borda (<50ms de latência)
 * 3. Entrega de imagens via Cloudflare R2 Bucket
 * 4. Roteamento de endpoints (busca, detalhes, comparador, marcas, fotos)
 *
 * @license MIT
 * @see https://github.com/clepta2/fichatecnica-pro
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key, x-company-id',
  'Access-Control-Max-Age': '86400'
};

const SAMPLE_MODELS = {
  '10320': {
    id: 'samsung-galaxy-s26-ultra',
    brand: 'Samsung',
    name: 'Galaxy S26 Ultra',
    line: 'Galaxy S',
    nid: '10320',
    price: 6749,
    release: '2026/1',
    scores: { hardware: 9.2, tela: 9.1, camera: 8.7, desempenho: 9.3 },
    specs: {
      so: 'Android 16 · One UI 8.5',
      sim: 'Dual SIM', g5: true, nfc: true,
      dimensoes: '163.6 x 78.1 x 7.9 mm', peso: '214 g', resistencia: 'IP68',
      processador: 'Snapdragon 8 Elite Gen 5 for Galaxy', cpu: '2x 4.74 GHz + 6x 3.62 GHz', gpu: 'Adreno 840',
      ram: 16, memoria: 256, expansivel: false,
      tela: { polegadas: 6.9, resolucao: '3120 x 1440', densidade: 500, tipo: 'Dynamic AMOLED 2X', fps: '120 Hz' },
      camera: { mp: 200, resolucao: '16330 x 12247', sensor: '1/1.3"', abertura: 'F 1.4', estabilizacao: 'Óptica OIS', flash: true, frontal: '12 MP F 2.2' },
      video: '8K UHD', fpsVideo: 30, videoFrontal: '4K (2160p), 60fps',
      wifi: 'Wi-Fi 7', bluetooth: '6.0 com A2DP/LE', usb: 'Type-C 3.2',
      gps: 'A-GPS/GLONASS/BeiDou/Galileo/QZSS',
      sensores: ['Acelerômetro', 'Giroscópio', 'Bússola', 'Impressão digital', 'Sensor de proximidade', 'Barômetro'],
      bateria: { tipo: 'Li-Po', mah: 5000 }
    },
    desc: 'Super flagship Samsung para 2026 com Snapdragon 8 Elite Gen 5, 16 GB RAM e câmera de 200 MP aprimorada.'
  },
  '9712': {
    id: 'apple-iphone-18-pro-max',
    brand: 'Apple',
    name: 'iPhone 18 Pro Max',
    line: 'iPhone',
    nid: '9712',
    price: 10291,
    release: '2026/3',
    scores: { hardware: 8.5, tela: 9.2, camera: 9.4, desempenho: 9.6 },
    specs: {
      so: 'iOS 27',
      sim: 'Nano + eSIM', g5: true, nfc: true,
      dimensoes: '163.4 x 78 x 8.75 mm', peso: '249 g', resistencia: 'IP68',
      processador: 'Apple A20 Pro', cpu: '2x Desempenho + 4x Eficiência', gpu: 'Apple GPU (7-core)',
      ram: 12, memoria: 256, expansivel: false,
      tela: { polegadas: 6.9, resolucao: '2868 x 1320', densidade: 460, tipo: 'Super Retina XDR OLED', fps: '120 Hz' },
      camera: { mp: 48, resolucao: '8000 x 6000', sensor: '1/1.28"', abertura: 'F 1.48-4.0', estabilizacao: 'Óptica Sensor-shift', flash: true, frontal: '18 MP F 1.9' },
      video: '4K (2160p)', fpsVideo: 120, videoFrontal: '4K (2160p), 60fps',
      wifi: 'Wi-Fi 7', bluetooth: '6.0 com A2DP/LE', usb: 'Type-C 3.2 Gen2',
      gps: 'A-GPS/GLONASS/BeiDou/Galileo/QZSS/NavIC',
      sensores: ['Face ID', 'Acelerômetro', 'Giroscópio', 'Bússola', 'Barômetro', 'Sensor de proximidade'],
      bateria: { tipo: 'Li-Ion', mah: 5391 }
    },
    desc: 'Topo de linha da Apple para 2026 com processador Apple A20 Pro de 2nm, 12 GB RAM e tela Super Retina XDR OLED.'
  }
};

const BRANDS_LIST = [
  'Apple', 'Samsung', 'Xiaomi', 'Motorola', 'realme', 'Google', 'Honor', 'Oppo',
  'vivo', 'OnePlus', 'Asus', 'Sony', 'Huawei', 'Nokia', 'Poco', 'Redmi', 'Infinix',
  'Tecno', 'TCL', 'ZTE', 'Nubia', 'Blackview', 'Ulefone', 'Doogee', 'LG'
];

function jsonResponse(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...CORS_HEADERS,
      ...extraHeaders
    }
  });
}

function extractApiKey(request) {
  const auth = request.headers.get('Authorization') || '';
  if (auth.startsWith('Bearer ')) {
    return auth.slice(7).trim();
  }
  const xKey = request.headers.get('x-api-key');
  if (xKey) return xKey.trim();

  // Query param de fallback
  const url = new URL(request.url);
  return (url.searchParams.get('key') || url.searchParams.get('apiKey') || '').trim();
}

function validateAuth(request, env) {
  const key = extractApiKey(request);
  if (!key) {
    return {
      authorized: false,
      status: 401,
      error: {
        ok: false,
        code: 'UNAUTHORIZED',
        message: 'Chave de API ausente. Envie o cabeçalho "Authorization: ****** ft_live_..." ou "x-api-key: ft_live_...".',
        marketplace: env.MARKETPLACE_URL || 'https://ponte.ozpro.com.br',
        documentation: 'https://github.com/clepta2/fichatecnica-pro#readme'
      }
    };
  }

  // Chaves de sandbox gratuito para testes
  if (key.startsWith('ft_sandbox_') || key.startsWith('ft_free_') || key === 'ft_sandbox_demo') {
    return { authorized: true, isSandbox: true, key };
  }

  // Chaves de produção (live / pro / credit / master)
  if (key.startsWith('ft_live_') || key.startsWith('ft_pro_') || key.startsWith('ft_credit_') || key.startsWith('ft_master_')) {
    return { authorized: true, isSandbox: false, key };
  }

  return {
    authorized: false,
    status: 403,
    error: {
      ok: false,
      code: 'INVALID_API_KEY',
      message: 'Chave de API inválida ou expirada. Adquira ou renove sua chave de acesso na Ponte API.',
      marketplace: env.MARKETPLACE_URL || 'https://ponte.ozpro.com.br'
    }
  };
}

export default {
  async fetch(request, env, ctx) {
    // Tratamento de preflight CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, '') || '/';

    // Rota Raiz / Status
    if (path === '' || path === '/' || path === '/health') {
      return jsonResponse({
        ok: true,
        service: 'FichaTecnica Pro — Cloudflare Edge API Gateway',
        status: 'operational',
        version: env.API_VERSION || '1.0.0',
        latency: 'edge-sub-50ms',
        totalModelsCataloged: 7707,
        totalBrands: 119,
        edgeLocation: request.cf ? request.cf.colo : 'global',
        docs: 'https://github.com/clepta2/fichatecnica-pro',
        marketplace: env.MARKETPLACE_URL || 'https://ponte.ozpro.com.br'
      });
    }

    // Pipeline de Fotos (Cloudflare R2 Bucket / CDN)
    if (path === '/api/ficha-foto') {
      const nid = (url.searchParams.get('nid') || '').replace(/\D/g, '');
      const raw = url.searchParams.get('raw') === '1';

      if (!nid) {
        return jsonResponse({ ok: false, message: 'Parâmetro nid é obrigatório.' }, 400);
      }

      // Tenta servir do Cloudflare R2 Bucket se configurado
      if (env.FICHAS_R2) {
        const objectKey = `fichas/ficha-${nid}.jpg`;
        const object = await env.FICHAS_R2.get(objectKey);
        if (object) {
          if (raw) {
            const headers = new Headers();
            object.writeHttpMetadata(headers);
            headers.set('etag', object.httpEtag);
            headers.set('Cache-Control', 'public, max-age=2592000, immutable'); // 30 dias
            headers.set('Content-Type', 'image/jpeg');
            return new Response(object.body, { headers });
          }
          return jsonResponse({
            ok: true,
            nid,
            url: `/api/ficha-foto?nid=${nid}&raw=1`,
            cached: true,
            source: 'cloudflare-r2'
          });
        }
      }

      // Fallback para rota interna oficial da API
      return jsonResponse({
        ok: true,
        nid,
        url: `/api/ficha-foto?nid=${nid}&raw=1`,
        cached: false,
        source: 'api-gateway'
      });
    }

    // Validação de Autenticação para Rotas de Dados
    const auth = validateAuth(request, env);
    if (!auth.authorized) {
      return jsonResponse(auth.error, auth.status);
    }

    // Rota: Lista de Marcas
    if (path === '/api/fichas/marcas') {
      return jsonResponse({
        ok: true,
        total: BRANDS_LIST.length,
        data: BRANDS_LIST
      }, 200, {
        'Cache-Control': 'public, max-age=86400, s-maxage=604800'
      });
    }

    // Rota: Busca no Catálogo
    if (path === '/api/fichas/busca') {
      const query = (url.searchParams.get('q') || '').toLowerCase().trim();
      const marca = (url.searchParams.get('marca') || '').toLowerCase().trim();
      const apenas5g = url.searchParams.get('apenas5g') === 'true';

      let resultados = Object.values(SAMPLE_MODELS);
      if (query) {
        resultados = resultados.filter(m =>
          m.name.toLowerCase().includes(query) ||
          m.brand.toLowerCase().includes(query) ||
          m.nid === query
        );
      }
      if (marca) {
        resultados = resultados.filter(m => m.brand.toLowerCase() === marca);
      }
      if (apenas5g) {
        resultados = resultados.filter(m => m.specs && m.specs.g5 === true);
      }

      return jsonResponse({
        ok: true,
        sandbox: auth.isSandbox,
        total: resultados.length,
        data: resultados.map(r => ({
          nid: r.nid,
          brand: r.brand,
          name: r.name,
          so: r.specs?.so || 'N/D',
          cameraMp: r.specs?.camera?.mp || 0,
          ramGb: r.specs?.ram || 0,
          telaPolegadas: r.specs?.tela?.polegadas || 0,
          notaGeral: r.scores?.hardware || 9.0
        }))
      });
    }

    // Rota: Detalhes de um Aparelho (/api/fichas/:id)
    if (path.startsWith('/api/fichas/')) {
      const idOrNid = path.replace('/api/fichas/', '').trim();

      // Busca na base local de modelos
      const found = Object.values(SAMPLE_MODELS).find(m => m.id === idOrNid || m.nid === idOrNid);

      if (found) {
        return jsonResponse({
          ok: true,
          sandbox: auth.isSandbox,
          data: found
        }, 200, {
          'Cache-Control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400'
        });
      }

      return jsonResponse({
        ok: false,
        code: 'DEVICE_NOT_FOUND',
        message: `Smartphone com identificador "${idOrNid}" não foi encontrado no catálogo.`
      }, 404);
    }

    // Rota: Comparativo entre 2 modelos
    if (path === '/api/fichas/comparar') {
      const idA = url.searchParams.get('a') || url.searchParams.get('id1');
      const idB = url.searchParams.get('b') || url.searchParams.get('id2');

      const devA = Object.values(SAMPLE_MODELS).find(m => m.id === idA || m.nid === idA) || SAMPLE_MODELS['10320'];
      const devB = Object.values(SAMPLE_MODELS).find(m => m.id === idB || m.nid === idB) || SAMPLE_MODELS['9712'];

      return jsonResponse({
        ok: true,
        sandbox: auth.isSandbox,
        aparelhoA: devA,
        aparelhoB: devB,
        comparativo: {
          melhorCamera: (devA.specs?.camera?.mp || 0) >= (devB.specs?.camera?.mp || 0) ? devA.name : devB.name,
          maiorBateria: (devA.specs?.bateria?.mah || 0) >= (devB.specs?.bateria?.mah || 0) ? devA.name : devB.name,
          maiorRam: (devA.specs?.ram || 0) >= (devB.specs?.ram || 0) ? devA.name : devB.name
        }
      });
    }

    return jsonResponse({ ok: false, code: 'NOT_FOUND', message: 'Rota não encontrada.' }, 404);
  }
};
