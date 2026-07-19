"use client";

import { useState, useEffect } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import Toaster from "@/components/ui/Toaster";
import { Usuario } from "@/types";
import styles from "./AppLayout.module.css";

interface Props {
  currentUser: Usuario;
  children: React.ReactNode;
}

export default function AppLayout({ currentUser, children }: Props) {
  // Expandida por padrão: a navegação principal agora vive só na sidebar
  const [sidebarExpanded, setSidebarExpanded] = useState(true);

  // Recolhe automaticamente em telas estreitas; volta a expandir quando há espaço.
  // Entre uma quebra e outra o usuário ainda pode alternar manualmente no hambúrguer.
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1280px)");
    const apply = () => setSidebarExpanded(!mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  return (
    <div
      className={styles.app}
      style={{
        '--sidebar-w': sidebarExpanded ? 'var(--sidebar-full)' : 'var(--sidebar-mini)',
      } as React.CSSProperties}
    >
      <Header currentUser={currentUser} />
      <Sidebar
        expanded={sidebarExpanded}
        currentUser={currentUser}
        onToggleSidebar={() => setSidebarExpanded(v => !v)}
      />
      <div className={styles.content}>{children}</div>
      <Toaster />
    </div>
  );
}
