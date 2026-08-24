import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { useMunicipios } from "@/features/mapa/api";
import DemandaEditModal from "./DemandaEditModal";
import {
  DEMANDA_STATUS_LABEL,
  DEMANDA_STATUS_TONE,
  PRIORIDADE_LABEL,
  useDemandas,
  useDemandaWorkflow,
  type Demanda,
  type DemandaPrioridade,
  type DemandaStatus,
} from "./api";

const PRIORIDADES: DemandaPrioridade[] = ["baixa", "media", "alta", "urgente"];

const MESES_PT = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];
const DIAS_PT = ["seg", "ter", "qua", "qui", "sex", "sáb", "dom"];

// Cor neutra para demandas gerais sem cidade vinculada.
const SEM_CIDADE_COR = "#7a7a7a";
const corDe = (d: Demanda) => d.municipio_cor || SEM_CIDADE_COR;

const pad = (n: number) => String(n).padStart(2, "0");
const isoOf = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;

function todayISO(): string {
  const t = new Date();
  return isoOf(t.getFullYear(), t.getMonth(), t.getDate());
}

function fmtBR(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${pad(d)}.${pad(m)}.${y}`;
}

function daysBetween(a: string, b: string): number {
  const da = new Date(`${a}T00:00`).getTime();
  const db = new Date(`${b}T00:00`).getTime();
  return Math.round((db - da) / 86400000);
}

function prazoLabel(iso: string): { txt: string; tone: string } {
  const d = daysBetween(todayISO(), iso);
  if (d < 0) return { txt: `${Math.abs(d)} d atrasado`, tone: "err" };
  if (d === 0) return { txt: "hoje", tone: "err" };
  if (d === 1) return { txt: "amanhã", tone: "warn" };
  if (d <= 7) return { txt: `em ${d} d`, tone: "warn" };
  return { txt: `em ${d} d`, tone: "muted" };
}

interface Cell {
  y: number;
  m: number;
  d: number;
  out: boolean;
}

function buildMonthGrid(year: number, monthIdx: number): Cell[] {
  const first = new Date(year, monthIdx, 1);
  const startDow = (first.getDay() + 6) % 7; // monday = 0
  const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();
  const prevDays = new Date(year, monthIdx, 0).getDate();
  const cells: Cell[] = [];
  for (let i = startDow - 1; i >= 0; i--) {
    cells.push({
      y: monthIdx === 0 ? year - 1 : year,
      m: monthIdx === 0 ? 11 : monthIdx - 1,
      d: prevDays - i,
      out: true,
    });
  }
  for (let d = 1; d <= daysInMonth; d++) cells.push({ y: year, m: monthIdx, d, out: false });
  while (cells.length < 42) {
    const last = cells[cells.length - 1];
    let ny = last.y;
    let nm = last.m;
    let nd = last.d + 1;
    const dim = new Date(ny, nm + 1, 0).getDate();
    if (nd > dim) {
      nd = 1;
      nm += 1;
      if (nm > 11) {
        nm = 0;
        ny += 1;
      }
    }
    cells.push({ y: ny, m: nm, d: nd, out: nm !== monthIdx });
  }
  return cells;
}

function isAberta(d: Demanda): boolean {
  return d.status === "pendente" || d.status === "em_andamento";
}

export default function DemandaCalendarScene() {
  const navigate = useNavigate();
  const [, setSearchParams] = useSearchParams();
  const role = useAuthStore((s) => s.user?.role);
  const canManage = role === "admin" || role === "coordenador";

  const today = todayISO();
  const [year, setYear] = useState(() => Number(today.slice(0, 4)));
  const [month, setMonth] = useState(() => Number(today.slice(5, 7)) - 1);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [filterCidade, setFilterCidade] = useState<number | "all" | "none">("all");
  const [filterPrioridade, setFilterPrioridade] = useState<DemandaPrioridade | "all">("all");
  const [editando, setEditando] = useState<Demanda | null>(null);

  const { data, isLoading, isError } = useDemandas();
  const municipios = useMunicipios();
  const workflow = useDemandaWorkflow();
  const todas = useMemo(() => data?.results ?? [], [data]);

  const demandas = useMemo(
    () =>
      todas.filter((d) => {
        if (filterPrioridade !== "all" && d.prioridade !== filterPrioridade) return false;
        if (filterCidade === "none") return d.municipio == null;
        if (filterCidade !== "all" && d.municipio !== filterCidade) return false;
        return true;
      }),
    [todas, filterCidade, filterPrioridade],
  );

  const filtroAtivo = filterCidade !== "all" || filterPrioridade !== "all";

  const byDate = useMemo(() => {
    const map: Record<string, Demanda[]> = {};
    for (const d of demandas) {
      if (!d.prazo) continue;
      (map[d.prazo] ||= []).push(d);
    }
    return map;
  }, [demandas]);

  const stats = useMemo(() => {
    const abertas = demandas.filter(isAberta);
    const atrasadas = abertas.filter((d) => d.prazo && daysBetween(today, d.prazo) < 0);
    const semana = abertas.filter((d) => {
      if (!d.prazo) return false;
      const n = daysBetween(today, d.prazo);
      return n >= 0 && n <= 7;
    });
    return {
      abertas: abertas.length,
      atrasadas: atrasadas.length,
      semana: semana.length,
      total: demandas.length,
    };
  }, [demandas, today]);

  const legendaCidades = useMemo(() => {
    const map = new Map<string, string>();
    let temGeral = false;
    for (const d of demandas) {
      if (d.municipio_nome) map.set(d.municipio_nome, corDe(d));
      else temGeral = true;
    }
    const out = [...map.entries()].map(([nome, cor]) => ({ nome, cor }));
    if (temGeral) out.push({ nome: "Sem cidade", cor: SEM_CIDADE_COR });
    return out;
  }, [demandas]);

  const cells = useMemo(() => buildMonthGrid(year, month), [year, month]);
  const diaAtivo = selectedDate ?? today;
  const dayItems = byDate[diaAtivo] ?? [];

  // Próximos eventos: demandas em aberto com prazo após o dia exibido,
  // ordenadas por data crescente.
  const proximos = useMemo(() => {
    return demandas
      .filter((d) => d.prazo && d.prazo > diaAtivo && isAberta(d))
      .sort((a, b) => (a.prazo as string).localeCompare(b.prazo as string))
      .slice(0, 30);
  }, [demandas, diaAtivo]);

  const goPrev = () => {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else setMonth((m) => m - 1);
  };
  const goNext = () => {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else setMonth((m) => m + 1);
  };
  const goToday = () => {
    setYear(Number(today.slice(0, 4)));
    setMonth(Number(today.slice(5, 7)) - 1);
    setSelectedDate(today);
  };

  const criarNoDia = (iso: string) => {
    setSearchParams({ view: "lista", prazo: iso });
  };

  const renderItem = (d: Demanda, showDate = false) => {
    const lab = prazoLabel(d.prazo as string);
    const aberta = isAberta(d);
    return (
      <li key={d.id} className="cal-day-item">
        <span className="cal-day-rail" style={{ background: corDe(d) }} />
        <div className="cal-day-body">
          <div className="cal-day-top">
            <span className="mono small">
              {d.imovel_inscricao || d.municipio_nome || "Demanda geral"}
            </span>
            <span
              className={`status-pill ${
                DEMANDA_STATUS_TONE[d.status as DemandaStatus]
              }`}
            >
              {DEMANDA_STATUS_LABEL[d.status as DemandaStatus]}
            </span>
          </div>
          {d.titulo && <p className="cal-day-title">{d.titulo}</p>}
          <div className="cal-day-meta">
            {showDate && <span className="mono">{fmtBR(d.prazo as string)}</span>}
            <span>{PRIORIDADE_LABEL[d.prioridade]}</span>
            <span className={`prazo-r ${lab.tone}`}>{lab.txt}</span>
            {d.responsaveis_detalhe.length > 0 && (
              <span>{d.responsaveis_detalhe.map((r) => r.nome).join(", ")}</span>
            )}
          </div>
          <div className="cal-day-actions">
            {d.status === "pendente" && (
              <button
                className="row-link"
                onClick={() => workflow.mutate({ id: d.id, action: "iniciar" })}
              >
                iniciar
              </button>
            )}
            {aberta && d.imovel != null && (
              <button
                className="row-link"
                onClick={() => navigate(`/bci/novo?imovel=${d.imovel}`)}
              >
                coletar BCI →
              </button>
            )}
            {aberta && (
              <button
                className="row-link"
                onClick={() => workflow.mutate({ id: d.id, action: "concluir" })}
              >
                concluir
              </button>
            )}
            {aberta && canManage && (
              <button
                className="row-link"
                onClick={() => workflow.mutate({ id: d.id, action: "cancelar" })}
              >
                cancelar
              </button>
            )}
            {canManage && (
              <button className="row-link" onClick={() => setEditando(d)}>
                editar
              </button>
            )}
          </div>
        </div>
      </li>
    );
  };

  return (
    <div className="scene-pad">
      <div className="rkicker mono">GESTÃO · DEMANDAS</div>
      <h1>Calendário de prazos</h1>
      <p className="lede">
        Demandas posicionadas pelo prazo de coleta. Clique num dia para ver os
        detalhes{canManage ? " ou criar uma nova demanda" : ""}.
      </p>

      <div className="agenda-stats">
        <div className="agenda-stat">
          <div className="ag-n">{stats.abertas}</div>
          <div className="ag-l">Em aberto</div>
        </div>
        <div className="agenda-stat err">
          <div className="ag-n">{stats.atrasadas}</div>
          <div className="ag-l">Atrasadas</div>
        </div>
        <div className="agenda-stat warn">
          <div className="ag-n">{stats.semana}</div>
          <div className="ag-l">Nesta semana</div>
        </div>
        <div className="agenda-stat">
          <div className="ag-n">{stats.total}</div>
          <div className="ag-l">Total visível</div>
        </div>
      </div>

      <div className="cal-filters">
        <div className="cal-filter">
          <span className="field-k">Cidade</span>
          <select
            value={filterCidade}
            onChange={(e) => {
              const v = e.target.value;
              setFilterCidade(v === "all" || v === "none" ? v : Number(v));
            }}
          >
            <option value="all">Todas as cidades</option>
            <option value="none">Sem cidade</option>
            {municipios.data?.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nome}/{m.uf}
              </option>
            ))}
          </select>
        </div>
        <div className="cal-filter">
          <span className="field-k">Prioridade</span>
          <select
            value={filterPrioridade}
            onChange={(e) =>
              setFilterPrioridade(e.target.value as DemandaPrioridade | "all")
            }
          >
            <option value="all">Todas as prioridades</option>
            {PRIORIDADES.map((p) => (
              <option key={p} value={p}>
                {PRIORIDADE_LABEL[p]}
              </option>
            ))}
          </select>
        </div>
        {filtroAtivo && (
          <button
            type="button"
            className="cal-filter-clear"
            onClick={() => {
              setFilterCidade("all");
              setFilterPrioridade("all");
            }}
          >
            limpar filtros
          </button>
        )}
      </div>

      <div className="cal-layout">
        <section className="cal-wrap">
          <div className="cal-head">
            <h2 className="cal-title">
              {MESES_PT[month]} <span className="cal-year mono">{year}</span>
            </h2>
            <div className="cal-nav">
              <button className="icon-btn" onClick={goPrev} aria-label="Mês anterior">
                ‹
              </button>
              <button className="btn-ghost small" onClick={goToday}>
                Hoje
              </button>
              <button className="icon-btn" onClick={goNext} aria-label="Próximo mês">
                ›
              </button>
            </div>
          </div>

          {isLoading && <p className="muted mono">carregando…</p>}
          {isError && <p className="form-error">Erro ao carregar demandas.</p>}

          <div className="cal">
            <div className="cal-dow">
              {DIAS_PT.map((d, i) => (
                <div key={d} className={`dow ${i >= 5 ? "wknd" : ""}`}>
                  {d}
                </div>
              ))}
            </div>
            <div className="cal-grid">
              {cells.map((c, i) => {
                const iso = isoOf(c.y, c.m, c.d);
                const items = byDate[iso] ?? [];
                const isToday = iso === today;
                const isWknd = i % 7 >= 5;
                return (
                  <div
                    key={i}
                    className={`cell ${c.out ? "out" : ""} ${isToday ? "today" : ""} ${
                      isWknd ? "wknd" : ""
                    } ${iso === selectedDate ? "sel" : ""}`}
                    onClick={() => setSelectedDate(iso)}
                  >
                    <div className="cell-head">
                      <span className="cell-d mono">{pad(c.d)}</span>
                      {isToday && <span className="today-dot">HOJE</span>}
                    </div>
                    <div className="cell-events">
                      {items.slice(0, 3).map((ev) => (
                        <div
                          key={ev.id}
                          className={`ev ${ev.status === "concluida" ? "done" : ""}`}
                          style={{ borderLeftColor: corDe(ev) }}
                        >
                          <span className="ev-dot" style={{ background: corDe(ev) }} />
                          <span className="ev-t">
                            {ev.titulo || ev.imovel_inscricao || ev.municipio_nome || "Demanda"}
                          </span>
                        </div>
                      ))}
                      {items.length > 3 && (
                        <div className="ev-more mono">+{items.length - 3}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="cal-legend">
            <span className="panel-kicker mono">CIDADES</span>
            <div className="cal-legend-row">
              {legendaCidades.map((c) => (
                <span key={c.nome} className="cal-leg-item">
                  <i className="cal-leg-dot" style={{ background: c.cor }} />
                  {c.nome}
                </span>
              ))}
            </div>
          </div>
        </section>

        <aside className="cal-day">
          <div className="cal-day-section">
            <div className="cal-day-head">
              <div>
                <div className="panel-kicker mono">
                  {selectedDate ? "DIA SELECIONADO" : "HOJE"}
                </div>
                <h3 className="cal-day-date mono">{fmtBR(diaAtivo)}</h3>
              </div>
              {canManage && (
                <button
                  className="btn-primary small"
                  onClick={() => criarNoDia(diaAtivo)}
                >
                  + Nova
                </button>
              )}
            </div>

            {dayItems.length === 0 ? (
              <p className="muted">Nenhuma demanda com prazo neste dia.</p>
            ) : (
              <ul className="cal-day-list">{dayItems.map((d) => renderItem(d))}</ul>
            )}
          </div>

          <div className="cal-day-section">
            <div className="panel-kicker mono">PRÓXIMOS EVENTOS</div>
            {proximos.length === 0 ? (
              <p className="muted">Nenhum evento futuro.</p>
            ) : (
              <ul className="cal-day-list">
                {proximos.map((d) => renderItem(d, true))}
              </ul>
            )}
          </div>
        </aside>
      </div>

      {editando && (
        <DemandaEditModal
          demanda={editando}
          onClose={() => setEditando(null)}
        />
      )}
    </div>
  );
}
