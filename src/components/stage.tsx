import Link from "next/link";

import { STAGES, stageOf } from "@/lib/domain/stages";
import { cn, TONES } from "@/lib/ui";

export function StageBadge({ stage, className }: { stage: number; className?: string }) {
  const s = stageOf(stage);
  const tone = TONES[s.color];
  return (
    <span className={cn("badge", tone.bg, tone.border, tone.text, className)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", tone.dot)} />
      {s.label}
    </span>
  );
}

/** Cadeia completa: intenção → escala. Usada no painel. */
export function StageRail({
  counts,
  current,
  hrefFor,
}: {
  counts?: { index: number; count: number }[];
  current?: number;
  hrefFor?: (stage: number) => string;
}) {
  return (
    <div className="scroll-thin -mx-1 flex gap-0 overflow-x-auto pb-1">
      {STAGES.map((stage, i) => {
        const count = counts?.[i]?.count ?? 0;
        const isCurrent = current === stage.index;
        const tone = TONES[stage.color];
        const content = (
          <div className="flex min-w-[104px] flex-1 flex-col items-center gap-2 px-1">
            <div className="flex w-full items-center">
              <span className={cn("h-px flex-1", i === 0 ? "bg-transparent" : "bg-line")} />
              <span
                className={cn(
                  "grid h-7 w-7 shrink-0 place-items-center rounded-full border text-[11px] font-semibold transition",
                  isCurrent ? cn(tone.bg, tone.border, tone.text) : "border-line bg-card text-muted",
                )}
              >
                {count}
              </span>
              <span className={cn("h-px flex-1", i === STAGES.length - 1 ? "bg-transparent" : "bg-line")} />
            </div>
            <span
              className={cn(
                "text-center text-[11px] leading-tight",
                isCurrent ? "font-semibold text-ink" : "text-muted",
              )}
            >
              {stage.short}
            </span>
          </div>
        );

        return hrefFor ? (
          <Link key={stage.key} href={hrefFor(stage.index)} className="min-w-[104px] flex-1 rounded-lg hover:bg-ink/[0.03]">
            {content}
          </Link>
        ) : (
          <div key={stage.key} className="min-w-[104px] flex-1">
            {content}
          </div>
        );
      })}
    </div>
  );
}

/** Trilha vertical da etapa atual (detalhe do projeto). */
export function StageProgress({ stage }: { stage: number }) {
  return (
    <ol className="flex flex-wrap items-center gap-x-1 gap-y-2">
      {STAGES.map((s, i) => {
        const done = i < stage;
        const now = i === stage;
        const tone = TONES[s.color];
        return (
          <li key={s.key} className="flex items-center gap-1">
            <span
              className={cn(
                "rounded-full border px-2.5 py-1 text-[11px] font-medium",
                now && cn(tone.bg, tone.border, tone.text, "font-semibold"),
                done && "border-line bg-white text-muted",
                !done && !now && "border-dashed border-line/70 text-muted/60",
              )}
            >
              {done ? "✓ " : ""}
              {s.short}
            </span>
            {i < STAGES.length - 1 && <span className="h-px w-3 bg-line" />}
          </li>
        );
      })}
    </ol>
  );
}
