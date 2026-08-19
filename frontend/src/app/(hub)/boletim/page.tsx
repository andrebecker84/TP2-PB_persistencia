"use client";

import { useMemo, useState } from "react";
import {
  GraduationCap, Award, CheckCircle2, Clock, Printer, ChevronRight,
  HandHeart, BookMarked, Layers, CircleDashed, CircleDot, Briefcase,
  Sparkles, Info, CalendarCheck, FileCheck2, XCircle, Route,
} from "lucide-react";
import { useUsuarioLogado } from "@/hooks/useCurrentUser";
import styles from "./page.module.css";

/* ──────────────────────────────────────────────────────────────────────────
   Boletim no modelo da Infnet: não há notas — o aluno demonstra COMPETÊNCIAS,
   avaliadas em D / DL / DML (ou ND, quando não demonstrada). Para ser aprovado
   numa disciplina são quatro quesitos: demonstrar todas as competências, ter
   75% de presença, entregar todos os TPs no prazo e ser aprovado no Projeto
   de Bloco. Os dados abaixo são ilustrativos.
   ────────────────────────────────────────────────────────────────────────── */

type Conceito = "DML" | "DL" | "D" | "ND";
const ORDEM: Conceito[] = ["ND", "D", "DL", "DML"];

const CONCEITO_INFO: Record<Conceito, { nome: string; regra: string }> = {
  DML: { nome: "Demonstrou com Máximo Louvor", regra: "cumpriu todos os itens de rubrica da competência no AT" },
  DL:  { nome: "Demonstrou com Louvor",        regra: "cumpriu ao menos 75% dos itens de rubrica no AT" },
  D:   { nome: "Demonstrou",                   regra: "cumpriu ao menos metade dos itens de rubrica no AT" },
  ND:  { nome: "Não Demonstrou",               regra: "não atingiu a rubrica mínima ou não entregou algum TP" },
};

interface Comp { nome: string; conceito: Conceito | null }
interface Disc {
  nome: string;
  tipo: "regular" | "pb";
  carga: number;
  comps: Comp[];
  presenca: number;
  tps: { total: number; atraso: number; pendentes: number };
  semFrequencia?: boolean;   // não reprova por frequência
}
interface Bloco { n: number; titulo: string; periodo: string; disciplinas: Disc[] }

const c = (nome: string, conceito: Conceito | null): Comp => ({ nome, conceito });

