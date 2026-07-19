"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import { CurrentUserProvider } from "@/hooks/useCurrentUser";
import { Usuario } from "@/types";

/**
 * Layout persistente das páginas autenticadas.
 *
 * Header, Sidebar e painéis são montados uma única vez e sobrevivem à
 * navegação feed ↔ vagas — a troca de rota substitui apenas o conteúdo
 * central, em vez de remontar (e re-buscar) a interface inteira.
 */
export default function HubLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<Usuario | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("infnet_user");
    if (!stored) { router.replace("/login"); return; }
    setUser(JSON.parse(stored));
    // Deixa os bundles das duas rotas prontos antes do primeiro clique.
    router.prefetch("/feed");
    router.prefetch("/vagas");
  }, [router]);

  if (!user) return null;

  return (
    <CurrentUserProvider user={user}>
      <AppLayout currentUser={user}>{children}</AppLayout>
    </CurrentUserProvider>
  );
}
