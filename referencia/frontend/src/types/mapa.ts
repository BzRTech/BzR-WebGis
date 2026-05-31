export type StatusImovel =
  | "sem_coleta"
  | "em_coleta"
  | "enviado"
  | "aprovado"
  | "rejeitado"
  | "arquivado";

export type UsoImovel =
  | "residencial"
  | "comercial"
  | "industrial"
  | "servicos"
  | "territorial"
  | "misto"
  | "outro";

export interface LoteProperties {
  id: number;
  inscricao_cadastral: string;
  status_atual: StatusImovel;
  uso: UsoImovel;
  bci_id: number | null;
  bci_status: string | null;
}

export type Pavimentacao =
  | "pavimentada"
  | "nao_pavimentada"
  | "asfaltico"
  | "nao_informado";

export interface LoteFeature {
  type: "Feature";
  geometry: { type: string; coordinates: unknown };
  properties: LoteProperties;
}

export interface LotesFC {
  type: "FeatureCollection";
  features: LoteFeature[];
}

export const STATUS_INFO: Record<
  StatusImovel,
  { label: string; cor: string }
> = {
  sem_coleta: { label: "Sem coleta", cor: "#9a9a9a" },
  em_coleta: { label: "Em coleta (rascunho)", cor: "#FFD500" },
  enviado: { label: "Enviado p/ aprovação", cor: "#A36A10" },
  aprovado: { label: "BCI concluído", cor: "#3E7D44" },
  rejeitado: { label: "Rejeitado", cor: "#B4351E" },
  arquivado: { label: "Arquivado", cor: "#555555" },
};

export const USO_INFO: Record<UsoImovel, { label: string; cor: string }> = {
  residencial: { label: "Residencial", cor: "#3E7D44" },
  comercial: { label: "Comercial", cor: "#2563EB" },
  industrial: { label: "Industrial", cor: "#7C3AED" },
  servicos: { label: "Serviços", cor: "#0EA5E9" },
  territorial: { label: "Territorial", cor: "#A36A10" },
  misto: { label: "Misto", cor: "#DB2777" },
  outro: { label: "Outro", cor: "#9a9a9a" },
};

export const PAVIMENTACAO_INFO: Record<
  Pavimentacao,
  { label: string; cor: string }
> = {
  pavimentada: { label: "Pavimentada", cor: "#3E7D44" },
  nao_pavimentada: { label: "Não pavimentada", cor: "#B4351E" },
  asfaltico: { label: "Revestimento asfáltico", cor: "#2563EB" },
  nao_informado: { label: "Não informado", cor: "#9a9a9a" },
};