const BLOCOS: Bloco[] = [
  {
    n: 1, titulo: "Fundamentos do Processamento de Dados", periodo: "25E1",
    disciplinas: [
      { nome: "Fundamentos do Processamento de Dados", tipo: "regular", carga: 60, presenca: 96,
        tps: { total: 4, atraso: 0, pendentes: 0 },
        comps: [
          c("Modelar problemas em estruturas de dados", "DML"),
          c("Implementar algoritmos de processamento", "DL"),
          c("Avaliar custo e desempenho de rotinas", "DML"),
        ] },
      { nome: "Planejamento de Curso e Carreira", tipo: "regular", carga: 30, presenca: 62, semFrequencia: true,
        tps: { total: 2, atraso: 0, pendentes: 0 },
        comps: [
          c("Traçar um plano de curso coerente com a carreira", "DL"),
          c("Reconhecer as competências do perfil profissional", "D"),
        ] },
      { nome: "Projeto de Bloco: Processamento de Dados", tipo: "pb", carga: 60, presenca: 92,
        tps: { total: 5, atraso: 0, pendentes: 0 },
        comps: [
          c("Integrar as competências do bloco num produto", "DL"),
          c("Documentar decisões técnicas do projeto", "DL"),
          c("Apresentar e defender a solução", "DML"),
        ] },
    ],
  },
  {
    n: 2, titulo: "Conectividade e Desenvolvimento de Aplicações", periodo: "25E2",
    disciplinas: [
      { nome: "Conectividade e Desenvolvimento Front-End", tipo: "regular", carga: 60, presenca: 88,
        tps: { total: 4, atraso: 1, pendentes: 0 },
        comps: [
          c("Construir interfaces responsivas e acessíveis", "DL"),
          c("Consumir APIs a partir do cliente", "DL"),
          c("Gerenciar o estado da aplicação", "D"),
        ] },
      { nome: "Desenvolvimento Back-End", tipo: "regular", carga: 60, presenca: 94,
        tps: { total: 4, atraso: 0, pendentes: 0 },
        comps: [
          c("Expor serviços REST versionados", "DML"),
          c("Persistir dados com mapeamento objeto-relacional", "DML"),
          c("Tratar erros e validações na borda", "DL"),
        ] },
      { nome: "Projeto de Bloco: Aplicações Conectadas", tipo: "pb", carga: 60, presenca: 90,
        tps: { total: 5, atraso: 0, pendentes: 0 },
        comps: [
          c("Entregar uma aplicação ponta a ponta", "DML"),
          c("Versionar e publicar o código do projeto", "DL"),
          c("Justificar a arquitetura adotada", "DL"),
        ] },
    ],
  },
  {
    n: 3, titulo: "Ciência da Computação", periodo: "26E2",
    disciplinas: [
      { nome: "Análise e Segurança de Agentes de IA", tipo: "regular", carga: 60, presenca: 90,
        tps: { total: 4, atraso: 0, pendentes: 1 },
        comps: [
          c("Avaliar riscos de agentes autônomos", null),
          c("Instrumentar e monitorar agentes", null),
          c("Aplicar guardrails de segurança", null),
        ] },
      { nome: "Engenharia Segura de Softwares Escaláveis", tipo: "regular", carga: 60, presenca: 92,
        tps: { total: 4, atraso: 0, pendentes: 1 },
        comps: [
          c("Modelar dados com isolamento de domínio", "DML"),
          c("Integrar JPA com repositórios Spring Data", "DML"),
          c("Registrar e consultar histórico de dados", "DL"),
          c("Testar a camada de persistência", null),
        ] },
      { nome: "Projeto de Bloco: Engenharia de Softwares Escaláveis", tipo: "pb", carga: 60, presenca: 94,
        tps: { total: 5, atraso: 0, pendentes: 3 },
        comps: [
          c("Construir a camada de persistência do produto", "DML"),
          c("Garantir integridade e desempenho no acesso a dados", "DL"),
          c("Documentar o design da solução", null),
        ] },
    ],
  },
];

/* trilhas de especialização — os blocos seguintes, ainda não iniciados */
const TRILHAS = [
  { nome: "Inteligência Artificial", disc: ["Machine Learning", "Desenvolvimento Disciplinado e Gestão de Multi-Agentes IA"] },
  { nome: "Sistemas Complexos",      disc: ["Engenharia Disciplinada de Softwares", "Desenvolvimento Disciplinado e Gestão de Multi-Agentes IA"] },
  { nome: "Engenharia de Dados",     disc: ["Engenharia de Banco de Dados", "Engenharia de Dados: Big Data"] },
  { nome: "Cibersegurança",          disc: ["Segurança Defensiva com SOC e Blue Team", "Segurança Ofensiva com Red Team"] },
  { nome: "Cloud Computing",         disc: ["Cloud Computing e Conteinerização", "Arquitetura e Engenharia de Softwares na Nuvem"] },
];

type StatusItem = "Concluído" | "Em curso" | "Não concluído";
interface Item { nome: string; carga: number; periodo: string; status: StatusItem; presenca?: number }

/* Projetos Supervisionados de Extensão — 400h, sem exigência de presença */
const EXTENSAO: Item[] = [
  { nome: "Portal Comunitário — Projeto Integrador",   carga: 120, periodo: "25E1", status: "Concluído" },
  { nome: "Mentoria de Programação em Escola Pública", carga:  80, periodo: "25E1", status: "Concluído" },
  { nome: "Hackathon Social Infnet",                   carga: 100, periodo: "25E2", status: "Concluído" },
  { nome: "Consultoria de TI para ONGs",               carga: 100, periodo: "26E2", status: "Em curso"   },
];

