import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  DEMANDA_STATUS_LABEL,
  DEMANDA_STATUS_TONE,
  PRIORIDADE_LABEL,
  useDemandas,
  useDemandaWorkflow,
  type DemandaStatus,
} from "./api";

const FILTERS: { value: string; label: string }[] = [
  { value: "", label: "Todas" },
  { value: "pendente", label: "Pendentes" },
  { value: "em_andamento", label: "Em andamento" },
  { value: "concluida", label: "Concluídas" },
];

export default function MinhasDemandasScene() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState("");
  const { data, isLoading, isError } = useDemandas({ status: filter });
  const workflow = useDemandaWorkflow();

  return (
    <div className="scene-pad">
      <div className="rkicker mono">CAMPO · DEMANDAS</div>
      <h1>Minhas demandas</h1>
      <p className="lede">
        Tarefas de coleta atribuídas a você. Inicie, colete o BCI e conclua.
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
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Inscrição</th>
            <th>Prioridade</th>
            <th>Prazo</th>
            <th>Status</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {isLoading && (
            <tr>
              <td colSpan={5}>Carregando…</td>
            </tr>
          )}
          {isError && (
            <tr>
              <td colSpan={5}>Erro ao carregar.</td>
            </tr>
          )}
          {data?.results.length === 0 && (
            <tr>
              <td colSpan={5}>Nenhuma demanda atribuída.</td>
            </tr>
          )}
          {data?.results.map((d) => {
            const tone = DEMANDA_STATUS_TONE[d.status as DemandaStatus];
            const aberta =
              d.status === "pendente" || d.status === "em_andamento";
            return (
              <tr key={d.id}>
                <td className="mono small" data-label="Inscrição">
                  {d.imovel_inscricao || d.titulo || d.municipio_nome || "—"}
                </td>
                <td data-label="Prioridade">
                  {PRIORIDADE_LABEL[d.prioridade]}
                </td>
                <td data-label="Prazo">{d.prazo ?? "—"}</td>
                <td data-label="Status">
                  <span className={`status-pill ${tone}`}>
                    {DEMANDA_STATUS_LABEL[d.status as DemandaStatus]}
                  </span>
                </td>
                <td data-label="Ações">
                  <span
                    style={{
                      display: "flex",
                      gap: 12,
                      alignItems: "center",
                      flexWrap: "wrap",
                    }}
                  >
                    {d.status === "pendente" && (
                      <button
                        className="row-link"
                        onClick={() =>
                          workflow.mutate({ id: d.id, action: "iniciar" })
                        }
                      >
                        iniciar
                      </button>
                    )}
                    {aberta && d.imovel != null && (
                      <button
                        className="row-link"
                        onClick={() => navigate(`/bci/novo?imovel=${d.imovel}`)}
                      >
                        coletar BCI →
                      </button>
                    )}
                    {aberta && (
                      <button
                        className="row-link"
                        onClick={() =>
                          workflow.mutate({ id: d.id, action: "concluir" })
                        }
                      >
                        concluir
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
