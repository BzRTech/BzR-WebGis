// Gráficos em SVG puro — sem dependências externas, temáveis via CSS vars.

export interface Fatia {
  label: string;
  value: number;
  color: string;
}

const fmt = (n: number) => n.toLocaleString("pt-BR");

export const PALETA = [
  "#1351b4",
  "#2670e8",
  "#168821",
  "#c5a000",
  "#e52207",
  "#7d5ba6",
  "#0c9abe",
  "#d4691e",
  "#5a6b7b",
  "#9a3d8c",
];

function vazio(fatias: Fatia[]): boolean {
  return fatias.every((f) => f.value === 0);
}

export function Donut({
  fatias,
  titulo,
}: {
  fatias: Fatia[];
  titulo?: string;
}) {
  const total = fatias.reduce((s, f) => s + f.value, 0);
  const size = 168;
  const r = 64;
  const cx = size / 2;
  const sw = 26;
  const circ = 2 * Math.PI * r;
  let acc = 0;

  return (
    <div className="chart-block">
      {titulo && <div className="chart-title">{titulo}</div>}
      {vazio(fatias) ? (
        <p className="muted">Sem dados no período.</p>
      ) : (
        <div className="donut-wrap">
          <svg
            viewBox={`0 0 ${size} ${size}`}
            className="donut"
            role="img"
            aria-label={titulo}
          >
            <circle
              cx={cx}
              cy={cx}
              r={r}
              fill="none"
              stroke="var(--line)"
              strokeWidth={sw}
            />
            {fatias.map((f) => {
              if (f.value === 0) return null;
              const frac = f.value / total;
              const dash = frac * circ;
              const seg = (
                <circle
                  key={f.label}
                  cx={cx}
                  cy={cx}
                  r={r}
                  fill="none"
                  stroke={f.color}
                  strokeWidth={sw}
                  strokeDasharray={`${dash} ${circ - dash}`}
                  strokeDashoffset={-acc * circ}
                  transform={`rotate(-90 ${cx} ${cx})`}
                />
              );
              acc += frac;
              return seg;
            })}
            <text x={cx} y={cx - 4} className="donut-total">
              {fmt(total)}
            </text>
            <text x={cx} y={cx + 16} className="donut-cap">
              total
            </text>
          </svg>
          <ul className="chart-legend">
            {fatias.map((f) => (
              <li key={f.label}>
                <span
                  className="chart-dot"
                  style={{ background: f.color }}
                />
                <span className="chart-leg-l">{f.label}</span>
                <span className="chart-leg-v mono">
                  {fmt(f.value)}
                  <span className="muted">
                    {" "}
                    · {total ? Math.round((f.value / total) * 100) : 0}%
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function BarrasV({
  fatias,
  titulo,
}: {
  fatias: Fatia[];
  titulo?: string;
}) {
  const max = Math.max(1, ...fatias.map((f) => f.value));
  const W = 320;
  const H = 180;
  const padB = 28;
  const padT = 16;
  const gap = 14;
  const n = fatias.length || 1;
  const bw = (W - gap * (n + 1)) / n;
  const escala = (v: number) => ((H - padB - padT) * v) / max;

  return (
    <div className="chart-block">
      {titulo && <div className="chart-title">{titulo}</div>}
      {vazio(fatias) ? (
        <p className="muted">Sem dados no período.</p>
      ) : (
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="barchart"
          role="img"
          aria-label={titulo}
        >
          <line
            x1={0}
            y1={H - padB}
            x2={W}
            y2={H - padB}
            stroke="var(--line-2)"
          />
          {fatias.map((f, i) => {
            const h = escala(f.value);
            const x = gap + i * (bw + gap);
            const y = H - padB - h;
            return (
              <g key={f.label}>
                <rect
                  x={x}
                  y={y}
                  width={bw}
                  height={h}
                  fill={f.color}
                  rx={2}
                />
                <text
                  x={x + bw / 2}
                  y={y - 5}
                  className="bar-num"
                  textAnchor="middle"
                >
                  {fmt(f.value)}
                </text>
                <text
                  x={x + bw / 2}
                  y={H - padB + 16}
                  className="bar-cap"
                  textAnchor="middle"
                >
                  {f.label}
                </text>
              </g>
            );
          })}
        </svg>
      )}
    </div>
  );
}

export interface BarraEmpilhada {
  label: string;
  partes: { value: number; color: string; nome: string }[];
}

export function BarrasEmpilhadas({
  linhas,
  titulo,
}: {
  linhas: BarraEmpilhada[];
  titulo?: string;
}) {
  const totais = linhas.map((l) =>
    l.partes.reduce((s, p) => s + p.value, 0),
  );
  const max = Math.max(1, ...totais);
  const semDados = totais.every((t) => t === 0);

  return (
    <div className="chart-block">
      {titulo && <div className="chart-title">{titulo}</div>}
      {semDados ? (
        <p className="muted">Sem dados no período.</p>
      ) : (
        <div className="stack-table">
          {linhas.map((l, i) => (
            <div className="stack-row" key={l.label}>
              <span className="stack-l">{l.label}</span>
              <span className="stack-track">
                {l.partes.map((p) =>
                  p.value > 0 ? (
                    <span
                      key={p.nome}
                      className="stack-seg"
                      style={{
                        width: `${(p.value / max) * 100}%`,
                        background: p.color,
                      }}
                      title={`${p.nome}: ${fmt(p.value)}`}
                    />
                  ) : null,
                )}
              </span>
              <span className="stack-v mono">{fmt(totais[i])}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
