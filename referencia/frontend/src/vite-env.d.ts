/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module "leaflet.heat" {
  import * as L from "leaflet";
  export = L;
}

declare namespace L {
  interface HeatMapOptions {
    minOpacity?: number;
    maxZoom?: number;
    max?: number;
    radius?: number;
    blur?: number;
    gradient?: Record<number, string>;
  }
  interface HeatLayer extends L.Layer {
    setLatLngs(latlngs: Array<[number, number, number?]>): this;
    setOptions(options: HeatMapOptions): this;
  }
  function heatLayer(
    latlngs: Array<[number, number, number?]>,
    options?: HeatMapOptions,
  ): HeatLayer;
}
