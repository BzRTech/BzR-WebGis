import { useEffect } from "react";
import { GeoJSON, MapContainer, TileLayer, useMap } from "react-leaflet";
import type { GeoJsonObject } from "geojson";
import * as L from "leaflet";
import { useLotes } from "./api";

const ACCENT = "#FFD500";

function Fit({ feature }: { feature: GeoJsonObject }) {
  const map = useMap();
  useEffect(() => {
    try {
      const b = L.geoJSON(feature).getBounds();
      if (b.isValid()) map.fitBounds(b, { padding: [30, 30], maxZoom: 19 });
    } catch {
      /* sem geometria válida */
    }
  }, [feature, map]);
  return null;
}

export default function LoteMiniMap({ imovelId }: { imovelId: number }) {
  const { data } = useLotes();
  const feature = data?.features.find((f) => f.properties.id === imovelId);
  if (!feature) return null;
  const geo = feature as unknown as GeoJsonObject;

  return (
    <div
      style={{
        height: 280,
        border: "1px solid var(--line-2)",
        marginTop: 10,
      }}
    >
      <MapContainer
        center={[-7.7, -35]}
        zoom={17}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <GeoJSON
          key={imovelId}
          data={geo}
          style={{
            color: ACCENT,
            weight: 3,
            fillColor: ACCENT,
            fillOpacity: 0.25,
          }}
        />
        <Fit feature={geo} />
      </MapContainer>
    </div>
  );
}
