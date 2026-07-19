"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  Search, Bell, MessageSquare, LogOut,
  Users, Trophy, Briefcase,
  User, Settings, ImageIcon,
  FileText, X,
  CheckCheck, CircleSlash, Circle, CheckCircle2, Trash2, SquarePen, ChevronDown, ChevronUp,
  CircleDashed, ListChecks,
} from "lucide-react";
import MarqueeText from "@/components/ui/MarqueeText";
import { Usuario } from "@/types";
import { signOut } from "@/hooks/useCurrentUser";
import { initials } from "@/utils/format";
import { CORES } from "@/utils/colors";
import { NOTIFICACOES as NOTIFICATIONS, MENSAGENS as MESSAGES } from "@/data/inbox";
import styles from "./Header.module.css";

interface Props {
  currentUser: Usuario;
}

const MENU_ITEMS = [
  { label: "Perfil",        icon: User        },
  { label: "Grupos",        icon: Users       },
  { label: "Trilhas",       icon: Trophy      },
  { label: "Fotos",         icon: ImageIcon   },
  { label: "Configurações", icon: Settings    },
];

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:18080/api/v1";

// notificações e mensagens vêm de @/data/inbox (fonte única compartilhada com a sidebar)

/* ── Pasta de mensagens: contorno como UM path SVG único ──
   corpo + aba desenhados numa só forma (fill + stroke contínuos), gerada a
   partir da largura/altura reais do dock — assim o contorno acompanha o
   crescimento da lista sozinho, sem "duas peças". */
const ABA_PEEK = 26; // altura da aba (agora acomoda o título "Mensagens")
const PASTA_R  = 14; // raio dos cantos
function pastaPath(w: number, h: number): string {
  const H = h + ABA_PEEK;   // altura total do SVG (inclui a aba)
  const t = ABA_PEEK;       // y da borda superior do corpo
  return [
    `M0 ${t}`,                                   // sobe pela esquerda até a aba
    `Q0 0 16 0`,                                 // canto superior-esquerdo da aba
    `L132 0`,                                    // topo reto da aba (mais larga)
    `C158 0 158 ${t} 186 ${t}`,                  // ombro: curva descendo ao corpo
    `L${w - PASTA_R} ${t}`,                      // borda superior do corpo
    `Q${w} ${t} ${w} ${t + PASTA_R}`,            // canto superior-direito
    `L${w} ${H - PASTA_R}`,                      // lateral direita
    `Q${w} ${H} ${w - PASTA_R} ${H}`,            // canto inferior-direito
    `L${PASTA_R} ${H}`,                          // base
    `Q0 ${H} 0 ${H - PASTA_R}`,                  // canto inferior-esquerdo
    "Z",                                         // fecha (lateral esquerda)
  ].join(" ");
}

