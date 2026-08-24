import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { useUIStore } from "@/stores/uiStore";
import { useRelatorioGestao, type RelatorioGestao } from "@/features/relatorios/api";
import {
  IcoArrow,
  IcoDraw,
  IcoHome,
  IcoLayers,
  IcoMap,
  IcoTarget,
  IcoUsers,
} from "@/components/icons";

const STATUS_LABEL: Record<string, string> = {
  sem_coleta: "Sem coleta",
  em_coleta: "Em coleta",
  enviado: "Enviado",
  aprovado: "Aprovado",
  rejeitado: "Rejeitado",
  arquivado: "Arquivado",
};

const USO_LABEL: Record<string, string> = {
  residencial: "Residencial",
  comercial: "Comercial",
  industrial: "Industrial",
  servicos: "Serviços",
  territorial: "Territorial",
  misto: "Misto",
  outro: "Outro",
};

const VIA_LABEL: Record<string, string> = {
  rua: "Rua",
  avenida: "Avenida",
  travessa: "Travessa",
  alameda: "Alameda",
  rodovia: "Rodovia",
  outro: "Outro",
};

// Paleta de gráficos: amarelo de marca + rampa de cinzas (adapta dark/light).
const RAMP = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-6)",
];

function fmtInt(n: number): string {
  return n.toLocaleString("pt-BR");
}

function fmtArea(v: string | null): string {
  const n = Number(v ?? 0);
  return `${n.toLocaleString("pt-BR", { maximumFractionDigits: 0 })} m²`;
}

interface Seg {
  label: string;
  value: number;
  color: string;
}

function toSegments(
  obj: Record<string, number>,
  labels: Record<string, string>,
): Seg[] {
  return Object.entries(obj)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => ({ label: labels[k] ?? k, value: v }))
    .sort((a, b) => b.value - a.value)
    .map((s, i) => ({ ...s, color: RAMP[i % RAMP.length] }));
}

