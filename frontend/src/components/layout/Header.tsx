"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  Search, Bell, MessageSquare, LogOut,
  Users, Trophy, Briefcase,
  User, Settings, ImageIcon,
  FileText, X,
  CheckCheck, CircleSlash, Circle, Trash2, SquarePen, ChevronDown, ChevronUp,
  CircleDashed, ListChecks, MailOpen, Mail, Check,
  GraduationCap, Activity,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import MarqueeText from "@/components/ui/MarqueeText";
import DragScroll from "@/components/ui/DragScroll";
import { Usuario } from "@/types";
import { signOut } from "@/hooks/useCurrentUser";
import { initials } from "@/utils/format";
import { CORES } from "@/utils/colors";
import { NOTIFICACOES as NOTIFICATIONS, MENSAGENS as MESSAGES } from "@/data/inbox";
import { useStatus, infoStatus } from "@/hooks/useStatus";
import StatusPicker from "./StatusPicker";
import styles from "./Header.module.css";

interface Props {
  currentUser: Usuario;
}

const MENU_ITEMS: { label: string; icon: LucideIcon; href?: string }[] = [
  { label: "Perfil",        icon: User,       href: "/perfil" },
  { label: "Grupos",        icon: Users       },
  { label: "Trilhas",       icon: Trophy      },
  { label: "Fotos",         icon: ImageIcon   },
  { label: "Configurações", icon: Settings    },
];

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:18080/api/v1";

/* ── Índice de busca das páginas acadêmicas (conteúdo estático do Boletim e do
   painel Meu Desempenho) — permite achar disciplinas, notas e indicadores pela
   busca da tab bar, junto com Posts e Vagas. ── */