/* Disciplinas eletivas — exigem 75% de presença */
const ELETIVAS: Item[] = [
  { nome: "Computação em Nuvem",            carga: 40, periodo: "25E1", status: "Concluído",     presenca: 92 },
  { nome: "Segurança de Aplicações",        carga: 40, periodo: "25E2", status: "Concluído",     presenca: 86 },
  { nome: "Introdução a Machine Learning",  carga: 40, periodo: "26E2", status: "Em curso",      presenca: 78 },
  { nome: "Empreendedorismo em Tecnologia", carga: 40, periodo: "—",    status: "Não concluído" },
];

const ESTAGIO: Item[] = [
  { nome: "Estágio supervisionado — Desenvolvimento Back-End", carga: 220, periodo: "25E2", status: "Concluído" },
  { nome: "Estágio supervisionado — Plataforma de Dados",      carga: 100, periodo: "26E2", status: "Em curso"  },
];

const COMPLEMENTARES: Item[] = [
  { nome: "Certificação Oracle Java SE",           carga: 30, periodo: "25E1", status: "Concluído" },
  { nome: "Semana de Tecnologia Infnet",           carga: 16, periodo: "25E2", status: "Concluído" },
  { nome: "Curso de Kubernetes (plataforma externa)", carga: 24, periodo: "26E2", status: "Concluído" },
  { nome: "Monitoria de Estruturas de Dados",      carga: 30, periodo: "26E2", status: "Em curso"   },
];

const METAS = { disciplinas: 2160, extensao: 400, estagio: 400, complementares: 140 };
const PRESENCA_MINIMA = 75;

/* ── regras derivadas ── */
const pior = (cs: Comp[]): Conceito | null => {
  if (cs.some(x => x.conceito == null)) return null;
  return cs.reduce<Conceito>((acc, x) =>
    ORDEM.indexOf(x.conceito as Conceito) < ORDEM.indexOf(acc) ? x.conceito as Conceito : acc, "DML");
};

function situacao(d: Disc): { txt: "Aprovado" | "Cursando" | "Reprovado"; motivo: string } {
  const freqOk = d.semFrequencia || d.presenca >= PRESENCA_MINIMA;
  if (!freqOk) return { txt: "Reprovado", motivo: `frequência de ${d.presenca}% — abaixo dos ${PRESENCA_MINIMA}% exigidos` };
  const cc = pior(d.comps);
  if (cc === "ND") return { txt: "Reprovado", motivo: "há competência não demonstrada" };
  if (cc == null) return { txt: "Cursando", motivo: "competências ainda em avaliação neste bloco" };
  return { txt: "Aprovado", motivo: `todas as competências demonstradas · conceito ${cc}` };
}

/* teto de conceito imposto pelos TPs entregues fora do prazo */
function tetoTP(d: Disc): string | null {
  if (d.tps.pendentes > 0) return "TP pendente — o AT fica ND se não for entregue até o prazo limite";
  if (d.tps.atraso >= 2) return "2 TPs fora do prazo — conceitos do AT limitados a D";
  if (d.tps.atraso === 1) return "1 TP fora do prazo — conceitos do AT limitados a DL";
  return null;
}

function ConceitoTag({ v, mini }: { v: Conceito | null; mini?: boolean }) {
  if (v == null) return <span className={`${styles.cnc} ${styles.cncAval} ${mini ? styles.cncMini : ""}`} title="Competência ainda em avaliação">—</span>;
  const cls = v === "DML" ? styles.cncDML : v === "DL" ? styles.cncDL : v === "D" ? styles.cncD : styles.cncND;
  return (
    <span className={`${styles.cnc} ${cls} ${mini ? styles.cncMini : ""}`}
      title={`${v} — ${CONCEITO_INFO[v].nome}: ${CONCEITO_INFO[v].regra}`}>{v}</span>
  );
}

function StatusTag({ s }: { s: StatusItem }) {
  const cls = s === "Concluído" ? styles.stOk : s === "Em curso" ? styles.stCurso : styles.stOff;
  const Ico = s === "Concluído" ? CheckCircle2 : s === "Em curso" ? CircleDot : CircleDashed;
  return <span className={`${styles.stBadge} ${cls}`}><Ico size={11} /> {s}</span>;
}

