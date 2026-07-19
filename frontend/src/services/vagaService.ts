import { Vaga, VagaRequest } from "@/types";
import { ok, headersEscrita } from "./api";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:18080/api/v1";

export const vagaService = {
  listarAtivas: (): Promise<Vaga[]> =>
    fetch(`${BASE}/vagas`).then(r => ok<Vaga[]>(r)),

  buscarPorId: (id: number): Promise<Vaga> =>
    fetch(`${BASE}/vagas/${id}`).then(r => ok<Vaga>(r)),

  criar: (data: VagaRequest): Promise<Vaga> =>
    fetch(`${BASE}/vagas`, { method: "POST", headers: headersEscrita(), body: JSON.stringify(data) })
      .then(r => ok<Vaga>(r)),

  atualizar: (id: number, data: VagaRequest): Promise<Vaga> =>
    fetch(`${BASE}/vagas/${id}`, { method: "PUT", headers: headersEscrita(), body: JSON.stringify(data) })
      .then(r => ok<Vaga>(r)),

  deletar: (id: number): Promise<void> =>
    fetch(`${BASE}/vagas/${id}`, { method: "DELETE", headers: headersEscrita(false) })
      .then(r => ok<void>(r)),
};