const INDICE_PAGINAS: { category: string; label: string; sub: string; href: string; termos: string }[] = [
  // ── Boletim: disciplinas dos blocos ──
  { category: "Boletim", label: "Fundamentos do Processamento de Dados", sub: "Bloco 1 · 25E1 · Aprovado · conceito DL", href: "/boletim", termos: "fundamentos processamento dados bloco 1 25e1 aprovado" },
  { category: "Boletim", label: "Planejamento de Curso e Carreira",      sub: "Bloco 1 · 25E1 · não reprova por frequência", href: "/boletim", termos: "planejamento curso carreira frequencia isenta bloco 1" },
  { category: "Boletim", label: "Projeto de Bloco: Processamento de Dados", sub: "Bloco 1 · 25E1 · PB · Aprovado", href: "/boletim", termos: "projeto bloco pb processamento dados aprovado" },
  { category: "Boletim", label: "Conectividade e Desenvolvimento Front-End", sub: "Bloco 2 · 25E2 · Aprovado · 1 TP fora do prazo", href: "/boletim", termos: "conectividade front-end frontend bloco 2 25e2 tp atraso" },
  { category: "Boletim", label: "Desenvolvimento Back-End",              sub: "Bloco 2 · 25E2 · Aprovado · conceito DL", href: "/boletim", termos: "desenvolvimento back-end backend bloco 2 25e2" },
  { category: "Boletim", label: "Projeto de Bloco: Aplicações Conectadas", sub: "Bloco 2 · 25E2 · PB · Aprovado", href: "/boletim", termos: "projeto bloco pb aplicacoes conectadas aprovado" },
  { category: "Boletim", label: "Análise e Segurança de Agentes de IA",  sub: "Bloco 3 · 26E2 · Cursando", href: "/boletim", termos: "analise seguranca agentes ia bloco 3 26e2 cursando" },
  { category: "Boletim", label: "Engenharia Segura de Softwares Escaláveis", sub: "Bloco 3 · 26E2 · Cursando", href: "/boletim", termos: "engenharia segura softwares escalaveis bloco 3 26e2 cursando persistencia" },
  { category: "Boletim", label: "Projeto de Bloco: Eng. de Softwares Escaláveis", sub: "Bloco 3 · 26E2 · PB · Cursando", href: "/boletim", termos: "projeto bloco pb engenharia softwares escalaveis cursando" },
  { category: "Boletim", label: "Perfil de conceitos",                   sub: "DML · DL · D · ND — como cada conceito é atribuído", href: "/boletim", termos: "conceito conceitos dml dl d nd demonstrou louvor maximo rubrica competencia at" },
  { category: "Boletim", label: "Como funciona a aprovação",             sub: "competências · 75% de presença · TPs no prazo · PB", href: "/boletim", termos: "aprovacao regras quesitos presenca 75 tp prazo projeto bloco reprovado" },
  { category: "Boletim", label: "Boletim Acadêmico",                     sub: "histórico por competências e carga horária", href: "/boletim", termos: "boletim historico escolar competencias frequencia situacao blocos graduacao" },
  // ── Boletim: trilhas de especialização ──
  { category: "Boletim", label: "Trilha: Inteligência Artificial",  sub: "Machine Learning · Multi-Agentes IA", href: "/boletim", termos: "trilha inteligencia artificial machine learning multi-agentes ia" },
  { category: "Boletim", label: "Trilha: Sistemas Complexos",       sub: "Engenharia Disciplinada de Softwares", href: "/boletim", termos: "trilha sistemas complexos engenharia disciplinada" },
  { category: "Boletim", label: "Trilha: Engenharia de Dados",      sub: "Banco de Dados · Big Data", href: "/boletim", termos: "trilha engenharia dados big data banco" },
  { category: "Boletim", label: "Trilha: Cibersegurança",           sub: "SOC e Blue Team · Red Team", href: "/boletim", termos: "trilha ciberseguranca seguranca soc blue red team ofensiva defensiva" },
  { category: "Boletim", label: "Trilha: Cloud Computing",          sub: "Conteinerização · Arquitetura na Nuvem", href: "/boletim", termos: "trilha cloud computing conteinerizacao nuvem arquitetura" },
  // ── Boletim: extensão, eletivas, estágio e complementares ──
  { category: "Boletim", label: "Projetos Supervisionados de Extensão", sub: "400h necessárias · sem exigência de presença", href: "/boletim", termos: "projetos supervisionados extensao 400h carga sem presenca" },
  { category: "Boletim", label: "Hackathon Social Infnet",             sub: "Extensão · 100h · 25E2 · Concluído", href: "/boletim", termos: "extensao hackathon social infnet concluido" },
  { category: "Boletim", label: "Consultoria de TI para ONGs",         sub: "Extensão · 100h · 26E2 · Em curso", href: "/boletim", termos: "extensao consultoria ti ongs em curso" },
  { category: "Boletim", label: "Disciplinas Eletivas",                sub: "exigem no mínimo 75% de presença", href: "/boletim", termos: "eletivas eletiva presenca 75 minimo" },
  { category: "Boletim", label: "Introdução a Machine Learning",       sub: "Eletiva · 40h · 26E2 · Em curso", href: "/boletim", termos: "eletiva machine learning ia em curso" },
  { category: "Boletim", label: "Estágio Obrigatório",                 sub: "400h necessárias · 220h concluídas", href: "/boletim", termos: "estagio obrigatorio 400h supervisionado" },
  { category: "Boletim", label: "Atividades Complementares",           sub: "140h necessárias · 70h concluídas", href: "/boletim", termos: "atividades complementares 140h certificacao monitoria" },
  { category: "Boletim", label: "Carga horária total",                 sub: "integralização do curso por categoria", href: "/boletim", termos: "carga horaria total integralizacao horas disciplinas extensao estagio complementares" },
  // ── Meu Desempenho: indicadores do painel ──
  // ── Perfil ──
  { category: "Perfil", label: "Meu perfil", sub: "panorama do aluno, status e horas obrigatórias", href: "/perfil", termos: "perfil conta aluno panorama resumo status horas" },
  { category: "Meu Desempenho", label: "Score geral no curso",      sub: "anéis de competências, presença e entregas", href: "/desempenho", termos: "score geral aneis competencias presenca entregas indice conceito medio" },
  { category: "Meu Desempenho", label: "Conclusão do curso",        sub: "bloco 3 de 12 · 25%", href: "/desempenho", termos: "conclusao curso progresso blocos faltam formatura 12" },
  { category: "Meu Desempenho", label: "Tendência do rendimento",   sub: "subindo ou caindo nas últimas semanas", href: "/desempenho", termos: "tendencia rendimento ponteiro subindo caindo evolucao" },
  { category: "Meu Desempenho", label: "Evolução no semestre e projeção", sub: "você × turma + previsão dos próximos meses", href: "/desempenho", termos: "evolucao semestre projecao previsao futura media turma grafico linha" },
  { category: "Meu Desempenho", label: "Comparação com turmas anteriores", sub: "índice médio de conceitos por turma", href: "/desempenho", termos: "comparacao turmas anteriores indice medio barras" },
  { category: "Meu Desempenho", label: "Presenças por disciplina",  sub: "frequência do bloco atual · mínimo 75%", href: "/desempenho", termos: "presenca presencas frequencia faltas disciplinas 75" },
  { category: "Meu Desempenho", label: "Horas complementares",      sub: "70h restantes de 140h", href: "/desempenho", termos: "horas complementares atividades 140 restantes" },
  { category: "Meu Desempenho", label: "Horas de estágio",          sub: "180h restantes de 400h", href: "/desempenho", termos: "horas estagio obrigatorio 400 restantes" },
  { category: "Meu Desempenho", label: "Horas de extensão",         sub: "100h restantes de 400h", href: "/desempenho", termos: "horas extensao projetos supervisionados 400 restantes" },
];

