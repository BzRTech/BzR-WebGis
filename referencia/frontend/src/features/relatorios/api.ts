import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface TecnicoLinha {
  id: number;
  nome: string;
  username: string;
  ativo_campo: boolean;
  last_login: string | null;
  bci_total: number;
  bci_aprovados: number;
  bci_pendentes: number;
  bci_rejeitados: number;
  demandas_total: number;
  demandas_concluidas: number;
  demandas_pendentes: number;
}

export interface RelatorioTecnicos {
  tecnicos: TecnicoLinha[];
  totais: {
    tecnicos: number;
    bci_total: number;
    bci_aprovados: number;
    bci_pendentes: number;
    bci_rejeitados: number;
    demandas_total: number;
    demandas_concluidas: number;
    demandas_pendentes: number;
  };
}

export interface FiltroTecnicos {
  municipio: number | null;
  tecnico: number | null;
  desde: string;
  ate: string;
}

function query(params: Record<string, string | number | null>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== null && v !== "") sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

export function useRelatorioTecnicos(filtro: FiltroTecnicos) {
  return useQuery({
    queryKey: ["relatorio-tecnicos", filtro],
    queryFn: () =>
      api
        .get(`relatorios/tecnicos/${query({ ...filtro })}`)
        .json<RelatorioTecnicos>(),
  });
}

export interface RelatorioGestao {
  municipio: number | null;
  imoveis: {
    total: number;
    por_status: Record<string, number>;
    por_uso: Record<string, number>;
    por_bairro: { bairro: string; total: number }[];
    area_terreno_total: string;
    area_construida_total: string;
  };
  vias: {
    total: number;
    por_tipo: Record<string, number>;
    pavimentadas: number;
    nao_pavimentadas: number;
    revestimento_asfaltico: number;
    nao_informado: number;
  };
  bairros: number;
  quadras: number;
  edificacoes: { total: number; area_construida_total: string };
}

export function useRelatorioGestao(municipio: number | null) {
  return useQuery({
    queryKey: ["relatorio-gestao", municipio],
    queryFn: () =>
      api
        .get(`relatorios/gestao/${query({ municipio })}`)
        .json<RelatorioGestao>(),
  });
}