function TabelaItens({ itens, comPresenca }: { itens: Item[]; comPresenca?: boolean }) {
  return (
    <div className={styles.tabelaWrap}>
      <table className={styles.tabela}>
        <thead>
          <tr>
            <th>Atividade</th>
            <th className={styles.colNum}>Carga</th>
            <th className={styles.colNum}>Trimestre</th>
            {comPresenca && <th className={styles.colNum}>Presença</th>}
            <th className={styles.colSit}>Status</th>
          </tr>
        </thead>
        <tbody>
          {itens.map(i => (
            <tr key={i.nome}>
              <td className={styles.disc}>{i.nome}</td>
              <td className={styles.colNum}>{i.carga}h</td>
              <td className={styles.colNum}>{i.periodo}</td>
              {comPresenca && (
                <td className={`${styles.colNum} ${i.presenca != null && i.presenca < PRESENCA_MINIMA ? styles.freqBaixa : ""}`}>
                  {i.presenca != null ? `${i.presenca}%` : "—"}
                </td>
              )}
              <td className={styles.colSit}><StatusTag s={i.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const somaConcluida = (itens: Item[]) => itens.filter(i => i.status === "Concluído").reduce((s, i) => s + i.carga, 0);

export default function BoletimPage() {
  const currentUser = useUsuarioLogado();
  const [abertos, setAbertos] = useState<Set<number>>(() => new Set([3]));
  const alternar = (b: number) =>
    setAbertos(prev => { const s = new Set(prev); s.has(b) ? s.delete(b) : s.add(b); return s; });

  const imprimir = () => {
    setAbertos(new Set(BLOCOS.map(b => b.n)));
    setTimeout(() => window.print(), 80);
  };

  const resumo = useMemo(() => {
    const discs = BLOCOS.flatMap(b => b.disciplinas);
    const comps = discs.flatMap(d => d.comps);
    const avaliadas = comps.filter(x => x.conceito != null) as { nome: string; conceito: Conceito }[];
    const conta = (v: Conceito) => avaliadas.filter(x => x.conceito === v).length;
    const aprovadas = discs.filter(d => situacao(d).txt === "Aprovado");
    return {
      comps: avaliadas.length,
      dml: conta("DML"), dl: conta("DL"), d: conta("D"), nd: conta("ND"),
      emAvaliacao: comps.length - avaliadas.length,
      aprovadas: aprovadas.length,
      cursando: discs.filter(d => situacao(d).txt === "Cursando").length,
      presenca: discs.reduce((s, d) => s + d.presenca, 0) / discs.length,
      cargaDisciplinas: aprovadas.reduce((s, d) => s + d.carga, 0),
    };
  }, []);

  const totais = [
    { label: "Disciplinas dos blocos", feito: resumo.cargaDisciplinas,      meta: METAS.disciplinas,    cor: "#3b8ef5", icon: Layers },
    { label: "Projetos de extensão",   feito: somaConcluida(EXTENSAO),      meta: METAS.extensao,       cor: "#a78bfa", icon: HandHeart },
    { label: "Estágio obrigatório",    feito: somaConcluida(ESTAGIO),       meta: METAS.estagio,        cor: "#22d3ee", icon: Briefcase },
    { label: "Atividades complementares", feito: somaConcluida(COMPLEMENTARES), meta: METAS.complementares, cor: "#fbbf24", icon: Sparkles },
  ];
  const cargaFeita = totais.reduce((s, t) => s + t.feito, 0);
  const cargaMeta = totais.reduce((s, t) => s + t.meta, 0);
  const pctCurso = Math.round((cargaFeita / cargaMeta) * 100);

  const statusBloco = (b: Bloco): StatusItem => {
    const sits = b.disciplinas.map(d => situacao(d).txt);
    if (sits.every(s => s === "Aprovado")) return "Concluído";
    if (sits.some(s => s === "Cursando")) return "Em curso";
    return "Não concluído";
  };

  return (
    <div className={styles.page}>
      <header className={styles.head}>
        <div className={styles.headIco}><GraduationCap size={20} /></div>
        <div className={styles.headInfo}>
          <h1 className={styles.h1}>Boletim Acadêmico</h1>
          <p className={styles.sub}>Histórico por competências — {currentUser.nome} · Engenharia de Software</p>
        </div>
        <button className={styles.printBtn} onClick={imprimir} title="Imprimir">
          <Printer size={15} /> Imprimir
        </button>
      </header>

      {/* ── Resumo ── */}
      <div className={styles.resumo}>
        <div className={styles.resItem}>
          <span className={styles.resIco} data-c="primary"><Award size={16} /></span>
          <div>
            <div className={styles.resVal}>{resumo.comps}</div>
            <div className={styles.resLbl}>competências demonstradas</div>
          </div>
        </div>
        <div className={styles.resItem}>
          <span className={styles.resIco} data-c="louvor"><Sparkles size={16} /></span>
          <div>
            <div className={styles.resVal}>{resumo.dml + resumo.dl}</div>
            <div className={styles.resLbl}>com louvor (DL + DML)</div>
          </div>
        </div>
        <div className={styles.resItem}>
          <span className={styles.resIco} data-c="success"><CheckCircle2 size={16} /></span>
          <div>
            <div className={styles.resVal}>{resumo.aprovadas}</div>
            <div className={styles.resLbl}>disciplinas aprovadas</div>
          </div>
        </div>
        <div className={styles.resItem}>
          <span className={styles.resIco} data-c="warning"><CalendarCheck size={16} /></span>
          <div>
            <div className={styles.resVal}>{Math.round(resumo.presenca)}%</div>
            <div className={styles.resLbl}>presença média (mín. {PRESENCA_MINIMA}%)</div>
          </div>
        </div>
      </div>

      {/* ── Perfil de conceitos ── */}
      <section className={styles.perfil}>
        <h2 className={styles.perfilTitulo}>Perfil de conceitos</h2>
        <div className={styles.perfilBarra}>
          {([["DML", resumo.dml], ["DL", resumo.dl], ["D", resumo.d], ["ND", resumo.nd]] as [Conceito, number][])
            .filter(([, n]) => n > 0)
            .map(([k, n]) => (
              <span key={k} className={styles[`seg${k}`]} style={{ flexGrow: n }}
                title={`${n} competência${n > 1 ? "s" : ""} ${k} — ${CONCEITO_INFO[k].nome}`}>
                {n}
              </span>
            ))}
        </div>
        <div className={styles.perfilLegenda}>
          {(["DML", "DL", "D", "ND"] as Conceito[]).map(k => (
            <span key={k} className={styles.legItem} title={CONCEITO_INFO[k].regra}>
              <i className={styles[`seg${k}`]} /> <b>{k}</b> {CONCEITO_INFO[k].nome}
            </span>
          ))}
        </div>
      </section>

      {/* ── Blocos ── */}
      <h2 className={styles.secTitulo}><Layers size={15} /> Blocos de Graduação</h2>

      {BLOCOS.slice().reverse().map(b => {
        const aberto = abertos.has(b.n);
        const st = statusBloco(b);
        const okc = b.disciplinas.filter(d => situacao(d).txt === "Aprovado").length;
        return (
          <section key={b.n} className={`${styles.bloco} ${aberto ? styles.blocoAberto : ""}`}>
            <button className={styles.blocoHead} onClick={() => alternar(b.n)} aria-expanded={aberto}>
              <ChevronRight size={15} className={styles.chevron} />
              <span className={styles.blocoTag}>Bloco {b.n}</span>
              <span className={styles.blocoTitulo}>{b.titulo}</span>
              <span className={styles.blocoPeriodo}>{b.periodo}</span>
              <span className={styles.blocoCount}>{okc}/{b.disciplinas.length}</span>
              <StatusTag s={st} />
            </button>

            {aberto && (
              <div className={styles.tabelaWrap}>
                <table className={styles.tabela}>
                  <thead>
                    <tr>
                      <th>Disciplina e competências</th>
                      <th className={styles.colNum}>Carga</th>
                      <th className={styles.colNum}>Presença</th>
                      <th className={styles.colNum}>TPs</th>
                      <th className={styles.colSit}>Situação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {b.disciplinas.map(d => {
                      const sit = situacao(d);
                      const conceito = pior(d.comps);
                      const teto = tetoTP(d);
                      const freqBaixa = !d.semFrequencia && d.presenca < PRESENCA_MINIMA;
                      return (
                        <tr key={d.nome}>
                          <td>
                            <span className={styles.disc}>
                              {d.tipo === "pb" && <span className={styles.pbTag} title="Disciplina de Projeto de Bloco">PB</span>}
                              {d.nome}
                              {conceito && <ConceitoTag v={conceito} />}
                            </span>
                            <ul className={styles.comps}>
                              {d.comps.map(x => (
                                <li key={x.nome}>
                                  <ConceitoTag v={x.conceito} mini />
                                  <span>{x.nome}</span>
                                </li>
                              ))}
                            </ul>
                            {teto && <p className={styles.aviso}><Info size={11} /> {teto}</p>}
                          </td>
                          <td className={styles.colNum}>{d.carga}h</td>
                          <td className={`${styles.colNum} ${freqBaixa ? styles.freqBaixa : ""}`}
                            title={d.semFrequencia ? "Disciplina que não reprova por frequência" : `Mínimo de ${PRESENCA_MINIMA}%`}>
                            {d.presenca}%{d.semFrequencia && <i className={styles.isenta}>isenta</i>}
                          </td>
                          <td className={styles.colNum} title={`${d.tps.total} TPs · ${d.tps.atraso} fora do prazo · ${d.tps.pendentes} pendentes`}>
                            <span className={d.tps.pendentes > 0 ? styles.tpAlerta : d.tps.atraso > 0 ? styles.tpAtraso : styles.tpOk}>
                              {d.tps.total - d.tps.pendentes}/{d.tps.total}
                            </span>
                          </td>
                          <td className={styles.colSit}>
                            <span className={`${styles.sitBadge} ${
                              sit.txt === "Cursando" ? styles.sitCursando :
                              sit.txt === "Reprovado" ? styles.sitReprovado : styles.sitAprovado
                            }`} title={sit.motivo}>
                              {sit.txt === "Reprovado" ? <XCircle size={11} /> : sit.txt === "Cursando" ? <CircleDot size={11} /> : <CheckCircle2 size={11} />}
                              {sit.txt}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        );
      })}

      {/* ── Mapa do curso: as rodas dos blocos ── */}
      <h2 className={styles.secTitulo}><Route size={15} /> Mapa do Curso</h2>
      <section className={styles.mapa}>
        <p className={styles.trilhaIntro}>
          Cada roda é um bloco: a metade de cima e a de baixo são as duas disciplinas,
          e o Projeto de Bloco fecha o conjunto. O núcleo é comum a todos; depois dele
          o curso segue por uma das trilhas.
        </p>

        <div className={styles.nucleo}>
          {BLOCOS.map((b, i) => {
            const st = statusBloco(b);
            const regs = b.disciplinas.filter(d => d.tipo === "regular");
            return (
              <div key={b.n} className={styles.passo}>
                <div className={`${styles.rodaG} ${
                  st === "Concluído" ? styles.rodaFeita : st === "Em curso" ? styles.rodaAtual : ""
                }`} title={`Bloco ${b.n} · ${b.titulo} · ${st}`}>
                  <span className={styles.rodaMeta}>{regs[0]?.nome ?? b.titulo}</span>
                  <span className={styles.rodaLinha} />
                  <span className={styles.rodaMeta}>{regs[1]?.nome ?? "Projeto de Bloco"}</span>
                </div>
                <span className={styles.rodaNome}>{b.titulo}</span>
                <span className={styles.rodaPer}>{b.periodo}</span>
                {i < BLOCOS.length - 1 && <span className={styles.seta} aria-hidden>→</span>}
              </div>
            );
          })}
        </div>

        <div className={styles.ramoTitulo}>
          <span />
          <b>Escolha uma trilha ao concluir o núcleo</b>
          <span />
        </div>

        <div className={styles.ramos}>
          {TRILHAS.map(t => (
            <div key={t.nome} className={styles.ramo} title={`${t.nome} · não iniciada`}>
              <div className={styles.rodaG}>
                <span className={styles.rodaMeta}>{t.disc[0]}</span>
                <span className={styles.rodaLinha} />
                <span className={styles.rodaMeta}>{t.disc[1]}</span>
              </div>
              <span className={styles.rodaNome}>{t.nome}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Extensão · eletivas · estágio · complementares ── */}
      <h2 className={styles.secTitulo}><HandHeart size={15} /> Projetos Supervisionados de Extensão</h2>
      <section className={styles.bloco}>
        <p className={styles.trilhaIntro}>
          Carga horária necessária: <strong>{METAS.extensao}h</strong>. Não há exigência de presença —
          conta o cumprimento da carga.
        </p>
        <TabelaItens itens={EXTENSAO} />
      </section>

      <h2 className={styles.secTitulo}><BookMarked size={15} /> Disciplinas Eletivas</h2>
      <section className={styles.bloco}>
        <p className={styles.trilhaIntro}>
          Exigem no mínimo <strong>{PRESENCA_MINIMA}% de presença</strong>, como as disciplinas regulares.
        </p>
        <TabelaItens itens={ELETIVAS} comPresenca />
      </section>

      <h2 className={styles.secTitulo}><Briefcase size={15} /> Estágio Obrigatório</h2>
      <section className={styles.bloco}>
        <p className={styles.trilhaIntro}>Carga horária necessária: <strong>{METAS.estagio}h</strong>.</p>
        <TabelaItens itens={ESTAGIO} />
      </section>

      <h2 className={styles.secTitulo}><Sparkles size={15} /> Atividades Complementares</h2>
      <section className={styles.bloco}>
        <p className={styles.trilhaIntro}>Carga horária necessária: <strong>{METAS.complementares}h</strong>.</p>
        <TabelaItens itens={COMPLEMENTARES} />
      </section>

      {/* ── Carga horária total ── */}
      <h2 className={styles.secTitulo}><Clock size={15} /> Carga Horária Total</h2>
      <section className={styles.totais}>
        <div className={styles.totaisTopo}>
          <div>
            <div className={styles.totaisVal}>
              {cargaFeita.toLocaleString("pt-BR")}
              <span className={styles.totaisMeta}> / {cargaMeta.toLocaleString("pt-BR")}h</span>
            </div>
            <div className={styles.totaisLbl}>integralização do curso</div>
          </div>
          <div className={styles.totaisPct}>{pctCurso}%</div>
        </div>
        <div className={styles.totaisTrilho}><span style={{ width: `${pctCurso}%` }} /></div>

        <ul className={styles.totaisLista}>
          {totais.map(t => {
            const pct = Math.min(100, Math.round((t.feito / t.meta) * 100));
            const TIco = t.icon;
            return (
              <li key={t.label} className={styles.totalItem}>
                <div className={styles.totalTop}>
                  <span className={styles.totalLabel}><TIco size={13} style={{ color: t.cor }} /> {t.label}</span>
                  <span className={styles.totalNum} style={{ color: t.cor }}>{t.feito}h <i>/ {t.meta}h</i></span>
                </div>
                <div className={styles.totalTrilho}>
                  <span style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${t.cor}, ${t.cor}bb)`, boxShadow: `0 0 8px ${t.cor}55` }} />
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {/* ── Regras de aprovação ── */}
      <section className={styles.regras}>
        <h2 className={styles.regrasTitulo}><FileCheck2 size={15} /> Como funciona a aprovação</h2>
        <ol className={styles.regrasLista}>
          <li>Demonstrar <strong>todas</strong> as competências previstas para a disciplina.</li>
          <li>Ter <strong>{PRESENCA_MINIMA}% de presença</strong> nas aulas, na modalidade presencial.</li>
          <li>Entregar os <strong>Testes de Performance (TPs)</strong> até o prazo limite.</li>
          <li>Ser aprovado na disciplina de <strong>Projeto de Bloco</strong>, em blocos iniciados a partir de 2025.</li>
        </ol>
        <p className={styles.regrasNota}>
          Um TP entregue fora do prazo normal limita os conceitos do AT a <b>DL</b>; dois ou mais limitam a <b>D</b>;
          e um TP não entregue até o prazo limite torna as competências <b>ND</b>. Planejamento de Curso e Carreira
          e Fluência em IA não reprovam por frequência.
        </p>
      </section>

      <p className={styles.rodape}>
        Documento gerado pela plataforma Infnet Hub · dados ilustrativos para demonstração acadêmica.
      </p>
    </div>
  );
}
