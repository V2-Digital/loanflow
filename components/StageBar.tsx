import { STAGES, STAGE_LABEL, type Stage } from "@/lib/types";

// Compact horizontal pipeline indicator. `compact` hides labels for list rows.
export function StageBar({ stage, compact = false }: { stage: Stage; compact?: boolean }) {
  const current = STAGES.indexOf(stage);
  return (
    <div className={compact ? "flex items-center gap-1" : "flex flex-wrap items-center gap-1.5"}>
      {STAGES.map((s, i) => {
        const done = i < current;
        const active = i === current;
        const dot = done
          ? "bg-emerald-500"
          : active
            ? "bg-brand-600 ring-4 ring-brand-100"
            : "bg-slate-300";
        return (
          <div key={s} className="flex items-center gap-1.5">
            <span className={`h-2.5 w-2.5 rounded-full ${dot}`} />
            {!compact && (
              <span
                className={
                  active
                    ? "text-xs font-semibold text-brand-700"
                    : done
                      ? "text-xs text-emerald-700"
                      : "text-xs text-slate-400"
                }
              >
                {STAGE_LABEL[s]}
              </span>
            )}
            {i < STAGES.length - 1 && (
              <span className={`h-px w-4 ${done ? "bg-emerald-400" : "bg-slate-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function StageBadge({ stage }: { stage: Stage }) {
  const closed = stage === "closed";
  return (
    <span
      className={`chip ${closed ? "bg-slate-200 text-slate-700" : "bg-brand-50 text-brand-700"}`}
    >
      {STAGE_LABEL[stage]}
    </span>
  );
}
