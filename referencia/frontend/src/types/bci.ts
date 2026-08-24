export type BCIStatus =
  | "rascunho"
  | "enviado"
  | "aprovado"
  | "rejeitado"
  | "arquivado";

export const BCI_STATUS_LABEL: Record<BCIStatus, string> = {
  rascunho: "Rascunho",
  enviado: "Enviado",
  aprovado: "Aprovado",
  rejeitado: "Rejeitado",
  arquivado: "Arquivado",
};

export const BCI_STATUS_TONE: Record<BCIStatus, "ok" | "warn" | "err" | ""> = {
  rascunho: "",
  enviado: "warn",
  aprovado: "ok",
  rejeitado: "err",
  arquivado: "",
};

export type FotoTipo = "geral" | "croqui";

export interface FotoBCI {
  id: number;
  imagem: string;
  thumbnail: string | null;
  legenda: string;
  tipo: FotoTipo;
  created_at: string;
}

export interface BCI {
  id: number;
  imovel: number;
  imovel_inscricao: string;
  municipio: number;
  tecnico: number | null;
  tecnico_nome: string | null;
  status: BCIStatus;
  dados: Record<string, unknown>;
  area_terreno_m2: string | null;
  area_construida_m2: string | null;
  uso: string;
  observacoes: string;
  precisao_gps_m: string | null;
  motivo_rejeicao: string;
  fotos: FotoBCI[];
  enviado_em: string | null;
  aprovado_em: string | null;
  created_at: string;
}

export interface ImovelLite {
  id: number;
  inscricao_cadastral: string;
  numero: string;
}

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
