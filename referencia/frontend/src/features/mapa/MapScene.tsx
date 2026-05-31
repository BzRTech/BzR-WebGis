import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  GeoJSON,
  MapContainer,
  TileLayer,
  ZoomControl,
  useMap,
} from "react-leaflet";
import type { Layer, PathOptions } from "leaflet";
import type {
  Feature,
  FeatureCollection,
  GeoJsonObject,
  Geometry,
} from "geojson";
import { useCamadaGeoJSON, useContagens, useLotes, useMunicipios } from "./api";
import type { CamadaTipo } from "./api";
import { useUIStore } from "@/stores/uiStore";
import { useAuthStore } from "@/stores/authStore";
import {
  PAVIMENTACAO_INFO,
  STATUS_INFO,
  USO_INFO,
  type LotesFC,
  type LoteProperties,
  type Pavimentacao,
  type StatusImovel,
  type UsoImovel,
} from "@/types/mapa";
import * as L from "leaflet";
import "leaflet.heat";

const ACCENT = "#FFD500";

type ColorMode = "status" | "tipo";
type LayerKey = "lotes" | CamadaTipo;

/* ───────── Ortofoto por município ─────────────────────────────────────
 * Tiles XYZ servidos por um nginx separado (serviço "orto" no
 * docker-compose, porta 8080), com a pirâmide na RAIZ do repo (./orto).
 * NÃO deixe os tiles dentro de frontend/ (trava o watcher do Vite).
 * ─────────────────────────────────────────────────────────────────────*/
interface OrtoCfg {
  url: string;
  center: [number, number];
  minZoom: number;
  maxNativeZoom: number;
}

const ORTO_HOST =
  typeof window !== "undefined" && window.location.hostname
    ? window.location.hostname
    : "localhost";
const ORTO_SRV = `http://${ORTO_HOST}:8080`;

const ORTOS: Record<string, OrtoCfg> = {
  itapororoca: {
    url: `${ORTO_SRV}/{z}/{x}/{y}.jpg`,
    center: [-6.836, -35.243],
    minZoom: 14,
    maxNativeZoom: 21,
  },
};
const ORTO_DEFAULT: OrtoCfg = ORTOS.itapororoca;
const ORTO_FLY_ZOOM = 17;

function normNome(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

/* ───────── Basemaps ──────────────────────────────────────────────────── */
type BaseKey = "ruas" | "satelite" | "claro" | "escuro" | "ortofoto";

const BASEMAPS: { key: BaseKey; label: string }[] = [
  { key: "ruas", label: "Ruas" },
  { key: "satelite", label: "Satélite" },
  { key: "claro", label: "Claro" },
  { key: "escuro", label: "Escuro" },
  { key: "ortofoto", label: "Ortofoto" },
];

function BaseLayerView({ base, orto }: { base: BaseKey; orto: OrtoCfg }) {
  switch (base) {
    case "satelite":
      return (
        <TileLayer
          key="satelite"
          attribution="Tiles &copy; Esri"
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          maxNativeZoom={19}
          maxZoom={23}
        />
      );
    case "claro":
      return (
        <TileLayer
          key="claro"
          attribution="&copy; OpenStreetMap &copy; CARTO"
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          maxNativeZoom={20}
          maxZoom={23}
        />
      );
    case "escuro":
      return (
        <TileLayer
          key="escuro"
          attribution="&copy; OpenStreetMap &copy; CARTO"
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          maxNativeZoom={20}
          maxZoom={23}
        />
      );
    case "ortofoto":
      return (
        <TileLayer
          key={`orto-${orto.url}`}
          attribution="Ortofoto · Prefeitura"
          url={orto.url}
          minZoom={orto.minZoom}
          maxNativeZoom={orto.maxNativeZoom}
          maxZoom={23}
        />
      );
    default:
      return (
        <TileLayer
          key="ruas"
          attribution="&copy; OpenStreetMap"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxNativeZoom={19}
          maxZoom={23}
        />
      );
  }
}

function OrtoFly({ base, center }: { base: BaseKey; center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    if (base === "ortofoto") map.setView(center, ORTO_FLY_ZOOM);
  }, [base, center, map]);
  return null;
}

