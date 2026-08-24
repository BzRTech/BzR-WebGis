import { useMutation, useQuery } from "@tanstack/react-query";
import type { FeatureCollection } from "geojson";
import { api } from "@/lib/api";
import { useUIStore } from "@/stores/uiStore";
import type { LotesFC } from "@/types/mapa";

export interface MunicipioLite {
  id: number;
  nome: string;
  uf: string;
  cor?: string;
}

export function useMunicipios() {
  return useQuery({
    queryKey: ["municipios", "lite"],
    staleTime: 5 * 60_000,
    queryFn: () =>
      api
        .get("municipios/")
        .json<{ results: MunicipioLite[] }>()
        .then((r) => r.results),
  });
}

export function useLotes() {
  const municipio = useUIStore((s) => s.municipioFiltro);
  return useQuery({
    queryKey: ["lotes-geojson", municipio],
    staleTime: 60_000,
    queryFn: () =>
      api
        .get(
          municipio
            ? `mapa/lotes.geojson?municipio=${municipio}`
            : "mapa/lotes.geojson",
        )
        .json<LotesFC>(),
  });
}

export type CamadaTipo =
  | "bairros"
  | "quadras"
  | "logradouros"
  | "edificacoes";

export interface Contagens {
  lotes: number;
  bairros: number;
  quadras: number;
  logradouros: number;
  edificacoes: number;
}

/** Contagem de feições por camada do município ativo (painel de camadas). */
export function useContagens() {
  const municipio = useUIStore((s) => s.municipioFiltro);
  return useQuery({
    queryKey: ["mapa-contagens", municipio],
    staleTime: 60_000,
    queryFn: () =>
      api
        .get(
          municipio
            ? `mapa/contagens?municipio=${municipio}`
            : "mapa/contagens",
        )
        .json<Contagens>(),
  });
}

/** GeoJSON de uma camada auxiliar (bairros, quadras…) do município ativo. */
export function useCamadaGeoJSON(tipo: CamadaTipo, enabled: boolean) {
  const municipio = useUIStore((s) => s.municipioFiltro);
  return useQuery({
    queryKey: ["camada-geojson", tipo, municipio],
    enabled,
    staleTime: 60_000,
    queryFn: () =>
      api
        .get(
          municipio
            ? `mapa/${tipo}.geojson?municipio=${municipio}`
            : `mapa/${tipo}.geojson`,
        )
        .json<FeatureCollection>(),
  });
}

export interface ProprietarioDetalhe {
  id: number;
  tipo: string;
  nome: string;
  cpf_cnpj: string;
  email: string;
  telefone: string;
  endereco_correspondencia: string;
}

export interface ImovelDetalhe {
  id: number;
  inscricao_cadastral: string;
  numero: string;
  complemento: string;
  area_terreno_m2: string | null;
  area_construida_m2: string | null;
  uso: string;
  status_atual: string;
  ultimo_bci: { id: number; status: string } | null;
  proprietario_detalhe: ProprietarioDetalhe | null;
}

export function useImovel(id: number | null) {
  return useQuery({
    queryKey: ["imovel", id],
    enabled: id != null,
    queryFn: () => api.get(`imoveis/${id}/`).json<ImovelDetalhe>(),
  });
}

export interface CampoInfo {
  campo: string;
  distintos: number;
  exemplo: string;
}
export interface ImportResumo {
  criados: number;
  atualizados: number;
  ignorados: number;
  total: number;
  erros: string[];
  campos?: CampoInfo[];
  /** Quebra dos ignorados por motivo (ex.: sem_lote, geom_invalida). */
  ignorados_motivos?: Record<string, number>;
}

export type ImportTipo =
  | "lotes"
  | "bairros"
  | "quadras"
  | "logradouros"
  | "edificacoes";

export interface ImportarParams {
  arquivo: File;
  municipio: number;
  /** Campo que identifica a chave da feição (nome/código/inscrição). */
  campo_chave?: string;
  /** Específico de logradouros: coluna que indica o tipo (rua, av…). */
  campo_tipo?: string;
  /** Específico de logradouros: coluna com o tipo de pavimentação. */
  campo_pavimentacao?: string;
  /** Específico de bairros: coluna com o código do bairro (opcional). */
  campo_codigo?: string;
}

const ENDPOINT: Record<ImportTipo, string> = {
  lotes: "imoveis/importar/",
  bairros: "bairros/importar/",
  quadras: "quadras/importar/",
  logradouros: "logradouros/importar/",
  edificacoes: "edificacoes/importar/",
};

const CAMPO_CHAVE_PARAM: Record<ImportTipo, string | null> = {
  lotes: "campo_inscricao",
  bairros: "campo_nome",
  quadras: "campo_codigo",
  logradouros: "campo_nome",
  edificacoes: "campo_inscricao",
};

export function useImportarFeicoes(tipo: ImportTipo) {
  return useMutation({
    mutationFn: async (params: ImportarParams) => {
      const form = new FormData();
      form.append("arquivo", params.arquivo);
      form.append("municipio", String(params.municipio));
      const chaveParam = CAMPO_CHAVE_PARAM[tipo];
      if (chaveParam && params.campo_chave)
        form.append(chaveParam, params.campo_chave);
      if (tipo === "logradouros" && params.campo_tipo)
        form.append("campo_tipo", params.campo_tipo);
      if (tipo === "logradouros" && params.campo_pavimentacao)
        form.append("campo_pavimentacao", params.campo_pavimentacao);
      if (
        (tipo === "bairros" || tipo === "logradouros") &&
        params.campo_codigo
      )
        form.append("campo_codigo", params.campo_codigo);
      // A importação é síncrona no servidor e arquivos grandes (shapefiles
      // com milhares de feições) levam tempo no free tier. O timeout global
      // (60s) abortaria antes do backend terminar; acompanhamos o limite do
      // gunicorn (120s) para o arquivo realmente chegar ao banco.
      return api
        .post(ENDPOINT[tipo], { body: form, timeout: 120000 })
        .json<ImportResumo>();
    },
  });
}