// notificações e mensagens vêm de @/data/inbox (fonte única compartilhada com a sidebar)

/* ── Pasta de mensagens: contorno como UM path SVG único ──
   corpo + aba desenhados numa só forma (fill + stroke contínuos), gerada a
   partir da largura/altura reais do dock — assim o contorno acompanha o
   crescimento da lista sozinho, sem "duas peças". */
const ABA_PEEK = 34; // altura da aba — título em tamanho padrão, centralizado
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
    `Q${w} ${t} ${w} ${t + PASTA_R}`,            // canto superior-direito (arredondado)
    // base RETA e encostada: o dock ancora na margem inferior, "fazendo parte"
    // dela (não flutua) — cantos de baixo sem arredondar
    `L${w} ${H}`,                                // lateral direita até a base
    `L0 ${H}`,                                   // base
    "Z",                                         // fecha subindo pela esquerda
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
  const statusAtual = useStatus();

  const [msgCollapsed, setMsgCollapsed] = useState(false);

  // dimensões reais do dock → path da pasta se ajusta ao crescer a lista
  const [pasta, setPasta] = useState({ w: 320, h: 240 });

  // busca dentro das mensagens (nome ou texto)
  const [buscaMsg, setBuscaMsg] = useState("");

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
  // marcar como lida / não lida — o contador de não-lidas deriva do estado
  const marcarLida = (id: number) =>
    setMsgs(prev => prev.map(m => (m.id === id ? { ...m, unread: false } : m)));
  const marcarNaoLida = (id: number) =>
    setMsgs(prev => prev.map(m => (m.id === id ? { ...m, unread: true } : m)));
  // em lote, sobre as selecionadas (modo seleção)
  const lidasSelecionadas = () =>
    setMsgs(prev => prev.map(m => (marcadasMsg.has(m.id) ? { ...m, unread: false } : m)));
  const naoLidasSelecionadas = () =>
    setMsgs(prev => prev.map(m => (marcadasMsg.has(m.id) ? { ...m, unread: true } : m)));
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
  }, [msgOpen, msgCollapsed, msgs.length, buscaMsg]);

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
        // páginas acadêmicas (Boletim / Meu Desempenho) — índice estático local
        INDICE_PAGINAS
          .filter(p =>
            p.label.toLowerCase().includes(q) ||
            p.sub.toLowerCase().includes(q) ||
            p.termos.includes(q)
          )
          .slice(0, 5)
          .forEach(p => results.push({ category: p.category, label: p.label, sub: p.sub, href: p.href }));

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
                {["Posts", "Vagas", "Perfil", "Boletim", "Meu Desempenho"].map(cat => {
                  const items = suggestions.filter(s => s.category === cat);
                  if (!items.length) return null;
                  const CatIco = cat === "Posts" ? FileText
                    : cat === "Vagas" ? Briefcase
                    : cat === "Perfil" ? User
                    : cat === "Boletim" ? GraduationCap : Activity;
                  return (
                    <div key={cat}>
                      <div className={styles.suggCat}>
                        <CatIco size={11} /> {cat}
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
                  <MessageSquare size={15} strokeWidth={2.6} className={styles.msgAbaIco} />
                  <span className={styles.msgAbaTitle}>Mensagens</span>
                </div>
                {/* plano superior (barra do avatar + busca) — flutua acima da
                    lista, com sombra em cima e embaixo e uma folga separando */}
                <div className={styles.msgPlano}>
                {/* barra: avatar + nome · ações (flat) · janela recolher/fechar (carved) */}
                <div className={styles.msgTab} onClick={() => msgCollapsed && setMsgCollapsed(false)}>
                  <div className={styles.meuAv} style={{ background: cor }} title={nomeCurto}>{myInitials}</div>
                  <StatusPicker />
                  <div className={styles.msgTabActions}>
                    {/* padrão: só Selecionar + Nova mensagem. No modo seleção
                        abre o kit: marcar/desmarcar todas · lidas · não lidas
                        · excluir (as três últimas exigem algo selecionado) */}
                    <button className={`${styles.popIco} ${styles.msgBtnSel} ${selMsg ? styles.popIcoOn : ""}`}
                      title={selMsg ? "Cancelar seleção" : "Selecionar"}
                      onClick={e => { e.stopPropagation(); toggleSelMsg(); }}>
                      {selMsg ? <ListChecks size={15} /> : <CircleDashed size={15} />}
                    </button>
                    {selMsg && (
                      <>
                        <button className={`${styles.popIco} ${todasMsgMarcadas ? styles.icoNeutro : styles.icoVerde}`}
                          title={todasMsgMarcadas ? "Desmarcar todas" : "Marcar todas"}
                          onClick={e => { e.stopPropagation(); marcarTodasMsg(); }}>
                          {todasMsgMarcadas ? <CircleSlash size={15} /> : <CheckCheck size={15} />}
                        </button>
                        {marcadasMsg.size > 0 && (
                          <>
                            <button className={`${styles.popIco} ${styles.icoCiano}`} title="Marcar como lidas"
                              onClick={e => { e.stopPropagation(); lidasSelecionadas(); }}>
                              <MailOpen size={15} />
                            </button>
                            <button className={`${styles.popIco} ${styles.icoAmbar}`} title="Marcar como não lidas"
                              onClick={e => { e.stopPropagation(); naoLidasSelecionadas(); }}>
                              <Mail size={15} />
                            </button>
                            <button className={`${styles.popIco} ${styles.icoVermelho}`} title="Excluir selecionadas"
                              onClick={e => { e.stopPropagation(); excluirMsgMarcadas(); }}>
                              <Trash2 size={15} />
                            </button>
                          </>
                        )}
                      </>
                    )}
                    {!selMsg && (
                      <button className={styles.popIco} title="Nova mensagem" onClick={e => e.stopPropagation()}><SquarePen size={15} /></button>
                    )}
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
                {/* busca dentro das mensagens */}
                <div className={styles.msgBusca}>
                  <Search size={14} className={styles.msgBuscaIco} />
                  <input
                    className={styles.msgBuscaInput}
                    placeholder="Buscar mensagens"
                    value={buscaMsg}
                    onChange={e => setBuscaMsg(e.target.value)}
                    onClick={e => e.stopPropagation()}
                  />
                  {buscaMsg && (
                    <button className={styles.msgBuscaClear} title="Limpar"
                      onClick={e => { e.stopPropagation(); setBuscaMsg(""); }}>
                      <X size={12} />
                    </button>
                  )}
                </div>
                </div>
                <DragScroll className={styles.msgList}>
                  {(() => {
                    const q = buscaMsg.trim().toLowerCase();
                    const lista = q
                      ? msgs.filter(m => m.nome.toLowerCase().includes(q) || m.texto.toLowerCase().includes(q))
                      : msgs;
                    if (msgs.length === 0) return <div className={styles.popVazio}>Nenhuma mensagem.</div>;
                    if (lista.length === 0) return <div className={styles.popVazio}>Nada encontrado para “{buscaMsg}”.</div>;
                    return lista.map(m => {
                    const msgCor = CORES[m.id % CORES.length];
                    const marc = marcadasMsg.has(m.id);
                    return (
                      <div key={m.id} data-marquee-host className={`${styles.msgItem} ${m.unread ? styles.unread : ""} ${marc ? styles.marcada : ""}`}>
                        {selMsg && (
                          <button className={`${styles.radar} ${marc ? styles.radarOn : ""}`}
                            onClick={() => toggleMarcaMsg(m.id)} title={marc ? "Desmarcar" : "Marcar"}>
                            <Circle size={20} />
                            {marc && <Check size={13} className={styles.radarTick} />}
                          </button>
                        )}
                        <div className={styles.msgAv} style={{ background: msgCor }}>{initials(m.nome)}</div>
                        <div className={styles.msgBody}>
                          <span className={styles.msgNome}>{m.nome}</span>
                          <MarqueeText className={styles.msgTexto}>{m.texto}</MarqueeText>
                        </div>
                        <div className={styles.msgFim}>
                          <span className={styles.msgTime}>{m.time}</span>
                          {m.unread ? (
                            <button className={styles.lidaBtn} title="Marcar como lida"
                              onClick={() => marcarLida(m.id)}>
                              <span className={styles.lidaDot} aria-hidden />
                              <MailOpen size={13} />
                            </button>
                          ) : (
                            <button className={`${styles.lidaBtn} ${styles.naoLidaBtn}`} title="Marcar como não lida"
                              onClick={() => marcarNaoLida(m.id)}>
                              <Mail size={13} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                    });
                  })()}
                </DragScroll>
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
                    {selNotif && (
                      <>
                        <button className={`${styles.popIco} ${todasMarcadas ? styles.icoNeutro : styles.icoVerde}`}
                          title={todasMarcadas ? "Desmarcar todas" : "Marcar todas"} onClick={marcarTodas}>
                          {todasMarcadas ? <CircleSlash size={15} /> : <CheckCheck size={15} />}
                        </button>
                        {marcadas.size > 0 && (
                          <button className={`${styles.popIco} ${styles.icoVermelho}`} title="Excluir selecionadas" onClick={excluirMarcadas}>
                            <Trash2 size={15} />
                          </button>
                        )}
                      </>
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
                          <Circle size={22} />
                          {marc && <Check size={14} className={styles.radarTick} />}
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
                <span className={styles.onlineDot} data-status={statusAtual}
                  style={{ background: infoStatus(statusAtual).cor }} title={infoStatus(statusAtual).label} />
              </div>
            </button>

            {menuOpen && (
              <div className={styles.dropdown}>
                <div className={styles.dropUser}>
                  <div className={styles.dropAvatar} style={{ background: cor }}>{myInitials}</div>
                  <div className={styles.dropName}>{currentUser.nome}</div>
                  <div className={styles.dropPapel}>{currentUser.papelDescricao}</div>
                  <div className={styles.dropEmail}>{currentUser.email}</div>
                  <div className={styles.dropStatus}><StatusPicker /></div>
                </div>
                <div className={styles.dropDivider} />
                {MENU_ITEMS.map(({ label, icon: Icon, href }) => (
                  <button key={label} className={styles.dropItem}
                    onClick={() => { setMenuOpen(false); if (href) router.push(href); }}>
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
