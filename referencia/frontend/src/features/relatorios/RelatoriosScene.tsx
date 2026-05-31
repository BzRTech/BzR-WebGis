import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { useUIStore } from "@/stores/uiStore";
import { STATUS_INFO, type StatusImovel } from "@/types/mapa";
import {
  BarrasEmpilhadas,
  BarrasV,
  Donut,
  PALETA,
  type Fatia,
} from "./charts";
import {
  useRelatorioGestao,
  useRelatorioTecnicos,
  type RelatorioGestao,
  type TecnicoLinha,
} from "./api";

const COR_APROVADO = "#168821";
const COR_PENDENTE = "#c5a000";
const COR_REJEITADO = "#e52207";

const USO_LABEL: Record<string, string> = {
  residencial: "Residencial",
  comercial: "Comercial",
  industrial: "Industrial",
  servicos: "Serviços",
  territorial: "Territorial",
  misto: "Misto",
  outro: "Outro",
};

const STATUS_LABEL: Record<string, string> = {
  sem_coleta: "Sem coleta",
  em_coleta: "Em coleta",
  enviado: "Enviado",
  aprovado: "Aprovado",
  rejeitado: "Rejeitado",
  arquivado: "Arquivado",
};

const VIA_LABEL: Record<string, string> = {
  rua: "Rua",
  avenida: "Avenida",
  travessa: "Travessa",
  alameda: "Alameda",
  rodovia: "Rodovia",
  outro: "Outro",
};

function fmtInt(n: number): string {
  return n.toLocaleString("pt-BR");
}

function fmtArea(v: string | null): string {
  const n = Number(v ?? 0);
  if (!n) return "—";
  // Zero vira travessão para não poluir o painel com "0 m²".
  return `${n.toLocaleString("pt-BR", { maximumFractionDigits: 0 })} m²`;
}

function fmtData(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR");
}

function Kpi({ n, value, sub }: { n: string; value: string; sub?: string }) {
  return (
    <div className="kpi">
      <div className="kpi-n mono">{n}</div>
      <div className="kpi-value">{value}</div>
      {sub ? <div className="kpi-sub">{sub}</div> : null}
    </div>
  );
}

