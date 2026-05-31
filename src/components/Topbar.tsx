export type View = "dashboard" | "mapa";

interface TopbarProps {
  view: View;
  onChange: (view: View) => void;
}

export default function Topbar({ view, onChange }: TopbarProps) {
  return (
    <header className="topbar">
      <div className="brand">
        <svg
          className="brand__mark"
          viewBox="0 0 64 64"
          role="img"
          aria-label="BzR"
        >
          <rect width="64" height="64" rx="14" fill="#0f4d31" />
          <path
            d="M32 12c-8.8 0-16 6.6-16 14.8C16 38 32 52 32 52s16-14 16-25.2C48 18.6 40.8 12 32 12z"
            fill="#4FA877"
          />
          <circle cx="32" cy="27" r="6.2" fill="#F7F8F5" />
        </svg>
        <div>
          <div className="brand__name">
            BzR <b>WebGIS</b>
          </div>
          <div className="brand__tag">Gestão Geoespacial</div>
        </div>
      </div>

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
