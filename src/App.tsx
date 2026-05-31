import { useState } from "react";
import Topbar, { type View } from "./components/Topbar";
import Sidebar from "./components/Sidebar";
import MapView from "./components/MapView";
import Dashboard from "./components/Dashboard";
import { MODULES } from "./data/modules";

export default function App() {
  const [view, setView] = useState<View>("dashboard");
  const [activeModules, setActiveModules] = useState<Set<string>>(
    () => new Set(MODULES.filter((m) => m.defaultActive).map((m) => m.id)),
  );

  function toggleModule(id: string) {
    setActiveModules((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  return (
    <div className="app">
      <Topbar view={view} onChange={setView} />
      <div className="app__body">
        {view === "dashboard" ? (
          <Dashboard />
        ) : (
          <>
            <Sidebar active={activeModules} onToggle={toggleModule} />
            <MapView active={activeModules} />
          </>
        )}
      </div>
    </div>
  );
}
