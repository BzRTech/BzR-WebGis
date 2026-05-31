import {
  MODULES,
  PROJECTS,
  STATUS_LABEL,
  type DemandStatus,
} from "../data/modules";

function countByStatus(status: DemandStatus): number {
  return MODULES.reduce(
    (acc, m) => acc + m.features.filter((f) => f.status === status).length,
    0,
  );
}

const totalDemands = MODULES.reduce((acc, m) => acc + m.features.length, 0);

export default function Dashboard() {
  return (
    <main className="dashboard">
      <div className="dashboard__head">
        <h1>Painel de Gestão</h1>
        <p>
          Visão consolidada dos projetos de WebGIS e das demandas municipais por
          módulo.
        </p>
      </div>

      <div className="kpis">
        <div className="kpi">
          <div className="kpi__label">Projetos ativos</div>
          <div className="kpi__value">
            {PROJECTS.filter((p) => p.status !== "concluido").length}
          </div>
          <div className="kpi__hint">{PROJECTS.length} no total</div>
        </div>
        <div className="kpi">
          <div className="kpi__label">Módulos</div>
          <div className="kpi__value">{MODULES.length}</div>
          <div className="kpi__hint">camadas municipais</div>
        </div>
        <div className="kpi">
          <div className="kpi__label">Demandas</div>
          <div className="kpi__value">{totalDemands}</div>
          <div className="kpi__hint">georreferenciadas</div>
        </div>
        <div className="kpi">
          <div className="kpi__label">Pendentes</div>
          <div className="kpi__value">{countByStatus("pendente")}</div>
          <div className="kpi__hint">aguardando ação</div>
        </div>
      </div>

      <div className="grid-2">
        <div className="panel">
          <div className="panel__head">
            <h2>Projetos em andamento</h2>
          </div>
          {PROJECTS.map((p) => (
            <div className="project" key={p.name}>
              <div>
                <div className="project__name">{p.name}</div>
                <div className="project__client">{p.client}</div>
              </div>
              <span className={`badge badge--${p.status}`}>
                {STATUS_LABEL[p.status]}
              </span>
              <div className="project__progress">
                <div className="bar">
                  <div
                    className="bar__fill"
                    style={{ width: `${p.progress}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="panel">
          <div className="panel__head">
            <h2>Demandas por módulo</h2>
          </div>
          {MODULES.map((m) => (
            <div className="module-stat" key={m.id}>
              <span
                className="module-stat__icon"
                style={{ background: m.color }}
                aria-hidden="true"
              >
                {m.icon}
              </span>
              <span className="module-stat__name">{m.name}</span>
              <span className="module-stat__count">{m.features.length}</span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