function TecnicosPanel({ municipio }: { municipio: number | null }) {
  const [desde, setDesde] = useState("");
  const [ate, setAte] = useState("");
  const [tecnico, setTecnico] = useState<number | null>(null);

  const q = useRelatorioTecnicos({ municipio, desde, ate, tecnico: null });
  const linhas = q.data?.tecnicos ?? [];

  const visiveis = useMemo<TecnicoLinha[]>(
    () => (tecnico ? linhas.filter((l) => l.id === tecnico) : linhas),
    [linhas, tecnico],
  );

  const tot = useMemo(() => {
    const acc = {
      bci_total: 0,
      bci_aprovados: 0,
      bci_pendentes: 0,
      demandas_concluidas: 0,
    };
    for (const l of visiveis) {
      acc.bci_total += l.bci_total;
      acc.bci_aprovados += l.bci_aprovados;
      acc.bci_pendentes += l.bci_pendentes;
      acc.demandas_concluidas += l.demandas_concluidas;
    }
    return acc;
  }, [visiveis]);

  const grafTecnicos = useMemo(
    () =>
      [...visiveis]
        .filter((l) => l.bci_total > 0)
        .sort((a, b) => b.bci_total - a.bci_total)
        .slice(0, 8)
        .map((l) => ({
          label: l.nome,
          partes: [
            { nome: "Aprovados", value: l.bci_aprovados, color: COR_APROVADO },
            { nome: "Pendentes", value: l.bci_pendentes, color: COR_PENDENTE },
            {
              nome: "Rejeitados",
              value: l.bci_rejeitados,
              color: COR_REJEITADO,
            },
          ],
        })),
    [visiveis],
  );

  return (
    <>
      <div className="cal-filters">
        <label className="cal-filter">
          <span className="mono">Técnico</span>
          <select
            value={tecnico ?? ""}
            onChange={(e) =>
              setTecnico(e.target.value ? Number(e.target.value) : null)
            }
          >
            <option value="">Todos</option>
            {linhas.map((l) => (
              <option key={l.id} value={l.id}>
                {l.nome}
              </option>
            ))}
          </select>
        </label>
        <label className="cal-filter">
          <span className="mono">De</span>
          <input
            type="date"
            value={desde}
            onChange={(e) => setDesde(e.target.value)}
          />
        </label>
        <label className="cal-filter">
          <span className="mono">Até</span>
          <input
            type="date"
            value={ate}
            onChange={(e) => setAte(e.target.value)}
          />
        </label>
        {(desde || ate || tecnico) && (
          <button
            type="button"
            className="cal-filter-clear"
            onClick={() => {
              setDesde("");
              setAte("");
              setTecnico(null);
            }}
          >
            Limpar
          </button>
        )}
      </div>

      <div className="kpi-grid">
        <Kpi n="TÉCNICOS" value={fmtInt(visiveis.length)} sub="no escopo" />
        <Kpi n="BCIs" value={fmtInt(tot.bci_total)} sub="coletados" />
        <Kpi n="APROVADOS" value={fmtInt(tot.bci_aprovados)} sub="concluídos" />
        <Kpi
          n="DEMANDAS"
          value={fmtInt(tot.demandas_concluidas)}
          sub="concluídas"
        />
      </div>

      {grafTecnicos.length > 0 && (
        <div className="charts-grid" style={{ gridTemplateColumns: "1fr" }}>
          <div className="chart-block">
            <div className="chart-title">BCIs por técnico</div>
            <div
              className="chart-legend"
              style={{ flexDirection: "row", flexWrap: "wrap", gap: 16 }}
            >
              <span className="chart-leg-l" style={{ flex: "none" }}>
                <span
                  className="chart-dot"
                  style={{
                    background: COR_APROVADO,
                    display: "inline-block",
                    marginRight: 6,
                  }}
                />
                Aprovados
              </span>
              <span className="chart-leg-l" style={{ flex: "none" }}>
                <span
                  className="chart-dot"
                  style={{
                    background: COR_PENDENTE,
                    display: "inline-block",
                    marginRight: 6,
                  }}
                />
                Pendentes
              </span>
              <span className="chart-leg-l" style={{ flex: "none" }}>
                <span
                  className="chart-dot"
                  style={{
                    background: COR_REJEITADO,
                    display: "inline-block",
                    marginRight: 6,
                  }}
                />
                Rejeitados
              </span>
            </div>
            <div style={{ marginTop: 16 }}>
              <BarrasEmpilhadas linhas={grafTecnicos} />
            </div>
          </div>
        </div>
      )}

      {q.isLoading ? (
        <p className="muted" style={{ marginTop: 24 }}>
          Carregando…
        </p>
      ) : visiveis.length === 0 ? (
        <p className="empty" style={{ marginTop: 24 }}>
          Nenhum técnico encontrado no escopo.
        </p>
      ) : (
        <table className="data-table" style={{ marginTop: 24 }}>
          <thead>
            <tr>
              <th>Técnico</th>
              <th className="num">BCI total</th>
              <th className="num">Aprovados</th>
              <th className="num">Pendentes</th>
              <th className="num">Rejeitados</th>
              <th className="num">Dem. concl.</th>
              <th className="num">Dem. pend.</th>
              <th>Último acesso</th>
            </tr>
          </thead>
          <tbody>
            {visiveis.map((l) => (
              <tr key={l.id}>
                <td data-label="Técnico">
                  <span className={`dot ${l.ativo_campo ? "ok" : "warn"}`} />
                  {l.nome}
                </td>
                <td className="num" data-label="BCI total">
                  {fmtInt(l.bci_total)}
                </td>
                <td className="num" data-label="Aprovados">
                  {fmtInt(l.bci_aprovados)}
                </td>
                <td className="num" data-label="Pendentes">
                  {fmtInt(l.bci_pendentes)}
                </td>
                <td className="num" data-label="Rejeitados">
                  {fmtInt(l.bci_rejeitados)}
                </td>
                <td className="num" data-label="Dem. concl.">
                  {fmtInt(l.demandas_concluidas)}
                </td>
                <td className="num" data-label="Dem. pend.">
                  {fmtInt(l.demandas_pendentes)}
                </td>
                <td className="small" data-label="Último acesso">
                  {fmtData(l.last_login)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}

function toFatias(
  obj: Record<string, number>,
  labels: Record<string, string>,
  cor: (chave: string, i: number) => string,
): Fatia[] {
  return Object.entries(obj)
    .map(([k, v], i) => ({ label: labels[k] ?? k, value: v, color: cor(k, i) }))
    .sort((a, b) => b.value - a.value);
}

function GestaoPanel({ municipio }: { municipio: number | null }) {
  const q = useRelatorioGestao(municipio);
  const d: RelatorioGestao | undefined = q.data;

  if (q.isLoading || !d) {
    return (
      <p className="muted" style={{ marginTop: 24 }}>
        Carregando…
      </p>
    );
  }

  const corStatus = (k: string) =>
    STATUS_INFO[k as StatusImovel]?.cor ?? "#5a6b7b";
  const fatiasStatus = toFatias(d.imoveis.por_status, STATUS_LABEL, corStatus);
  const fatiasUso = toFatias(
    d.imoveis.por_uso,
    USO_LABEL,
    (_k, i) => PALETA[i % PALETA.length],
  );
  const fatiasTipo = toFatias(
    d.vias.por_tipo,
    VIA_LABEL,
    (_k, i) => PALETA[i % PALETA.length],
  );
  const fatiasPav: Fatia[] = [
    { label: "Pavimentadas", value: d.vias.pavimentadas, color: COR_APROVADO },
    {
      label: "Não pavimentadas",
      value: d.vias.nao_pavimentadas,
      color: COR_PENDENTE,
    },
    {
      label: "Revestimento asfáltico",
      value: d.vias.revestimento_asfaltico,
      color: "#2563EB",
    },
    { label: "Não informado", value: d.vias.nao_informado, color: "#5a6b7b" },
  ];

  return (
    <>
      <div className="kpi-grid">
        <Kpi n="IMÓVEIS" value={fmtInt(d.imoveis.total)} sub="cadastrados" />
        <Kpi n="VIAS" value={fmtInt(d.vias.total)} sub="logradouros" />
        <Kpi n="QUADRAS" value={fmtInt(d.quadras)} sub="cadastradas" />
        <Kpi n="BAIRROS" value={fmtInt(d.bairros)} sub="cadastrados" />
      </div>

      <div className="cross-grid" style={{ marginTop: 24 }}>
        <div className="cross-card">
          <span className="cross-k mono">ÁREA DE TERRENO</span>
          <span className="cross-v">
            {fmtArea(d.imoveis.area_terreno_total)}
          </span>
        </div>
        <div className="cross-card">
          <span className="cross-k mono">ÁREA CONSTRUÍDA (IMÓVEIS)</span>
          <span className="cross-v">
            {fmtArea(d.imoveis.area_construida_total)}
          </span>
        </div>
        <div className="cross-card">
          <span className="cross-k mono">EDIFICAÇÕES</span>
          <span className="cross-v">{fmtInt(d.edificacoes.total)}</span>
        </div>
        <div className="cross-card">
          <span className="cross-k mono">ÁREA CONSTRUÍDA (EDIF.)</span>
          <span className="cross-v">
            {fmtArea(d.edificacoes.area_construida_total)}
          </span>
        </div>
      </div>

      <div className="charts-grid">
        <Donut titulo="Imóveis por situação" fatias={fatiasStatus} />
        <Donut titulo="Imóveis por uso" fatias={fatiasUso} />
        <BarrasV titulo="Vias por tipo" fatias={fatiasTipo} />
        <Donut titulo="Pavimentação das vias" fatias={fatiasPav} />
      </div>
    </>
  );
}

export default function RelatoriosScene() {
  const [params, setParams] = useSearchParams();
  const view = params.get("view") === "gestao" ? "gestao" : "tecnicos";
  const municipioFiltro = useUIStore((s) => s.municipioFiltro);
  const user = useAuthStore((s) => s.user);

  // Coordenador é travado no próprio município pelo backend; admin usa o
  // seletor global da barra superior.
  const municipio = user?.role === "admin" ? municipioFiltro : null;

  return (
    <div className="scene-pad">
      <div className="rkicker mono">05 · RELATÓRIOS</div>
      <h1>Dashboard e relatórios</h1>

      <div className="demandas-switch">
        <div className="tweak-opts">
          <button
            type="button"
            className={view === "tecnicos" ? "on" : ""}
            onClick={() => setParams({})}
          >
            Técnicos
          </button>
          <button
            type="button"
            className={view === "gestao" ? "on" : ""}
            onClick={() => setParams({ view: "gestao" })}
          >
            Gestão
          </button>
        </div>
      </div>

      {view === "tecnicos" ? (
        <TecnicosPanel municipio={municipio} />
      ) : (
        <GestaoPanel municipio={municipio} />
      )}
    </div>
  );
}
