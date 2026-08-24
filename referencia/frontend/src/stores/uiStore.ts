import { create } from "zustand";

type Theme = "light" | "dark";
type Density = "comfortable" | "compact";

interface UIState {
  theme: Theme;
  density: Density;
  toggleTheme: () => void;
  setDensity: (d: Density) => void;
  municipioFiltro: number | null;
  setMunicipioFiltro: (id: number | null) => void;
  focoImovelId: number | null;
  setFocoImovel: (id: number | null) => void;
}

const THEME_KEY = "eixo.theme";
const DENSITY_KEY = "eixo.density";

function readTheme(): Theme {
  if (typeof localStorage === "undefined") return "light";
  return localStorage.getItem(THEME_KEY) === "dark" ? "dark" : "light";
}

function readDensity(): Density {
  if (typeof localStorage === "undefined") return "comfortable";
  return localStorage.getItem(DENSITY_KEY) === "compact"
    ? "compact"
    : "comfortable";
}

function apply(theme: Theme, density: Density): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.setAttribute("data-theme", theme);
  root.setAttribute("data-density", density);
}

export const useUIStore = create<UIState>((set, get) => ({
  theme: readTheme(),
  density: readDensity(),
  toggleTheme: () => {
    const theme = get().theme === "dark" ? "light" : "dark";
    localStorage.setItem(THEME_KEY, theme);
    apply(theme, get().density);
    set({ theme });
  },
  setDensity: (density) => {
    localStorage.setItem(DENSITY_KEY, density);
    apply(get().theme, density);
    set({ density });
  },
  municipioFiltro: null,
  setMunicipioFiltro: (municipioFiltro) => set({ municipioFiltro }),
  focoImovelId: null,
  setFocoImovel: (focoImovelId) => set({ focoImovelId }),
}));

/** Apply persisted theme/density before first paint. */
export function initUI(): void {
  const { theme, density } = useUIStore.getState();
  apply(theme, density);
}
