import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, submitMutation } from "@/lib/api";
import type { Paginated } from "@/types/bci";
import type { Me } from "@/types/auth";

export type DemandaStatus =
  | "pendente"
  | "em_andamento"
  | "concluida"
  | "cancelada";
export type DemandaPrioridade = "baixa" | "media" | "alta" | "urgente";

export interface Demanda {
  id: number;
  imovel: number | null;
  imovel_inscricao: string | null;
  municipio: number | null;
  municipio_nome: string | null;
  municipio_cor: string | null;
  responsaveis: number[];
  responsaveis_detalhe: { id: number; nome: string }[];
  titulo: string;
  descricao: string;
  equipe: string;
  prioridade: DemandaPrioridade;
  prioridade_display: string;
  status: DemandaStatus;
  status_display: string;
  prazo: string | null;
  iniciada_em: string | null;
  concluida_em: string | null;
  created_at: string;
  updated_at: string;
}

export const DEMANDA_STATUS_LABEL: Record<DemandaStatus, string> = {
  pendente: "Pendente",
  em_andamento: "Em andamento",
  concluida: "Concluída",
  cancelada: "Cancelada",
};

export const DEMANDA_STATUS_TONE: Record<DemandaStatus, string> = {
  pendente: "",
  em_andamento: "warn",
  concluida: "ok",
  cancelada: "err",
};

export const PRIORIDADE_LABEL: Record<DemandaPrioridade, string> = {
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
  urgente: "Urgente",
};

// Equipes conhecidas. O campo é aberto: outras equipes podem ser digitadas
// livremente no formulário (estas são apenas sugestões).
export const EQUIPES_SUGERIDAS = ["PD", "CTM"];

export interface DemandaFiltro {
  status?: string;
  responsavel?: number;
}

export function useDemandas(filtro: DemandaFiltro = {}) {
  const params = new URLSearchParams();
  if (filtro.status) params.set("status", filtro.status);
  if (filtro.responsavel != null)
    params.set("responsaveis", String(filtro.responsavel));
  const qs = params.toString();
  return useQuery({
    queryKey: ["demandas", filtro.status ?? "all", filtro.responsavel ?? "all"],
    queryFn: () =>
      api.get(`demandas/${qs ? `?${qs}` : ""}`).json<Paginated<Demanda>>(),
  });
}

/** Técnicos e coordenadores — quem pode ser responsável por uma demanda. */
export function useResponsaveisDisponiveis() {
  return useQuery({
    queryKey: ["responsaveis-disponiveis"],
    staleTime: 5 * 60_000,
    queryFn: () => api.get("users/atribuiveis/").json<Paginated<Me>>(),
  });
}

export interface CreateDemandaInput {
  imovel?: number | null;
  municipio?: number | null;
  cor?: string;
  responsaveis?: number[];
  titulo?: string;
  descricao?: string;
  equipe?: string;
  prioridade: DemandaPrioridade;
  prazo?: string | null;
}

export function useCreateDemanda() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateDemandaInput) =>
      submitMutation<Demanda>({
        path: "demandas/",
        method: "POST",
        body,
        label: `Demanda · ${body.titulo || `imóvel ${body.imovel ?? "—"}`}`,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["demandas"] });
      qc.invalidateQueries({ queryKey: ["municipios"] });
    },
  });
}

export interface UpdateDemandaInput {
  municipio?: number | null;
  cor?: string;
  responsaveis?: number[];
  titulo?: string;
  descricao?: string;
  equipe?: string;
  prioridade?: DemandaPrioridade;
  prazo?: string | null;
}

export function useUpdateDemanda() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: UpdateDemandaInput }) =>
      submitMutation<Demanda>({
        path: `demandas/${id}/`,
        method: "PATCH",
        body,
        label: `Editar demanda #${id}`,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["demandas"] });
      qc.invalidateQueries({ queryKey: ["municipios"] });
    },
  });
}

type DemandaAction = "iniciar" | "concluir" | "cancelar";

export function useDeleteDemanda() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`demandas/${id}/`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["demandas"] }),
  });
}

export function useDemandaWorkflow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action }: { id: number; action: DemandaAction }) =>
      submitMutation<Demanda>({
        path: `demandas/${id}/${action}/`,
        method: "POST",
        body: {},
        label: `Demanda #${id} · ${action}`,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["demandas"] }),
  });
}
