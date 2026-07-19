"use client";

import { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  ChevronLeft, ChevronRight, CheckCircle2, Clock, Circle, AlertCircle,
  CalendarDays, ListChecks, TriangleAlert,
} from "lucide-react";
import DragScroll from "@/components/ui/DragScroll";
import MarqueeText from "@/components/ui/MarqueeText";
import ProgressoEntregas, { Contagem } from "./ProgressoEntregas";
import styles from "./LeftPanel.module.css";

const WEEK_DAYS = ["S","T","Q","Q","S","S","D"];
const MONTHS = [
  "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro",
];

type Status = "done" | "pending" | "nao_iniciada" | "atrasada";
type Faixa  = "mes" | "trimestre" | "semestre";

interface Tarefa { titulo: string; data: string; vencimento: string; grupo: string; status: Status; }

const TAREFAS_INICIAIS: Tarefa[] = [
  { titulo: "Kickoff Bloco DR5",    data: "10 Mar", vencimento: "2026-03-10", grupo: "Eng. de Softwares Escaláveis", status: "done"        },
  { titulo: "TP1-PB Monolito",      data: "05 Mai", vencimento: "2026-05-05", grupo: "Eng. de Softwares Escaláveis", status: "done"        },
  { titulo: "Design Patterns Quiz", data: "20 Jun", vencimento: "2026-06-20", grupo: "Design Patterns e DDD",        status: "done"        },
  { titulo: "Assessment — Aula 06", data: "09 Jul", vencimento: "2026-07-09", grupo: "Design Patterns e DDD",        status: "nao_iniciada"},
  { titulo: "TP2-PB Persistência",  data: "14 Jul", vencimento: "2026-07-14", grupo: "Eng. de Softwares Escaláveis", status: "pending"     },
  { titulo: "React Final Project",  data: "24 Jul", vencimento: "2026-07-24", grupo: "Dev. Web com React",           status: "nao_iniciada"},
  { titulo: "Mobile Assessment",    data: "12 Ago", vencimento: "2026-08-12", grupo: "Dev. Mobile React Native",     status: "pending"     },
  { titulo: "TP3-PB Microserviços", data: "28 Set", vencimento: "2026-09-28", grupo: "Eng. de Softwares Escaláveis", status: "nao_iniciada"},
  { titulo: "Projeto Final DR5",    data: "30 Nov", vencimento: "2026-11-30", grupo: "Eng. de Softwares Escaláveis", status: "nao_iniciada"},
];

const STATUS_LABEL: Record<Status, string> = {
  done:          "Concluída",
  pending:       "Em andamento",
  nao_iniciada:  "Não iniciada",
  atrasada:      "Atrasada",
};

const STATUS_ORDER: Status[] = ["done", "pending", "nao_iniciada", "atrasada"];

const FAIXAS: { id: Faixa; label: string; dias: number }[] = [
  { id: "mes",       label: "1 mês",     dias: 31  },
  { id: "trimestre", label: "Trimestre", dias: 92  },
  { id: "semestre",  label: "Semestre",  dias: 184 },
];

const HOJE = (() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; })();

/** Status efetivo: uma tarefa vencida e "não iniciada" vira atrasada
 *  automaticamente; se estiver "em andamento" e vencida, mantém o status mas
 *  sinaliza o aviso de atraso. */
function efetivo(t: Tarefa): { status: Status; atraso: boolean } {
  const venc = new Date(t.vencimento + "T00:00:00");
  const vencida = venc < HOJE;
  if (vencida && t.status === "nao_iniciada") return { status: "atrasada", atraso: true };
  if (vencida && t.status === "pending")      return { status: "pending",  atraso: true };
  if (t.status === "atrasada")                return { status: "atrasada", atraso: true };
  return { status: t.status, atraso: false };
}

function StatusIcon({ status, size = 15 }: { status: Status; size?: number }) {
  if (status === "done")         return <CheckCircle2 size={size} className={styles.iconDone} />;
  if (status === "pending")      return <Clock        size={size} className={styles.iconPending} />;
  if (status === "nao_iniciada") return <Circle       size={size} className={styles.iconNaoIniciada} />;
  return <AlertCircle size={size} className={styles.iconAtrasada} />;
}

