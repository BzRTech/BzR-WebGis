import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Role } from "@/types/auth";

export interface AuditLog {
  id: number;
  action: string;
  action_display: string;
  actor: number | null;
  actor_nome: string;
  actor_label: string;
  object_type: string;
  object_id: string;
  object_repr: string;
  municipio: number | null;
  municipio_nome: string | null;
  metadata: Record<string, unknown>;
  ip_address: string | null;
  created_at: string;
}

interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface AuditFiltro {
  action: string;
  actor: number | null;
  search: string;
  page: number;
}

/** Catálogo de ações (espelha AuditLog.Action no backend) p/ o filtro. */
export const ACTION_OPTIONS: { value: string; label: string }[] = [
  { value: "login", label: "Acesso (login)" },
  { value: "demanda_criada", label: "Demanda criada" },
  { value: "demanda_editada", label: "Demanda editada" },
  { value: "demanda_iniciada", label: "Demanda iniciada" },
  { value: "demanda_concluida", label: "Demanda concluída" },
  { value: "demanda_cancelada", label: "Demanda cancelada" },
  { value: "demanda_excluida", label: "Demanda excluída" },
  { value: "bci_criado", label: "BCI criado" },
  { value: "bci_editado", label: "BCI editado" },
  { value: "bci_enviado", label: "BCI enviado" },
  { value: "bci_aprovado", label: "BCI aprovado" },
  { value: "bci_rejeitado", label: "BCI rejeitado" },
  { value: "bci_reaberto", label: "BCI reaberto" },
  { value: "bci_excluido", label: "BCI excluído" },
  { value: "foto_adicionada", label: "Foto/arquivo adicionado" },
  { value: "cadastro_criado", label: "Cadastro criado" },
  { value: "cadastro_editado", label: "Cadastro editado" },
  { value: "cadastro_excluido", label: "Cadastro excluído" },
  { value: "cadastro_importado", label: "Feições importadas" },
];

function query(params: Record<string, string | number | null>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== null && v !== "") sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

export function useAuditLogs(filtro: AuditFiltro) {
  return useQuery({
    queryKey: ["audit-logs", filtro],
    queryFn: () =>
      api
        .get(
          `audit/${query({
            action: filtro.action,
            actor: filtro.actor,
            search: filtro.search,
            page: filtro.page,
          })}`,
        )
        .json<Paginated<AuditLog>>(),
    placeholderData: (prev) => prev,
  });
}

export interface AcessoLinha {
  id: number;
  nome: string;
  username: string;
  role: Role;
  municipio_nome: string | null;
  ativo_campo: boolean;
  last_login: string | null;
  ultimo_acesso_log: string | null;
  total_acoes: number;
}

export interface AcessosResposta {
  usuarios: AcessoLinha[];
  total: number;
}

export function useAcessos() {
  return useQuery({
    queryKey: ["audit-acessos"],
    queryFn: () => api.get("audit/acessos/").json<AcessosResposta>(),
  });
}
