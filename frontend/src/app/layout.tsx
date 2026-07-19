import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

// next/font baixa e serve as fontes pelo próprio Next (self-hosted):
// sem requisição ao Google em runtime e sem flash de fonte trocada.
const inter = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });

export const metadata: Metadata = {
  title: "Infnet Hub",
  description: "A plataforma dos estudantes Infnet",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html:
          `(function(){const t=localStorage.getItem('infnet-theme');if(t)document.documentElement.setAttribute('data-theme',t);})()`
        }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