interface Cell { d: number; outside: boolean; }
function buildCalendar(year: number, month: number): Cell[] {
  const firstDay  = new Date(year, month, 1).getDay();
  const offset    = (firstDay + 6) % 7; // segunda=0, ..., domingo=6
  const total     = new Date(year, month + 1, 0).getDate();
  const prevTotal = new Date(year, month, 0).getDate();
  const cells: Cell[] = [];
  for (let i = offset - 1; i >= 0; i--) cells.push({ d: prevTotal - i, outside: true });
  for (let d = 1; d <= total; d++)      cells.push({ d, outside: false });
  const resto = cells.length % 7;
  if (resto) for (let d = 1; d <= 7 - resto; d++) cells.push({ d, outside: true });
  return cells;
}

interface TooltipPos { task: Tarefa; x: number; y: number; }
interface MenuPos     { idx: number; x: number; y: number; }

export default function LeftPanel() {
  const today = new Date();
  const [calYear,  setCalYear]  = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [tarefas,  setTarefas]  = useState<Tarefa[]>(TAREFAS_INICIAIS);
  const [faixa,    setFaixa]    = useState<Faixa>("trimestre");
  const [tip,  setTip]  = useState<TooltipPos | null>(null);
  const [menu, setMenu] = useState<MenuPos | null>(null);

  // tarefas dentro da faixa escolhida (janela em torno de hoje)
  const tarefasVisiveis = useMemo(() => {
    const dias = FAIXAS.find(f => f.id === faixa)!.dias;
    const min = new Date(HOJE); min.setDate(min.getDate() - dias);
    const max = new Date(HOJE); max.setDate(max.getDate() + dias);
    return tarefas.filter(t => {
      const v = new Date(t.vencimento + "T00:00:00");
      return v >= min && v <= max;
    });
  }, [tarefas, faixa]);

  // distribuição de status sobre TODAS as tarefas (para o gráfico de progresso)
  const contagem = useMemo<Contagem>(() => {
    const c: Contagem = { done: 0, pending: 0, nao_iniciada: 0, atrasada: 0 };
    tarefas.forEach(t => { c[efetivo(t).status] += 1; });
    return c;
  }, [tarefas]);

  // dots do calendário: só no mês/ano de vencimento, com o status efetivo
  const taskMap = useMemo(() => {
    const m = new Map<number, { task: Tarefa; status: Status }>();
    tarefas.forEach(t => {
      const v = new Date(t.vencimento + "T00:00:00");
      if (v.getFullYear() === calYear && v.getMonth() === calMonth) {
        m.set(v.getDate(), { task: t, status: efetivo(t).status });
      }
    });
    return m;
  }, [tarefas, calYear, calMonth]);

  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu(null);
    window.addEventListener("click", close);
    window.addEventListener("scroll", close, true);
    return () => { window.removeEventListener("click", close); window.removeEventListener("scroll", close, true); };
  }, [menu]);

  const showTip = (e: React.MouseEvent, task: Tarefa) => {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setTip({ task, x: r.left + r.width / 2, y: r.top });
  };

  const openMenu = (e: React.MouseEvent, idx: number) => {
    e.stopPropagation();
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setTip(null);
    setMenu({ idx, x: r.left, y: r.bottom + 6 });
  };

  const setStatus = (idx: number, status: Status) => {
    setTarefas(ts => ts.map((t, i) => (i === idx ? { ...t, status } : t)));
    setMenu(null);
  };

  const cells  = buildCalendar(calYear, calMonth);
  const todayD = today.getFullYear() === calYear && today.getMonth() === calMonth
    ? today.getDate() : -1;

  const prevMonth = () => {
    if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11); }
    else setCalMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0); }
    else setCalMonth(m => m + 1);
  };

  return (
    <aside className={styles.panel}>

      {/* ── Calendário ── */}
      <div className={styles.card}>
        <div className={styles.calHeader}>
          <button className={styles.calNav} onClick={prevMonth} aria-label="Mês anterior"><ChevronLeft size={15} /></button>
          <span className={styles.calTitle}>
            <CalendarDays size={14} className={styles.calTitleIco} />
            {MONTHS[calMonth]} {calYear}
          </span>
          <button className={styles.calNav} onClick={nextMonth} aria-label="Próximo mês"><ChevronRight size={15} /></button>
        </div>
        <div className={styles.calGrid}>
          {WEEK_DAYS.map((d, i) => (
            <div key={i} className={styles.calDay}>{d}</div>
          ))}
          {cells.map((cell, i) => {
            const task = cell.outside ? undefined : taskMap.get(cell.d);
            const hoje = !cell.outside && cell.d === todayD;
            return (
              <div
                key={i}
                className={`${styles.calCell} ${cell.outside ? styles.calOutside : ""} ${hoje ? styles.calToday : ""} ${task ? styles.calTask : ""}`}
                onMouseEnter={task ? (e) => showTip(e, task.task) : undefined}
                onMouseLeave={task ? () => setTip(null) : undefined}
              >
                <span className={styles.calNum}>{cell.d}</span>
                {task && <span className={`${styles.taskDot} ${styles[`dot_${task.status}`]}`} />}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Tarefas & Entregas ── */}
      <div className={styles.card}>
        <h3 className={styles.title}><ListChecks size={15} className={styles.titleIco} /> Tarefas &amp; Entregas</h3>

        <div className={styles.faixaRow}>
          {FAIXAS.map(f => (
            <button
              key={f.id}
              className={`${styles.faixaBtn} ${faixa === f.id ? styles.faixaAtiva : ""}`}
              onClick={() => setFaixa(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>

        {tarefasVisiveis.length === 0 ? (
          <p className={styles.tarefaVazio}>Nenhuma entrega nesta faixa.</p>
        ) : (
          <DragScroll className={styles.tarefaScroll}>
            {tarefasVisiveis.map((t) => {
              const idx = tarefas.indexOf(t);
              const { status: efStatus, atraso } = efetivo(t);
              const avisoAndamento = atraso && efStatus === "pending";
              return (
                <div key={idx} data-marquee-host className={`${styles.tarefaItem} ${efStatus === "done" ? styles.tarefaDone : ""}`}>
                  <button
                    className={styles.tarefaStatus}
                    onClick={(e) => openMenu(e, idx)}
                    title="Alterar status"
                    aria-label={`Status: ${STATUS_LABEL[efStatus]} — clique para alterar`}
                  >
                    <StatusIcon status={efStatus} size={18} />
                  </button>
                  <div className={styles.tarefaInfo}>
                    <MarqueeText className={styles.tarefaTitulo}>{t.titulo}</MarqueeText>
                    <span className={styles.tarefaMeta}>
                      <MarqueeText className={styles.tarefaGrupo}>{t.grupo}</MarqueeText>
                      {avisoAndamento && (
                        <span className={styles.avisoAtraso}><TriangleAlert size={10} /> atrasada</span>
                      )}
                    </span>
                  </div>
                  <span className={styles.tarefaData}>
                    <CalendarDays size={12} className={styles.tarefaDataIco} />
                    {t.data}
                  </span>
                </div>
              );
            })}
          </DragScroll>
        )}
      </div>

      {/* ── Progresso das Entregas ── */}
      <ProgressoEntregas contagem={contagem} />

      {tip && !menu && createPortal(
        <div className={styles.tooltip} style={{ left: tip.x, top: tip.y - 8 }}>
          <span className={styles.ttTitle}>{tip.task.titulo}</span>
          <span className={`${styles.ttBadge} ${styles[`ttBadge_${efetivo(tip.task).status}`]}`}>
            {STATUS_LABEL[efetivo(tip.task).status]}
          </span>
          <span className={styles.ttGrupo}>{tip.task.grupo}</span>
        </div>,
        document.body
      )}

      {menu && createPortal(
        <div className={styles.statusMenu} style={{ left: menu.x, top: menu.y }} onClick={e => e.stopPropagation()}>
          <span className={styles.statusMenuTitle}>Marcar como</span>
          {STATUS_ORDER.map(s => (
            <button
              key={s}
              className={`${styles.statusOpt} ${tarefas[menu.idx].status === s ? styles.statusOptAtivo : ""}`}
              onClick={() => setStatus(menu.idx, s)}
            >
              <StatusIcon status={s} size={14} />
              <span>{STATUS_LABEL[s]}</span>
              {tarefas[menu.idx].status === s && <CheckCircle2 size={13} className={styles.statusOptCheck} />}
            </button>
          ))}
        </div>,
        document.body
      )}
    </aside>
  );
}