/* ───────── Estilos das camadas ───────────────────────────────────────── */
function loteStyle(modo: ColorMode) {
  return (feature?: Feature): PathOptions => {
    if (modo === "tipo") {
      const uso = (feature?.properties?.uso ?? "outro") as UsoImovel;
      return {
        color: "#1a1a1a",
        weight: 1,
        fillColor: USO_INFO[uso]?.cor ?? "#9a9a9a",
        fillOpacity: 0.55,
      };
    }
    const st = (feature?.properties?.status_atual ??
      "sem_coleta") as StatusImovel;
    return {
      color: "#1a1a1a",
      weight: 1,
      fillColor: STATUS_INFO[st]?.cor ?? "#9a9a9a",
      fillOpacity: 0.55,
    };
  };
}

const STYLE_BAIRROS: PathOptions = { color: "#7c3aed", weight: 2, fill: false };
const STYLE_QUADRAS: PathOptions = { color: "#0ea5e9", weight: 1.5, fill: false };
const STYLE_EDIF: PathOptions = {
  color: "#e11d48",
  weight: 1,
  fillColor: "#e11d48",
  fillOpacity: 0.25,
};

function logrStyle(feature?: Feature): PathOptions {
  const pav = (feature?.properties?.pavimentacao ??
    "nao_informado") as Pavimentacao;
  return { color: PAVIMENTACAO_INFO[pav]?.cor ?? "#9a9a9a", weight: 3 };
}

/* ───────── Camada de lotes (clique → ficha, rótulos por zoom) ────────── */
function LotesLayer({
  data,
  modo,
  selId,
  onSelect,
  pane,
}: {
  data: LotesFC;
  modo: ColorMode;
  selId: number | null;
  onSelect: (p: LoteProperties) => void;
  pane?: string;
}) {
  const map = useMap();
  const ref = useRef<L.GeoJSON | null>(null);
  const selLayer = useRef<L.Polygon | null>(null);

  function onEachFeature(feature: Feature, layer: Layer) {
    layer.on("click", () => onSelect(feature.properties as LoteProperties));
  }

  useEffect(() => {
    const gj = ref.current;
    if (!gj) return;
    if (selLayer.current) {
      gj.resetStyle(selLayer.current);
      selLayer.current = null;
    }
    if (selId == null) return;
    gj.eachLayer((l) => {
      const poly = l as L.Polygon & { feature?: Feature };
      if (poly.feature?.properties?.id !== selId) return;
      poly.setStyle({ color: ACCENT, weight: 4, fillOpacity: 0.7 });
      poly.bringToFront();
      selLayer.current = poly;
      const isMobile = window.matchMedia("(max-width: 768px)").matches;
      if (isMobile) {
        // A ficha vira uma barra inferior no celular; reserva a metade de
        // baixo para que o lote selecionado apareça na metade de cima.
        const h = map.getSize().y;
        map.flyToBounds(poly.getBounds(), {
          maxZoom: 23,
          paddingTopLeft: [24, 90],
          paddingBottomRight: [24, Math.round(h * 0.5)],
          duration: 0.6,
        });
      } else {
        map.flyToBounds(poly.getBounds(), {
          maxZoom: 22,
          padding: [48, 48],
          duration: 0.6,
        });
      }
    });
  }, [selId, map]);

  useEffect(() => {
    const refresh = () => {
      const gj = ref.current;
      if (!gj) return;
      const b = map.getZoom() >= 17 ? map.getBounds() : null;
      gj.eachLayer((l) => {
        const poly = l as L.Polygon & { feature?: Feature };
        const visible = !!b && poly.getBounds().intersects(b);
        if (visible && !poly.getTooltip()) {
          const insc = poly.feature?.properties?.inscricao_cadastral ?? "";
          poly.bindTooltip(String(insc), {
            permanent: true,
            direction: "center",
            className: "lote-lbl",
          });
        } else if (!visible && poly.getTooltip()) {
          poly.unbindTooltip();
        }
      });
    };
    refresh();
    map.on("moveend zoomend", refresh);
    return () => {
      map.off("moveend zoomend", refresh);
    };
  }, [map]);

  return (
    <GeoJSON
      ref={ref}
      key={`${data.features.length}-${modo}`}
      data={data as unknown as GeoJsonObject}
      style={loteStyle(modo)}
      onEachFeature={onEachFeature}
      pane={pane}
    />
  );
}

