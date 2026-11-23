import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, ArrowRight } from "lucide-react";
import { getInitiative } from "@/lib/domain/queries";
import { requireUser } from "@/lib/auth/session";
import { AppShell } from "@/components/app-shell";
import { StageBadge } from "@/components/stage";
import { cn, formatDate, pct, TONES } from "@/lib/ui";
import { STAGES } from "@/lib/domain/stages";
import {
  addEvidenceAction,
  addLearningAction,
  addResultAction,
  addTaskAction,
  advanceStageFormAction,
  createProcessAction,
  blockTaskAction,
  toggleTaskAction,
  unblockTaskAction,
} from "@/lib/domain/actions";

export const dynamic = "force-dynamic";

export default async function InitiativePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;

  const data = await getInitiative(user.workspaceId, id);
  if (!data) notFound();

  const {
    initiative,
    tasks = [],
    evidences = [],
    results = [],
    learnings = [],
    processes = [],
    reality,
  } = data;

  const stage = STAGES[initiative.stage];
  const tasksDone = tasks.filter(t => t.status === "feita").length;
  const progress = pct(tasksDone, tasks.length);
  const nextTask = tasks.find(t => t.status === "a_fazer" || t.status === "fazendo");
  const tasksBlocked = tasks.filter(t => t.status === "bloqueada").length;

  return (
    <AppShell user={user} active="/initiatives">
      <header className="mb-8">
        <div className="flex flex-wrap items-center gap-2 text-[12px] text-muted">
          <Link href="/initiatives" className="link">Intenções</Link>
        </div>
        <h1 className="mt-2 text-[34px] leading-tight">{initiative.title}</h1>
        <p className="mt-2 max-w-[54ch] text-sm text-muted">{initiative.objective}</p>
      </header>

      <div className="card divide-y divide-line">
        <div className="flex items-center justify-between">
          <div>
            <StageBadge stage={initiative.stage} />
            <span className="text-[11px] uppercase tracking-[0.12em] text-muted">
              {reality.label}
            </span>
            {tasksBlocked > 0 && (
              <span className="badge border-red/30 bg-red/5 text-red">bloqueio</span>
            )}
          </div>
          <Link href={`/initiatives/${initiative.id}`} className="link text-ink">
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-6 flex items-center gap-4">
          <div className="hidden w-[120px] sm:block">
            <div className="mb-1.5 flex justify-between text-[10px] uppercase tracking-[0.1em] text-muted">
              execução
              <span className="mono">{pct(tasksDone, tasks.length)}%</span>
            </div>
            <div className="h-1 overflow-hidden rounded-full bg-line/70">
              <div className={cn(TONES[stage.color].dot, { width: `${progress}%` })} />
            </div>
          </div>
          <div className="hidden w-[92px] text-right sm:block">
            <div className="mono text-[11px] text-muted">provas</div>
            <div className="mono text-sm">{evidences.length}</div>
          </div>
          <div className="hidden w-[92px] text-right sm:block">
            <div className="mono text-[11px] text-muted">resultados</div>
            <div className="mono text-sm">{results.length}</div>
          </div>
          <div className="hidden w-[70px] text-right md:block">
            <div className="text-[11px] text-muted">prazo</div>
            <div className="text-sm">{formatDate(initiative.dueAt)}</div>
          </div>
          <ArrowRight className="h-4 w-4 text-muted transition group-hover:translate-x-0.5 group-hover:text-ink" />
        </div>

        {nextTask ? (
          <form action={toggleTaskAction} className="mt-4">
            <input type="hidden" name="taskId" value={nextTask.id} />
            <input type="hidden" name="initiativeId" value={initiative.id} />
            <button className="btn btn-gold btn-sm">
              {nextTask.status === "a_fazer" ? "Iniciar" : "Concluir"}
            </button>
          </form>
        ) : (
          <p className="text-sm text-muted">Nenhuma tarefa em aberto. Comece abaixo.</p>
        )}

        <div className="mt-8">
          <h2 className="text-[22px] mb-2">Tarefas</h2>
          {tasks.map(t => (
            <div key={t.id} className="flex items-center gap-3 py-1 border-b border-line/70">
              <span className="mono">{t.title}</span>
              <span className={cn(
                "badge",
                t.status === "feita" && "border-green/30 bg-green/5",
                t.status === "bloqueada" && "border-red/30 bg-red/5",
                t.status === "a_fazer" && "border-gray/30 bg-gray/5"
              )}>
                {t.status}
              </span>
              {t.status === "bloqueada" && (
                <form action={unblockTaskAction}>
                  <input type="hidden" name="taskId" value={t.id} />
                  <input type="hidden" name="initiativeId" value={initiative.id} />
                  <button className="btn btn-sm btn-ghost ml-2" title="Desbloquear">
                    ✓
                  </button>
                </form>
              )}
            </div>
          ))}
        </div>

        <div className="mt-8">
          <h2 className="text-[22px] mb-2">Evidências</h2>
          {evidences.length === 0 ? (
            <p className="text-sm text-muted">Nenhuma evidência registrada.</p>
          ) : (
            <div className="divide-y divide-line">
              {evidences.map(e => (
                <div key={e.id} className="px-4 py-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-blue">{e.kind}</span>
                    <span className="text-[11px] text-muted">{formatDate(e.occurredAt)}</span>
                  </div>
                  <p className="mt-1 text-[13px] leading-snug">{e.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-8">
          <h2 className="text-[22px] mb-2">Resultados</h2>
          {results.length === 0 ? (
            <p className="text-sm text-muted">Sem resultados medidos.</p>
          ) : (
            <ul className="divide-y divide-line">
              {results.map(r => (
                <li key={r.id} className="px-4 py-2">
                  <span className="mono">{r.metric}:</span>
                  <span className="text-sm">{r.value} {r.unit}</span>
                  {r.target && (
                    <span className="text-sm text-gray-600">
                      (meta: {r.target} {r.unit})
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-8">
          <h2 className="text-[22px] mb-2">Aprendizados</h2>
          {learnings.length === 0 ? (
            <p className="text-sm text-muted">Nenhum aprendizado registrado.</p>
          ) : (
            <ul className="divide-y divide-line">
              {learnings.map(l => (
                <li key={l.id} className="px-4 py-2">
                  <span className="font-medium">{l.insight}</span>
                  <p className="text-[11px] text-muted">{l.context}</p>
                  <span className={cn(
                    "badge",
                    l.status === "provado" && "border-green/30 bg-green/5",
                    l.status === "aberto" && "border-gray/30 bg-gray/5",
                    l.status === "descartado" && "border-red/30 bg-red/5"
                  )}>
                    {l.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-8">
          <h2 className="text-[22px] mb-2">Processos</h2>
          {processes.length === 0 ? (
            <p className="text-sm text-muted">Nenhum processo criado.</p>
          ) : (
            <ul className="divide-y divide-line">
              {processes.map(p => (
                <li key={p.id} className="px-4 py-2">
                  <span className="font-medium">{p.name}</span>
                  <span className="text-sm text-muted">{p.summary}</span>
                  <span className={cn(
                    "badge",
                    p.status === "validado" && "border-green/30 bg-green/5",
                    p.status !== "validado" && "border-gray/30 bg-gray/5"
                  )}>
                    {p.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-8">
          <h2 className="text-[22px] mb-2">Próximo passo</h2>
          {nextTask ? (
            <div className="flex items-center gap-3">
              <StageBadge stage={initiative.stage} />
              <span className="text-sm text-muted">{nextTask.title}</span>
              {nextTask.status === "bloqueada" && (
                <form action={unblockTaskAction}>
                  <input type="hidden" name="taskId" value={nextTask.id} />
                  <input type="hidden" name="initiativeId" value={initiative.id} />
                  <button className="btn btn-sm btn-ghost ml-2" title="Desbloquear">
                    ✓
                  </button>
                </form>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted">Nenhuma tarefa em aberto. Comece abaixo.</p>
          )}
        </div>

        <div className="mt-8">
          <h2 className="text-[22px] mb-2">Adicionar tarefa</h2>
          <form action={addTaskAction} className="space-y-3">
            <div>
              <label className="label" htmlFor="title">Título da tarefa</label>
              <input
                id="title"
                name="title"
                type="text"
                required
                className="field"
                placeholder="Ex.: Enviar proposta ao cliente X"
              />
            </div>
            <div className="flex items-end gap-3">
              <div className="w-48">
                <label className="label" htmlFor="milestoneId">Marco</label>
                <input
                  id="milestoneId"
                  name="milestoneId"
                  type="text"
                  className="field"
                  placeholder="Busque um marco existente"
                />
              </div>
              <div className="w-12">
                <input
                  type="checkbox"
                  name="requiresEvidence"
                  className="mr-1"
                />
              </div>
            </div>
            <button type="submit" className="btn btn-primary">
              Adicionar tarefa
            </button>
          </form>
        </div>

        <div className="mt-8">
          <h2 className="text-[22px] mb-2">Avançar etapa</h2>
          <form action={advanceStageFormAction} className="space-y-3">
            <input type="hidden" name="initiativeId" value={initiative.id} />
            <button type="submit" className="btn btn-primary">
              Próxima etapa
            </button>
          </form>
        </div>

        <div className="mt-8">
          <h2 className="text-[22px] mb-2">Adicionar evidência</h2>
          <form action={addEvidenceAction} className="space-y-3">
            <input type="hidden" name="initiativeId" value={initiative.id} />
            <div className="flex items-end gap-3">
              <div className="w-24">
                <label className="label" htmlFor="kind">Tipo</label>
                <select
                  id="kind"
                  name="kind"
                  required
                  className="field"
                >
                  {["entrega", "arquivo", "publicacao", "contato", "reuniao", "venda", "receita", "metrica", "feedback", "processo", "outro"].map(t => (
                    <option key={t} value={t}>
                      {t === "entrega" ? "Entrega produzida" : t === "arquivo" ? "Arquivo criado" : t === "publicacao" ? "Publicação realizada" : t === "contato" ? "Cliente contatado" : t === "reuniao" ? "Reunião realizada" : t === "venda" ? "Venda realizada" : t === "receita" ? "Receita gerada" : t === "metrica" ? "Métrica registrada" : t === "feedback" ? "Feedback recebido" : t === "processo" ? "Processo documentado" : "Outra prova"}
                    </option>
                  ))}
                </select>
              </div>
              <div className="w-48">
                <label className="label" htmlFor="description">Descrição</label>
                <input
                  id="description"
                  name="description"
                  type="text"
                  required
                  className="field"
                  placeholder="Ex.: Contrato assinado com cliente X"
                />
              </div>
              <div className="w-12">
                <input type="checkbox" name="taskId" />
              </div>
            </div>
            <button type="submit" className="btn btn-primary">
              Registrar evidência
            </button>
          </form>
        </div>

        <div className="mt-8">
          <h2 className="text-[22px] mb-2">Adicionar resultado</h2>
          <form action={addResultAction} className="space-y-3">
            <input type="hidden" name="initiativeId" value={initiative.id} />
            <div className="flex items-end gap-3">
              <div className="w-48">
                <label className="label" htmlFor="metric">Métrica</label>
                <input
                  id="metric"
                  name="metric"
                  type="text"
                  required
                  className="field"
                  placeholder="Ex.: Receita mensal"
                />
              </div>
              <div className="w-24">
                <label className="label" htmlFor="value">Valor</label>
                <input
                  id="value"
                  name="value"
                  type="number"
                  required
                  step="0.01"
                  className="field"
                />
              </div>
              <div className="w-12">
                <input type="checkbox" name="taskId" />
              </div>
            </div>
            <button type="submit" className="btn btn-primary">
              Medir resultado
            </button>
          </form>
        </div>

        <div className="mt-8">
          <h2 className="text-[22px] mb-2">Registrar aprendizado</h2>
          <form action={addLearningAction} className="space-y-3">
            <input type="hidden" name="initiativeId" value={initiative.id} />
            <div className="flex items-end gap-3">
              <div className="w-48">
                <label className="label" htmlFor="insight">Insight</label>
                <textarea
                  id="insight"
                  name="insight"
                  required
                  rows={3}
                  className="field"
                  placeholder="O que funcionou, para quem e por quê?"
                />
              </div>
              <div className="w-24">
                <label className="label" htmlFor="context">Contexto</label>
                <input
                  id="context"
                  name="context"
                  type="text"
                  className="field"
                  placeholder="Detalhes adicionais (opcional)"
                />
              </div>
            </div>
            <button type="submit" className="btn btn-primary">
              Salvar aprendizado
            </button>
          </form>
        </div>

        <div className="mt-8">
          <h2 className="text-[22px] mb-2">Adicionar processo</h2>
          <form action={createProcessAction} className="space-y-3">
            <input type="hidden" name="initiativeId" value={initiative.id} />
            <div className="flex items-end gap-3">
              <div className="w-48">
                <label className="label" htmlFor="name">Nome do processo</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  className="field"
                  placeholder="Ex.: Processo de prospecção"
                />
              </div>
              <div className="w-48">
                <label className="label" htmlFor="steps">Passos</label>
                <textarea
                  id="steps"
                  name="steps"
                  required
                  rows={5}
                  className="field"
                  placeholder="Um passo por linha"
                />
              </div>
            </div>
            <button type="submit" className="btn btn-primary">
              Criar processo
            </button>
          </form>
        </div>

        <div className="mt-8">
          <h2 className="text-[22px] mb-2">Status da tarefa (se houver)</h2>
          {nextTask && (
            <form action={toggleTaskAction} className="space-y-2">
              <input type="hidden" name="taskId" value={nextTask.id} />
              <input type="hidden" name="initiativeId" value={initiative.id} />
              <button type="submit" className="btn btn-sm">
                {nextTask.status === "a_fazer" ? "Iniciar" : "Concluir"}
              </button>
            </form>
          )}
        </div>

        <div className="mt-8">
          <h2 className="text-[22px] mb-2">Bloquear / Desbloquear tarefa</h2>
          {nextTask && nextTask.status !== "feita" && (
            <form action={blockTaskAction} className="space-y-2">
              <input type="hidden" name="taskId" value={nextTask.id} />
              <input type="hidden" name="initiativeId" value={initiative.id} />
              <button type="submit" className="btn btn-sm btn-ghost">
                Bloquear
              </button>
            </form>
          )}
        </div>

        <div className="mt-8">
          <h2 className="text-[22px] mb-2">Log de atividade</h2>
          <p className="text-[11px] text-muted">
            A cada ação você gera evidência. Sem prova, não há progresso.
          </p>
        </div>
      </div>
    </AppShell>
  );
}