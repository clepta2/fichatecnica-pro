/**
 * FichaTecnica Pro — TypeScript Definitions
 * Versão 1.0.0
 */

export interface FichaScores {
  hardware: number;
  tela: number;
  camera: number;
  desempenho: number;
  custoBeneficio?: number;
}

export interface FichaTela {
  polegadas: number;
  resolucao: string;
  densidade: number;
  tipo: string;
  fps?: string;
  protecao?: string;
}

export interface FichaCamera {
  mp: number;
  resolucao?: string;
  sensor?: string;
  abertura?: string;
  estabilizacao?: string;
  flash?: boolean;
  frontal?: string;
  zoom?: string;
  lentesExtras?: string[];
}

export interface FichaBateria {
  tipo: string;
  mah: number;
  carregamentoRapidoWatts?: number;
  carregamentoSemFio?: boolean;
}

export interface FichaSpecs {
  so: string;
  sim: string;
  g5: boolean;
  nfc: boolean;
  dimensoes: string;
  peso: string;
  resistencia?: string;
  processador: string;
  cpu: string;
  gpu: string;
  ram: number;
  ramMax?: number;
  memoria: number;
  memoriaMax?: number;
  expansivel: boolean;
  tela: FichaTela;
  camera: FichaCamera;
  video: string;
  fpsVideo: number;
  videoFrontal?: string;
  wifi: string;
  bluetooth: string;
  usb: string;
  gps: string;
  sensores: string[];
  bateria: FichaBateria;
}

export interface FichaTecnica {
  id: string;
  brand: string;
  name: string;
  line?: string;
  image?: string;
  nid: string;
  price?: number;
  release?: string;
  scores: FichaScores;
  specs: FichaSpecs;
  desc?: string;
}

export interface FichaCatalogoItem {
  nid: string;
  brand: string;
  name: string;
  so: string;
  cameraMp: number;
  ramGb: number;
  cpuGhz: number;
  telaPolegadas: number;
  resolucao: string;
  notaGeral: number;
}

export interface BuscaOptions {
  marca?: string;
  ano?: number;
  apenas5G?: boolean;
  apenasNfc?: boolean;
  ramMin?: number;
  limite?: number;
  pagina?: number;
}

export interface ComparativoResultado {
  aparelhoA: FichaTecnica;
  aparelhoB: FichaTecnica;
  vantagensA: string[];
  vantagensB: string[];
  vencedorGeral: string;
}

export interface FichaTecnicaClientConfig {
  apiKey?: string;
  baseUrl?: string;
  timeoutMs?: number;
  cacheTtlMs?: number;
}

export declare class FichaTecnicaPro {
  constructor(config?: FichaTecnicaClientConfig);
  buscar(termo: string, options?: BuscaOptions): Promise<FichaCatalogoItem[]>;
  obter(idOuNid: string): Promise<FichaTecnica>;
  listarMarcas(): Promise<string[]>;
  comparar(idA: string, idB: string): Promise<ComparativoResultado>;
  obterFotoUrl(nid: string, options?: { raw?: boolean }): string;
}

export default FichaTecnicaPro;