/* ───────── Camada auxiliar genérica ──────────────────────────────────── */
function AuxLayer({
  data,
  style,
  rotulo,
  pane,
}: {
  data: FeatureCollection;
  style: PathOptions | ((f?: Feature) => PathOptions);
  rotulo?: (p: Record<string, unknown>) => string;
  pane?: string;
}) {
  function onEachFeature(feature: Feature, layer: Layer) {
    if (rotulo && feature.properties) {
      const txt = rotulo(feature.properties as Record<string, unknown>);
      if (txt) layer.bindTooltip(txt, { sticky: true });
    }
  }
  return (
    <GeoJSON
      key={data.features.length}
      data={data as unknown as GeoJsonObject}
      style={style}
      onEachFeature={onEachFeature}
      pane={pane}
    />
  );
}

/* ───────── Mapa de calor das edificações ─────────────────────────────── */
function centroidOf(geom: Geometry): [number, number] | null {
  let sx = 0;
  let sy = 0;
  let n = 0;
  const visit = (coords: unknown): void => {
    if (
      Array.isArray(coords) &&
      typeof coords[0] === "number" &&
      typeof coords[1] === "number"
    ) {
      sx += coords[0];
      sy += coords[1];
      n += 1;
    } else if (Array.isArray(coords)) {
      coords.forEach(visit);
    }
  };
  if ("coordinates" in geom) visit(geom.coordinates);
  if (!n) return null;
  return [sy / n, sx / n];
}

function HeatLayer({ points }: { points: Array<[number, number]> }) {
  const map = useMap();
  useEffect(() => {
    const layer = L.heatLayer(
      points.map(([lat, lng]) => [lat, lng, 0.6]),
      { radius: 18, blur: 22, maxZoom: 18 },
    );
    layer.addTo(map);
    return () => {
      map.removeLayer(layer);
    };
  }, [map, points]);
  return null;
}

function FitBounds({ data }: { data: GeoJsonObject | null }) {
  const map = useMap();
  useMemo(() => {
    if (!data) return;
    try {
      const layer = L.geoJSON(data);
      const b = layer.getBounds();
      if (b.isValid()) map.fitBounds(b, { padding: [24, 24] });
    } catch {
      /* sem geometria válida */
    }
  }, [data, map]);
  return null;
}

/* Empilhamento das camadas (de baixo p/ cima): bairros, logradouros,
 * quadras, lotes, edificações. Panes com z-index fixo garantem a ordem
 * independente de quando cada camada é ligada/desligada. */
const PANE_Z: Record<LayerKey, number> = {
  bairros: 411,
  logradouros: 412,
  quadras: 413,
  lotes: 414,
  edificacoes: 415,
};
const paneDe = (key: LayerKey) => `camada-${key}`;

function LayerPanes() {
  const map = useMap();
  useEffect(() => {
    for (const [key, z] of Object.entries(PANE_Z)) {
      const nome = paneDe(key as LayerKey);
      const pane = map.getPane(nome) ?? map.createPane(nome);
      pane.style.zIndex = String(z);
      // Edificações ficam por cima, mas deixam o clique passar para o lote.
      if (key === "edificacoes") pane.style.pointerEvents = "none";
    }
  }, [map]);
  return null;
}

/* ───────── Cena ──────────────────────────────────────────────────────── */
const CAMADAS: { key: LayerKey; label: string; cor: string }[] = [
  { key: "edificacoes", label: "Edificações", cor: "#e11d48" },
  { key: "lotes", label: "Lotes", cor: "#f59e0b" },
  { key: "quadras", label: "Quadras", cor: "#0ea5e9" },
  { key: "logradouros", label: "Logradouros", cor: "#f97316" },
  { key: "bairros", label: "Bairros", cor: "#7c3aed" },
];

