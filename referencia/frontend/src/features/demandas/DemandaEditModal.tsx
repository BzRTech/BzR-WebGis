import { type FormEvent, useState } from "react";
import { HTTPError } from "ky";
import { useMunicipios } from "@/features/mapa/api";
import ResponsaveisField from "./ResponsaveisField";
import {
  EQUIPES_SUGERIDAS,
  PRIORIDADE_LABEL,
  useUpdateDemanda,
  type Demanda,
  type DemandaPrioridade,
} from "./api";

const PRIORIDADES: DemandaPrioridade[] = ["baixa", "media", "alta", "urgente"];

export default function DemandaEditModal({
  demanda,
  onClose,
}: {
  demanda: Demanda;
  onClose: () => void;
}) {
  const [titulo, setTitulo] = useState(demanda.titulo);
  const [descricao, setDescricao] = useState(demanda.descricao);
  const [municipio, setMunicipio] = useState<number | "">(
    demanda.municipio ?? "",
  );
  const [cor, setCor] = useState(demanda.municipio_cor || "#1351B4");
  const [responsaveis, setResponsaveis] = useState<number[]>(
    demanda.responsaveis ?? [],
  );
  const [prioridade, setPrioridade] = useState<DemandaPrioridade>(
    demanda.prioridade,
  );
  const [prazo, setPrazo] = useState(demanda.prazo ?? "");
  const [equipe, setEquipe] = useState(demanda.equipe ?? "");
  const [erro, setErro] = useState<string | null>(null);

  const municipios = useMunicipios();
  const editar = useUpdateDemanda();

  function onSelectMunicipio(id: number | "") {
    setMunicipio(id);
    const found = municipios.data?.find((m) => m.id === id);
    if (found?.cor) setCor(found.cor);
  }

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
    if (cidadeConflito) {
      setErro(`Esta cor já é da cidade ${cidadeConflito.nome}. Escolha outra.`);
      return;
    }
    try {
      await editar.mutateAsync({
        id: demanda.id,
        body: {
          titulo: titulo.trim(),
          descricao: descricao.trim(),
          municipio: municipio === "" ? null : Number(municipio),
          cor: municipio === "" ? undefined : cor,
          responsaveis,
          prioridade,
          prazo: prazo || null,
          equipe: equipe.trim(),
        },
      });
      onClose();
    } catch (err) {
      if (err instanceof HTTPError) {
        const body = await err.response.json().catch(() => null);
        setErro(body ? JSON.stringify(body) : "Falha ao salvar.");
      } else {
        setErro("Falha de conexão.");
      }
    }
  }

  return (
    <div className="modal-back" onClick={onClose}>
      <form
        className="modal"
        onClick={(e) => e.stopPropagation()}
        onSubmit={onSubmit}
      >
        <div className="modal-head">
          <div>
            <div className="panel-kicker mono">EDITAR DEMANDA</div>
            <h3>#{demanda.id}</h3>
          </div>
          <button
            type="button"
            className="icon-btn"
            onClick={onClose}
            aria-label="Fechar"
          >
            ×
          </button>
        </div>

        {erro && <div className="form-error">{erro}</div>}

        <label className="field">
          <span className="field-k">Título</span>
          <input value={titulo} onChange={(e) => setTitulo(e.target.value)} />
        </label>

        <label className="field">
          <span className="field-k">Cidade</span>
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
                style={{ width: 44, height: 32, padding: 2, cursor: "pointer" }}
              />
              <span className="mono small">{cor}</span>
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
          <span className="field-k">Equipe</span>
          <input
            list="equipes-sugeridas-edit"
            value={equipe}
            onChange={(e) => setEquipe(e.target.value)}
            placeholder="ex.: PD, CTM…"
          />
          <datalist id="equipes-sugeridas-edit">
            {EQUIPES_SUGERIDAS.map((eq) => (
              <option key={eq} value={eq} />
            ))}
          </datalist>
        </label>

        <label className="field">
          <span className="field-k">Prioridade</span>
          <select
            value={prioridade}
            onChange={(e) => setPrioridade(e.target.value as DemandaPrioridade)}
          >
            {PRIORIDADES.map((p) => (
              <option key={p} value={p}>
                {PRIORIDADE_LABEL[p]}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span className="field-k">Prazo</span>
          <input
            type="date"
            value={prazo}
            onChange={(e) => setPrazo(e.target.value)}
          />
        </label>

        <label className="field">
          <span className="field-k">Descrição</span>
          <textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            rows={3}
          />
        </label>

        <div className="modal-foot">
          <button type="button" className="btn-ghost" onClick={onClose}>
            Cancelar
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={editar.isPending || !!cidadeConflito}
          >
            {editar.isPending ? "Salvando…" : "Salvar"}
          </button>
        </div>
      </form>
    </div>
  );
}
