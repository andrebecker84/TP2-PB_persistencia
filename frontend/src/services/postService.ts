import { Post, PostRequest, Comentario, CurtidaResponse } from "@/types";
import { ok, headersEscrita } from "./api";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:18080/api/v1";

export const postService = {
  listarTodos: (): Promise<Post[]> =>
    fetch(`${BASE}/posts`).then(r => ok<Post[]>(r)),

  criar: (data: PostRequest): Promise<Post> =>
    fetch(`${BASE}/posts`, { method: "POST", headers: headersEscrita(), body: JSON.stringify(data) })
      .then(r => ok<Post>(r)),

  atualizar: (id: number, data: PostRequest): Promise<Post> =>
    fetch(`${BASE}/posts/${id}`, { method: "PUT", headers: headersEscrita(), body: JSON.stringify(data) })
      .then(r => ok<Post>(r)),

  // Sem corpo, mas com o cabeçalho de autoria: a exclusão também gera revisão,
  // e é a que mais importa saber quem fez.
  deletar: (id: number): Promise<void> =>
    fetch(`${BASE}/posts/${id}`, { method: "DELETE", headers: headersEscrita(false) })
      .then(r => ok<void>(r)),

  toggleCurtir: (postId: number, usuarioId: number): Promise<CurtidaResponse> =>
    fetch(`${BASE}/posts/${postId}/curtidas?usuarioId=${usuarioId}`, {
      method: "POST", headers: headersEscrita(false),
    }).then(r => ok<CurtidaResponse>(r)),

  listarCurtidas: (postId: number): Promise<{ usuarioId: number; usuarioNome: string }[]> =>
    fetch(`${BASE}/posts/${postId}/curtidas`).then(r => ok(r)),

  listarComentarios: (postId: number): Promise<Comentario[]> =>
    fetch(`${BASE}/posts/${postId}/comentarios`).then(r => ok<Comentario[]>(r)),

  criarComentario: (postId: number, conteudo: string, autorId: number): Promise<Comentario> =>
    fetch(`${BASE}/posts/${postId}/comentarios`, {
      method: "POST", headers: headersEscrita(),
      body: JSON.stringify({ conteudo, autorId }),
    }).then(r => ok<Comentario>(r)),

  editarComentario: (postId: number, id: number, conteudo: string, autorId: number): Promise<Comentario> =>
    fetch(`${BASE}/posts/${postId}/comentarios/${id}`, {
      method: "PUT", headers: headersEscrita(),
      body: JSON.stringify({ conteudo, autorId }),
    }).then(r => ok<Comentario>(r)),

  deletarComentario: (postId: number, id: number): Promise<void> =>
    fetch(`${BASE}/posts/${postId}/comentarios/${id}`, {
      method: "DELETE", headers: headersEscrita(false),
    }).then(r => ok<void>(r)),
};