export default function MapScene() {
  const navigate = useNavigate();
  const { data, isLoading, isError } = useLotes();
  const [sel, setSel] = useState<LoteProperties | null>(null);
  const focoId = useUIStore((s) => s.focoImovelId);
  const setFoco = useUIStore((s) => s.setFocoImovel);
  const municipioFiltro = useUIStore((s) => s.municipioFiltro);
  const municipios = useMunicipios();
  const userMuni = useAuthStore((s) => s.user?.municipio_nome);

  const [painelAberto, setPainelAberto] = useState(true);
  const [base, setBase] = useState<BaseKey>("ruas");
  const [modo, setModo] = useState<ColorMode>("status");
  const [heat, setHeat] = useState(false);
  const [visible, setVisible] = useState<Record<LayerKey, boolean>>({
    lotes: true,
    edificacoes: false,
    quadras: false,
    logradouros: false,
    bairros: false,
  });

  const contagens = useContagens();
  const bairros = useCamadaGeoJSON("bairros", visible.bairros);
  const quadras = useCamadaGeoJSON("quadras", visible.quadras);
  const logradouros = useCamadaGeoJSON("logradouros", visible.logradouros);
  const edificacoes = useCamadaGeoJSON(
    "edificacoes",
    visible.edificacoes || heat,
  );

  const heatPoints = useMemo<Array<[number, number]>>(() => {
    if (!heat || !edificacoes.data) return [];
    const pts: Array<[number, number]> = [];
    for (const f of edificacoes.data.features) {
      if (!f.geometry) continue;
      const c = centroidOf(f.geometry);
      if (c) pts.push(c);
    }
    return pts;
  }, [heat, edificacoes.data]);

  // Ortofoto segue o município ativo (seletor de cidade ou o do técnico).
  const orto = useMemo(() => {
    const nome =
      (municipioFiltro != null
        ? municipios.data?.find((m) => m.id === municipioFiltro)?.nome
        : null) ??
      userMuni ??
      null;
    return (nome && ORTOS[normNome(nome)]) || ORTO_DEFAULT;
  }, [municipioFiltro, municipios.data, userMuni]);

  // Foco vindo da busca da topbar: centraliza e seleciona o lote.
  useEffect(() => {
    if (focoId == null || !data) return;
    const f = data.features.find((x) => x.properties.id === focoId);
    if (f) {
      setSel(f.properties);
      setFoco(null);
    }
  }, [focoId, data, setFoco]);

  function toggle(key: LayerKey) {
    setVisible((v) => ({ ...v, [key]: !v[key] }));
  }

  const corLegenda = modo === "tipo" ? USO_INFO : STATUS_INFO;
  const cont = contagens.data;
  const contagemDe = (key: LayerKey): number | undefined =>
    cont ? cont[key] : undefined;

  return (
    <div style={{ position: "relative", height: "100%" }}>
      <MapContainer
        center={[-8.0, -34.9]}
        zoom={13}
        maxZoom={23}
        zoomControl={false}
        style={{ height: "100%", width: "100%" }}
      >
        <ZoomControl position="bottomright" />
        <LayerPanes />
        <BaseLayerView base={base} orto={orto} />
        <OrtoFly base={base} center={orto.center} />

        {visible.edificacoes && edificacoes.data && (
          <AuxLayer
            data={edificacoes.data}
            style={STYLE_EDIF}
            pane={paneDe("edificacoes")}
          />
        )}
        {visible.lotes && data && (
          <LotesLayer
            data={data}
            modo={modo}
            selId={sel?.id ?? null}
            onSelect={setSel}
            pane={paneDe("lotes")}
          />
        )}
        {visible.quadras && quadras.data && (
          <AuxLayer
            data={quadras.data}
            style={STYLE_QUADRAS}
            rotulo={(p) => String(p.codigo ?? "")}
            pane={paneDe("quadras")}
          />
        )}
        {visible.logradouros && logradouros.data && (
          <AuxLayer
            data={logradouros.data}
            style={logrStyle}
            rotulo={(p) => String(p.nome ?? "")}
            pane={paneDe("logradouros")}
          />
        )}
        {visible.bairros && bairros.data && (
          <AuxLayer
            data={bairros.data}
            style={STYLE_BAIRROS}
            rotulo={(p) => String(p.nome ?? "")}
            pane={paneDe("bairros")}
          />
        )}
        {heat && heatPoints.length > 0 && <HeatLayer points={heatPoints} />}

        {data && <FitBounds data={data as unknown as GeoJsonObject} />}
      </MapContainer>

      {/* ───── Painel de camadas + basemaps ───── */}
      <div className="floating-left">
        {painelAberto ? (
          <div className="panel layers-panel">
            <div className="panel-head between">
              <div className="panel-kicker mono">CAMADAS · CTM</div>
              <button
                className="icon-btn"
                onClick={() => setPainelAberto(false)}
                aria-label="Recolher"
              >
                ✕
              </button>
            </div>

            <div className="seg-tabs" role="tablist">
              <button
                className={`seg-tab ${modo === "status" ? "on" : ""}`}
                onClick={() => setModo("status")}
              >
                Status
              </button>
              <button
                className={`seg-tab ${modo === "tipo" ? "on" : ""}`}
                onClick={() => setModo("tipo")}
              >
                Tipo
              </button>
            </div>

            <div className="layers-list">
              {CAMADAS.map((c) => {
                const n = contagemDe(c.key);
                return (
                  <label key={c.key} className="layers-row">
                    <input
                      type="checkbox"
                      checked={visible[c.key]}
                      onChange={() => toggle(c.key)}
                    />
                    <i className="lg" style={{ background: c.cor }} />
                    <span className="layers-name">{c.label}</span>
                    <span className="layers-count mono">
                      {n != null ? n.toLocaleString("pt-BR") : "—"}
                    </span>
                  </label>
                );
              })}
            </div>

            <label className="layers-row heat-row">
              <input
                type="checkbox"
                checked={heat}
                onChange={() => setHeat((h) => !h)}
              />
              <span className="layers-name">Mapa de calor (edificações)</span>
            </label>

            <div className="legend-box">
              <div className="panel-kicker mono">
                LEGENDA · {modo === "tipo" ? "USO" : "STATUS"}
              </div>
              {(
                Object.entries(corLegenda) as [
                  string,
                  { label: string; cor: string },
                ][]
              ).map(([k, v]) => (
                <div key={k} className="legend-item">
                  <i className="lg" style={{ background: v.cor }} />
                  {v.label}
                </div>
              ))}
            </div>

            {visible.logradouros && (
              <div className="legend-box">
                <div className="panel-kicker mono">LOGRADOUROS · PAVIMENTO</div>
                {(
                  Object.entries(PAVIMENTACAO_INFO) as [
                    string,
                    { label: string; cor: string },
                  ][]
                ).map(([k, v]) => (
                  <div key={k} className="legend-item">
                    <i className="lg" style={{ background: v.cor }} />
                    {v.label}
                  </div>
                ))}
              </div>
            )}

            <div className="basemap-grid">
              <div className="panel-kicker mono">MAPA BASE</div>
              <div className="basemap-btns">
                {BASEMAPS.map((b) => (
                  <button
                    key={b.key}
                    className={`basemap-btn ${base === b.key ? "on" : ""}`}
                    onClick={() => setBase(b.key)}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <button
            className="map-fab"
            onClick={() => setPainelAberto(true)}
            aria-label="Camadas"
            title="Camadas"
          >
            ▤
          </button>
        )}
      </div>

      {/* ───── Ficha do lote ───── */}
      <div className="floating-right">
        {!sel ? (
          <div className="panel panel-info empty">
            <div className="panel-kicker mono">FICHA</div>
            <h3>Selecione um lote</h3>
            <p>
              {isLoading
                ? "Carregando lotes…"
                : isError
                  ? "Erro ao carregar lotes."
                  : !data || data.features.length === 0
                    ? "Nenhum lote importado. Admin: importe o arquivo de lotes em Lotes."
                    : "Clique em um lote para ver o status do BCI e coletar."}
            </p>
          </div>
        ) : (
          <div className="panel panel-info">
            <div className="panel-head between">
              <div>
                <div className="panel-kicker mono">
                  LOTE · {sel.inscricao_cadastral}
                </div>
                <h3>{STATUS_INFO[sel.status_atual]?.label}</h3>
              </div>
              <button
                className="icon-btn"
                onClick={() => setSel(null)}
                aria-label="Fechar"
              >
                ✕
              </button>
            </div>

            <span
              className={`status-pill ${
                sel.status_atual === "aprovado"
                  ? "ok"
                  : sel.status_atual === "rejeitado"
                    ? "err"
                    : sel.status_atual === "sem_coleta"
                      ? ""
                      : "warn"
              }`}
            >
              {sel.bci_id ? `BCI #${sel.bci_id} · ${sel.bci_status}` : "Sem BCI"}
            </span>

            <dl className="kv">
              <div>
                <dt>Inscrição</dt>
                <dd className="mono small">{sel.inscricao_cadastral}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>{STATUS_INFO[sel.status_atual]?.label}</dd>
              </div>
            </dl>

            <button
              className="btn-primary full"
              onClick={() =>
                navigate(sel.bci_id ? "/bci" : `/bci/novo?imovel=${sel.id}`)
              }
            >
              {sel.bci_id ? "Ver BCIs" : "Preencher BCI deste lote"}
            </button>
            <button
              className="btn-ghost full"
              onClick={() => navigate(`/imovel/${sel.id}`)}
            >
              Abrir ficha
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
