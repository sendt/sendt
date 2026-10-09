export type SpeedMode = "yavas" | "normal" | "hizli" | "auto";
export type GameId = "pinball" | "rush" | "falling" | "match" | "pairs";

export const SPEEDS: Record<SpeedMode, { label: string; color: string }> = {
  yavas:  { label: "Yavaş",    color: "#22c55e" },
  normal: { label: "Normal",   color: "#6366f1" },
  hizli:  { label: "Hızlı",    color: "#f59e0b" },
  auto:   { label: "Otomatik", color: "#8b5cf6" },
};

export const GAMES_META: { id: GameId; title: string; icon: string; desc: string }[] = [
  { id: "pinball",  title: "Kelime Pinball",  icon: "🎯", desc: "Yeni kelimeleri öğren" },
  { id: "rush",     title: "Kelime Arabası",  icon: "🚗", desc: "Düşen kelimeleri yakala" },
  { id: "falling",  title: "Düşen Kelimeler", icon: "🌧️", desc: "Doğru seçeneği seç" },
  { id: "match",    title: "Eşleştir",        icon: "🔗", desc: "Çiftleri eşleştir" },
  { id: "pairs",    title: "Çiftler",         icon: "🃏", desc: "Hafıza kartı" },
];

export const TOTAL_DAYS = 60;

// TODO: Geri bildirim e-posta adresini kendi adresinle değiştir.
export const FEEDBACK_EMAIL = "geribildirim@example.com";

export const COLORS = {
  bg: "#0f172a",
  card: "#1e293b",
  cardBorder: "#334155",
  text: "#f1f5f9",
  textDim: "#94a3b8",
  indigo: "#6366f1",
  indigoDark: "#4f46e5",
  green: "#22c55e",
  red: "#ef4444",
  amber: "#f59e0b",
};

/**
 * Hız çarpanı. "auto" modda oyuncu doğru bildikçe hızlanır, yanlışta yavaşlar.
 * Oyunlar bunu temel hız/süre ile çarpar (süre için bölünür).
 */
const BASE_FACTOR: Record<Exclude<SpeedMode, "auto">, number> = {
  yavas: 0.7,
  normal: 1,
  hizli: 1.4,
};

export function nextSpeedFactor(mode: SpeedMode, current: number, ok: boolean): number {
  if (mode !== "auto") return BASE_FACTOR[mode];
  const next = ok ? current + 0.08 : current - 0.15;
  return Math.max(0.7, Math.min(1.7, next));
}

export function initialSpeedFactor(mode: SpeedMode): number {
  return mode === "auto" ? 1 : BASE_FACTOR[mode];
}
