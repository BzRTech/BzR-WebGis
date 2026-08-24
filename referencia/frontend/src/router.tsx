import {
  Navigate,
  Outlet,
  createBrowserRouter,
  useLocation,
  useSearchParams,
} from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import AppShell from "@/components/layout/AppShell";
import LoginScene from "@/features/auth/LoginScene";
import UsersScene from "@/features/admin/UsersScene";
import BCIListScene from "@/features/bci/BCIListScene";
import BCICreateScene from "@/features/bci/BCICreateScene";
import BCIDetailScene from "@/features/bci/BCIDetailScene";
import MinhasDemandasScene from "@/features/demandas/MinhasDemandasScene";
import DemandaCreateScene from "@/features/demandas/DemandaCreateScene";
import DemandaCalendarScene from "@/features/demandas/DemandaCalendarScene";
import MapScene from "@/features/mapa/MapScene";
import FichaScene from "@/features/ficha/FichaScene";
import LotesImportScene from "@/features/admin/LotesImportScene";
import RelatoriosScene from "@/features/relatorios/RelatoriosScene";
import AuditScene from "@/features/audit/AuditScene";
import DashboardScene from "@/features/dashboard/DashboardScene";
import type { Role } from "@/types/auth";

function Splash() {
  return (
    <div
      className="scene"
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "var(--paper)",
        color: "var(--muted)",
      }}
    >
      <span className="mono" style={{ letterSpacing: "0.14em" }}>
        CARREGANDO…
      </span>
    </div>
  );
}

function RequireAuth() {
  const status = useAuthStore((s) => s.status);
  const location = useLocation();
  if (status === "loading") return <Splash />;
  if (status === "anonymous") {
    return (
      <Navigate to="/login" replace state={{ from: location.pathname }} />
    );
  }
  return <Outlet />;
}

function RequireRole({ roles }: { roles: Role[] }) {
  const user = useAuthStore((s) => s.user);
  if (user && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}

function DemandasRoute() {
  const role = useAuthStore((s) => s.user?.role);
  const [params, setParams] = useSearchParams();
  const view = params.get("view") === "lista" ? "lista" : "calendario";
  const canManage = role === "admin" || role === "coordenador";

  const setView = (next: "lista" | "calendario") => {
    setParams(next === "lista" ? { view: "lista" } : {});
  };

  const listScene = canManage ? <DemandaCreateScene /> : <MinhasDemandasScene />;

  return (
    <>
      <div className="demandas-switch">
        <div className="tweak-opts">
          <button
            type="button"
            className={view === "calendario" ? "on" : ""}
            onClick={() => setView("calendario")}
          >
            Calendário
          </button>
          <button
            type="button"
            className={view === "lista" ? "on" : ""}
            onClick={() => setView("lista")}
          >
            Lista
          </button>
        </div>
      </div>
      {view === "calendario" ? <DemandaCalendarScene /> : listScene}
    </>
  );
}

function LoginRoute() {
  const status = useAuthStore((s) => s.status);
  if (status === "loading") return <Splash />;
  if (status === "authenticated") return <Navigate to="/" replace />;
  return <LoginScene />;
}

export const router = createBrowserRouter([
  { path: "/login", element: <LoginRoute /> },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppShell />,
        children: [
          { index: true, element: <MapScene /> },
          { path: "imovel/:id", element: <FichaScene /> },
          { path: "bci", element: <BCIListScene /> },
          { path: "bci/novo", element: <BCICreateScene /> },
          { path: "bci/:id/editar", element: <BCICreateScene /> },
          { path: "bci/:id", element: <BCIDetailScene /> },
          { path: "demandas", element: <DemandasRoute /> },
          {
            element: <RequireRole roles={["admin", "coordenador"]} />,
            children: [
              { path: "dashboard", element: <DashboardScene /> },
              { path: "relatorios", element: <RelatoriosScene /> },
              { path: "auditoria", element: <AuditScene /> },
            ],
          },
          {
            element: <RequireRole roles={["admin"]} />,
            children: [
              { path: "admin/usuarios", element: <UsersScene /> },
              { path: "admin/lotes", element: <LotesImportScene /> },
            ],
          },
        ],
      },
    ],
  },
  { path: "*", element: <Navigate to="/" replace /> },
]);
