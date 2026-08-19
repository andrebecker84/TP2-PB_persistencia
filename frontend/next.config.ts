import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  output: "standalone",

  // fixa a raiz do workspace no diretório do front-end: sem isto o Turbopack
  // infere C:\Users\becke (por um package-lock.json perdido lá) e chega a
  // resolver o mesmo módulo por dois caminhos via OneDrive.
  turbopack: {
    root: path.resolve(__dirname),
  },
  devIndicators: {
    position: "top-right",
  },
  // Proxy opcional: /api/* → back-end. O cliente hoje chama a API por URL
  // absoluta (NEXT_PUBLIC_API_URL), então isto só entra em ação se alguém usar
  // caminho relativo. Usa variável própria (API_PROXY_TARGET) e NÃO a
  // NEXT_PUBLIC_API_URL: esta já termina em /api/v1 e duplicaria o prefixo
  // (/api/v1/v1/...); além disso, o rewrite roda no SERVIDOR — num contêiner,
  // "localhost" seria o próprio front-end, não o back-end.
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.API_PROXY_TARGET || "http://localhost:18080"}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
