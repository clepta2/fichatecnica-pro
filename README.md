# 📱 FichaTecnica Pro — SDK & API de Especificações de Smartphones

> **A maior e mais precisa API de fichas técnicas, comparativos de hardware e fotos de alta resolução de dispositivos móveis do Brasil (7.700+ modelos e 119 marcas).**

[![Status](https://img.shields.io/badge/Status-Cloudflare%20Edge%20API-success.svg)](#)
[![Modelos](https://img.shields.io/badge/Modelos-7.707%2B%20Aparelhos-blue.svg)](#)
[![Marcas](https://img.shields.io/badge/Marcas-119%20Fabricantes-indigo.svg)](#)
[![Latency](https://img.shields.io/badge/Latência-<50ms-cyan.svg)](#)
[![Auth](https://img.shields.io/badge/Auth-RFC%206750%20Bearer-orange.svg)](#)
[![License](https://img.shields.io/badge/License-MIT%20SDK-purple.svg)](LICENSE)

---

## ⚡ O que é o FichaTecnica Pro?

O **FichaTecnica Pro** é uma solução de infraestrutura em nuvem desenvolvida pela OZPro Enterprise que transforma uma gigantesca base estruturada de especificações técnicas de smartphones em uma **API REST ultrarrápida de borda (Cloudflare Edge + R2 + KV + PostgreSQL Supabase)**.

Desenvolvido para abastecer **e-commerces, sistemas ERP, plataformas de compra e venda de aparelhos usados, assistências técnicas e comparadores de tecnologia**, o serviço elimina a necessidade de você manter ou atualizar tabelas gigantescas no seu banco de dados local.

---

## 🔒 Modelo de Acesso & Licenciamento

> [!IMPORTANT]
> **Este repositório público contém o SDK oficial (cliente JavaScript/TypeScript), contratos de tipos e a documentação completa de integração.**
> 
> A base bruta de dados consolidada (com mais de 9 MB de especificações estruturadas) e o pipeline de imagens de alta resolução ficam salvos em nós de borda da Cloudflare e são acessados mediante requisições autenticadas.
> 
> **Para obter uma Chave de API de Produção (`ft_live_...`) ou cotas de requisições por crédito, adquira seu acesso no Marketplace oficial:**
> 👉 **[Acessar Ponte API Marketplace](https://ponte.ozpro.com.br)**

---

## 🚀 Como Integrar em seu Projeto

### 1. Instalação via NPM / Yarn / Bun

```bash
npm install fichatecnica-pro
```

*(Ou utilize o arquivo cliente `fichatecnica-pro.js` diretamente no seu frontend ou backend Node.js)*.

### 2. Uso Rápido com o SDK

```javascript
import FichaTecnicaPro from 'fichatecnica-pro';

const ft = new FichaTecnicaPro({
  apiKey: 'ft_live_SEU_TOKEN_AQUI' // Obtenha no Ponte API Marketplace
});

// 1. Busca avançada no catálogo
const resultados = await ft.buscar('Galaxy S26 Ultra', { apenas5G: true });
console.log('Resultados encontrados:', resultados);

// 2. Obter especificações completas de um smartphone
const aparelho = await ft.obter('10320'); // via NID ou Slug
console.log('Processador:', aparelho.specs.processador);
console.log('Câmera:', aparelho.specs.camera.mp, 'MP');
console.log('Bateria:', aparelho.specs.bateria.mah, 'mAh');

// 3. Comparativo técnico direto lado a lado
const comparativo = await ft.comparar('samsung-galaxy-s26-ultra', 'apple-iphone-18-pro-max');
console.log('Vantagens do Aparelho A:', comparativo.vantagensA);
console.log('Vencedor técnico geral:', comparativo.vencedorGeral);

// 4. URL de foto de alta resolução servida via Cloudflare R2
const fotoUrl = ft.obterFotoUrl('10320', { raw: true });
console.log('URL da foto:', fotoUrl);
```

---

## 🔑 Autenticação Oficial (Padrão RFC 6750 & HTTP Headers)

A API adota o padrão internacional **RFC 6750 ****** para todas as requisições de produção.

### Cabeçalhos aceitos:

```http
Authorization: ******
```
*Ou alternativamente:*
```http
x-api-key: ft_live_SEU_TOKEN_AQUI
```

### Prefixos de Chave por Categoria de Serviço:

| Prefixo de Chave | Nível de Acesso | Descrição |
| :--- | :--- | :--- |
| `ft_sandbox_...` | **Sandbox Gratuito** | Retorna modelos de teste e especificações de amostra para homologação. |
| `ft_credit_...` | **Por Crédito (Pré-pago)** | Cobrança por consulta realizada (inicia em R$ 0,02 / chamada). |
| `ft_pro_...` | **Plano Mensal Pro** | Vazão de 300 RPM, chamadas ilimitadas e cache em borda ativado. |
| `ft_enterprise_...`| **Enterprise / Master** | Vazão dedicada até 3.000 RPM, webhooks e sincronização de estoque. |

---

## 📡 Documentação Completa dos Endpoints

Base URL Oficial de Borda: `https://api.ozpro.com.br` (ou conforme provisionamento do seu subdomínio).

### 1. `GET /api/fichas/busca`
Busca inteligentes de modelos por texto livre, fabricante ou filtros técnicos.

* **Query Params:**
  * `q` (string): Nome ou termo de busca (ex: `"Galaxy S26"`, `"iPhone 18"`).
  * `marca` (string): Filtra por fabricante (ex: `"Apple"`, `"Samsung"`, `"Xiaomi"`).
  * `ano` (number): Filtra por ano de lançamento.
  * `apenas5g` (boolean): `true` para listar somente aparelhos 5G.
  * `ramMin` (number): Filtro por memória RAM mínima em GB.
  * `limite` (number): Quantidade de itens por página (padrão: 20, máx: 100).

* **Exemplo de Resposta (200 OK):**
```json
{
  "ok": true,
  "total": 1,
  "data": [
    {
      "nid": "10320",
      "brand": "Samsung",
      "name": "Galaxy S26 Ultra",
      "so": "Android 16",
      "cameraMp": 200,
      "ramGb": 16,
      "cpuGhz": 4.74,
      "telaPolegadas": 6.9,
      "resolucao": "1440x3120",
      "notaGeral": 9.2,
      "urlReferencia": "https://www.tudocelular.com/Samsung/fichas-tecnicas/n10320/Samsung-Galaxy-S26-Ultra.html"
    }
  ]
}
```

---

### 2. `GET /api/fichas/:id`
Retorna a Ficha Técnica completa e detalhada do smartphone (dimensões, chipset, câmeras, sensores e pontuações).

* **Parâmetro de URL:** `:id` (Slug amigável ou NID numérico).
* **Exemplo de Resposta (200 OK):**
```json
{
  "ok": true,
  "data": {
    "id": "samsung-galaxy-s26-ultra",
    "brand": "Samsung",
    "name": "Galaxy S26 Ultra",
    "line": "Galaxy S",
    "nid": "10320",
    "price": 6749,
    "release": "2026/1",
    "scores": {
      "hardware": 9.2,
      "tela": 9.1,
      "camera": 8.7,
      "desempenho": 9.3
    },
    "specs": {
      "so": "Android 16 · One UI 8.5",
      "sim": "Dual SIM",
      "g5": true,
      "nfc": true,
      "dimensoes": "163.6 x 78.1 x 7.9 mm",
      "peso": "214 g",
      "resistencia": "IP68",
      "processador": "Snapdragon 8 Elite Gen 5 for Galaxy",
      "cpu": "2x 4.74 GHz + 6x 3.62 GHz",
      "gpu": "Adreno 840",
      "ram": 16,
      "memoria": 256,
      "expansivel": false,
      "tela": {
        "polegadas": 6.9,
        "resolucao": "3120 x 1440",
        "densidade": 500,
        "tipo": "Dynamic AMOLED 2X",
        "fps": "120 Hz"
      },
      "camera": {
        "mp": 200,
        "resolucao": "16330 x 12247",
        "sensor": "1/1.3\"",
        "abertura": "F 1.4",
        "estabilizacao": "Óptica OIS",
        "flash": true,
        "frontal": "12 MP F 2.2"
      },
      "video": "8K UHD",
      "fpsVideo": 30,
      "wifi": "Wi-Fi 7",
      "bluetooth": "6.0 com A2DP/LE",
      "usb": "Type-C 3.2",
      "sensores": [
        "Acelerômetro",
        "Giroscópio",
        "Bússola",
        "Impressão digital",
        "Sensor de proximidade",
        "Barômetro"
      ],
      "bateria": {
        "tipo": "Li-Po",
        "mah": 5000
      }
    },
    "desc": "Super flagship Samsung para 2026 com Snapdragon 8 Elite Gen 5, 16 GB RAM e câmera de 200 MP aprimorada."
  }
}
```

---

### 3. `GET /api/fichas/comparar`
Compara dois modelos lado a lado com cálculo automatizado de vantagens técnicas.

* **Query Params:** `a=10320&b=9712`

---

### 4. `GET /api/ficha-foto`
Entrega a imagem oficial do aparelho armazenada no bucket **Cloudflare R2** com cache global e CDN de alta velocidade.

* **Query Params:**
  * `nid` (string): Identificador do aparelho.
  * `raw` (opcional, `1`): Retorna diretamente o binário `image/jpeg` otimizado com cabeçalho de cache de 30 dias (`Cache-Control: public, max-age=2592000`).

---

## 💻 Exemplos em Outras Linguagens

### cURL

```bash
curl -X GET "https://api.ozpro.com.br/api/fichas/10320" \
  -H "Authorization: ****** \
  -H "Accept: application/json"
```

### Python (`requests`)

```python
import requests

url = "https://api.ozpro.com.br/api/fichas/busca"
headers = {
    "Authorization": "******",
    "Accept": "application/json"
}
params = {"q": "iPhone 18", "apenas5g": "true"}

response = requests.get(url, headers=headers, params=params)
data = response.json()
print(f"Total encontrado: {data.get('total')}")
```

### PHP

```php
<?php
$apiKey = "ft_live_SEU_TOKEN_AQUI";
$ch = curl_init("https://api.ozpro.com.br/api/fichas/10320");
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Authorization: ****** . $apiKey,
    "Accept: application/json"
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
curl_close($ch);

$dados = json_decode($response, true);
print_r($dados);
```

---

## 📊 Matriz de Tarifas no Ponte API Marketplace

| Modalidade | Preço Base | Vantagem Principal |
| :--- | :--- | :--- |
| **Por Crédito** | A partir de **R$ 0,02** por consulta | Pague somente pelo que consultar. Sem mensalidade ou fidelidade. |
| **Plano Starter** | **R$ 29,90** / mês | Até 2.000 requisições/mês com 60 RPM. Ideal para catálogos médios. |
| **Plano Pro** | **R$ 79,90** / mês | Até 20.000 requisições/mês com 300 RPM e comparador em tempo real. |
| **Plano Enterprise** | Sob consulta | Consultas ilimitadas, rate-limit dedicado e suporte SLA prioritário. |

Contrate em segundos via PIX dinâmico com ativação imediata no painel:  
👉 **[https://ponte.ozpro.com.br](https://ponte.ozpro.com.br)**

---

## 🌐 Infraestrutura Cloudflare Edge CDN & Deploy Automático

A API FichaTecnica Pro roda nativamente na infraestrutura de borda da **Cloudflare** através de Workers, R2 Storage e cache global Anycast em mais de 300 data centers pelo mundo.

### 1. Inclusão Direta via CDN no Navegador
Para sites e e-commerces que dispensam empacotadores (Node/Webpack/Vite):

```html
<!-- CDN de Alta Velocidade Cloudflare -->
<script src="https://cdn.ozpro.com.br/fichatecnica-pro.min.js"></script>
<script>
  const ft = new FichaTecnicaPro({ apiKey: 'ft_live_SEU_TOKEN_AQUI' });
  ft.obter('10320').then(ficha => console.log(ficha));
</script>
```

### 2. Configuração do Cloudflare Worker (`wrangler.toml`)
O arquivo `wrangler.toml` incluído no repositório está configurado para a conta Cloudflare oficial:
- **Account ID:** `bc4b376a696e3280f28cf5df7fc0ff88`
- **R2 Bucket:** `fichatecnica-fotos` (Pipeline de fotos dos aparelhos)
- **Cache-Control:** `public, max-age=86400, s-maxage=604800` (Respostas sub-50ms)

### 3. Deploy Contínuo via GitHub Actions
O repositório conta com o pipeline automatizado em `.github/workflows/deploy.yml`. A cada `push` na branch `main`:
1. O GitHub Actions roda em container Ubuntu;
2. Autentica na Cloudflare via secrets criptografados `CLOUDFLARE_API_TOKEN` e `CLOUDFLARE_ACCOUNT_ID`;
3. Faz o deploy do Worker e da camada CDN com zero downtime.

---

## 🛡️ Segurança & Confiabilidade

* **Isolamento de Infraestrutura:** Dados hospedados em Cloudflare Workers com proteção nativa contra DDoS e web scraping não autorizado.
* **Dados Higienizados:** Apenas dados e especificações técnicas de aparelhos oficiais validados por curadoria.
* **Cache em Camadas:** Consultas repetidas respondem com latência inferior a **15ms** através da rede Anycast da Cloudflare.

---

## 📄 Licença

O SDK e os exemplos deste repositório estão licenciados sob a licença [MIT](LICENSE).  
O serviço de API, banco de dados hospedado em nuvem e distribuição de mídia são propriedades da **OZPro Enterprise Cloud**.
