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
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:18080/api"}/:path*`,
      },
    ];
  },
};

export default nextConfig;
