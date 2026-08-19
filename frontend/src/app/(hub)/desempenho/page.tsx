"use client";

import { useMemo, useState } from "react";
import {
  Activity, TrendingUp, TrendingDown, Award, GraduationCap,
  Clock, Briefcase, HandHeart, CalendarCheck, Sparkles, Users,
  Target, Gauge, LineChart, Boxes, Flag, CheckCircle2,
} from "lucide-react";
import { useUsuarioLogado } from "@/hooks/useCurrentUser";
import styles from "./page.module.css";

/* ──────────────────────────────────────────────────────────────────────────
   Painel de desempenho. Não há notas: tudo é derivado dos CONCEITOS das
   competências (DML / DL / D / ND). O "índice" é o indicador que a plataforma
   calcula a partir deles — DML 100, DL 80, D 60, ND 0 — e serve só para
   comparar evolução, nunca substitui o conceito. Dados ilustrativos.
   ────────────────────────────────────────────────────────────────────────── */

type Conceito = "DML" | "DL" | "D" | "ND";
const PESO: Record<Conceito, number> = { DML: 100, DL: 80, D: 60, ND: 0 };
const CONCEITO_DE = (i: number): Conceito => (i >= 95 ? "DML" : i >= 75 ? "DL" : i >= 55 ? "D" : "ND");

/* competências já avaliadas, na ordem dos blocos (espelha o boletim) */
const CONCEITOS: Conceito[] = [
  "DML", "DL", "DML", "DL", "D", "DL", "DL", "DML",          // bloco 1 · 25E1
  "DL", "DL", "D", "DML", "DML", "DL", "DML", "DL", "DL",     // bloco 2 · 25E2
  "DML", "DML", "DL", "DML", "DL",                            // bloco 3 · 26E2 (parcial)
];

/* evolução do índice no semestre — aluno × turma, e a projeção dos 2 meses seguintes */
const MESES = ["Fev", "Mar", "Abr", "Mai", "Jun", "Jul"];
const MESES_FUTUROS = ["Ago", "Set"];
const ALUNO = [78, 82, 80, 86, 90, 92];
const TURMA = [74, 75, 77, 78, 80, 81];
const PROJECAO = [94, 96];
const PROJECAO_TURMA = [82, 83];
const INCERTEZA = 4;

/* horas obrigatórias (mesmos números do boletim) */
const HORAS = [
  { label: "Atividades complementares", total: 140, feitas: 70,  icon: Sparkles,  cor: "#fbbf24" },
  { label: "Estágio obrigatório",       total: 400, feitas: 220, icon: Briefcase, cor: "#22d3ee" },
  { label: "Projetos de extensão",      total: 400, feitas: 300, icon: HandHeart, cor: "#a78bfa" },
];

const PRESENCAS = [
  { disc: "Engenharia Segura de Softwares Escaláveis", pct: 92 },
  { disc: "Análise e Segurança de Agentes de IA",      pct: 90 },
  { disc: "Projeto de Bloco: Eng. de Softwares",       pct: 94 },
  { disc: "Introdução a Machine Learning (eletiva)",   pct: 78 },
];

/* turmas anteriores — índice médio de conceitos */
const TURMAS_ANT: { turma: string; indice: number; eu?: boolean }[] = [
  { turma: "24E2", indice: 79 },
  { turma: "25E1", indice: 82 },
  { turma: "25E2", indice: 80 },
  { turma: "26E2", indice: 84, eu: true },
];

/* Catmull-Rom convertido em cúbicas: a linha passa exatamente pelos pontos,
   mas chega neles em curva, sem os bicos do polyline. */
