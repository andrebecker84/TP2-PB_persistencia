export function initials(nome: string): string {
  return nome.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase();
}

const TITULOS: Record<string, string> = {
  PROFESSOR: "Prof.", COORDENADOR: "Coord.", SECRETARIA: "Sec.",
};

/** Nome curto com título do papel: "Prof. Carlos", "Coord. Ana", ou só o primeiro nome. */
export function nomeCurto(nome: string, papel: string): string {
  const primeiro = nome.replace(/^Prof\.?\s+/i, "").split(" ")[0];
  const titulo = TITULOS[papel];
  return titulo ? `${titulo} ${primeiro}` : primeiro;
}

export function relativo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "agora";
  if (m < 60) return `${m}min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const day = Math.floor(h / 24);
  return day < 7 ? `${day}d` : new Date(iso).toLocaleDateString("pt-BR");
}

export const EMOJIS = [
  "😀","😂","🥹","😊","😎","🤔","🥳","😅","👍","👏",
  "🙌","🎉","🚀","💡","⚡","🔥","💪","✅","❤️","🙏",
  "👀","💯","🤝","📚","💻","🐛","✨","⭐","🎯","📌",
];
