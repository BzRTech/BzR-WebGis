export type View = "dashboard" | "mapa";

interface TopbarProps {
  view: View;
  onChange: (view: View) => void;
  /** Volta para a landing institucional. */
  onSair?: () => void;
}

export default function Topbar({ view, onChange, onSair }: TopbarProps) {
  return (
    <header className="topbar">
      <button className="brand" type="button" onClick={onSair}>
        {/* "O Bloco": quadrado com um único canto arredondado, sempre o
            superior-direito (assinatura da marca BzR — public/marca). */}
        <svg
          className="brand__mark"
          viewBox="0 0 100 100"
          role="img"
          aria-label="BzR"
        >
          <path d="M0 0 H64 A36 36 0 0 1 100 36 V100 H0 Z" fill="#fff" />
        </svg>
        <span>
          <span className="brand__name">
            BzR <b>WebGIS</b>
          </span>
          <span className="brand__tag">Gestão Geoespacial</span>
        </span>
      </button>

      <nav className="topbar__nav" aria-label="Navegação principal">
        <button
          className={view === "dashboard" ? "is-active" : ""}
          onClick={() => onChange("dashboard")}
        >
          Painel
        </button>
        <button
          className={view === "mapa" ? "is-active" : ""}
          onClick={() => onChange("mapa")}
        >
          Mapa
        </button>
      </nav>

      <div className="topbar__spacer" />

      <div className="topbar__user">
        <span>BzR Tech</span>
        <span className="avatar" aria-hidden="true">
          B
        </span>
      </div>
    </header>
  );
}
