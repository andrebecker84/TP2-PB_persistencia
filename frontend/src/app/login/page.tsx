"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, TriangleAlert, Check, LoaderCircle } from "lucide-react";
import { usuarioService } from "@/services/usuarioService";
import HexLogo from "@/components/ui/HexLogo";
import { Usuario } from "@/types";
import { initials } from "@/utils/format";
import styles from "./page.module.css";

const CORES = ["#3b82f6", "#7c3aed", "#e63946", "#2a9d8f", "#f59e0b"];

export default function LoginPage() {
  const router = useRouter();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [entrando, setEntrando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // origem da abertura circular: o centro do botão que foi acionado
  const [veu, setVeu] = useState<{ x: number; y: number } | null>(null);
  // sombreado das bordas da lista, conforme o que ainda há para rolar
  const [borda, setBorda] = useState<"none" | "baixo" | "ambos" | "cima">("none");

  const listaRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    router.prefetch("/feed");
    usuarioService.listarTodos()
      .then(setUsuarios)
      .catch(() => setError("Não foi possível conectar ao servidor. Verifique se o back-end está rodando."))
      .finally(() => setLoading(false));
  }, [router]);

  /* a lista só ganha esmaecimento no lado em que ainda há conteúdo escondido —
     sem isso a última linha fica cortada no meio, como se estivesse quebrada */
  const medirBorda = useCallback(() => {
    const el = listaRef.current;
    if (!el) return;
    const sobra = el.scrollHeight - el.clientHeight;
    if (sobra <= 1) return setBorda("none");
    const noTopo = el.scrollTop <= 1;
    const naBase = el.scrollTop >= sobra - 1;
    setBorda(noTopo ? "baixo" : naBase ? "cima" : "ambos");
  }, []);

  useEffect(() => { medirBorda(); }, [usuarios, medirBorda]);

  const entrar = useCallback(() => {
    const user = usuarios.find(u => u.id === selected);
    if (!user || entrando) return;
    setEntrando(true);
    localStorage.setItem("infnet_user", JSON.stringify(user));
    // abertura circular a partir do botão: o hub "nasce" de onde você clicou
    const r = btnRef.current?.getBoundingClientRect();
    setVeu(r
      ? { x: r.left + r.width / 2, y: r.top + r.height / 2 }
      : { x: window.innerWidth / 2, y: window.innerHeight / 2 });
    setTimeout(() => router.push("/feed"), 430);
  }, [usuarios, selected, entrando, router]);

  /* teclado: setas percorrem os perfis, Enter entra */
  const navegar = (e: React.KeyboardEvent) => {
    if (!usuarios.length) return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const i = usuarios.findIndex(u => u.id === selected);
      const prox = e.key === "ArrowDown"
        ? (i + 1) % usuarios.length
        : (i <= 0 ? usuarios.length - 1 : i - 1);
      setSelected(usuarios[prox].id);
      listaRef.current?.children[prox]?.scrollIntoView({ block: "nearest" });
    }
    if (e.key === "Enter" && selected != null) { e.preventDefault(); entrar(); }
  };

  return (
    <div className={styles.page}>
      <div className={styles.luz} aria-hidden />

      <main className={`${styles.coluna} ${entrando ? styles.recuando : ""}`}>
        <div className={styles.marca}>
          <HexLogo size={38} id="hexGradLogin" />
          <span className={styles.marcaTxt}>Infnet<b>Hub</b></span>
        </div>

        <section className={styles.card}>
          <header className={styles.cabecalho}>
            <h1 className={styles.titulo}>Entrar</h1>
            <p className={styles.sub}>Escolha seu perfil para continuar.</p>
          </header>

          {error && (
            <div className={styles.erro} role="alert">
              <TriangleAlert size={18} className={styles.erroIco} />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className={styles.lista}>
              {[...Array(4)].map((_, i) => <div key={i} className={styles.skeleton} />)}
            </div>
          ) : (
            <div
              ref={listaRef}
              className={styles.lista}
              data-borda={borda}
              onScroll={medirBorda}
              onKeyDown={navegar}
              role="radiogroup"
              aria-label="Perfis disponíveis"
            >
              {usuarios.map(u => {
                const ativo = selected === u.id;
                return (
                  <button
                    key={u.id}
                    role="radio"
                    aria-checked={ativo}
                    tabIndex={ativo || (selected == null && u.id === usuarios[0].id) ? 0 : -1}
                    className={`${styles.perfil} ${ativo ? styles.perfilOn : ""}`}
                    onClick={() => setSelected(u.id)}
                    onDoubleClick={entrar}
                  >
                    <span className={styles.avatar} style={{ background: CORES[u.id % CORES.length] }}>
                      {initials(u.nome)}
                    </span>
                    <span className={styles.info}>
                      <span className={styles.nome}>{u.nome}</span>
                      <span className={styles.meta}>
                        {u.classe ? `${u.classe} · ` : ""}{u.escola ?? "Infnet"}
                      </span>
                    </span>
                    <span className={styles.marcador} aria-hidden>
                      {ativo && <Check size={12} strokeWidth={3.2} />}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          <button
            ref={btnRef}
            className={styles.btn}
            onClick={entrar}
            disabled={!selected || entrando}
          >
            {entrando
              ? <><LoaderCircle size={16} className={styles.girando} /> Entrando…</>
              : <>Continuar <ArrowRight size={16} className={styles.seta} /></>}
          </button>
        </section>

        <p className={styles.rodape}>Ambiente de demonstração acadêmica · Infnet</p>
      </main>

      {/* abertura circular que cobre a tela e entrega a vez para o hub */}
      {veu && (
        <div
          className={styles.veu}
          style={{ ["--vx" as string]: `${veu.x}px`, ["--vy" as string]: `${veu.y}px` }}
          aria-hidden
        />
      )}
    </div>
  );
}