/* Título curto por papel + primeiro nome: "Prof. Carlos", "Coord. Ana"… */
export default function Header({ currentUser }: Props) {
  const router = useRouter();
  const [menuOpen,      setMenuOpen]      = useState(false);
  const [notifOpen,     setNotifOpen]     = useState(false);
  const [msgOpen,       setMsgOpen]       = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [teclas,        setTeclas]        = useState({ meta: false, ctrl: false, k: false });
  const [so,            setSo]            = useState<"mac" | "windows" | "linux">("windows");
  const [searchValue,   setSearchValue]   = useState("");
  const [suggestions,   setSuggestions]   = useState<{ category: string; label: string; sub: string; href: string }[]>([]);
  const [showSugg,      setShowSugg]      = useState(false);

  const menuRef   = useRef<HTMLDivElement>(null);
  const notifRef  = useRef<HTMLDivElement>(null);
  const msgRef    = useRef<HTMLDivElement>(null);
  const msgDockRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const suggRef   = useRef<HTMLDivElement>(null);

  const cor        = CORES[currentUser.id % CORES.length];
  const myInitials = initials(currentUser.nome);

  const [msgCollapsed, setMsgCollapsed] = useState(false);

  // dimensões reais do dock → path da pasta se ajusta ao crescer a lista
  const [pasta, setPasta] = useState({ w: 320, h: 240 });

  // popup de confirmação (excluir mensagens/notificações)
  const [confirmar, setConfirmar] = useState<{ texto: string; acao: () => void } | null>(null);

  // modo seleção: as bolinhas de marcar só aparecem quando ativado
  const [selNotif, setSelNotif] = useState(false);
  const [selMsg,   setSelMsg]   = useState(false);
  const toggleSelNotif = () => { setSelNotif(v => !v); setMarcadas(new Set()); };
  const toggleSelMsg   = () => { setSelMsg(v => !v);   setMarcadasMsg(new Set()); };

  // ── Notificações: estado local (marcar / excluir) ──
  const [notifs, setNotifs]   = useState(NOTIFICATIONS);
  const [marcadas, setMarcadas] = useState<Set<number>>(new Set());
  const unreadNotif = notifs.filter(n => n.unread).length;
  const toggleMarca = (id: number) => setMarcadas(prev => {
    const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s;
  });
  const todasMarcadas = notifs.length > 0 && marcadas.size === notifs.length;
  const marcarTodas = () => { setSelNotif(true); setMarcadas(todasMarcadas ? new Set() : new Set(notifs.map(n => n.id))); };
  const excluirMarcadas = () => {
    if (marcadas.size === 0) return;
    setConfirmar({
      texto: `Excluir ${marcadas.size} ${marcadas.size > 1 ? "notificações selecionadas" : "notificação selecionada"}?`,
      acao: () => { setNotifs(prev => prev.filter(n => !marcadas.has(n.id))); setMarcadas(new Set()); },
    });
  };

  // ── Mensagens: estado local (marcar / excluir) ──
  const [msgs, setMsgs]         = useState(MESSAGES);
  const [marcadasMsg, setMarcadasMsg] = useState<Set<number>>(new Set());
  const unreadMsg = msgs.filter(m => m.unread).length;
  const toggleMarcaMsg = (id: number) => setMarcadasMsg(prev => {
    const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s;
  });
  const todasMsgMarcadas = msgs.length > 0 && marcadasMsg.size === msgs.length;
  const marcarTodasMsg = () => { setSelMsg(true); setMarcadasMsg(todasMsgMarcadas ? new Set() : new Set(msgs.map(m => m.id))); };
  const excluirMsgMarcadas = () => {
    if (marcadasMsg.size === 0) return;
    setConfirmar({
      texto: `Excluir ${marcadasMsg.size} mensagem${marcadasMsg.size > 1 ? "s" : ""} selecionada${marcadasMsg.size > 1 ? "s" : ""}?`,
      acao: () => { setMsgs(prev => prev.filter(m => !marcadasMsg.has(m.id))); setMarcadasMsg(new Set()); },
    });
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (suggRef.current && !suggRef.current.contains(e.target as Node)) setShowSugg(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // mede o dock e mantém o path da pasta sincronizado com a altura da lista
  useEffect(() => {
    if (!msgOpen) return;
    const el = msgDockRef.current;
    if (!el) return;
    const medir = () => setPasta({ w: el.offsetWidth, h: el.offsetHeight });
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    return () => ro.disconnect();
  }, [msgOpen, msgCollapsed, msgs.length]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current  && !menuRef.current.contains(e.target  as Node)) setMenuOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      // o dock de mensagens é persistente: clicar na página NÃO fecha
      // (só fecha pelo X ou pelo botão da tab bar)
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    // detecta o sistema para mostrar só o atalho e o ícone correspondentes
    const ua = navigator.userAgent.toLowerCase();
    if (/mac|iphone|ipad/.test(ua)) setSo("mac");
    else if (/linux|x11|ubuntu|fedora/.test(ua) && !/android/.test(ua)) setSo("linux");
    else setSo("windows");
  }, []);

  useEffect(() => {
    // acompanha cada tecla do atalho isoladamente: segura Ctrl → acende Ctrl,
    // aperta K → acende K; cada uma afunda no momento em que é pressionada
    const down = (e: KeyboardEvent) => {
      if (e.key === "Control") setTeclas(t => ({ ...t, ctrl: true }));
      if (e.key === "Meta")    setTeclas(t => ({ ...t, meta: true }));
      if (e.key.toLowerCase() === "k") setTeclas(t => ({ ...t, k: true }));
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === "Escape") {
        searchRef.current?.blur();
        setMenuOpen(false); setNotifOpen(false); setMsgOpen(false);
      }
    };
    const up = (e: KeyboardEvent) => {
      if (e.key === "Control") setTeclas(t => ({ ...t, ctrl: false }));
      if (e.key === "Meta")    setTeclas(t => ({ ...t, meta: false }));
      if (e.key.toLowerCase() === "k") setTeclas(t => ({ ...t, k: false }));
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  useEffect(() => {
    const q = searchValue.trim().toLowerCase();
    if (q.length < 2) { setSuggestions([]); setShowSugg(false); return; }
    const timer = setTimeout(async () => {
      try {
        const [postsRes, vagasRes] = await Promise.all([
          fetch(`${API}/posts`).then(r => r.ok ? r.json() : []).catch(() => []),
          fetch(`${API}/vagas`).then(r => r.ok ? r.json() : []).catch(() => []),
        ]);
        const results: typeof suggestions = [];
        (postsRes as { id: number; titulo: string | null; conteudo: string; autorNome: string }[])
          .filter(p =>
            (p.titulo ?? "").toLowerCase().includes(q) ||
            p.conteudo.toLowerCase().includes(q) ||
            p.autorNome.toLowerCase().includes(q)
          )
          .slice(0, 4)
          .forEach(p => results.push({
            category: "Posts",
            label: p.titulo ?? p.conteudo.slice(0, 50),
            sub: p.autorNome,
            href: `/feed?q=${encodeURIComponent(q)}`,
          }));
        (vagasRes as { id: number; titulo: string; empresa: string; categoria: string | null; localizacao: string | null }[])
          .filter(v =>
            v.titulo.toLowerCase().includes(q) ||
            v.empresa.toLowerCase().includes(q) ||
            (v.categoria ?? "").toLowerCase().includes(q) ||
            (v.localizacao ?? "").toLowerCase().includes(q)
          )
          .slice(0, 4)
          .forEach(v => results.push({
            category: "Vagas",
            label: v.titulo,
            sub: v.empresa,
            href: `/vagas?q=${encodeURIComponent(q)}`,
          }));
        setSuggestions(results);
        setShowSugg(results.length > 0);
      } catch { setSuggestions([]); }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchValue]);

  const handleSearchNav = (href?: string) => {
    const q = searchValue.trim();
    setShowSugg(false);
    setSearchValue("");
    const target = href ?? `/feed?q=${encodeURIComponent(q)}`;
    window.dispatchEvent(new CustomEvent("infnet:search", { detail: { query: q } }));
    router.push(target);
  };

  // path da pasta (usado pelo vidro recortado e pelo contorno SVG)
  const pastaD = pastaPath(pasta.w, pasta.h);
  // nome curto: título + primeiro nome ("Prof. Carlos"), sem sobrenome
  const partesNome = currentUser.nome.trim().split(/\s+/);
  const nomeCurto = /\.$/.test(partesNome[0]) && partesNome[1]
    ? `${partesNome[0]} ${partesNome[1]}`
    : partesNome[0];

  return (
    <header className={styles.header}>
      <div className={styles.inner}>

        {/* ── Busca ── */}
        <div className={styles.center}>

          {/* Busca sempre expandida: knob de vidro com a lupa + cursor de
              terminal esmaecendo suave antes de "Buscar" */}
          <div ref={suggRef} className={`${styles.searchWrap} ${searchFocused ? styles.searchFocused : ""}`}>
            <span className={styles.searchKnob}>
              <span className={styles.searchIconAnim}><Search size={14} /></span>
            </span>

            {!searchValue && <span className={styles.caret} aria-hidden />}

            <input
              ref={searchRef}
              className={`${styles.searchInput} ${searchValue ? "" : styles.searchInputEmpty}`}
              placeholder="Buscar"
              value={searchValue}
              onChange={e => setSearchValue(e.target.value)}
              onFocus={() => { setSearchFocused(true); if (suggestions.length > 0) setShowSugg(true); }}
              onBlur={() => setSearchFocused(false)}
              onKeyDown={e => {
                if (e.key === "Enter") { handleSearchNav(); searchRef.current?.blur(); }
                if (e.key === "Escape") { setShowSugg(false); setSearchValue(""); searchRef.current?.blur(); }
              }}
            />
            {searchValue ? (
              <button className={styles.searchClear} onClick={() => { setSearchValue(""); setShowSugg(false); searchRef.current?.focus(); }}>
                <X size={12} />
              </button>
            ) : (
              <span className={styles.searchKbd}>
                {so === "mac" ? (
                  <>
                    <svg className={styles.kbdGlifo} width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
                    <kbd className={teclas.meta ? styles.kbdPress : ""}>⌘</kbd>
                    <kbd className={teclas.k ? styles.kbdPress : ""}>K</kbd>
                  </>
                ) : so === "linux" ? (
                  <>
                    <span className={styles.kbdGlifo} aria-hidden style={{ fontSize: "13px", lineHeight: 1 }}>🐧</span>
                    <kbd className={teclas.ctrl ? styles.kbdPress : ""}>Ctrl</kbd>
                    <kbd className={teclas.k ? styles.kbdPress : ""}>K</kbd>
                  </>
                ) : (
                  <>
                    <svg className={styles.kbdGlifo} width="11" height="11" viewBox="0 0 88 88" fill="currentColor"><path d="M0 12.402l35.687-4.86.016 34.423-35.67.203zm35.67 33.529l.017 34.453L.001 75.48V45.7zm4.326-38.025L87.314 0v41.527l-47.318.376zm47.329 41.123l-.011 41.343-47.318-6.678-.066-34.739z"/></svg>
                    <kbd className={teclas.ctrl ? styles.kbdPress : ""}>Ctrl</kbd>
                    <kbd className={teclas.k ? styles.kbdPress : ""}>K</kbd>
                  </>
                )}
              </span>
            )}

            {showSugg && suggestions.length > 0 && (
              <div className={styles.suggBox}>
                {["Posts", "Vagas"].map(cat => {
                  const items = suggestions.filter(s => s.category === cat);
                  if (!items.length) return null;
                  return (
                    <div key={cat}>
                      <div className={styles.suggCat}>
                        {cat === "Posts" ? <FileText size={11} /> : <Briefcase size={11} />} {cat}
                      </div>
                      {items.map((s, i) => (
                        <button key={i} className={styles.suggItem} onMouseDown={() => handleSearchNav(s.href)}>
                          <span className={styles.suggLabel}>{s.label}</span>
                          <span className={styles.suggSub}>{s.sub}</span>
                        </button>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Direita: ícones + usuário ── */}
        <div className={styles.right}>

          {/* Mensagens */}
          <div ref={msgRef} className={styles.popWrap}>
            <button
              className={styles.iconBtn}
              title="Mensagens"
              onClick={() => { setMsgOpen(v => !v); setNotifOpen(false); setMenuOpen(false); }}
            >
              <MessageSquare size={18} />
              {unreadMsg > 0 && <span className={styles.badge}>{unreadMsg}</span>}
            </button>

            {msgOpen && createPortal(
              <div ref={msgDockRef} className={`${styles.msgDock} ${msgCollapsed ? styles.msgDockCollapsed : ""}`}>
                {/* PASTA (corpo + aba numa forma só), dimensionada pela altura
                    real do dock → cresce com a lista.
                    · vidro: div com backdrop-filter recortado no path (glassmorphism)
                    · contorno: SVG só com o stroke por cima */}
                <div className={styles.pastaGlass} style={{
                  width: pasta.w, height: pasta.h + ABA_PEEK,
                  clipPath: `path("${pastaD}")`, WebkitClipPath: `path("${pastaD}")`,
                }} />
                <svg className={styles.pastaSvg} width={pasta.w} height={pasta.h + ABA_PEEK}
                     viewBox={`0 0 ${pasta.w} ${pasta.h + ABA_PEEK}`} aria-hidden="true">
                  <path className={styles.pastaStroke} d={pastaD} />
                </svg>
                {/* título dentro da abinha da pasta */}
                <div className={styles.msgAba}>
                  <MessageSquare size={13} className={styles.msgAbaIco} />
                  <span className={styles.msgAbaTitle}>Mensagens</span>
                </div>
                {/* barra: avatar + nome · ações (flat) · janela recolher/fechar (carved) */}
                <div className={styles.msgTab} onClick={() => msgCollapsed && setMsgCollapsed(false)}>
                  <div className={styles.meuAvWrap}>
                    <div className={styles.meuAv} style={{ background: cor }}>{myInitials}</div>
                    <span className={styles.meuDot} title="Online" />
                  </div>
                  <span className={styles.meuNome}>{nomeCurto}</span>
                  <div className={styles.msgTabActions}>
                    <button className={`${styles.popIco} ${selMsg ? styles.popIcoOn : ""}`}
                      title={selMsg ? "Cancelar seleção" : "Selecionar"}
                      onClick={e => { e.stopPropagation(); toggleSelMsg(); }}>
                      {selMsg ? <ListChecks size={15} /> : <CircleDashed size={15} />}
                    </button>
                    <button className={styles.popIco} title={todasMsgMarcadas ? "Desmarcar todas" : "Marcar todas"}
                      onClick={e => { e.stopPropagation(); marcarTodasMsg(); }}>
                      {todasMsgMarcadas ? <CircleSlash size={15} /> : <CheckCheck size={15} />}
                    </button>
                    {marcadasMsg.size > 0 && (
                      <button className={`${styles.popIco} ${styles.popIcoDanger}`} title="Excluir selecionadas"
                        onClick={e => { e.stopPropagation(); excluirMsgMarcadas(); }}>
                        <Trash2 size={15} />
                      </button>
                    )}
                    <button className={styles.popIco} title="Nova mensagem" onClick={e => e.stopPropagation()}><SquarePen size={15} /></button>
                  </div>
                  <div className={styles.msgTabWindow}>
                    <button className={styles.popIco} title={msgCollapsed ? "Expandir" : "Recolher"}
                      onClick={e => { e.stopPropagation(); setMsgCollapsed(v => !v); }}>
                      {msgCollapsed ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                    <button className={`${styles.popIco} ${styles.popIcoClose}`} title="Fechar"
                      onClick={e => { e.stopPropagation(); setMsgOpen(false); }}><X size={15} /></button>
                  </div>
                </div>
                <div className={styles.msgList}>
                  {msgs.length === 0 ? (
                    <div className={styles.popVazio}>Nenhuma mensagem.</div>
                  ) : msgs.map(m => {
                    const msgCor = CORES[m.id % CORES.length];
                    const marc = marcadasMsg.has(m.id);
                    return (
                      <div key={m.id} data-marquee-host className={`${styles.msgItem} ${m.unread ? styles.unread : ""} ${marc ? styles.marcada : ""}`}>
                        {selMsg && (
                          <button className={`${styles.radar} ${marc ? styles.radarOn : ""}`}
                            onClick={() => toggleMarcaMsg(m.id)} title={marc ? "Desmarcar" : "Marcar"}>
                            {marc ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                          </button>
                        )}
                        <div className={styles.msgAv} style={{ background: msgCor }}>{initials(m.nome)}</div>
                        <div className={styles.msgBody}>
                          <span className={styles.msgNome}>{m.nome}</span>
                          <MarqueeText className={styles.msgTexto}>{m.texto}</MarqueeText>
                        </div>
                        <span className={styles.msgTime}>{m.time}</span>
                      </div>
                    );
                  })}
                </div>
              </div>,
              document.body
            )}
          </div>

          {/* Notificações */}
          <div ref={notifRef} className={styles.popWrap}>
            <button
              className={styles.iconBtn}
              title="Notificações"
              onClick={() => { setNotifOpen(v => !v); setMsgOpen(false); setMenuOpen(false); }}
            >
              <Bell size={18} />
              {unreadNotif > 0 && <span className={styles.badge}>{unreadNotif}</span>}
            </button>

            {notifOpen && (
              <div className={styles.popup}>
                <div className={styles.popHeader}>
                  <span className={styles.popTitle}><Bell size={15} className={styles.popTitleIco} /> Notificações</span>
                  <div className={styles.popTools}>
                    <button className={`${styles.popIco} ${selNotif ? styles.popIcoOn : ""}`}
                      title={selNotif ? "Cancelar seleção" : "Selecionar"} onClick={toggleSelNotif}>
                      {selNotif ? <ListChecks size={15} /> : <CircleDashed size={15} />}
                    </button>
                    <button className={styles.popIco} title={todasMarcadas ? "Desmarcar todas" : "Marcar todas"} onClick={marcarTodas}>
                      {todasMarcadas ? <CircleSlash size={15} /> : <CheckCheck size={15} />}
                    </button>
                    {marcadas.size > 0 && (
                      <button className={`${styles.popIco} ${styles.popIcoDanger}`} title="Excluir selecionadas" onClick={excluirMarcadas}>
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>
                {notifs.length === 0 ? (
                  <div className={styles.popVazio}>Nenhuma notificação.</div>
                ) : notifs.map(n => {
                  const NIcon = n.icon;
                  const marc = marcadas.has(n.id);
                  return (
                    <div key={n.id} className={`${styles.notifItem} ${n.unread ? styles.unread : ""} ${marc ? styles.marcada : ""}`}>
                      {selNotif && (
                        <button className={`${styles.radar} ${marc ? styles.radarOn : ""}`} onClick={() => toggleMarca(n.id)}
                          title={marc ? "Desmarcar" : "Marcar"} aria-label={marc ? "Desmarcar" : "Marcar"}>
                          {marc ? <CheckCircle2 size={22} /> : <Circle size={22} />}
                        </button>
                      )}
                      <div className={styles.notifIconWrap}><NIcon size={14} /></div>
                      <div className={styles.notifBody}>
                        <span className={styles.notifText}>{n.text}</span>
                        <span className={styles.notifTime}>{n.time} atrás</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Avatar / dropdown */}
          <div ref={menuRef} className={styles.avatarWrap}>
            <button
              className={styles.avatarBtn}
              onClick={() => { setMenuOpen(v => !v); setNotifOpen(false); setMsgOpen(false); }}
            >
              <div className={styles.avatarContainer}>
                <div className={styles.avatar} style={{ background: cor }}>{myInitials}</div>
                <span className={styles.onlineDot} />
              </div>
            </button>

            {menuOpen && (
              <div className={styles.dropdown}>
                <div className={styles.dropUser}>
                  <div className={styles.dropAvatar} style={{ background: cor }}>{myInitials}</div>
                  <div className={styles.dropName}>{currentUser.nome}</div>
                  <div className={styles.dropPapel}>{currentUser.papelDescricao}</div>
                  <div className={styles.dropEmail}>{currentUser.email}</div>
                </div>
                <div className={styles.dropDivider} />
                {MENU_ITEMS.map(({ label, icon: Icon }) => (
                  <button key={label} className={styles.dropItem} onClick={() => setMenuOpen(false)}>
                    <Icon size={14} />{label}
                  </button>
                ))}
                <div className={styles.dropDivider} />
                <button className={styles.dropSair} onClick={() => signOut(router)}>
                  <LogOut size={14} /> Sair
                </button>
              </div>
            )}
          </div>

        </div>
      </div>

      {confirmar && createPortal(
        <div className={styles.confirmOverlay} onMouseDown={() => setConfirmar(null)}>
          <div className={styles.confirmBox} onMouseDown={e => e.stopPropagation()}>
            <div className={styles.confirmIco}><Trash2 size={20} /></div>
            <p className={styles.confirmTxt}>{confirmar.texto}</p>
            <span className={styles.confirmSub}>Esta ação não pode ser desfeita.</span>
            <div className={styles.confirmActions}>
              <button className={styles.confirmCancel} onClick={() => setConfirmar(null)}>Cancelar</button>
              <button className={styles.confirmDel} onClick={() => { confirmar.acao(); setConfirmar(null); }}>Excluir</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </header>
  );
}