function Donut({ segments, unit }: { segments: Seg[]; unit: string }) {
  const total = segments.reduce((acc, s) => acc + s.value, 0);
  const r = 52;
  const c = 2 * Math.PI * r;
  const sw = 18;
  let acc = 0;

  return (
    <div className="donut-wrap">
      <svg viewBox="0 0 140 140" className="donut" role="img">
        <circle
          cx="70"
          cy="70"
          r={r}
          fill="none"
          stroke="var(--paper-2)"
          strokeWidth={sw}
        />
        {total > 0 &&
          segments.map((s, i) => {
            const dash = (s.value / total) * c;
            const el = (
              <circle
                key={i}
                cx="70"
                cy="70"
                r={r}
                fill="none"
                stroke={s.color}
                strokeWidth={sw}
                strokeDasharray={`${dash} ${c - dash}`}
                strokeDashoffset={-acc}
                transform="rotate(-90 70 70)"
              />
            );
            acc += dash;
            return el;
          })}
        <text x="70" y="66" textAnchor="middle" className="donut-n">
          {fmtInt(total)}
        </text>
        <text x="70" y="84" textAnchor="middle" className="donut-u">
          {unit}
        </text>
      </svg>
      <ul className="donut-legend">
        {segments.map((s, i) => (
          <li key={i}>
            <span className="dl-dot" style={{ background: s.color }} />
            <span className="dl-l">{s.label}</span>
            <span className="dl-v mono">{fmtInt(s.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function DashBars({ items }: { items: Seg[] }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  if (items.length === 0) {
    return <p className="muted">Sem dados.</p>;
  }
  return (
    <div className="dash-bars">
      {items.map((it, i) => (
        <div className="dash-bar" key={i}>
          <div className="dash-bar-top">
            <span className="dash-bar-l">{it.label}</span>
            <span className="dash-bar-v mono">{fmtInt(it.value)}</span>
          </div>
          <span className="dash-bar-track">
            <span
              className="dash-bar-fill"
              style={{ width: `${(it.value / max) * 100}%`, background: it.color }}
            />
          </span>
        </div>
      ))}
    </div>
  );
}

function StatCard({
  icon: Ic,
  value,
  label,
  sub,
  accent,
}: {
  icon: (p: { size?: number }) => JSX.Element;
  value: string;
  label: string;
  sub: string;
  accent: string;
}) {
  return (
    <div className="dash-card">
      <div className="dash-card-h">
        <span className="dash-card-ico">
          <Ic size={18} />
        </span>
        <span className="dash-card-line" style={{ background: accent }} />
      </div>
      <div className="dash-card-n">{value}</div>
      <div className="dash-card-l">{label}</div>
      <div className="dash-card-sub mono">{sub}</div>
    </div>
  );
}

export default function DashboardScene() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const municipioFiltro = useUIStore((s) => s.municipioFiltro);

  // Coordenador é travado no próprio município pelo backend; admin usa o
  // seletor global da barra superior.
  const municipio = user?.role === "admin" ? municipioFiltro : null;
  const q = useRelatorioGestao(municipio);
  const d: RelatorioGestao | undefined = q.data;

  const statusSegs = useMemo(
    () => (d ? toSegments(d.imoveis.por_status, STATUS_LABEL) : []),
    [d],
  );
  const usoSegs = useMemo(
    () => (d ? toSegments(d.imoveis.por_uso, USO_LABEL) : []),
    [d],
  );
  const viaSegs = useMemo(
    () => (d ? toSegments(d.vias.por_tipo, VIA_LABEL) : []),
    [d],
  );
  const pavSegs = useMemo<Seg[]>(() => {
    if (!d) return [];
    return [
      { label: "Pavimentadas", value: d.vias.pavimentadas, color: RAMP[0] },
      { label: "Não pavimentadas", value: d.vias.nao_pavimentadas, color: RAMP[2] },
      { label: "Revestimento asfáltico", value: d.vias.revestimento_asfaltico, color: "#2563EB" },
      { label: "Não informado", value: d.vias.nao_informado, color: RAMP[4] },
    ].filter((s) => s.value > 0);
  }, [d]);

  const bairros = d?.imoveis.por_bairro ?? [];
  const maxBairro = Math.max(1, ...bairros.map((b) => b.total));

  return (
    <div className="scene-pad dash">
      <div className="dash-hero">
        <div>
          <div className="rkicker mono">GESTÃO · DASHBOARD</div>
          <h1>Dashboard Municipal</h1>
          <p className="lede">
            Visão consolidada do Cadastro Técnico Multifinalitário.
          </p>
        </div>
        <button className="btn-primary dash-cta" onClick={() => navigate("/")}>
          Acessar Mapa <IcoArrow size={16} />
        </button>
      </div>

      {q.isLoading || !d ? (
        <p className="muted mono">carregando…</p>
      ) : (
        <>
          <div className="dash-cards">
            <StatCard
              icon={IcoHome}
              value={fmtInt(d.imoveis.total)}
              label="Imóveis"
              sub="cadastrados"
              accent="var(--chart-1)"
            />
            <StatCard
              icon={IcoLayers}
              value={fmtInt(d.edificacoes.total)}
              label="Edificações"
              sub="mapeadas"
              accent="var(--chart-3)"
            />
            <StatCard
              icon={IcoMap}
              value={fmtInt(d.vias.total)}
              label="Vias"
              sub="logradouros"
              accent="var(--chart-2)"
            />
            <StatCard
              icon={IcoTarget}
              value={fmtInt(d.quadras)}
              label="Quadras"
              sub="cadastradas"
              accent="var(--chart-4)"
            />
            <StatCard
              icon={IcoUsers}
              value={fmtInt(d.bairros)}
              label="Bairros"
              sub="mapeados"
              accent="var(--chart-2)"
            />
            <StatCard
              icon={IcoDraw}
              value={fmtArea(d.imoveis.area_construida_total)}
              label="Área construída"
              sub="imóveis"
              accent="var(--chart-1)"
            />
          </div>

          <div className="dash-panels">
            <section className="dash-panel">
              <div className="dash-panel-h">
                <h2>Imóveis por situação</h2>
              </div>
              {statusSegs.length === 0 ? (
                <p className="muted">Sem dados.</p>
              ) : (
                <Donut segments={statusSegs} unit="imóveis" />
              )}
            </section>

            <section className="dash-panel">
              <div className="dash-panel-h">
                <h2>Imóveis por uso</h2>
              </div>
              <DashBars items={usoSegs} />
            </section>

            <section className="dash-panel">
              <div className="dash-panel-h">
                <h2>Pavimentação das vias</h2>
              </div>
              {pavSegs.length === 0 ? (
                <p className="muted">Sem dados.</p>
              ) : (
                <Donut segments={pavSegs} unit="vias" />
              )}
              <div className="dash-panel-sub">
                <span className="panel-kicker mono">VIAS POR TIPO</span>
                <DashBars items={viaSegs} />
              </div>
            </section>
          </div>

          <section className="dash-panel dash-rank">
            <div className="dash-panel-h">
              <h2>Distribuição por bairro</h2>
              <span className="muted mono small">
                {fmtInt(bairros.length)} bairros
              </span>
            </div>
            {bairros.length === 0 ? (
              <p className="muted">Sem imóveis cadastrados.</p>
            ) : (
              <div className="rank-grid">
                {bairros.map((b, i) => (
                  <div className="rank-item" key={`${b.bairro}-${i}`}>
                    <span className="rank-n mono">{i + 1}</span>
                    <div className="rank-body">
                      <div className="rank-top">
                        <span className="rank-name">{b.bairro}</span>
                        <span className="rank-v mono">{fmtInt(b.total)}</span>
                      </div>
                      <span className="rank-track">
                        <span
                          className="rank-fill"
                          style={{ width: `${(b.total / maxBairro) * 100}%` }}
                        />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <div className="dash-summary">
            <div className="dash-sum-item">
              <span className="dash-sum-k mono">ÁREA DE TERRENO</span>
              <span className="dash-sum-v">
                {fmtArea(d.imoveis.area_terreno_total)}
              </span>
            </div>
            <div className="dash-sum-item">
              <span className="dash-sum-k mono">ÁREA CONSTRUÍDA (IMÓVEIS)</span>
              <span className="dash-sum-v">
                {fmtArea(d.imoveis.area_construida_total)}
              </span>
            </div>
            <div className="dash-sum-item">
              <span className="dash-sum-k mono">ÁREA CONSTRUÍDA (EDIF.)</span>
              <span className="dash-sum-v">
                {fmtArea(d.edificacoes.area_construida_total)}
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