function suave(pts: [number, number][], k = 0.85) {
  if (pts.length < 2) return "";
  let d = `M${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1x = p1[0] + ((p2[0] - p0[0]) / 6) * k;
    const c1y = p1[1] + ((p2[1] - p0[1]) / 6) * k;
    const c2x = p2[0] - ((p3[0] - p1[0]) / 6) * k;
    const c2y = p2[1] - ((p3[1] - p1[1]) / 6) * k;
    d += ` C${c1x.toFixed(2)} ${c1y.toFixed(2)} ${c2x.toFixed(2)} ${c2y.toFixed(2)} ${p2[0].toFixed(2)} ${p2[1].toFixed(2)}`;
  }
  return d;
}
/* mesma curva, fechada até a base, para o preenchimento */
const area = (pts: [number, number][], base: number) =>
  `${suave(pts)} L${pts[pts.length - 1][0]} ${base} L${pts[0][0]} ${base} Z`;

const BLOCO_ATUAL = 3;
const BLOCOS_CURSO = 12;
const PRESENCA_GERAL = 92;
const ENTREGAS_NO_PRAZO = 96;

export default function DesempenhoPage() {
  const currentUser = useUsuarioLogado();
  const [ponto, setPonto] = useState<number | null>(null);   // tooltip do gráfico de linhas
  const [barra, setBarra] = useState<number | null>(null);   // tooltip do comparativo

  /* ── indicadores derivados dos conceitos ── */
  const perfil = useMemo(() => {
    const conta = (v: Conceito) => CONCEITOS.filter(x => x === v).length;
    const indice = CONCEITOS.reduce((s, x) => s + PESO[x], 0) / CONCEITOS.length;
    return { total: CONCEITOS.length, dml: conta("DML"), dl: conta("DL"), d: conta("D"), nd: conta("ND"), indice };
  }, []);

  const tendencia = useMemo(() => {
    const delta = ALUNO[ALUNO.length - 1] - ALUNO[ALUNO.length - 3];
    return { delta, subindo: delta >= 0 };
  }, []);

  const cursoPct = Math.round((BLOCO_ATUAL / BLOCOS_CURSO) * 100);
  const acimaTurma = ALUNO[ALUNO.length - 1] - TURMA[TURMA.length - 1];
  const projFinal = PROJECAO[PROJECAO.length - 1];

  /* ── geometria: anéis do score (estilo atividade) ── */
  const anel = (r: number, pct: number) => {
    const c = 2 * Math.PI * r;
    return { r, c, dash: `${(pct / 100) * c} ${c}` };
  };
  const aneis = [
    { ...anel(52, perfil.indice),   cor: "url(#gComp)", label: "Competências", valor: Math.round(perfil.indice) },
    { ...anel(41, PRESENCA_GERAL),  cor: "url(#gPres)", label: "Presença",     valor: PRESENCA_GERAL },
    { ...anel(30, ENTREGAS_NO_PRAZO), cor: "url(#gEnt)", label: "Entregas no prazo", valor: ENTREGAS_NO_PRAZO },
  ];

  /* ── geometria: gráfico de linhas com projeção ── */
  const W = 620, H = 190, ML = 34, MR = 16, MT = 16, MB = 30;
  const serie = [...ALUNO, ...PROJECAO];
  const rotulos = [...MESES, ...MESES_FUTUROS];
  const yMin = 60, yMax = 100;
  const px = (i: number) => ML + (i / (serie.length - 1)) * (W - ML - MR);
  const py = (v: number) => H - MB - ((v - yMin) / (yMax - yMin)) * (H - MT - MB);
  const iUlt = ALUNO.length - 1;

  /* ── geometria: ponteiro da tendência (−10 a +10) ── */
  const angulo = Math.max(-90, Math.min(90, (tendencia.delta / 10) * 90));

  /* ── alerta conforme o rendimento ── */
  const marcas = [
    { k: "vs. turma", v: `${acimaTurma >= 0 ? "+" : ""}${acimaTurma}` },
    { k: "no período", v: `${tendencia.delta >= 0 ? "+" : ""}${tendencia.delta}` },
    { k: "em D", v: `${perfil.d}` },
  ];
  const alerta = !tendencia.subindo
    ? { tom: "warn" as const, icon: TrendingDown, titulo: "Rendimento em queda",
        dica: "Refaça os itens de rubrica das competências em D e marque uma monitoria." }
    : acimaTurma >= 8
      ? { tom: "bom" as const, icon: Sparkles, titulo: "Acima da turma — parabéns!",
          dica: "Para virar DL em DML, cubra todos os itens de rubrica do AT e entregue os TPs no prazo normal." }
      : { tom: "ok" as const, icon: Award, titulo: "Na média da turma",
          dica: "Escolha duas competências em D e refaça os itens de rubrica que faltaram." };
  const AlertaIcon = alerta.icon;

  const maxAnt = Math.max(...TURMAS_ANT.map(t => t.indice));

  return (
    <div className={styles.page}>
      <header className={styles.head}>
        <div className={styles.headIco}><Activity size={20} /></div>
        <div>
          <h1 className={styles.h1}>Meu Desempenho</h1>
          <p className={styles.sub}>Painel de acompanhamento por competências — {currentUser.nome}</p>
        </div>
      </header>

      {/* ── Painel de topo: score em anéis · progresso do curso · tendência ── */}
      <div className={styles.painel}>
        {/* Score geral */}
        <section className={`${styles.cardPainel} ${styles.cardScore}`}>
          <Award className={styles.marca} size={130} aria-hidden />
          <h2 className={styles.painelTitulo}><Award size={15} /> Score geral no curso</h2>

          <div className={styles.scoreBody}>
            <div className={styles.scoreLado}>
              <div className={styles.ladoItem} title="Índice calculado a partir dos conceitos das competências">
                <b>{Math.round(perfil.indice)}</b>
                <span><i className={styles.pontoComp} />índice</span>
              </div>
              <div className={styles.ladoItem} title="Presença média nas disciplinas do bloco">
                <b>{PRESENCA_GERAL}%</b>
                <span><i className={styles.pontoPres} />presença</span>
              </div>
            </div>

            <div className={styles.aneis}>
              <svg viewBox="0 0 140 140" className={styles.aneisSvg}>
                <defs>
                  <linearGradient id="gComp" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#a855f7" /><stop offset="1" stopColor="#22d3ee" />
                  </linearGradient>
                  <linearGradient id="gPres" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#34d399" /><stop offset="1" stopColor="#a3e635" />
                  </linearGradient>
                  <linearGradient id="gEnt" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#3b8ef5" /><stop offset="1" stopColor="#22d3ee" />
                  </linearGradient>
                </defs>
                <g transform="rotate(-90 70 70)">
                  {aneis.map(a => (
                    <g key={a.r}>
                      <circle cx="70" cy="70" r={a.r} className={styles.anelTrilho} />
                      <circle cx="70" cy="70" r={a.r} stroke={a.cor} strokeDasharray={a.dash}
                        className={styles.anelArco}>
                        <title>{`${a.label}: ${a.valor}%`}</title>
                      </circle>
                    </g>
                  ))}
                </g>
                {/* disco central: o conceito ganha superfície própria em vez de
                    flutuar sobre o vão dos anéis */}
                <circle cx="70" cy="70" r="23" className={styles.aneisDisco} />
                <text x="70" y="78" className={styles.aneisNum}>{CONCEITO_DE(perfil.indice)}</text>
              </svg>
              <span className={styles.aneisSub}>conceito médio</span>
            </div>

            <div className={styles.scoreLado}>
              <div className={styles.ladoItem} title="TPs entregues dentro do prazo normal">
                <b>{ENTREGAS_NO_PRAZO}%</b>
                <span><i className={styles.pontoEnt} />entregas</span>
              </div>
              <div className={styles.ladoItem} title="Competências avaliadas até aqui">
                <b>{perfil.total}</b>
                <span>competências</span>
              </div>
            </div>
          </div>

          <div className={styles.scorePerfil}>
            {([["DML", perfil.dml], ["DL", perfil.dl], ["D", perfil.d], ["ND", perfil.nd]] as [Conceito, number][])
              .filter(([, n]) => n > 0)
              .map(([k, n]) => (
                <span key={k} className={styles[`p${k}`]} style={{ flexGrow: n }} title={`${n} competência(s) ${k}`}>
                  {k} {n}
                </span>
              ))}
          </div>
        </section>

        {/* Conclusão do curso */}
        <section className={styles.cardPainel}>
          <Boxes className={styles.marca} size={120} aria-hidden />
          <h2 className={styles.painelTitulo}><Boxes size={15} /> Conclusão do curso</h2>
          <div className={styles.cursoTopo}>
            <div className={styles.cursoVal}>{cursoPct}<span>%</span></div>
            <span className={styles.cursoBloco}>
              <Boxes size={13} /> bloco {BLOCO_ATUAL} de {BLOCOS_CURSO}
            </span>
          </div>

          {/* trilha dos blocos: o marcador aponta onde você está agora */}
          <div className={styles.trilhaBlocos}>
            <span className={styles.marcadorAqui} style={{ left: `${((BLOCO_ATUAL - 0.5) / BLOCOS_CURSO) * 100}%` }}>
              aqui
            </span>
            <div className={styles.blocos} title={`Bloco ${BLOCO_ATUAL} de ${BLOCOS_CURSO}`}>
              {Array.from({ length: BLOCOS_CURSO }, (_, i) => (
                <span key={i} className={
                  i < BLOCO_ATUAL - 1 ? styles.blocoFeito :
                  i === BLOCO_ATUAL - 1 ? styles.blocoAtual : styles.blocoVazio
                } title={`Bloco ${i + 1}${i < BLOCO_ATUAL - 1 ? " · concluído" : i === BLOCO_ATUAL - 1 ? " · em curso" : " · a cursar"}`} />
              ))}
            </div>
          </div>

          <div className={styles.marcas}>
            <span className={styles.marca2}><CheckCircle2 size={11} /><b>{BLOCO_ATUAL - 1}</b> concluídos</span>
            <span className={styles.marca2}><Boxes size={11} /><b>{BLOCOS_CURSO - BLOCO_ATUAL}</b> restantes</span>
            <span className={styles.marca2}><Flag size={11} /><b>28E1</b> previsão</span>
          </div>
        </section>

        {/* Tendência com ponteiro */}
        <section className={styles.cardPainel}>
          <Gauge className={styles.marca} size={120} aria-hidden />
          <h2 className={styles.painelTitulo}><Gauge size={15} /> Tendência do rendimento</h2>
          <div className={styles.gauge}>
            <svg viewBox="0 0 140 92" className={styles.gaugeSvg}>
              <defs>
                <linearGradient id="gArco" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0" stopColor="#f87171" />
                  <stop offset=".42" stopColor="var(--surface-3)" />
                  <stop offset=".58" stopColor="var(--surface-3)" />
                  <stop offset="1" stopColor="#34d399" />
                </linearGradient>
              </defs>
              <path d="M14 70 A 56 56 0 0 1 126 70" className={styles.gaugeArco} />
              <path d="M14 70 A 56 56 0 0 1 126 70" stroke="url(#gArco)" className={styles.gaugeArcoCor} />

              {/* marcações a cada 22,5° — dão leitura de instrumento ao arco */}
              {Array.from({ length: 9 }, (_, i) => {
                const a = (-90 + i * 22.5) * (Math.PI / 180);
                const r1 = i % 4 === 0 ? 44 : 47, r2 = 51;
                return (
                  <line key={i}
                    x1={70 + Math.sin(a) * r1} y1={70 - Math.cos(a) * r1}
                    x2={70 + Math.sin(a) * r2} y2={70 - Math.cos(a) * r2}
                    className={i % 4 === 0 ? styles.tickForte : styles.tick} />
                );
              })}

              <g className={styles.ponteiro} style={{ transform: `rotate(${angulo}deg)` }}>
                <path d="M70 70 L70 26" className={styles.agulha} />
                <path d="M70 70 L70 79" className={styles.contrapeso} />
              </g>
              <circle cx="70" cy="70" r="6.5" className={styles.eixo} />
              <circle cx="70" cy="70" r="2.4" className={styles.eixoMiolo} />

              <text x="18" y="88" className={styles.gaugeLbl} textAnchor="start">caindo</text>
              <text x="122" y="88" className={styles.gaugeLbl} textAnchor="end">subindo</text>
            </svg>
          </div>

          <div className={styles.gaugeRodape}>
            <div className={`${styles.gaugeVal} ${tendencia.subindo ? styles.up : styles.down}`}>
              {tendencia.subindo ? <TrendingUp size={15} /> : <TrendingDown size={15} />}
              {tendencia.subindo ? "+" : "−"}{Math.abs(tendencia.delta)}
              <i>pts</i>
            </div>
            <span className={styles.gaugeTag}>
              {acimaTurma >= 0 ? `${acimaTurma} acima da turma` : `${Math.abs(acimaTurma)} abaixo da turma`}
            </span>
          </div>
          <p className={styles.cursoHint}>variação nas últimas semanas</p>
        </section>
      </div>

      {/* ── Alerta ── */}
      <div className={`${styles.alerta} ${alerta.tom === "bom" ? styles.alertaBom : alerta.tom === "ok" ? styles.alertaOk : styles.alertaWarn}`}>
        <span className={styles.alertaIco}><AlertaIcon size={18} /></span>
        <div className={styles.alertaCorpo}>
          <div className={styles.alertaTopo}>
            <strong className={styles.alertaTitulo}>{alerta.titulo}</strong>
            <div className={styles.marcas}>
              {marcas.map(m => (
                <span key={m.k} className={styles.marca2}>
                  <b>{m.v}</b> {m.k}
                </span>
              ))}
            </div>
          </div>
          <p className={styles.alertaTexto}>{alerta.dica}</p>
        </div>
      </div>

      {/* ── Evolução no semestre + projeção ── */}
      <section className={styles.card}>
        <div className={styles.cardHead}>
          <h2 className={styles.cardTitle}><LineChart size={15} /> Evolução no semestre e projeção</h2>
          <div className={styles.legendaLin}>
            <span><i className={styles.dotAluno} /> Você</span>
            <span><i className={styles.dotProj} /> Projeção sua</span>
            <span><i className={styles.dotTurma} /> Média da turma</span>
            <span><i className={styles.dotProjTurma} /> Projeção da turma</span>
          </div>
        </div>

        <div className={styles.chartWrap}>
          <svg viewBox={`0 0 ${W} ${H}`} className={styles.chart}
            onMouseLeave={() => setPonto(null)}>
            <defs>
              {/* cada linha tem o seu degradê descendo até a base, na própria cor */}
              <linearGradient id="fillAluno" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="rgba(59,142,245,.34)" />
                <stop offset=".85" stopColor="rgba(59,142,245,.02)" />
                <stop offset="1" stopColor="rgba(59,142,245,0)" />
              </linearGradient>
              <linearGradient id="fillProj" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="rgba(34,211,238,.3)" />
                <stop offset=".85" stopColor="rgba(34,211,238,.02)" />
                <stop offset="1" stopColor="rgba(34,211,238,0)" />
              </linearGradient>
              <linearGradient id="fillTurma" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="rgba(148,163,184,.2)" />
                <stop offset=".85" stopColor="rgba(148,163,184,.02)" />
                <stop offset="1" stopColor="rgba(148,163,184,0)" />
              </linearGradient>
              <linearGradient id="fillProjTurma" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="rgba(167,139,250,.24)" />
                <stop offset=".85" stopColor="rgba(167,139,250,.02)" />
                <stop offset="1" stopColor="rgba(167,139,250,0)" />
              </linearGradient>
            </defs>

            {[60, 70, 80, 90, 100].map(v => (
              <g key={v}>
                <line x1={ML} y1={py(v)} x2={W - MR} y2={py(v)} className={styles.grid} />
                <text x={ML - 8} y={py(v) + 3.5} className={styles.eixo} textAnchor="end">{v}</text>
              </g>
            ))}

            {/* áreas: turma, você e projeção — cada uma descendo até a base, e a
                da projeção emendando na sua, sem corte no meio do gráfico */}
            <path fill="url(#fillTurma)" d={area(TURMA.map((v, i) => [px(i), py(v)]), H - MB)} />
            <path fill="url(#fillProjTurma)" d={area(
              [[px(iUlt), py(TURMA[iUlt])], ...PROJECAO_TURMA.map((v, i): [number, number] => [px(iUlt + 1 + i), py(v)])],
              H - MB)} />
            <path fill="url(#fillProj)" d={area(
              [[px(iUlt), py(ALUNO[iUlt])], ...PROJECAO.map((v, i): [number, number] => [px(iUlt + 1 + i), py(v)])],
              H - MB)} />
            <path fill="url(#fillAluno)" d={area(ALUNO.map((v, i) => [px(i), py(v)]), H - MB)} />
            {/* fronteira entre o que já aconteceu e o que é projeção */}
            <line x1={px(iUlt)} y1={MT - 4} x2={px(iUlt)} y2={H - MB} className={styles.corte} />
            <text x={px(iUlt) + 5} y={MT + 4} className={styles.corteLbl}>projeção →</text>

            <path className={styles.lineTurma} d={suave(TURMA.map((v, i) => [px(i), py(v)]))} />
            <path className={styles.lineProjTurma} d={suave(
              [[px(iUlt), py(TURMA[iUlt])], ...PROJECAO_TURMA.map((v, i): [number, number] => [px(iUlt + 1 + i), py(v)])])} />
            {PROJECAO_TURMA.map((v, i) => (
              <circle key={`pt${i}`} cx={px(iUlt + 1 + i)} cy={py(v)} r="3" className={styles.ptProjTurma} />
            ))}
            <path className={styles.lineAluno} d={suave(ALUNO.map((v, i) => [px(i), py(v)]))} />
            <path className={styles.lineProj} d={suave(
              [[px(iUlt), py(ALUNO[iUlt])], ...PROJECAO.map((v, i): [number, number] => [px(iUlt + 1 + i), py(v)])])} />

            {serie.map((v, i) => (
              <circle key={i} cx={px(i)} cy={py(v)} r={i > iUlt ? 4.2 : 3.6}
                className={i > iUlt ? styles.ptProj : styles.ptAluno} />
            ))}
            {ponto != null && <line x1={px(ponto)} y1={MT} x2={px(ponto)} y2={H - MB} className={styles.cursorLinha} />}

            {/* faixas invisíveis de captura para o tooltip */}
            {serie.map((_, i) => (
              <rect key={i} x={px(i) - (W - ML - MR) / (serie.length - 1) / 2} y={0}
                width={(W - ML - MR) / (serie.length - 1)} height={H}
                fill="transparent" onMouseEnter={() => setPonto(i)} />
            ))}

            {rotulos.map((m, i) => (
              <text key={m} x={px(i)} y={H - 10} textAnchor="middle"
                className={i > iUlt ? styles.eixoProj : styles.eixo}>{m}</text>
            ))}
          </svg>

          {ponto != null && (
            <div className={styles.tip} style={{ left: `${(px(ponto) / W) * 100}%` }}>
              <div className={styles.tipTitulo}>{rotulos[ponto]}{ponto > iUlt ? " · projetado" : ""}</div>
              <div className={styles.tipLinha}>
                <i className={styles.dotAluno} /> Você
                <b>{serie[ponto]}</b><em>{CONCEITO_DE(serie[ponto])}</em>
              </div>
              <div className={styles.tipLinha}>
                <i className={ponto > iUlt ? styles.dotProjTurma : styles.dotTurma} /> Turma{ponto > iUlt ? " (proj.)" : ""}
                <b>{ponto <= iUlt ? TURMA[ponto] : PROJECAO_TURMA[ponto - iUlt - 1]}</b>
                <em>{CONCEITO_DE(ponto <= iUlt ? TURMA[ponto] : PROJECAO_TURMA[ponto - iUlt - 1])}</em>
              </div>
              {ponto > iUlt && <div className={styles.tipNota}>projeção com margem de ± {INCERTEZA} pts</div>}
            </div>
          )}
        </div>

        <p className={styles.chartNota}>
          Projeção para o fim do semestre: <strong>{projFinal}</strong> — conceito médio{" "}
          <strong>{CONCEITO_DE(projFinal)}</strong>, mantido o ritmo atual.
        </p>
      </section>

      {/* ── Comparação com turmas (barras + linha) ── */}
      <div className={styles.grid2}>
        <section className={styles.card}>
          <div className={styles.cardHead}>
            <h2 className={styles.cardTitle}><Users size={15} /> Comparação com turmas anteriores</h2>
          </div>
          <div className={styles.comboWrap} onMouseLeave={() => setBarra(null)}>
            <svg viewBox="0 0 340 190" className={styles.combo}>
              {/* as turmas anteriores são referência: ficam neutras. Só a sua
                  barra recebe o acento — é ela que se quer ler primeiro. */}
              <defs>
                <linearGradient id="gbEu" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="var(--primary)" />
                  <stop offset="1" stopColor="#1f6fe0" />
                </linearGradient>
              </defs>
              {[60, 70, 80, 90].map(v => {
                const y = 160 - ((v - 55) / 40) * 130;
                return <line key={v} x1="26" y1={y} x2="330" y2={y} className={styles.grid} />;
              })}
              {TURMAS_ANT.map((t, i) => {
                const x = 44 + i * 76, y = 160 - ((t.indice - 55) / 40) * 130;
                return (
                  <g key={t.turma} onMouseEnter={() => setBarra(i)} className={styles.barGrupo}>
                    <rect x={x - 24} y={y} width="48" height={160 - y} rx="7"
                      fill={t.eu ? "url(#gbEu)" : "var(--surface-3)"}
                      className={`${styles.barra} ${barra === i ? styles.barraOn : ""}`} />
                    <text x={x} y={y - 8} textAnchor="middle" className={styles.barNum}>{t.indice}</text>
                    <text x={x} y="177" textAnchor="middle"
                      className={i === TURMAS_ANT.length - 1 ? styles.barLblEu : styles.barLbl}>
                      {i === TURMAS_ANT.length - 1 ? `Você · ${t.turma}` : t.turma}
                    </text>
                    <rect x={x - 38} y="0" width="76" height="190" fill="transparent" />
                  </g>
                );
              })}
              <path className={styles.comboLinha}
                d={suave(TURMAS_ANT.map((t, i): [number, number] => [44 + i * 76, 160 - ((t.indice - 55) / 40) * 130]))} />
              {TURMAS_ANT.map((t, i) => (
                <circle key={t.turma} cx={44 + i * 76} cy={160 - ((t.indice - 55) / 40) * 130} r="4" className={styles.comboPt} />
              ))}
            </svg>
            {barra != null && (
              <div className={styles.tipBar} style={{ left: `${((44 + barra * 76) / 340) * 100}%` }}>
                <div className={styles.tipTitulo}>{TURMAS_ANT[barra].turma}</div>
                <div className={styles.tipLinha}>
                  índice <b>{TURMAS_ANT[barra].indice}</b><em>{CONCEITO_DE(TURMAS_ANT[barra].indice)}</em>
                </div>
                <div className={styles.tipNota}>
                  {barra === TURMAS_ANT.length - 1
                    ? "sua turma"
                    : `${TURMAS_ANT[TURMAS_ANT.length - 1].indice - TURMAS_ANT[barra].indice > 0 ? "+" : ""}${TURMAS_ANT[TURMAS_ANT.length - 1].indice - TURMAS_ANT[barra].indice} pts vs. sua turma`}
                </div>
              </div>
            )}
          </div>
          <p className={styles.chartNota}>Índice médio de conceitos por turma no mesmo ponto do curso.</p>
        </section>

        {/* Presenças */}
        <section className={styles.card}>
          <div className={styles.cardHead}>
            <h2 className={styles.cardTitle}><CalendarCheck size={15} /> Presenças por disciplina</h2>
          </div>
          <ul className={styles.presencas}>
            {PRESENCAS.map(p => {
              const baixa = p.pct < 85;
              return (
                <li key={p.disc} className={styles.presItem} title={`${p.pct}% de presença · mínimo 75%`}>
                  <span className={styles.presDisc}>{p.disc}</span>
                  <div className={styles.presTrilho}>
                    <span className={`${styles.presBarra} ${baixa ? styles.presBaixa : ""}`} style={{ width: `${p.pct}%` }} />
                  </div>
                  <span className={`${styles.presPct} ${baixa ? styles.presPctBaixa : ""}`}>{p.pct}%</span>
                </li>
              );
            })}
          </ul>
          <p className={styles.presNota}>Frequência mínima para aprovação: <strong>75%</strong>.</p>
        </section>
      </div>

      {/* ── Horas obrigatórias restantes ── */}
      <section className={styles.card}>
        <div className={styles.cardHead}>
          <h2 className={styles.cardTitle}><Clock size={15} /> Horas obrigatórias restantes</h2>
          <span className={styles.cardHint}>
            faltam {HORAS.reduce((s, h) => s + Math.max(0, h.total - h.feitas), 0)}h no total
          </span>
        </div>
        <div className={styles.horas}>
          {HORAS.map(h => {
            const rest = Math.max(0, h.total - h.feitas);
            const pct = Math.round((h.feitas / h.total) * 100);
            const HIco = h.icon;
            return (
              <div key={h.label} className={styles.horaItem} title={`${h.feitas}h de ${h.total}h concluídas`}>
                <div className={styles.horaTop}>
                  <span className={styles.horaLabel}><HIco size={13} style={{ color: h.cor }} /> {h.label}</span>
                  <span className={styles.horaRest}><strong>{rest}h</strong> restantes</span>
                </div>
                <div className={styles.horaTrilho}>
                  <span className={styles.horaBarra} style={{
                    width: `${pct}%`,
                    background: `linear-gradient(90deg, ${h.cor}, ${h.cor}cc)`,
                    boxShadow: `0 0 8px ${h.cor}66`,
                  }} />
                </div>
                <div className={styles.horaHint}>{h.feitas}h de {h.total}h ({pct}%)</div>
              </div>
            );
          })}
        </div>
      </section>

      <p className={styles.rodape}>
        <Target size={12} /> O índice (0–100) é um indicador da plataforma calculado a partir dos conceitos —
        DML 100 · DL 80 · D 60 · ND 0. A avaliação oficial é sempre o conceito, nunca o índice.
      </p>
    </div>
  );
}
