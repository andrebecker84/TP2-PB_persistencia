"use client";

import { createContext, useContext } from "react";
import { useRouter } from "next/navigation";
import { Usuario } from "@/types";

const CurrentUserContext = createContext<Usuario | null>(null);

export function CurrentUserProvider({ user, children }: { user: Usuario; children: React.ReactNode }) {
  return <CurrentUserContext.Provider value={user}>{children}</CurrentUserContext.Provider>;
}

/**
 * Usuário logado, fornecido pelo layout do hub — que só renderiza as páginas
 * depois de resolvê-lo do localStorage, então aqui ele nunca é nulo.
 */
export function useUsuarioLogado(): Usuario {
  const user = useContext(CurrentUserContext);
  if (!user) throw new Error("useUsuarioLogado usado fora do CurrentUserProvider");
  return user;
}

export function signOut(router: ReturnType<typeof useRouter>) {
  localStorage.removeItem("infnet_user");
  router.push("/login");
}
