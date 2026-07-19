"use client";

import { useMemo } from "react";
import { TrendingUp } from "lucide-react";
import styles from "./ProgressoEntregas.module.css";

export interface Contagem { done: number; pending: number; nao_iniciada: number; atrasada: number; }

/* fim do trimestre/semestre do bloco 26E2 (referência para a contagem regressiva) */
const HOJE = (() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; })();
const DIA  = 86_400_000;
const PERIODOS = [
  { label: "Trimestre", ini: "2026-07-07", fim: "2026-09-30" },
  { label: "Semestre",  ini: "2026-05-04", fim: "2026-12-19" },
];

const SEGS: { key: keyof Contagem; label: string; cor: string }[] = [
  { key: "done",         label: "Concluídas",    cor: "var(--success)" },
  { key: "pending",      label: "Em andamento",  cor: "var(--warning)" },
  { key: "nao_iniciada", label: "Não iniciadas", cor: "var(--text-dim)" },
  { key: "atrasada",     label: "Atrasadas",     cor: "var(--danger)"  },
];

const R = 26, C = 2 * Math.PI * R;

export default function ProgressoEntregas({ contagem }: { contagem: Contagem }) {
  const total = SEGS.reduce((s, seg) => s + contagem[seg.key], 0);
  const pctConcluido = total ? Math.round((contagem.done / total) * 100) : 0;

  // arcos do donut, acumulados
  const arcos = useMemo(() => {
    let acc = 0;
    return SEGS.map(seg => {
      const val = contagem[seg.key];
      const dash = total ? (val / total) * C : 0;
      const el = { cor: seg.cor, dash, offset: -acc };
      acc += dash;
      return el;
    });
  }, [contagem, total]);

  const periodos = PERIODOS.map(p => {
    const ini = new Date(p.ini + "T00:00:00").getTime();
    const fim = new Date(p.fim + "T00:00:00").getTime();
    const dias = Math.max(0, Math.ceil((fim - HOJE.getTime()) / DIA));
    const prog = Math.min(100, Math.max(0, Math.round(((HOJE.getTime() - ini) / (fim - ini)) * 100)));
    return { ...p, dias, prog };
  });

  return (
    <div className={styles.card}>
      <h3 className={styles.title}><TrendingUp size={15} className={styles.titleIco} /> Progresso das Entregas</h3>

      <div className={styles.donutRow}>
        <div className={styles.donutWrap}>
          <svg viewBox="0 0 64 64" className={styles.donut} aria-hidden>
            <circle cx="32" cy="32" r={R} className={styles.donutTrilho} />
            {arcos.map((a, i) => a.dash > 0 && (
              <circle
                key={i} cx="32" cy="32" r={R} fill="none"
                stroke={a.cor} strokeWidth="7"
                strokeDasharray={`${a.dash} ${C - a.dash}`}
                strokeDashoffset={a.offset}
                transform="rotate(-90 32 32)"
                strokeLinecap="butt"
                style={{ filter: `drop-shadow(0 0 2.5px ${a.cor})` }}
              />
            ))}
          </svg>
          <div className={styles.donutCentro}>
            <span className={styles.donutPct}>{pctConcluido}%</span>
            <span className={styles.donutSub}>concluído</span>
          </div>
        </div>

        <ul className={styles.legenda}>
          {SEGS.map(seg => (
            <li key={seg.key} className={styles.legItem}>
              <span className={styles.legDot} style={{ background: seg.cor }} />
              <span className={styles.legLabel}>{seg.label}</span>
              <span className={styles.legVal}>{contagem[seg.key]}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className={styles.periodos}>
        {periodos.map(p => (
          <div key={p.label} className={styles.periodo}>
            <div className={styles.periodoTopo}>
              <span className={styles.periodoLabel}>{p.label}</span>
              <span className={styles.periodoDias}>faltam <strong>{p.dias}</strong> dias</span>
            </div>
            <div className={styles.periodoTrilho}>
              <div className={styles.periodoBarra} style={{ width: `${p.prog}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
