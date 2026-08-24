import { useEffect, useRef, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { useUIStore } from "@/stores/uiStore";
import { useMunicipios } from "@/features/mapa/api";
import { useImovelSearch } from "@/features/bci/api";
import { ROLE_LABEL } from "@/types/auth";
import { BrandHex } from "@/components/BrandMark";
import OfflineIndicator from "@/components/OfflineIndicator";
import type { Role } from "@/types/auth";
import {
  IcoCheck,
  IcoDash,
  IcoDraw,
  IcoHistory,
  IcoLayers,
  IcoLogout,
  IcoMap,
  IcoMoon,
  IcoReport,
  IcoSearch,
  IcoSun,
  IcoUsers,
} from "@/components/icons";

interface NavItem {
  to: string;
  label: string;
  icon: (p: { size?: number }) => JSX.Element;
  roles?: Role[];
}

const NAV: NavItem[] = [
  { to: "/", label: "Mapa", icon: IcoMap },
  {
    to: "/dashboard",
    label: "Dashboard",
    icon: IcoDash,
    roles: ["admin", "coordenador"],
  },
  {
    to: "/bci",
    label: "Coleta",
    icon: IcoDraw,
    roles: ["admin", "coordenador", "tecnico"],
  },
  {
    to: "/demandas",
    label: "Demandas",
    icon: IcoCheck,
    roles: ["admin", "coordenador", "tecnico"],
  },
  {
    to: "/relatorios",
    label: "Relatórios",
    icon: IcoReport,
    roles: ["admin", "coordenador"],
  },
  {
    to: "/auditoria",
    label: "Auditoria",
    icon: IcoHistory,
    roles: ["admin", "coordenador"],
  },
  {
    to: "/admin/lotes",
    label: "Importar",
    icon: IcoLayers,
    roles: ["admin"],
  },
  {
    to: "/admin/usuarios",
    label: "Usuários",
    icon: IcoUsers,
    roles: ["admin"],
  },
];

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "··";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function CitySelect() {
  const municipios = useMunicipios();
  const filtro = useUIStore((s) => s.municipioFiltro);
  const setFiltro = useUIStore((s) => s.setMunicipioFiltro);
  return (
    <select
      className="city-select mono"
      value={filtro ?? ""}
      onChange={(e) =>
        setFiltro(e.target.value ? Number(e.target.value) : null)
      }
      aria-label="Município"
    >
      <option value="">TODOS OS MUNICÍPIOS</option>
      {municipios.data?.map((m) => (
        <option key={m.id} value={m.id}>
          {m.nome.toUpperCase()}/{m.uf}
        </option>
      ))}
    </select>
  );
}

function TopSearch({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const [term, setTerm] = useState("");
  const [show, setShow] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const setFoco = useUIStore((s) => s.setFocoImovel);
  const setFiltro = useUIStore((s) => s.setMunicipioFiltro);
  const search = useImovelSearch(term);

  // Ao expandir a busca no celular, foca o campo automaticamente.
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  function pick(id: number) {
    setFiltro(null);
    setFoco(id);
    setTerm("");
    setShow(false);
    onClose();
    navigate("/");
  }

  return (
    <div className={`topbar-search ${open ? "is-open" : ""}`}>
      <IcoSearch size={16} />
      <input
        ref={inputRef}
        value={term}
        onChange={(e) => {
          setTerm(e.target.value);
          setShow(true);
        }}
        onFocus={() => setShow(true)}
        onBlur={() =>
          setTimeout(() => {
            setShow(false);
            onClose();
          }, 150)
        }
        placeholder="Buscar inscrição…"
      />
      {show && term.trim().length >= 2 && (
        <div className="search-pop">
          {search.isLoading && (
            <div className="search-row muted mono">buscando…</div>
          )}
          {!search.isLoading && search.data?.results.length === 0 && (
            <div className="search-row muted mono">nada encontrado</div>
          )}
          {search.data?.results.slice(0, 8).map((im) => (
            <button
              type="button"
              key={im.id}
              className="search-row"
              onMouseDown={() => pick(im.id)}
            >
              <span className="mono">{im.inscricao_cadastral}</span>
              {im.numero ? (
                <span className="muted"> · nº {im.numero}</span>
              ) : null}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AppShell() {
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const theme = useUIStore((s) => s.theme);
  const toggleTheme = useUIStore((s) => s.toggleTheme);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);

  const name = user
    ? `${user.first_name} ${user.last_name}`.trim() || user.username
    : "";

  const items = NAV.filter(
    (i) => !i.roles || (user != null && i.roles.includes(user.role)),
  );

  async function onLogout() {
    await signOut();
    navigate("/login", { replace: true });
  }

  return (
    <div className="scene scene-map">
      <OfflineIndicator />
      <header className="topbar">
        <div className="topbar-left">
          <div className="topbar-brand">
            <BrandHex size={32} />
            <div className="brand-sep" />
            <div className="brand-text">
              <div className="brand-prod">WebGIS · CTM</div>
              <div className="brand-muni mono">
                {user?.municipio_nome ? (
                  <span className="muni-city">
                    {user.municipio_nome.toUpperCase()}
                  </span>
                ) : (
                  <span className="muni-city">
                    <CitySelect />
                  </span>
                )}
                <span className="muni-ex"> · EX. 2026</span>
              </div>
            </div>
          </div>
        </div>

        <TopSearch open={searchOpen} onClose={() => setSearchOpen(false)} />

        <div className="topbar-right">
          <button
            className="tb-btn search-toggle"
            onClick={() => setSearchOpen((v) => !v)}
            aria-label="Buscar"
            type="button"
          >
            <IcoSearch size={16} />
          </button>
          <button
            className="tb-btn"
            onClick={toggleTheme}
            aria-label="Tema"
            type="button"
          >
            {theme === "dark" ? <IcoSun size={15} /> : <IcoMoon size={15} />}
          </button>
          <div className="tb-user">
            <div className="tb-avatar">{initials(name)}</div>
            <div className="tb-user-meta">
              <div className="tb-name">{name}</div>
              <div className="tb-role mono">
                {user ? ROLE_LABEL[user.role].toUpperCase() : ""}
              </div>
            </div>
          </div>
          <button
            className="tb-btn danger"
            onClick={onLogout}
            type="button"
            aria-label="Sair"
          >
            <IcoLogout size={15} /> Sair
          </button>
        </div>
      </header>

      <div className="map-body">
        <aside className="sidebar">
          <button
            className="side-mark"
            onClick={() => navigate("/")}
            type="button"
            title="Início"
            aria-label="Início"
          >
            <BrandHex size={26} />
          </button>

          <nav className="side-nav">
            {items.map((it) => {
              const Ic = it.icon;
              const on =
                it.to === "/"
                  ? location.pathname === "/"
                  : location.pathname.startsWith(it.to);
              return (
                <button
                  key={it.to}
                  className={`side-btn ${on ? "on" : ""}`}
                  onClick={() => navigate(it.to)}
                  type="button"
                >
                  <Ic size={18} />
                  <span className="side-lbl">{it.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        <main className="app-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
