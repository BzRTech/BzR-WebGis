import { useState } from "react";
import { ROLE_LABEL } from "@/types/auth";
import {
  ACTION_OPTIONS,
  useAcessos,
  useAuditLogs,
  type AuditFiltro,
} from "./api";

const PAGE_SIZE = 50;

const dtf = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

function fmt(value: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : dtf.format(d);
}

function relativo(value: string | null): string {
  if (!value) return "nunca";
  const diff = Date.now() - new Date(value).getTime();
  if (Number.isNaN(diff)) return "—";
  const min = Math.floor(diff / 60000);
  if (min < 1) return "agora há pouco";
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h} h`;
  const dias = Math.floor(h / 24);
  if (dias < 30) return `há ${dias} d`;
  return fmt(value);
}

function metaResumo(meta: Record<string, unknown>): string {
  const keys = Object.keys(meta);
  if (keys.length === 0) return "";
  if (typeof meta.motivo === "string") return `motivo: ${meta.motivo}`;
  if (Array.isArray(meta.campos)) return `campos: ${meta.campos.join(", ")}`;
  if (meta.resumo && typeof meta.resumo === "object") {
    const r = meta.resumo as Record<string, unknown>;
    return Object.entries(r)
      .map(([k, v]) => `${k}: ${v}`)
      .join(" · ");
  }
  return keys.map((k) => `${k}: ${String(meta[k])}`).join(" · ");
}

const EMPTY: AuditFiltro = { action: "", actor: null, search: "", page: 1 };

export default function AuditScene() {
  const [filtro, setFiltro] = useState<AuditFiltro>(EMPTY);
  const acessos = useAcessos();
  const logs = useAuditLogs(filtro);

  const totalPages = logs.data
    ? Math.max(1, Math.ceil(logs.data.count / PAGE_SIZE))
    : 1;

  function setF<K extends keyof AuditFiltro>(key: K, value: AuditFiltro[K]) {
    setFiltro((f) => ({ ...f, [key]: value, page: key === "page" ? (value as number) : 1 }));
  }

  return (
    <div className="scene-pad">
      <div className="rkicker mono">ADMINISTRAÇÃO · AUDITORIA</div>
      <h1>Log de acessos e atividade</h1>
      <p className="lede">
        Acompanhe o último acesso de cada usuário e o histórico de ações —
        criação e conclusão de demandas, BCIs, uploads e alterações de cadastro.
      </p>

      <div className="admin-bar">
        <div className="rkicker mono">ÚLTIMO ACESSO POR USUÁRIO</div>
      </div>
      <table className="data-table">
        <thead>
          <tr>
            <th>Usuário</th>
            <th>Papel</th>
            <th>Município</th>
            <th>Último acesso</th>
            <th>Quando</th>
            <th>Ações registradas</th>
          </tr>
        </thead>
        <tbody>
          {acessos.isError && (
            <tr>
              <td colSpan={6}>Erro ao carregar acessos.</td>
            </tr>
          )}
          {acessos.data?.usuarios.map((u) => {
            const ultimo = u.ultimo_acesso_log ?? u.last_login;
            return (
              <tr key={u.id}>
                <td>
                  {u.nome}
                  <div className="mono small muted">{u.username}</div>
                </td>
                <td>
                  <span className={`role-badge ${u.role}`}>
                    {ROLE_LABEL[u.role]}
                  </span>
                </td>
                <td>{u.municipio_nome ?? "—"}</td>
                <td className="small">{fmt(ultimo)}</td>
                <td className="small muted">{relativo(ultimo)}</td>
                <td className="mono">{u.total_acoes}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="admin-bar" style={{ marginTop: "1.5rem" }}>
        <div className="rkicker mono">
          {logs.data ? `HISTÓRICO · ${logs.data.count} REGISTRO(S)` : "HISTÓRICO"}
        </div>
      </div>

      <div className="users-form">
        <label className="field">
          <span className="field-k">Ação</span>
          <select
            value={filtro.action}
            onChange={(e) => setF("action", e.target.value)}
          >
            <option value="">Todas as ações</option>
            {ACTION_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span className="field-k">Usuário</span>
          <select
            value={filtro.actor ?? ""}
            onChange={(e) =>
              setF("actor", e.target.value ? Number(e.target.value) : null)
            }
          >
            <option value="">Todos os usuários</option>
            {acessos.data?.usuarios.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nome}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span className="field-k">Buscar</span>
          <input
            value={filtro.search}
            onChange={(e) => setF("search", e.target.value)}
            placeholder="objeto, inscrição…"
          />
        </label>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Data/hora</th>
            <th>Usuário</th>
            <th>Ação</th>
            <th>Objeto</th>
            <th>Detalhes</th>
            <th>IP</th>
          </tr>
        </thead>
        <tbody>
          {logs.isError && (
            <tr>
              <td colSpan={6}>Erro ao carregar o histórico.</td>
            </tr>
          )}
          {logs.data?.results.length === 0 && (
            <tr>
              <td colSpan={6} className="muted">
                Nenhum registro para os filtros atuais.
              </td>
            </tr>
          )}
          {logs.data?.results.map((l) => (
            <tr key={l.id}>
              <td className="small mono">{fmt(l.created_at)}</td>
              <td>{l.actor_nome}</td>
              <td>{l.action_display}</td>
              <td className="small">
                {l.object_repr || "—"}
                {l.object_type ? (
                  <span className="muted mono small"> · {l.object_type}</span>
                ) : null}
              </td>
              <td className="small muted">{metaResumo(l.metadata) || "—"}</td>
              <td className="mono small muted">{l.ip_address ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {logs.data && logs.data.count > PAGE_SIZE && (
        <div className="form-actions" style={{ gap: "0.75rem", alignItems: "center" }}>
          <button
            type="button"
            className="btn-primary"
            disabled={!logs.data.previous}
            onClick={() => setFiltro((f) => ({ ...f, page: f.page - 1 }))}
          >
            Anterior
          </button>
          <span className="mono small">
            {filtro.page} / {totalPages}
          </span>
          <button
            type="button"
            className="btn-primary"
            disabled={!logs.data.next}
            onClick={() => setFiltro((f) => ({ ...f, page: f.page + 1 }))}
          >
            Próxima
          </button>
        </div>
      )}
    </div>
  );
}
