"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check } from "lucide-react";
import { STATUS, StatusId, useStatus, definirStatus, infoStatus } from "@/hooks/useStatus";
import s from "./StatusPicker.module.css";

/* ── Luz do status ────────────────────────────────────────────────────────
   Cada estado tem seu próprio sinal: online pisca e abre a onda do radar;
   ausente respira devagar com meia-luz; ocupado mostra a barra de "não
   perturbe"; offline fica só o contorno; dormindo troca a luz por um
   bonequinho que respira roncando, com os "z" subindo.                     */
function Luz({ id }: { id: StatusId }) {
  if (id === "dormindo") {
    return (
      <svg className={s.dorminhoco} viewBox="0 0 26 22" width="30" height="25" aria-hidden>
        <ellipse cx="8" cy="19.4" rx="7.6" ry="2.1" className={s.travesseiro} />
        <g className={s.corpo}>
          <circle cx="8" cy="12.6" r="5.9" className={s.cabeca} />
          <path d="M5.1 12 q1.35 1.5 2.7 0" className={s.olho} />
          <path d="M9.3 12 q1.35 1.5 2.7 0" className={s.olho} />
          <circle cx="4.4" cy="14.4" r="1.1" className={s.bochecha} />
          <circle cx="11.8" cy="14.4" r="1.1" className={s.bochecha} />
          <path d="M7.2 15.4 q.8 .8 1.6 0" className={s.boca} />
        </g>
        <g className={s.zs}>
          <path className={s.z1} d="M15.6 10.6 h2.7 l-2.7 3.1 h2.7" />
          <path className={s.z2} d="M19.8 5.6 h2.1 l-2.1 2.4 h2.1" />
        </g>
      </svg>
    );
  }
  return <span className={s.luz} aria-hidden />;
}

const LARGURA_MENU = 232;
const ALTURA_MENU = 248;

export default function StatusPicker({ compacto }: { compacto?: boolean }) {
  const atual = useStatus();
  const [aberto, setAberto] = useState(false);
  // o menu vai para o <body> por portal: assim não fica preso (nem recortado)
  // dentro do dock de mensagens ou do menu da conta, que são popups menores
  const [pos, setPos] = useState<{ left: number; top?: number; bottom?: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const info = infoStatus(atual);

  const alternar = () => {
    if (aberto) { setAberto(false); return; }
    const r = btnRef.current?.getBoundingClientRect();
    if (!r) return;
    const cabeAbaixo = r.bottom + 8 + ALTURA_MENU <= window.innerHeight;
    setPos({
      left: Math.max(8, Math.min(r.left - 6, window.innerWidth - LARGURA_MENU - 8)),
      ...(cabeAbaixo
        ? { top: r.bottom + 8 }
        : { bottom: window.innerHeight - r.top + 8 }),
    });
    setAberto(true);
  };

  useEffect(() => {
    if (!aberto) return;
    const fora = (e: MouseEvent) => {
      const alvo = e.target as Node;
      if (!btnRef.current?.contains(alvo) && !menuRef.current?.contains(alvo)) setAberto(false);
    };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setAberto(false); };
    const fecha = () => setAberto(false);
    document.addEventListener("mousedown", fora);
    document.addEventListener("keydown", esc);
    window.addEventListener("resize", fecha);
    window.addEventListener("scroll", fecha, true);
    return () => {
      document.removeEventListener("mousedown", fora);
      document.removeEventListener("keydown", esc);
      window.removeEventListener("resize", fecha);
      window.removeEventListener("scroll", fecha, true);
    };
  }, [aberto]);

  return (
    <div className={s.wrap}>
      <button
        ref={btnRef}
        className={`${s.badge} ${s[atual]} ${compacto ? s.compacto : ""}`}
        onClick={e => { e.stopPropagation(); alternar(); }}
        title="Alterar meu status"
        aria-haspopup="menu"
        aria-expanded={aberto}
      >
        <Luz id={atual} />
        {!compacto && info.label}
      </button>

      {aberto && pos && createPortal(
        <div
          ref={menuRef}
          className={`${s.menu} ${pos.bottom != null ? s.menuCima : ""}`}
          style={{ left: pos.left, top: pos.top, bottom: pos.bottom }}
          role="menu"
          /* impede que o popup hospedeiro se feche antes do clique completar */
          onMouseDown={e => e.stopPropagation()}
        >
          <div className={s.menuTitulo}>Meu status</div>
          {STATUS.map(o => (
            <button
              key={o.id}
              role="menuitemradio"
              aria-checked={o.id === atual}
              className={`${s.opt} ${s[o.id]} ${o.id === atual ? s.optOn : ""}`}
              onClick={e => { e.stopPropagation(); definirStatus(o.id); setAberto(false); }}
            >
              <span className={s.optLuz}><Luz id={o.id} /></span>
              <span className={s.optTxt}>
                <b>{o.label}</b>
                <i>{o.hint}</i>
              </span>
              {o.id === atual && <Check size={14} className={s.optCheck} />}
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}
