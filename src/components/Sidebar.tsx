import { MODULES } from "../data/modules";

interface SidebarProps {
  active: Set<string>;
  onToggle: (id: string) => void;
}

export default function Sidebar({ active, onToggle }: SidebarProps) {
  return (
    <aside className="sidebar" aria-label="Módulos">
      <div className="sidebar__section">
        <div className="sidebar__title">Módulos municipais</div>
      </div>

      <div className="module-list">
        {MODULES.map((m) => {
          const isActive = active.has(m.id);
          return (
            <button
              key={m.id}
              className={`module ${isActive ? "is-active" : ""}`}
              onClick={() => onToggle(m.id)}
              aria-pressed={isActive}
            >
              <span
                className="module__icon"
                style={{ background: m.color }}
                aria-hidden="true"
              >
                {m.icon}
              </span>
              <span className="module__body">
                <span className="module__name">{m.name}</span>
                <span className="module__meta">
                  {m.features.length} demandas
                </span>
              </span>
              <span className="module__toggle" aria-hidden="true" />
            </button>
          );
        })}
      </div>
    </aside>
  );
}
