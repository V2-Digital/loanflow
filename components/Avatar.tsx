import { initials } from "@/lib/format";

const COLORS = [
  "bg-rose-500",
  "bg-amber-500",
  "bg-emerald-500",
  "bg-brand-600",
  "bg-violet-500",
  "bg-cyan-600",
];

export function Avatar({ name, id, size = 8 }: { name: string; id: number; size?: number }) {
  const color = COLORS[id % COLORS.length];
  const dim = `${size * 0.25}rem`;
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white ${color}`}
      style={{ width: dim, height: dim }}
      title={name}
    >
      {initials(name)}
    </span>
  );
}
