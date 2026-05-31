import { STATUS_LABEL, type DemandStatus } from "../data/modules";

const STATUS_COLORS: Record<DemandStatus, string> = {
  pendente: "#a9651b",
  andamento: "#156540",
  concluido: "#20507f",
};

export default function Legend() {
  return (
    <div className="legend" aria-label="Legenda">
      <h4>Situação das demandas</h4>
      {(Object.keys(STATUS_LABEL) as DemandStatus[]).map((s) => (
        <div className="legend__row" key={s}>
          <span
            className="legend__swatch"
            style={{ background: STATUS_COLORS[s] }}
          />
          <span>{STATUS_LABEL[s]}</span>
        </div>
      ))}
    </div>
  );
}
