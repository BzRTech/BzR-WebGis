import { type FormEvent, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { HTTPError } from "ky";
import { useMunicipios } from "@/features/mapa/api";
import DemandaEditModal from "./DemandaEditModal";
import ResponsaveisField from "./ResponsaveisField";
import {
  DEMANDA_STATUS_LABEL,
  DEMANDA_STATUS_TONE,
  EQUIPES_SUGERIDAS,
  PRIORIDADE_LABEL,
  useCreateDemanda,
  useDemandas,
  useDeleteDemanda,
  useDemandaWorkflow,
  type Demanda,
  type DemandaPrioridade,
  type DemandaStatus,
} from "./api";

const PRIORIDADES: DemandaPrioridade[] = ["baixa", "media", "alta", "urgente"];

export default function DemandaCreateScene() {
  const [municipio, setMunicipio] = useState<number | "">("");
  const [cor, setCor] = useState("#1351B4");
  const [responsaveis, setResponsaveis] = useState<number[]>([]);
  const [prioridade, setPrioridade] = useState<DemandaPrioridade>("media");
  const [searchParams] = useSearchParams();
  const [prazo, setPrazo] = useState(() => searchParams.get("prazo") ?? "");
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [equipe, setEquipe] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [editando, setEditando] = useState<Demanda | null>(null);

  const municipios = useMunicipios();
  const criar = useCreateDemanda();
  const workflow = useDemandaWorkflow();
  const excluir = useDeleteDemanda();
  const lista = useDemandas();

  function onSelectMunicipio(id: number | "") {
    setMunicipio(id);
    const found = municipios.data?.find((m) => m.id === id);
    if (found?.cor) setCor(found.cor);
  }

  // A cor é exclusiva por cidade: bloqueia se outra cidade já usa essa cor.
  const cidadeConflito =
    municipio === ""
      ? null
      : municipios.data?.find(
          (m) =>
            m.id !== municipio &&
            (m.cor ?? "").toLowerCase() === cor.toLowerCase(),
        );

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    if (!titulo.trim() && municipio === "") {
      setErro("Informe ao menos um título ou cidade.");
      return;
    }
    if (cidadeConflito) {
      setErro(`Esta cor já é da cidade ${cidadeConflito.nome}. Escolha outra.`);
      return;
    }
    try {
      await criar.mutateAsync({
        municipio: municipio === "" ? null : Number(municipio),
        cor: municipio === "" ? undefined : cor,
        responsaveis,
        prioridade,
        prazo: prazo || null,
        titulo: titulo.trim(),
        descricao: descricao.trim(),
        equipe: equipe.trim(),
      });
      setMunicipio("");
      setCor("#1351B4");
      setResponsaveis([]);
      setPrioridade("media");
      setPrazo("");
      setTitulo("");
      setDescricao("");
      setEquipe("");
    } catch (err) {
      if (err instanceof HTTPError) {
        const body = await err.response.json().catch(() => null);
        setErro(body ? JSON.stringify(body) : "Falha ao criar demanda.");
      } else {
        setErro("Falha de conexão.");
      }
    }
  }

  return (
    <div className="scene-pad">
      <div className="rkicker mono">GESTÃO · DEMANDAS</div>
      <h1>Demandas</h1>
      <p className="lede">
        Gestão de demandas gerais dos projetos. Vincule a uma cidade
        (opcional) para organizar por cor no calendário.
      </p>

      <form className="import-box" onSubmit={onSubmit}>
        {erro && <div className="form-error">{erro}</div>}

        <label className="field">
          <span className="field-k">Título (opcional)</span>
          <input
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="ex.: Atualizar área construída"
          />
        </label>

        <label className="field">
          <span className="field-k">Descrição (opcional)</span>
          <textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            rows={3}
          />
        </label>

        <label className="field">
          <span className="field-k">Cidade (opcional)</span>
          <select
            value={municipio}
            onChange={(e) =>
              onSelectMunicipio(e.target.value ? Number(e.target.value) : "")
            }
          >
            <option value="">— sem cidade —</option>
            {municipios.data?.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nome}/{m.uf}
              </option>
            ))}
          </select>
        </label>

        {municipio !== "" && (
          <label className="field">
            <span className="field-k">Cor da cidade</span>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <input
                type="color"
                value={cor}
                onChange={(e) => setCor(e.target.value)}
                style={{
                  width: 44,
                  height: 32,
                  padding: 2,
                  cursor: "pointer",
                }}
              />
              <span className="mono small">{cor}</span>
              <span className="muted small">
                cor exclusiva desta cidade no calendário
              </span>
            </div>
            {cidadeConflito && (
              <span className="form-error" style={{ marginTop: 8 }}>
                Já usada por {cidadeConflito.nome}. Escolha outra cor.
              </span>
            )}
          </label>
        )}

        <div className="field">
          <span className="field-k">
            Responsáveis{" "}
            {responsaveis.length > 0 ? `(${responsaveis.length})` : ""}
          </span>
          <ResponsaveisField value={responsaveis} onChange={setResponsaveis} />
        </div>

        <label className="field">
          <span className="field-k">Equipe (opcional)</span>
          <input
            list="equipes-sugeridas"
            value={equipe}
            onChange={(e) => setEquipe(e.target.value)}
            placeholder="ex.: PD, CTM…"
          />
          <datalist id="equipes-sugeridas">
            {EQUIPES_SUGERIDAS.map((eq) => (
              <option key={eq} value={eq} />
            ))}
          </datalist>
        </label>

        <label className="field">
          <span className="field-k">Prioridade</span>
          <select
            value={prioridade}
            onChange={(e) =>
              setPrioridade(e.target.value as DemandaPrioridade)
            }
          >
            {PRIORIDADES.map((p) => (
              <option key={p} value={p}>
                {PRIORIDADE_LABEL[p]}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span className="field-k">Prazo (opcional)</span>
          <input
            type="date"
            value={prazo}
            onChange={(e) => setPrazo(e.target.value)}
          />
        </label>

        <button
          type="submit"
          className="btn-primary"
          disabled={
            criar.isPending ||
            !!cidadeConflito ||
            (!titulo.trim() && municipio === "")
          }
        >
          {criar.isPending ? "Criando…" : "Criar demanda"}
        </button>
      </form>

      <table className="data-table" style={{ marginTop: 24 }}>
        <thead>
          <tr>
            <th>Nº</th>
            <th>Demanda</th>
            <th>Cidade</th>
            <th>Equipe</th>
            <th>Responsáveis</th>
            <th>Prioridade</th>
            <th>Status</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {lista.data?.results.length === 0 && (
            <tr>
              <td colSpan={8}>Nenhuma demanda.</td>
            </tr>
          )}
          {lista.data?.results.map((d) => {
            const tone = DEMANDA_STATUS_TONE[d.status as DemandaStatus];
            const aberta =
              d.status === "pendente" || d.status === "em_andamento";
            return (
              <tr key={d.id}>
                <td className="mono small" data-label="Nº">
                  #{d.id}
                </td>
                <td className="small" data-label="Demanda">
                  {d.titulo || d.imovel_inscricao || "—"}
                </td>
                <td data-label="Cidade">{d.municipio_nome || "—"}</td>
                <td data-label="Equipe">{d.equipe || "—"}</td>
                <td data-label="Responsáveis">
                  {d.responsaveis_detalhe.length > 0
                    ? d.responsaveis_detalhe.map((r) => r.nome).join(", ")
                    : "—"}
                </td>
                <td data-label="Prioridade">
                  {PRIORIDADE_LABEL[d.prioridade]}
                </td>
                <td data-label="Status">
                  <span className={`status-pill ${tone}`}>
                    {DEMANDA_STATUS_LABEL[d.status as DemandaStatus]}
                  </span>
                </td>
                <td data-label="Ações">
                  <span style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                    <button className="row-link" onClick={() => setEditando(d)}>
                      editar
                    </button>
                    {aberta && (
                      <button
                        className="row-link"
                        onClick={() =>
                          workflow.mutate({ id: d.id, action: "cancelar" })
                        }
                      >
                        cancelar
                      </button>
                    )}
                    <button
                      className="row-link danger"
                      onClick={() => {
                        if (
                          window.confirm(
                            `Excluir a demanda #${d.id}? Esta ação não pode ser desfeita.`,
                          )
                        )
                          excluir.mutate(d.id);
                      }}
                    >
                      excluir
                    </button>
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {editando && (
        <DemandaEditModal demanda={editando} onClose={() => setEditando(null)} />
      )}
    </div>
  );
}
