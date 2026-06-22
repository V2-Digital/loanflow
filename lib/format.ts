import { STAGE_LABEL, type DocStatus, type Stage, type TaskStatus } from "./types";

export function money(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents);
}

export function date(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function dateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function stageLabel(s: Stage): string {
  return STAGE_LABEL[s];
}

export const docStatusChip: Record<DocStatus, string> = {
  requested: "bg-amber-100 text-amber-800",
  uploaded: "bg-blue-100 text-blue-800",
  approved: "bg-emerald-100 text-emerald-800",
  rejected: "bg-rose-100 text-rose-800",
};

export const taskStatusChip: Record<TaskStatus, string> = {
  todo: "bg-slate-100 text-slate-700",
  in_progress: "bg-blue-100 text-blue-800",
  done: "bg-emerald-100 text-emerald-800",
};

export const taskStatusLabel: Record<TaskStatus, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  done: "Done",
};

export function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
