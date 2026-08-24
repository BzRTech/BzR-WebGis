import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBCIs, useDeleteBCI, useWorkflow } from "./api";
import { useAuthStore } from "@/stores/authStore";
import {
  BCI_STATUS_LABEL,
  BCI_STATUS_TONE,
  type BCIStatus,
} from "@/types/bci";

function fmtData(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR");
}

const FILTERS: { value: string; label: string }[] = [
  { value: "", label: "Todos" },
  { value: "rascunho", label: "Rascunhos" },
  { value: "enviado", label: "Enviados" },
  { value: "aprovado", label: "Aprovados" },
  { value: "rejeitado", label: "Rejeitados" },
];

export default function BCIListScene() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState("");
  const { data, isLoading, isError } = useBCIs(filter);
  const workflow = useWorkflow();
  const excluir = useDeleteBCI();
  const role = useAuthStore((s) => s.user?.role);

  const canApprove = role === "admin" || role === "coordenador";

  async function act(
    id: number,
    action: "enviar" | "aprovar" | "rejeitar",
  ) {
    let motivo: string | undefined;
    if (action === "rejeitar") {
      motivo = window.prompt("Motivo da rejeição:") ?? undefined;
      if (!motivo) return;
    }
    await workflow.mutateAsync({ id, action, motivo });
  }

  async function corrigir(id: number) {
    await workflow.mutateAsync({ id, action: "reabrir" });
    navigate(`/bci/${id}/editar`);
  }

  return (
    <div className="scene-pad">
      <div className="rkicker mono">COLETA · BCI</div>
      <h1>Boletins de Cadastro</h1>
      <p className="lede">
        Acompanhe e movimente os BCIs no fluxo: rascunho → enviado → aprovado.
      </p>

      <div className="admin-bar">
        <div className="tweak-opts" style={{ display: "flex", gap: 4 }}>
          {FILTERS.map((f) => (
            <button
              key={f.value}
              className={filter === f.value ? "on" : ""}
              onClick={() => setFilter(f.value)}
              type="button"
            >
              {f.label}
            </button>
          ))}
        </div>
        <button className="btn-primary" onClick={() => navigate("/bci/novo")}>
          + Nova coleta
        </button>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Inscrição</th>
            <th>Técnico</th>
            <th>Status</th>
            <th>Preenchido</th>
            <th>Aprovado</th>
            <th>Fotos</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {isLoading && (
            <tr>
              <td colSpan={7}>Carregando…</td>
            </tr>
          )}
          {isError && (
            <tr>
              <td colSpan={7}>Erro ao carregar.</td>
            </tr>
          )}
          {data?.results.length === 0 && (
            <tr>
              <td colSpan={7}>Nenhum BCI.</td>
            </tr>
          )}
          {data?.results.map((b) => {
            const tone = BCI_STATUS_TONE[b.status as BCIStatus];
            const stop = (e: React.MouseEvent) => e.stopPropagation();
            return (
              <tr
                key={b.id}
                className="row-clickable"
                onClick={() => navigate(`/bci/${b.id}`)}
                title="Abrir BCI"
              >
                <td className="mono small" data-label="Inscrição">
                  {b.imovel_inscricao}
                </td>
                <td data-label="Técnico">{b.tecnico_nome || "—"}</td>
                <td data-label="Status">
                  <span className={`status-pill ${tone}`}>
                    {BCI_STATUS_LABEL[b.status as BCIStatus]}
                  </span>
                </td>
                <td className="mono small" data-label="Preenchido">
                  {fmtData(b.created_at)}
                </td>
                <td className="mono small" data-label="Aprovado">
                  {fmtData(b.aprovado_em)}
                </td>
                <td className="num mono" data-label="Fotos">
                  {b.fotos.length}
                </td>
                <td data-label="Ações" onClick={stop}>
                  <span
                    style={{
                      display: "flex",
                      gap: 12,
                      alignItems: "center",
                      flexWrap: "wrap",
                    }}
                  >
                    <button
                      className="row-link"
                      onClick={() => navigate(`/bci/${b.id}`)}
                    >
                      abrir →
                    </button>
                    {b.status === "rascunho" && (
                      <button
                        className="row-link"
                        onClick={() => act(b.id, "enviar")}
                      >
                        enviar
                      </button>
                    )}
                    {b.status === "enviado" && canApprove && (
                      <>
                        <button
                          className="row-link"
                          onClick={() => act(b.id, "aprovar")}
                        >
                          aprovar
                        </button>
                        <button
                          className="row-link"
                          onClick={() => act(b.id, "rejeitar")}
                        >
                          rejeitar
                        </button>
                      </>
                    )}
                    {b.status === "rejeitado" && (
                      <>
                        <button
                          className="row-link"
                          onClick={() => corrigir(b.id)}
                        >
                          corrigir
                        </button>
                        {b.motivo_rejeicao && (
                          <span className="muted mono">
                            {b.motivo_rejeicao}
                          </span>
                        )}
                      </>
                    )}
                    {(canApprove || b.status === "rascunho") && (
                      <button
                        className="row-link danger"
                        onClick={() => {
                          if (
                            window.confirm(
                              `Excluir o BCI de ${b.imovel_inscricao}? Esta ação não pode ser desfeita.`,
                            )
                          )
                            excluir.mutate(b.id);
                        }}
                      >
                        excluir
                      </button>
                    )}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
