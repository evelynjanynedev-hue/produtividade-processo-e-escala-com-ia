import clsx from "clsx";

export { clsx as cn };

export type Tone = "gold" | "blue" | "green" | "red" | "ink";

export const TONES: Record<Tone, { text: string; bg: string; border: string; dot: string }> = {
  gold: { text: "text-[#7A5A12]", bg: "bg-[#F7E8C3]", border: "border-[#E8CF95]", dot: "bg-gold" },
  blue: { text: "text-[#24506A]", bg: "bg-[#E3EDF3]", border: "border-[#B9D2E0]", dot: "bg-blue" },
  green: { text: "text-[#3B6544]", bg: "bg-[#E4EEE5]", border: "border-[#BFD5C2]", dot: "bg-green" },
  red: { text: "text-[#8F3A22]", bg: "bg-[#F7E2DA]", border: "border-[#E6BCAE]", dot: "bg-red" },
  ink: { text: "text-ink", bg: "bg-ink/5", border: "border-ink/15", dot: "bg-ink" },
};

export function formatDate(date: Date | string | null | undefined) {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(d);
}

export function formatDateLong(date: Date | string | null | undefined) {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long", year: "numeric" }).format(d);
}

export function relativeDays(date: Date | string | null | undefined) {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = Math.round((d.getTime() - Date.now()) / 86_400_000);
  if (diff === 0) return "hoje";
  if (diff === 1) return "amanhã";
  if (diff === -1) return "ontem";
  if (diff < 0) return `há ${Math.abs(diff)} dias`;
  return `em ${diff} dias`;
}

export function pct(part: number, total: number) {
  if (!total) return 0;
  return Math.min(100, Math.round((part / total) * 100));
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("");
}
