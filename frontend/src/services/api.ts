export async function ok<T>(r: Response): Promise<T> {
  if (!r.ok) throw new Error((await r.json().catch(() => ({}))).message || r.statusText);
  if (r.status === 204) return undefined as T;
  return r.json();
}

/**
 * Id do usuário logado, guardado no login.
 *
 * Devolve null durante a renderização no servidor, onde localStorage não existe.
 */
function usuarioAtualId(): number | null {
  if (typeof window === "undefined") return null;
  try {
    const armazenado = window.localStorage.getItem("infnet_user");
    return armazenado ? (JSON.parse(armazenado).id ?? null) : null;
  } catch {
    return null;
  }
}

/**
 * Cabeçalhos das operações de escrita.
 *
 * O `X-Usuario-Id` é o que identifica o autor da mudança para a trilha de
 * auditoria: o back-end resolve o nome e o e-mail e grava na revisão do Envers.
 * Sem ele a alteração é registrada como "anonimo" — o histórico continua
 * existindo, mas deixa de responder quem fez.
 *
 * É função, e não constante, porque o usuário logado muda em tempo de execução;
 * ler o localStorage no carregamento do módulo fixaria o valor de uma vez.
 */
export function headersEscrita(incluirJson = true): HeadersInit {
  const headers: Record<string, string> = {};
  if (incluirJson) headers["Content-Type"] = "application/json";

  const id = usuarioAtualId();
  if (id !== null) headers["X-Usuario-Id"] = String(id);

  return headers;
}
