import { Usuario } from "@/types";
import { ok } from "./api";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:18080/api/v1";

export const usuarioService = {
  listarTodos: (): Promise<Usuario[]> =>
    fetch(`${BASE}/usuarios`).then(r => ok<Usuario[]>(r)),

  buscarPorId: (id: number): Promise<Usuario> =>
    fetch(`${BASE}/usuarios/${id}`).then(r => ok<Usuario>(r)),
};
