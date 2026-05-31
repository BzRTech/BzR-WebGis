import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import {
  MODULES,
  MAP_CENTER,
  MAP_ZOOM,
  STATUS_LABEL,
  type DemandStatus,
} from "../data/modules";
import Legend from "./Legend";

interface MapViewProps {
  active: Set<string>;
}

const STATUS_STROKE: Record<DemandStatus, string> = {
  pendente: "#a9651b",
  andamento: "#156540",
  concluido: "#20507f",
};

export default function MapView({ active }: MapViewProps) {
  const visibleModules = MODULES.filter((m) => active.has(m.id));

  return (
    <section className="workspace">
      <MapContainer
        className="map"
        center={MAP_CENTER}
        zoom={MAP_ZOOM}
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> · BzR Tech'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {visibleModules.flatMap((m) =>
          m.features.map((f) => (
            <CircleMarker
              key={f.id}
              center={f.position}
              radius={9}
              pathOptions={{
                color: STATUS_STROKE[f.status],
                weight: 2,
                fillColor: m.color,
                fillOpacity: 0.85,
              }}
            >
              <Popup>
                <div className="popup__title">{f.title}</div>
                <div className="popup__row" style={{ marginBottom: 6 }}>
                  {f.description}
                </div>
                <div className="popup__row" style={{ marginBottom: 8 }}>
                  <strong>{m.name}</strong>
                </div>
                <span className={`badge badge--${f.status}`}>
                  {STATUS_LABEL[f.status]}
                </span>
              </Popup>
            </CircleMarker>
          )),
        )}
      </MapContainer>

      <div className="map-card">
        <h4>Mapa operacional</h4>
        <p>
          {visibleModules.length === 0
            ? "Nenhum módulo ativo. Selecione módulos no painel lateral."
            : `${visibleModules.length} módulo(s) ativo(s) · ${visibleModules.reduce(
                (acc, m) => acc + m.features.length,
                0,
              )} demandas no mapa.`}
        </p>
      </div>

      <Legend />
    </section>
  );
}
