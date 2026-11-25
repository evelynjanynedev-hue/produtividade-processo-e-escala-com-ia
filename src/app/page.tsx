import Link from "next/link";
import { ArrowRight, CheckCircle2, CircleAlert, FileCheck2, Gauge, Plus, Target, Workflow } from "lucide-react";

import { createInitiativeAction, toggleTaskAction } from "@/lib/domain/actions";
import { getWorkspaceSnapshot } from "@/lib/domain/queries";
import { requireUser } from "@/lib/auth/session";
import { AppShell } from "@/components/app-shell";
import { StageBadge, StageRail } from "@/components/stage";
import { cn, formatDate, pct, relativeDays, TONES } from "@/lib/ui";
import { stageOf } from "@/lib/domain/stages";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const user = await requireUser();
  const { erro } = await searchParams;
  const snapshot = await getWorkspaceSnapshot(user.workspaceId);
  const today = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  }).format(new Date());

  return (
    <AppShell user={user} active="/">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="eyebrow">Painel · {today}</div>
          <h1 className="mt-2 text-[34px] leading-[1.05] sm:text-[40px]">Onde você está agora.</h1>
          <p className="mt-2 max-w-[58ch] text-sm leading-relaxed text-muted">
            Conectar → Criar → Contribuir. Três dimensões: EU (Perceber → Elaborar → Integrar), FAZER (Direção → Estrutura → Execução), MUNDO (Conectar → Criar → Contribuir). Crescimento sem sobrecarga: tudo aqui é medido por prova.
          </p>
        </div>
        <a href="#nova" className="btn btn-primary">
          <Plus className="h-4 w-4" /> Nova intenção
        </a>
      </header>

      {erro && (
        <div className="mb-6 flex items-start gap-2 rounded-lg border border-red/30 bg-red/5 px-4 py-3 text-sm text-red">
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{erro}</span>
        </div>
      )}

      {/* ── próximo passo + estado ─────────────────────────────── */}
      <section className="grid gap-5 lg:grid-cols-3">
        <div className="card card-pad relative overflow-hidden lg:col-span-2">
          <div className="eyebrow mb-3">Próximo passo concreto</div>

          {snapshot.nextStep ? (
            <>
              <h2 className="max-w-[26ch] text-[27px] leading-[1.15]">{snapshot.nextStep.title}</h2>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-[12px] text-muted">
                <StageBadge stage={snapshot.nextStep.initiativeStage} />
                <Link href={`/initiatives/${snapshot.nextStep.initiativeId}`} className="link text-ink">
                  {snapshot.nextStep.initiativeTitle}
                </Link>
                {snapshot.nextStep.dueAt && (
                  <span className="rounded-full border border-line px-2 py-0.5">
                    {relativeDays(snapshot.nextStep.dueAt)}
                  </span>
                )}
              </div>
              <div className="mt-6 flex flex-wrap items-center gap-2">
                <form action={toggleTaskAction}>
                  <input type="hidden" name="taskId" value={snapshot.nextStep.id} />
                  <input type="hidden" name="initiativeId" value={snapshot.nextStep.initiativeId} />
                  <button className="btn btn-gold btn-sm">
                    <CheckCircle2 className="h-4 w-4" /> Concluir agora
                  </button>
                </form>
                <Link href={`/initiatives/${snapshot.nextStep.initiativeId}`} className="btn btn-sm">
                  Abrir projeto <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                {snapshot.nextStep.requiresEvidence && (
                  <span className="text-[12px] text-muted">esta ação vai pedir prova</span>
                )}
              </div>
            </>
          ) : (
            <>
              <h2 className="max-w-[28ch] text-[26px] leading-[1.15]">
                Nenhuma ação em aberto. O sistema está parado — e parado não gera evidência.
              </h2>
              <p className="mt-3 max-w-[46ch] text-sm text-muted">
                Escreva a próxima intenção ou abra um projeto para definir a menor ação de hoje.
              </p>
              <a href="#nova" className="btn btn-primary btn-sm mt-6">
                <Plus className="h-4 w-4" /> Criar próxima ação
              </a>
            </>
          )}

          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gold/10 blur-2xl" />
        </div>

        <div className="card card-pad">
          <div className="eyebrow mb-4">Estado do sistema</div>
          <dl className="space-y-3.5">
            {[
              { icon: Target, label: "Projetos ativos", value: snapshot.totals.active },
              { icon: Gauge, label: "Ações abertas", value: snapshot.totals.tasksOpen },
              { icon: FileCheck2, label: "Evidências (7 dias)", value: snapshot.totals.evidencesThisWeek },
              { icon: Workflow, label: "Processos validados", value: snapshot.totals.validatedProcesses },
              { icon: CheckCircle2, label: "Taxa de conversão", value: `${snapshot.totals.tasksDone > 0 ? Math.round((snapshot.totals.results / snapshot.totals.tasksDone) * 100) : 0}%` },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="flex items-center justify-between gap-3">
                  <dt className="flex items-center gap-2 text-[13px] text-muted">
                    <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
                    {item.label}
                  </dt>
                  <dd className="mono font-serif text-xl leading-none">{item.value}</dd>
                </div>
              );
            })}
          </dl>
          <div className="divider my-4" />
          <p className="text-[12px] leading-relaxed text-muted">
            {snapshot.blocked.length > 0
              ? `${snapshot.blocked.length} projeto(s) com tarefa bloqueada.`
              : "Nenhum bloqueio registrado. Execução limpa."}
          </p>
        </div>
      </section>

      {/* ── mapa do sistema ───────────────────────────────────── */}
      <section className="card mt-5 px-6 pb-5 pt-6">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
          <div>
            <div className="eyebrow">Mapa do processo</div>
            <h2 className="mt-1 text-[22px]">Intenção → Escala</h2>
          </div>
          <p className="text-[12px] text-muted">Cada bolinha é um projeto. Só anda para a direita com prova.</p>
        </div>
        <StageRail counts={snapshot.stageCounts} />
      </section>

      {/* ── iniciativas + evidências ──────────────────────────── */}
      <section className="mt-5 grid gap-5 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          <div className="flex items-baseline justify-between">
            <h2 className="text-[22px]">Projetos</h2>
            <Link href="/initiatives" className="text-[12px] text-muted hover:text-ink">
              ver todos
            </Link>
          </div>

          {snapshot.active.length === 0 && (
            <div className="card p-6 text-sm text-muted">
              Nada ativo. Uma intenção escrita vira estrutura em segundos — comece abaixo.
            </div>
          )}

          {snapshot.active.slice(0, 5).map((initiative) => {
            const stage = stageOf(initiative.stage);
            const tone = TONES[stage.color];
            const progress = pct(initiative.tasksDone, initiative.tasksTotal);
            return (
              <Link
                key={initiative.id}
                href={`/initiatives/${initiative.id}`}
                className="group block rounded-xl border border-line bg-card px-5 py-4 transition hover:border-ink/25"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <StageBadge stage={initiative.stage} />
                      {initiative.tasksBlocked > 0 && (
                        <span className="badge border-red/30 bg-red/5 text-red">bloqueio</span>
                      )}
                    </div>
                    <h3 className="mt-2 truncate text-[19px] leading-tight">{initiative.title}</h3>
                    <p className="mt-1 text-[12px] text-muted">
                      {initiative.nextTask ? `próximo: ${initiative.nextTask}` : "sem próxima ação definida"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-[12px] text-muted">
                    <span className="mono">
                      {initiative.tasksDone}/{initiative.tasksTotal}
                    </span>
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                  </div>
                </div>
                <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-line/60">
                  <div className={cn("h-full rounded-full", tone.dot)} style={{ width: `${progress}%` }} />
                </div>
              </Link>
            );
          })}
        </div>

        <div>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-[22px]">Últimas provas</h2>
            <span className="text-[11px] text-muted">{snapshot.totals.evidences} no total</span>
          </div>
          <div className="card divide-y divide-line">
            {snapshot.recentEvidence.length === 0 && (
              <p className="p-5 text-[13px] text-muted">
                Nenhuma evidência. Sem prova, o sistema não considera nada validado.
              </p>
            )}
            {snapshot.recentEvidence.map((evidence) => (
              <div key={evidence.id} className="px-4 py-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-blue">
                    {evidence.kind}
                  </span>
                  <span className="text-[11px] text-muted">{formatDate(evidence.occurredAt)}</span>
                </div>
                <p className="mt-1 text-[13px] leading-snug">{evidence.description}</p>
                <Link
                  href={`/initiatives/${evidence.initiativeId}`}
                  className="mt-1 block truncate text-[11px] text-muted hover:text-ink"
                >
                  {evidence.initiativeTitle}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── nova intenção ─────────────────────────────────────── */}
      <section id="nova" className="card mt-8 scroll-mt-8 overflow-hidden">
        <div className="border-b border-line bg-shell/50 px-6 py-5">
          <div className="eyebrow">Entrada do sistema</div>
          <h2 className="mt-1 text-[26px] leading-tight">Escreva solto. Sai estrutura.</h2>
          <p className="mt-1 text-[13px] text-muted">
            O motor de intake lê a intenção, identifica objetivo, prazo e público, e devolve etapas e tarefas executáveis.
          </p>
        </div>
        <form action={createInitiativeAction} className="space-y-4 px-6 py-5">
          <div>
            <label className="label" htmlFor="intent">
              Intenção, ideia, problema ou projeto
            </label>
            <textarea
              id="intent"
              name="intent"
              required
              minLength={12}
              rows={4}
              placeholder="Ex.: quero criar uma empresa para ajudar negócios jurídicos a crescer usando marketing, vendas, tecnologia e IA — 5 clientes em 90 dias."
              className="field resize-y"
            />
            <p className="mt-1.5 text-[11px] text-muted">
              Quanto mais concreto (número, prazo, público), melhor a estrutura gerada.
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div className="w-[150px]">
              <label className="label" htmlFor="priority">
                Prioridade
              </label>
              <select id="priority" name="priority" className="field" defaultValue="media">
                <option value="alta">Alta</option>
                <option value="media">Média</option>
                <option value="baixa">Baixa</option>
              </select>
            </div>
            <div className="w-[170px]">
              <label className="label" htmlFor="dueAt">
                Prazo (opcional)
              </label>
              <input id="dueAt" name="dueAt" type="date" className="field" />
            </div>
            <button type="submit" className="btn btn-primary">
              Estruturar intenção <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </form>
      </section>
    </AppShell>
  );
}
