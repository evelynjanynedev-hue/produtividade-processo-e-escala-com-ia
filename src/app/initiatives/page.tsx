import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";

import { requireUser } from "@/lib/auth/session";
import { listInitiatives } from "@/lib/domain/queries";
import { AppShell } from "@/components/app-shell";
import { StageBadge } from "@/components/stage";
import { cn, formatDate, pct, TONES } from "@/lib/ui";
import { stageOf } from "@/lib/domain/stages";
import { realityReport } from "@/lib/domain/rules";

export const dynamic = "force-dynamic";

export default async function InitiativesPage() {
  const user = await requireUser();
  const initiatives = await listInitiatives(user.workspaceId);
  const active = initiatives.filter((i) => i.status === "ativa");
  const archived = initiatives.filter((i) => i.status !== "ativa");

  return (
    <AppShell user={user} active="/initiatives">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="eyebrow">Portfólio</div>
          <h1 className="mt-2 text-[34px] leading-tight">Intenções em andamento.</h1>
          <p className="mt-2 max-w-[54ch] text-sm text-muted">
            Cada projeto mostra onde está, qual é a próxima ação e qual é a prova que já existe.
          </p>
        </div>
        <Link href="/#nova" className="btn btn-primary">
          <Plus className="h-4 w-4" /> Nova intenção
        </Link>
      </header>

      <div className="card divide-y divide-line">
        {active.length === 0 && (
          <p className="p-6 text-sm text-muted">Nenhum projeto ativo ainda.</p>
        )}
        {active.map((initiative) => {
          const stage = stageOf(initiative.stage);
          const tone = TONES[stage.color];
          return (
            <Link
              key={initiative.id}
              href={`/initiatives/${initiative.id}`}
              className="group flex flex-wrap items-center gap-4 px-6 py-5 transition hover:bg-shell/40"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <StageBadge stage={initiative.stage} />
                  <span className="text-[11px] uppercase tracking-[0.12em] text-muted">
                    {realityReport(initiative.reality).label}
                  </span>
                  {initiative.tasksBlocked > 0 && (
                    <span className="badge border-red/30 bg-red/5 text-red">bloqueio</span>
                  )}
                </div>
                <h2 className="mt-2 truncate text-[21px] leading-tight">{initiative.title}</h2>
                <p className="mt-1 line-clamp-1 text-[12.5px] text-muted">{initiative.objective}</p>
              </div>

              <div className="flex items-center gap-6">
                <div className="hidden w-[120px] sm:block">
                  <div className="mb-1.5 flex justify-between text-[10px] uppercase tracking-[0.1em] text-muted">
                    <span>execução</span>
                    <span className="mono">{pct(initiative.tasksDone, initiative.tasksTotal)}%</span>
                  </div>
                  <div className="h-1 overflow-hidden rounded-full bg-line/70">
                    <div className={cn("h-full rounded-full", tone.dot)} style={{ width: `${pct(initiative.tasksDone, initiative.tasksTotal)}%` }} />
                  </div>
                </div>
                <div className="hidden w-[92px] text-right sm:block">
                  <div className="mono text-[11px] text-muted">provas</div>
                  <div className="mono text-sm">{initiative.evidencesCount}</div>
                </div>
                <div className="hidden w-[92px] text-right sm:block">
                  <div className="mono text-[11px] text-muted">resultados</div>
                  <div className="mono text-sm">{initiative.resultsCount}</div>
                </div>
                <div className="hidden w-[70px] text-right md:block">
                  <div className="text-[11px] text-muted">prazo</div>
                  <div className="text-sm">{formatDate(initiative.dueAt)}</div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted transition group-hover:translate-x-0.5 group-hover:text-ink" />
              </div>
            </Link>
          );
        })}
      </div>

      {archived.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-[18px] text-muted">Arquivados</h2>
          <div className="card divide-y divide-line opacity-70">
            {archived.map((initiative) => (
              <Link
                key={initiative.id}
                href={`/initiatives/${initiative.id}`}
                className="flex items-center justify-between gap-4 px-5 py-3 text-sm hover:bg-shell/40"
              >
                <span className="truncate">{initiative.title}</span>
                <StageBadge stage={initiative.stage} />
              </Link>
            ))}
          </div>
        </section>
      )}
    </AppShell>
  );
}
