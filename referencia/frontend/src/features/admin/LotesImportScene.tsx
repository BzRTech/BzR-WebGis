import { type FormEvent, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { HTTPError } from "ky";
import { api } from "@/lib/api";
import {
  useImportarFeicoes,
  type ImportResumo,
  type ImportTipo,
} from "@/features/mapa/api";

interface Municipio {
  id: number;
  nome: string;
  uf: string;
}
interface Paginated<T> {
  results: T[];
}

interface TipoConfig {
  label: string;
  kicker: string;
  geom: string;
  chave: { label: string; placeholder: string } | null;
  campoTipo?: { label: string; placeholder: string };
  campoCodigo?: { label: string; placeholder: string };
  campoPavimentacao?: { label: string; placeholder: string };
  ajuda: string;
}

const TIPOS: Record<ImportTipo, TipoConfig> = {
  lotes: {
    label: "Lotes",
    kicker: "LOTES",
    geom: "polígonos",
    chave: {
      label: "Campo da inscrição (opcional — detecta automaticamente)",
      placeholder: "ex.: inscricao, cod_lote…",
    },
    ajuda:
      "Cada feição vira um imóvel; reimportar atualiza pela inscrição cadastral (não duplica).",
  },
  bairros: {
    label: "Bairros",
    kicker: "BAIRROS",
    geom: "polígonos",
    chave: {
      label: "Campo do nome (opcional — detecta automaticamente)",
      placeholder: "ex.: nome, bairro, nm_bairro…",
    },
    campoCodigo: {
      label: "Campo do código (opcional)",
      placeholder: "ex.: cod_bairro",
    },
    ajuda:
      "Cada feição vira um bairro; reimportar atualiza a geometria do bairro de mesmo nome.",
  },
  quadras: {
    label: "Quadras",
    kicker: "QUADRAS",
    geom: "polígonos",
    chave: {
      label: "Campo do código (opcional — detecta automaticamente)",
      placeholder: "ex.: codigo, cod_quadra, quadra…",
    },
    ajuda:
      "Cada feição vira uma quadra; a quadra é associada ao bairro cujo polígono contém o centróide, se houver.",
  },
  logradouros: {
    label: "Logradouros",
    kicker: "LOGRADOUROS",
    geom: "linhas",
    chave: {
      label: "Campo do nome (opcional — detecta automaticamente)",
      placeholder: "ex.: nome, logradouro, nm_logr…",
    },
    campoTipo: {
      label: "Campo do tipo (opcional — rua/avenida/…)",
      placeholder: "ex.: tipo, tip_logr",
    },
    campoPavimentacao: {
      label: "Campo da pavimentação (opcional)",
      placeholder: "ex.: pavimento, revestimento",
    },
    campoCodigo: {
      label: "Campo do código do trecho (opcional — detecta automaticamente)",
      placeholder: "ex.: id_trecho",
    },
    ajuda:
      "Com o código do trecho, cada trecho vira um registro (preserva a pavimentação por trecho); sem ele, agrupa por tipo + nome.",
  },
  edificacoes: {
    label: "Edificações",
    kicker: "EDIFICAÇÕES",
    geom: "polígonos",
    chave: {
      label: "Campo da inscrição do lote (opcional — detecta automaticamente)",
      placeholder: "ex.: inscricao, cod_lote…",
    },
    ajuda:
      "Cada edificação é casada ao lote por inscrição (se o arquivo tiver a coluna), senão pelo lote de maior sobreposição e, por fim, pelo lote mais próximo (~5 m). Os lotes precisam já ter sido importados antes.",
  },
};

const MOTIVO_LABEL: Record<string, string> = {
  sem_lote: "Sem lote correspondente (verifique se os lotes foram importados)",
  geom_invalida: "Geometria inválida ou não-poligonal",
};

const ORDEM_TIPOS: ImportTipo[] = [
  "lotes",
  "bairros",
  "quadras",
  "logradouros",
  "edificacoes",
];

export default function LotesImportScene() {
  const [tipo, setTipo] = useState<ImportTipo>("lotes");
  const [file, setFile] = useState<File | null>(null);
  const [municipio, setMunicipio] = useState<number | "">("");
  const [campoChave, setCampoChave] = useState("");
  const [campoTipo, setCampoTipo] = useState("");
  const [campoCodigo, setCampoCodigo] = useState("");
  const [campoPavimentacao, setCampoPavimentacao] = useState("");
  const [resumo, setResumo] = useState<ImportResumo | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const importar = useImportarFeicoes(tipo);
  const cfg = TIPOS[tipo];

  const municipios = useQuery({
    queryKey: ["municipios"],
    queryFn: () => api.get("municipios/").json<Paginated<Municipio>>(),
  });

  const camposOrdenados = useMemo(
    () => [...(resumo?.campos ?? [])].sort((a, b) => b.distintos - a.distintos),
    [resumo],
  );

  function onChangeTipo(novo: ImportTipo) {
    setTipo(novo);
    setResumo(null);
    setErro(null);
    setCampoChave("");
    setCampoTipo("");
    setCampoCodigo("");
    setCampoPavimentacao("");
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setResumo(null);
    if (!file || !municipio) return;
    try {
      const r = await importar.mutateAsync({
        arquivo: file,
        municipio: Number(municipio),
        campo_chave: campoChave || undefined,
        campo_tipo: campoTipo || undefined,
        campo_codigo: campoCodigo || undefined,
        campo_pavimentacao: campoPavimentacao || undefined,
      });
      setResumo(r);
    } catch (err) {
      if (err instanceof HTTPError) {
        const body = await err.response.json().catch(() => null);
        setErro(body ? JSON.stringify(body) : "Falha na importação.");
      } else {
        setErro("Falha de conexão.");
      }
    }
  }

  return (
    <div className="scene-pad">
      <div className="rkicker mono">ADMINISTRAÇÃO · {cfg.kicker}</div>
      <h1>Importar {cfg.label.toLowerCase()}</h1>
      <p className="lede">
        Suba um arquivo <strong>.geojson</strong> ou Shapefile zipado{" "}
        <strong>.zip</strong> com {cfg.geom}. {cfg.ajuda}
      </p>

      <div
        role="tablist"
        aria-label="Tipo de feição"
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 4,
          marginBottom: 16,
          borderBottom: "1px solid var(--line-2)",
        }}
      >
        {ORDEM_TIPOS.map((t) => {
          const active = t === tipo;
          return (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChangeTipo(t)}
              style={{
                padding: "8px 14px",
                background: active ? "var(--paper-2)" : "transparent",
                border: "1px solid var(--line-2)",
                borderBottom: active ? "1px solid var(--paper-2)" : "1px solid var(--line-2)",
                marginBottom: -1,
                color: active ? "var(--ink)" : "var(--muted)",
                fontFamily: "inherit",
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              {TIPOS[t].label}
            </button>
          );
        })}
      </div>

      <form className="import-box" onSubmit={onSubmit}>
        {erro && <div className="form-error">{erro}</div>}
        <label className="field">
          <span className="field-k">Município</span>
          <select
            value={municipio}
            onChange={(e) =>
              setMunicipio(e.target.value ? Number(e.target.value) : "")
            }
            required
          >
            <option value="">— selecione —</option>
            {municipios.data?.results.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nome}/{m.uf}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span className="field-k">Arquivo (.geojson ou .zip)</span>
          <input
            type="file"
            accept=".geojson,.json,.zip"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            required
          />
        </label>
        {cfg.chave && (
          <label className="field">
            <span className="field-k">{cfg.chave.label}</span>
            <input
              value={campoChave}
              onChange={(e) => setCampoChave(e.target.value)}
              placeholder={cfg.chave.placeholder}
            />
          </label>
        )}
        {cfg.campoTipo && (
          <label className="field">
            <span className="field-k">{cfg.campoTipo.label}</span>
            <input
              value={campoTipo}
              onChange={(e) => setCampoTipo(e.target.value)}
              placeholder={cfg.campoTipo.placeholder}
            />
          </label>
        )}
        {cfg.campoCodigo && (
          <label className="field">
            <span className="field-k">{cfg.campoCodigo.label}</span>
            <input
              value={campoCodigo}
              onChange={(e) => setCampoCodigo(e.target.value)}
              placeholder={cfg.campoCodigo.placeholder}
            />
          </label>
        )}
        {cfg.campoPavimentacao && (
          <label className="field">
            <span className="field-k">{cfg.campoPavimentacao.label}</span>
            <input
              value={campoPavimentacao}
              onChange={(e) => setCampoPavimentacao(e.target.value)}
              placeholder={cfg.campoPavimentacao.placeholder}
            />
          </label>
        )}
        <button
          type="submit"
          className="btn-primary"
          disabled={!file || !municipio || importar.isPending}
        >
          {importar.isPending ? (
            <>
              Importando <span className="spinner" />
            </>
          ) : (
            "Importar"
          )}
        </button>
      </form>

      {resumo && (
        <>
          <div className="import-resumo">
            <div>
              <div className="n">{resumo.criados}</div>
              <div className="k">Criados</div>
            </div>
            <div>
              <div className="n">{resumo.atualizados}</div>
              <div className="k">Atualizados</div>
            </div>
            <div>
              <div className="n">{resumo.ignorados}</div>
              <div className="k">Ignorados</div>
            </div>
            <div>
              <div className="n">{resumo.total}</div>
              <div className="k">Total</div>
            </div>
          </div>
          {resumo.ignorados_motivos &&
            Object.keys(resumo.ignorados_motivos).length > 0 && (
              <div className="form-error" style={{ marginTop: 16 }}>
                <p style={{ margin: "0 0 6px" }}>
                  {resumo.ignorados} ignorada(s), por motivo:
                </p>
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {Object.entries(resumo.ignorados_motivos).map(([k, n]) => (
                    <li key={k}>
                      {MOTIVO_LABEL[k] ?? k}: <strong>{n}</strong>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          {cfg.chave &&
            tipo !== "edificacoes" &&
            resumo.total > 1 &&
            resumo.criados + resumo.atualizados <= 1 &&
            camposOrdenados.length > 0 && (
              <div className="form-error" style={{ marginTop: 16 }}>
                <p style={{ margin: "0 0 4px" }}>
                  {resumo.criados + resumo.atualizados === 0
                    ? "Nada foi importado — nenhum campo de chave reconhecido."
                    : "Atenção: todas as feições caíram no mesmo registro — o campo da chave se repete."}
                </p>
                <p style={{ margin: "0 0 10px", fontSize: 12 }}>
                  Escolha a coluna cujo nº de valores distintos seja próximo
                  de <strong>{resumo.total}</strong> e importe de novo:
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {camposOrdenados.map((c) => (
                    <button
                      key={c.campo}
                      type="button"
                      onClick={() => setCampoChave(c.campo)}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 12,
                        cursor: "pointer",
                        border: "1px solid var(--line-2)",
                        background:
                          c.distintos === resumo.total
                            ? "var(--accent)"
                            : "var(--paper-2)",
                        color:
                          c.distintos === resumo.total
                            ? "#111"
                            : "var(--ink)",
                        padding: "8px 10px",
                        fontFamily: "inherit",
                        fontSize: 13,
                        textAlign: "left",
                      }}
                    >
                      <span className="mono">{c.campo}</span>
                      <span>
                        {c.distintos} distintos · ex.: {c.exemplo || "—"}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          {resumo.erros.length > 0 && (
            <div className="form-error" style={{ marginTop: 16 }}>
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {resumo.erros.map((er, i) => (
                  <li key={i}>{er}</li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}
