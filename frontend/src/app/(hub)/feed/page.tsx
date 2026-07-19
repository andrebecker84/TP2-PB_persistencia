"use client";

import { Suspense, useState, useEffect, useCallback, SetStateAction } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Inbox, X, Send, TriangleAlert, RotateCw } from "lucide-react";
import { Post, PostRequest } from "@/types";
import { postService } from "@/services/postService";
import { nomeCurto } from "@/utils/format";
import { useUsuarioLogado } from "@/hooks/useCurrentUser";
import LeftPanel from "@/components/layout/LeftPanel";
import RightPanel from "@/components/layout/RightPanel";
import PostCard from "@/components/feed/PostCard";
import PostForm from "@/components/feed/PostForm";
import PostTimeline from "@/components/feed/PostTimeline";
import SaudacaoBanner from "@/components/feed/SaudacaoBanner";
import styles from "./page.module.css";

// Cache de módulo: ao voltar para o feed, a lista da última visita aparece na
// hora — sem skeleton — enquanto uma busca silenciosa a atualiza por trás.
let cachePosts: Post[] | null = null;

function FeedContent() {
  const router = useRouter();
  const currentUser = useUsuarioLogado();
  const [query, setQuery] = useState("");
  const [posts, setPostsState] = useState<Post[]>(cachePosts ?? []);
  const [loading, setLoading] = useState(cachePosts === null);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [flyer, setFlyer] = useState<{ x: number; y: number } | null>(null);

  // ao clicar em publicar: o aviãozinho decola (cresce e some no topo com rastro)
  // e então o editor se expande
  const abrirEditor = (e: React.MouseEvent<HTMLDivElement>) => {
    if (launching) return;
    const plane = e.currentTarget.querySelector("[data-plane]");
    const r = plane?.getBoundingClientRect();
    if (r) setFlyer({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
    setLaunching(true);
    setTimeout(() => { setEditingPost(null); setShowForm(true); setLaunching(false); setFlyer(null); }, 620);
  };

  const setPosts = useCallback((updater: SetStateAction<Post[]>) => {
    setPostsState(prev => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      cachePosts = next;
      return next;
    });
  }, []);

  useEffect(() => {
    // lê query da URL no mount (deep link)
    const params = new URLSearchParams(window.location.search);
    setQuery(params.get("q")?.toLowerCase().trim() ?? "");
    // escuta evento de busca do Header
    const handler = (e: Event) => setQuery((e as CustomEvent<{query:string}>).detail.query.toLowerCase().trim());
    window.addEventListener("infnet:search", handler);
    return () => window.removeEventListener("infnet:search", handler);
  }, []);

  const buscarPosts = useCallback(async (silencioso = false) => {
    try {
      if (!silencioso) { setLoading(true); setError(null); }
      setPosts(await postService.listarTodos());
      setError(null);
    } catch {
      // na atualização silenciosa a lista em cache continua válida na tela
      if (!silencioso) setError("Não foi possível carregar o feed. Verifique se o back-end está rodando.");
    } finally { setLoading(false); }
  }, [setPosts]);

  useEffect(() => { buscarPosts(cachePosts !== null); }, [buscarPosts]);

  const handleSalvar = async (dados: PostRequest) => {
    setEnviando(true);
    try {
      if (editingPost) {
        const atualizado = await postService.atualizar(editingPost.id, dados);
        setPosts(prev => prev.map(p => p.id === editingPost.id ? atualizado : p));
      } else {
        await postService.criar(dados);
        buscarPosts(true);
      }
      setShowForm(false); setEditingPost(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao salvar publicação");
    } finally { setEnviando(false); }
  };

  const handleDeletar = async (id: number) => {
    if (!confirm("Deseja remover esta publicação?")) return;
    try {
      await postService.deletar(id);
      setPosts(prev => prev.filter(p => p.id !== id));
    } catch (err) { alert(err instanceof Error ? err.message : "Erro ao remover"); }
  };

  const filteredPosts = query
    ? posts.filter(p =>
        p.conteudo.toLowerCase().includes(query) ||
        (p.titulo?.toLowerCase().includes(query) ?? false) ||
        p.autorNome.toLowerCase().includes(query)
      )
    : posts;

  return (
    <div className={styles.body}>

      <LeftPanel />

      {!loading && filteredPosts.length > 0 && <PostTimeline posts={filteredPosts} />}

      <main className={styles.feed}>
        {!showForm ? (
          <div
            className={`${styles.composeBox} ${launching ? styles.launching : ""}`}
            onClick={abrirEditor}
          >
            <span className={styles.composeBadge}>{nomeCurto(currentUser.nome, currentUser.papel)}</span>
            <div className={styles.composePlaceholder}>
              Compartilhe uma ideia com a comunidade...
            </div>
            <button className={styles.btnPublicar} title="Publicar" aria-label="Publicar" data-plane>
              <Send size={16} />
            </button>
          </div>
        ) : (
          <PostForm
            currentUser={currentUser}
            postParaEditar={editingPost}
            enviando={enviando}
            onPostar={handleSalvar}
            onCancelar={() => { setShowForm(false); setEditingPost(null); }}
          />
        )}

        {!query && <SaudacaoBanner nome={currentUser.nome} />}

        {error && (
          <div className={styles.error}>
            <span className={styles.errorIco}><TriangleAlert size={16} /></span>
            <span className={styles.errorMsg}>{error}</span>
            <button onClick={() => buscarPosts()}><RotateCw size={13} /> Tentar novamente</button>
          </div>
        )}

        {query && (
          <div className={styles.searchBanner}>
            <span>Resultados para <strong>"{query}"</strong> — {filteredPosts.length} encontrado{filteredPosts.length !== 1 ? "s" : ""}</span>
            <button className={styles.clearSearch} onClick={() => { setQuery(""); router.push("/feed"); }}><X size={13} /> Limpar</button>
          </div>
        )}

        {loading ? (
          <div className={styles.skeletons}>
            {[...Array(3)].map((_, i) => <div key={i} className={styles.skeleton} />)}
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className={styles.empty}>
            <Inbox size={48} className={styles.emptyIcon} />
            <p>{query ? `Nenhum resultado para "${query}".` : "Nenhuma publicação ainda. Seja o primeiro!"}</p>
          </div>
        ) : (
          filteredPosts.map(post => (
            <div key={post.id} id={`post-${post.id}`} style={{ scrollMarginTop: "calc(var(--header-h) + 1rem)" }}>
              <PostCard
                post={post}
                currentUser={currentUser}
                onEditar={() => { setEditingPost(post); setShowForm(true); }}
                onDeletar={() => handleDeletar(post.id)}
                onPostUpdated={updated => setPosts(prev => prev.map(p => p.id === updated.id ? updated : p))}
              />
            </div>
          ))
        )}
      </main>

      <RightPanel />

      {flyer && createPortal(
        <div className={styles.flyer} style={{ left: flyer.x, top: flyer.y }} aria-hidden>
          <Send size={18} className={styles.flyerPlane} />
        </div>,
        document.body
      )}
    </div>
  );
}

export default function FeedPage() {
  return (
    <Suspense>
      <FeedContent />
    </Suspense>
  );
}
