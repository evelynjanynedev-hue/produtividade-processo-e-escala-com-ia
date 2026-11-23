"use server";

import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { db } from "@/lib/db";
import {
  activityEvents,
  aiProviders,
  contentPieces,
  evidences,
  initiatives,
  knowledgeItems,
  leads,
  learnings,
  milestones,
  processes,
  results,
  tasks,
} from "@/lib/db/schema";
import { requireUser } from "@/lib/auth/session";
import { draftFromIntent } from "@/lib/domain/intake";
import { realityReport, type RealityInput } from "@/lib/domain/rules";
import { EVIDENCE_KINDS } from "@/lib/domain/stages";

export type ActionResult = { ok: boolean; error?: string; message?: string };

const evidenceKindValues = EVIDENCE_KINDS.map((k) => k.value) as [string, ...string[]];

async function log(
  workspaceId: string,
  actorId: string,
  initiativeId: string | null,
  verb: string,
  summary: string,
  meta: Record<string, unknown> = {},
) {
  await db.insert(activityEvents).values({ workspaceId, actorId, initiativeId, verb, summary, meta });
}

async function ownedInitiative(workspaceId: string, initiativeId: string) {
  const [row] = await db
    .select({
      id: initiatives.id,
      title: initiatives.title,
      stage: initiatives.stage,
    })
    .from(initiatives)
    .where(and(eq(initiatives.id, initiativeId), eq(initiatives.workspaceId, workspaceId)))
    .limit(1);
  return row ?? null;
}

/* ══════════════════════════════════════════════════════════════════
   INTENÇÃO → ESTRUTURA
   ══════════════════════════════════════════════════════════════════ */

const intentSchema = z.object({
  intent: z
    .string()
    .trim()
    .min(12, "Escreva um pouco mais: o que você quer que exista?")
    .max(2000, "Texto muito longo. Resuma a intenção."),
  priority: z.enum(["baixa", "media", "alta"]).default("media"),
  dueAt: z.string().optional(),
});

export async function createInitiativeAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const parsed = intentSchema.safeParse({
    intent: formData.get("intent"),
    priority: formData.get("priority") ?? "media",
    dueAt: formData.get("dueAt") ?? undefined,
  });

  if (!parsed.success) {
    redirect(`/?erro=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Dados inválidos")}`);
  }

  const draft = draftFromIntent(parsed.data.intent);
  const dueAt = parsed.data.dueAt ? new Date(`${parsed.data.dueAt}T23:59:00`) : null;

  const id = await db.transaction(async (tx) => {
    const [created] = await tx
      .insert(initiatives)
      .values({
        workspaceId: user.workspaceId,
        title: draft.title,
        intent: parsed.data.intent,
        objective: draft.objective,
        expectedResult: draft.expectedResult,
        vision: draft.vision,
        stage: 2,
        priority: parsed.data.priority,
        dueAt: Number.isNaN(dueAt?.getTime() ?? NaN) ? null : dueAt,
        createdBy: user.id,
      })
      .returning({ id: initiatives.id });

    let taskPosition = 0;

    for (const [index, milestone] of draft.milestones.entries()) {
      const [createdMilestone] = await tx
        .insert(milestones)
        .values({ initiativeId: created.id, title: milestone.title, position: index })
        .returning({ id: milestones.id });

      for (const task of milestone.tasks) {
        await tx.insert(tasks).values({
          initiativeId: created.id,
          milestoneId: createdMilestone.id,
          title: task.title,
          requiresEvidence: task.requiresEvidence,
          position: taskPosition++,
        });
      }
    }

    return created.id;
  });

  await log(user.workspaceId, user.id, id, "intencao.criada", `Intenção estruturada: ${draft.title}`);

  revalidatePath("/");
  redirect(`/initiatives/${id}`);
}

/* ══════════════════════════════════════════════════════════════════
   AVANÇO DE ETAPA (com regra de realidade)
   ══════════════════════════════════════════════════════════════════ */

async function realityInputFor(initiativeId: string, stage: number): Promise<RealityInput> {
  const [row] = await db
    .select({
      milestones: sql<number>`(select count(*) from milestones m where m.initiative_id = ${initiativeId})`,
      tasks: sql<number>`(select count(*) from tasks t where t.initiative_id = ${initiativeId})`,
      tasksDone: sql<number>`(select count(*) from tasks t where t.initiative_id = ${initiativeId} and t.status = 'feita')`,
      tasksBlocked: sql<number>`(select count(*) from tasks t where t.initiative_id = ${initiativeId} and t.status = 'bloqueada')`,
      evidences: sql<number>`(select count(*) from evidences e where e.initiative_id = ${initiativeId})`,
      results: sql<number>`(select count(*) from results r where r.initiative_id = ${initiativeId})`,
      learningsProven: sql<number>`(select count(*) from learnings l where l.initiative_id = ${initiativeId} and l.status = 'provado')`,
      validatedProcesses: sql<number>`(select count(*) from processes p where p.initiative_id = ${initiativeId} and p.status <> 'rascunho')`,
    })
    .from(initiatives)
    .where(eq(initiatives.id, initiativeId));

  return {
    stage,
    milestones: Number(row?.milestones ?? 0),
    tasks: Number(row?.tasks ?? 0),
    tasksDone: Number(row?.tasksDone ?? 0),
    tasksBlocked: Number(row?.tasksBlocked ?? 0),
    evidences: Number(row?.evidences ?? 0),
    results: Number(row?.results ?? 0),
    learningsProven: Number(row?.learningsProven ?? 0),
    validatedProcesses: Number(row?.validatedProcesses ?? 0),
  };
}

export async function advanceStageFormAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const initiativeId = String(formData.get("initiativeId") ?? "");
  const initiative = await ownedInitiative(user.workspaceId, initiativeId);
  if (!initiative) return;

  const input = await realityInputFor(initiative.id, initiative.stage);
  const report = realityReport(input);

  if (!report.nextStage) return;
  if (report.blockers.length > 0) return;

  await db
    .update(initiatives)
    .set({ stage: report.nextStage.index, updatedAt: new Date() })
    .where(eq(initiatives.id, initiative.id));

  await log(
    user.workspaceId,
    user.id,
    initiative.id,
    "etapa.avancou",
    `${initiative.title}: ${report.stage.label} → ${report.nextStage.label}`,
  );

  revalidatePath(`/initiatives/${initiative.id}`);
  revalidatePath("/");
}

export async function advanceStageAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const initiativeId = String(formData.get("initiativeId") ?? "");
  const initiative = await ownedInitiative(user.workspaceId, initiativeId);
  if (!initiative) return { ok: false, error: "Projeto não encontrado." };

  const input = await realityInputFor(initiative.id, initiative.stage);
  const report = realityReport(input);

  if (!report.nextStage) return { ok: false, error: "Este projeto já está em escala." };
  if (report.blockers.length > 0) return { ok: false, error: report.blockers[0] };

  await db
    .update(initiatives)
    .set({ stage: report.nextStage.index, updatedAt: new Date() })
    .where(eq(initiatives.id, initiative.id));

  await log(
    user.workspaceId,
    user.id,
    initiative.id,
    "etapa.avancou",
    `${initiative.title}: ${report.stage.label} → ${report.nextStage.label}`,
  );

  revalidatePath(`/initiatives/${initiative.id}`);
  revalidatePath("/");
  return { ok: true, message: `Agora em ${report.nextStage.label}.` };
}

/* ══════════════════════════════════════════════════════════════════
   TAREFAS
   ══════════════════════════════════════════════════════════════════ */

const taskSchema = z.object({
  initiativeId: z.string().uuid(),
  title: z.string().trim().min(3, "Descreva a tarefa.").max(240),
  requiresEvidence: z.boolean().default(false),
  milestoneId: z.string().uuid().optional().or(z.literal("")),
});

export async function addTaskAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const parsed = taskSchema.safeParse({
    initiativeId: formData.get("initiativeId"),
    title: formData.get("title"),
    requiresEvidence: formData.get("requiresEvidence") === "on",
    milestoneId: formData.get("milestoneId") ?? "",
  });
  if (!parsed.success) return;

  const initiative = await ownedInitiative(user.workspaceId, parsed.data.initiativeId);
  if (!initiative) return;

  let milestoneId: string | null = null;
  if (parsed.data.milestoneId) {
    const [milestone] = await db
      .select({ id: milestones.id })
      .from(milestones)
      .where(and(eq(milestones.id, parsed.data.milestoneId), eq(milestones.initiativeId, initiative.id)))
      .limit(1);
    if (!milestone) return;
    milestoneId = milestone.id;
  }

  const [last] = await db
    .select({ position: tasks.position })
    .from(tasks)
    .where(eq(tasks.initiativeId, initiative.id))
    .orderBy(sql`${tasks.position} desc`)
    .limit(1);

  await db.insert(tasks).values({
    initiativeId: initiative.id,
    milestoneId,
    title: parsed.data.title,
    requiresEvidence: parsed.data.requiresEvidence,
    position: (last?.position ?? 0) + 1,
  });

  await db.update(initiatives).set({ updatedAt: new Date() }).where(eq(initiatives.id, initiative.id));
  revalidatePath(`/initiatives/${initiative.id}`);
  revalidatePath("/");
}

const toggleSchema = z.object({
  taskId: z.string().uuid(),
  initiativeId: z.string().uuid(),
});

export async function toggleTaskAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const parsed = toggleSchema.safeParse({
    taskId: formData.get("taskId"),
    initiativeId: formData.get("initiativeId"),
  });
  if (!parsed.success) return;

  const initiative = await ownedInitiative(user.workspaceId, parsed.data.initiativeId);
  if (!initiative) return;

  const [task] = await db
    .select({ id: tasks.id, status: tasks.status, title: tasks.title, requiresEvidence: tasks.requiresEvidence })
    .from(tasks)
    .where(and(eq(tasks.id, parsed.data.taskId), eq(tasks.initiativeId, initiative.id)))
    .limit(1);
  if (!task) return;

  const done = task.status !== "feita";
  await db
    .update(tasks)
    .set({ status: done ? "feita" : "a_fazer", completedAt: done ? new Date() : null })
    .where(eq(tasks.id, task.id));

  if (done) {
    await log(user.workspaceId, user.id, initiative.id, "tarefa.concluida", task.title);
  }

  await db.update(initiatives).set({ updatedAt: new Date() }).where(eq(initiatives.id, initiative.id));

  revalidatePath(`/initiatives/${initiative.id}`);
  revalidatePath("/");
  if (done && task.requiresEvidence) {
    redirect(`/initiatives/${initiative.id}?prova=${task.id}#evidencias`);
  }
}

export async function blockTaskAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const parsed = toggleSchema.safeParse({
    taskId: formData.get("taskId"),
    initiativeId: formData.get("initiativeId"),
  });
  if (!parsed.success) return;

  const initiative = await ownedInitiative(user.workspaceId, parsed.data.initiativeId);
  if (!initiative) return;

  await db
    .update(tasks)
    .set({ status: "bloqueada" })
    .where(and(eq(tasks.id, parsed.data.taskId), eq(tasks.initiativeId, initiative.id)));

  await log(user.workspaceId, user.id, initiative.id, "tarefa.bloqueada", "Tarefa marcada como bloqueada");
  revalidatePath(`/initiatives/${initiative.id}`);
}

export async function unblockTaskAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const parsed = toggleSchema.safeParse({
    taskId: formData.get("taskId"),
    initiativeId: formData.get("initiativeId"),
  });
  if (!parsed.success) return;

  const initiative = await ownedInitiative(user.workspaceId, parsed.data.initiativeId);
  if (!initiative) return;

  await db
    .update(tasks)
    .set({ status: "a_fazer" })
    .where(and(eq(tasks.id, parsed.data.taskId), eq(tasks.initiativeId, initiative.id)));

  await log(user.workspaceId, user.id, initiative.id, "tarefa.desbloqueada", "Bloqueio removido");
  revalidatePath(`/initiatives/${initiative.id}`);
}

/* ══════════════════════════════════════════════════════════════════
   EVIDÊNCIA · RESULTADO · APRENDIZADO
   ══════════════════════════════════════════════════════════════════ */

const evidenceSchema = z.object({
  initiativeId: z.string().uuid(),
  taskId: z.string().uuid().optional().or(z.literal("")),
  kind: z.enum(evidenceKindValues),
  description: z.string().trim().min(5, "Descreva a prova em uma frase.").max(600),
  url: z.string().trim().url("Link inválido.").optional().or(z.literal("")),
});

export async function addEvidenceAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const parsed = evidenceSchema.safeParse({
    initiativeId: formData.get("initiativeId"),
    taskId: formData.get("taskId") ?? "",
    kind: formData.get("kind") ?? "entrega",
    description: formData.get("description"),
    url: formData.get("url") ?? "",
  });
  if (!parsed.success) return;

  const initiative = await ownedInitiative(user.workspaceId, parsed.data.initiativeId);
  if (!initiative) return;

  await db.insert(evidences).values({
    initiativeId: initiative.id,
    taskId: parsed.data.taskId || null,
    kind: parsed.data.kind as "entrega" | "arquivo" | "publicacao" | "contato" | "reuniao" | "venda" | "receita" | "metrica" | "feedback" | "processo" | "outro",
    description: parsed.data.description,
    url: parsed.data.url || null,
    createdBy: user.id,
  });

  await log(user.workspaceId, user.id, initiative.id, "evidencia.registrada", parsed.data.description);

  if (initiative.stage < 5) {
    await db.update(initiatives).set({ stage: 5, updatedAt: new Date() }).where(eq(initiatives.id, initiative.id));
  }

  revalidatePath(`/initiatives/${initiative.id}`);
  revalidatePath("/");
}

const resultSchema = z.object({
  initiativeId: z.string().uuid(),
  metric: z.string().trim().min(2, "Qual métrica?").max(120),
  value: z.coerce.number({ invalid_type_error: "Use um número." }),
  target: z.coerce.number().optional(),
  unit: z.string().trim().min(1).max(24).default("un"),
});

export async function addResultAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const rawTarget = formData.get("target");
  const parsed = resultSchema.safeParse({
    initiativeId: formData.get("initiativeId"),
    metric: formData.get("metric"),
    value: formData.get("value"),
    target: rawTarget ? rawTarget : undefined,
    unit: formData.get("unit") || "un",
  });
  if (!parsed.success) return;

  const initiative = await ownedInitiative(user.workspaceId, parsed.data.initiativeId);
  if (!initiative) return;

  await db.insert(results).values({
    initiativeId: initiative.id,
    metric: parsed.data.metric,
    value: parsed.data.value.toString(),
    target: parsed.data.target != null ? parsed.data.target.toString() : null,
    unit: parsed.data.unit,
  });

  await log(
    user.workspaceId,
    user.id,
    initiative.id,
    "resultado.medido",
    `${parsed.data.metric}: ${parsed.data.value} ${parsed.data.unit}`,
  );

  revalidatePath(`/initiatives/${initiative.id}`);
  revalidatePath("/");
}

const learningSchema = z.object({
  initiativeId: z.string().uuid(),
  insight: z.string().trim().min(8, "Escreva o aprendizado.").max(600),
  context: z.string().trim().max(400).optional().or(z.literal("")),
});

export async function addLearningAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const parsed = learningSchema.safeParse({
    initiativeId: formData.get("initiativeId"),
    insight: formData.get("insight"),
    context: formData.get("context") ?? "",
  });
  if (!parsed.success) return;

  const initiative = await ownedInitiative(user.workspaceId, parsed.data.initiativeId);
  if (!initiative) return;

  await db.insert(learnings).values({
    initiativeId: initiative.id,
    insight: parsed.data.insight,
    context: parsed.data.context || "",
  });

  await log(user.workspaceId, user.id, initiative.id, "aprendizado.registrado", parsed.data.insight);
  revalidatePath(`/initiatives/${initiative.id}`);
}

export async function setLearningStatusAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = String(formData.get("learningId") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!["aberto", "provado", "descartado"].includes(status)) return;

  const [learning] = await db
    .select({ id: learnings.id, initiativeId: learnings.initiativeId, insight: learnings.insight })
    .from(learnings)
    .innerJoin(initiatives, eq(initiatives.id, learnings.initiativeId))
    .where(and(eq(learnings.id, id), eq(initiatives.workspaceId, user.workspaceId)))
    .limit(1);
  if (!learning) return;

  await db
    .update(learnings)
    .set({ status: status as "aberto" | "provado" | "descartado" })
    .where(eq(learnings.id, learning.id));

  await log(user.workspaceId, user.id, learning.initiativeId, `aprendizado.${status}`, learning.insight);
  revalidatePath(`/initiatives/${learning.initiativeId}`);
}

/* ══════════════════════════════════════════════════════════════════
   PROCESSO (padronização)
   ══════════════════════════════════════════════════════════════════ */

const processSchema = z.object({
  initiativeId: z.string().uuid(),
  name: z.string().trim().min(4, "Dê um nome ao processo.").max(160),
  summary: z.string().trim().max(400).optional().or(z.literal("")),
  steps: z.string().trim().min(10, "Liste os passos, um por linha."),
});

export async function createProcessAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const parsed = processSchema.safeParse({
    initiativeId: formData.get("initiativeId"),
    name: formData.get("name"),
    summary: formData.get("summary") ?? "",
    steps: formData.get("steps"),
  });
  if (!parsed.success) return;

  const initiative = await ownedInitiative(user.workspaceId, parsed.data.initiativeId);
  if (!initiative) return;

  const steps = parsed.data.steps
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 20)
    .map((title) => ({ title }));

  const [created] = await db
    .insert(processes)
    .values({
      workspaceId: user.workspaceId,
      initiativeId: initiative.id,
      name: parsed.data.name,
      summary: parsed.data.summary || "",
      steps,
      status: "validado",
    })
    .returning({ id: processes.id });

  await log(user.workspaceId, user.id, initiative.id, "processo.criado", `Processo: ${parsed.data.name}`);

  revalidatePath(`/initiatives/${initiative.id}`);
  revalidatePath("/processes");
  void created;
}

export async function setProcessStatusAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = String(formData.get("processId") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!["rascunho", "validado", "escalando"].includes(status)) return;

  const [process] = await db
    .select({ id: processes.id, workspaceId: processes.workspaceId, name: processes.name })
    .from(processes)
    .where(and(eq(processes.id, id), eq(processes.workspaceId, user.workspaceId)))
    .limit(1);
  if (!process) return;

  await db
    .update(processes)
    .set({ status: status as "rascunho" | "validado" | "escalando", updatedAt: new Date() })
    .where(eq(processes.id, process.id));

  await log(user.workspaceId, user.id, null, `processo.${status}`, process.name);
  revalidatePath("/processes");
}

export async function addAiProviderAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const provider = String(formData.get("provider") ?? "groq");
  const name = String(formData.get("name") ?? "").trim();
  const apiKey = String(formData.get("apiKey") ?? "").trim();
  const model = String(formData.get("model") ?? "").trim();
  const baseUrl = String(formData.get("baseUrl") ?? "").trim();

  if (name.length < 2 || apiKey.length < 5) return;

  const validProvider = ["groq", "openai", "anthropic", "google", "ollama", "custom"].includes(provider)
    ? (provider as "groq" | "openai" | "anthropic" | "google" | "ollama" | "custom")
    : "custom";

  await db.insert(aiProviders).values({
    workspaceId: user.workspaceId,
    provider: validProvider,
    name,
    apiKey,
    model,
    baseUrl,
    enabled: true,
  });

  await log(user.workspaceId, user.id, null, "ia.provedor.adicionado", name);
  revalidatePath("/settings");
}

export async function addKnowledgeAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const title = String(formData.get("title") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  const category = String(formData.get("category") ?? "insight");
  const tagsRaw = String(formData.get("tags") ?? "").trim();
  const source = String(formData.get("source") ?? "").trim();
  const initiativeId = String(formData.get("initiativeId") ?? "").trim();

  if (title.length < 3 || content.length < 5) return;

  const tags = tagsRaw
    ? tagsRaw.split(",").map((t) => t.trim()).filter(Boolean).slice(0, 10)
    : [];

  const validCategory = ["insight", "referencia", "decisao", "contato", "recurso", "ideia", "outro"].includes(category)
    ? (category as "insight" | "referencia" | "decisao" | "contato" | "recurso" | "ideia" | "outro")
    : "insight";

  await db.insert(knowledgeItems).values({
    workspaceId: user.workspaceId,
    initiativeId: initiativeId || null,
    title,
    content,
    category: validCategory,
    tags,
    source,
  });

  await log(user.workspaceId, user.id, initiativeId || null, "conhecimento.adicionado", title);
  revalidatePath("/knowledge");
}

export async function addLeadAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 2) return;

  const stage = String(formData.get("stage") ?? "novo");
  const validStage = ["novo", "contatado", "qualificado", "proposta", "negociacao", "fechado", "perdido"].includes(stage)
    ? (stage as "novo" | "contatado" | "qualificado" | "proposta" | "negociacao" | "fechado" | "perdido")
    : "novo";

  await db.insert(leads).values({
    workspaceId: user.workspaceId,
    name,
    email: String(formData.get("email") ?? "").trim(),
    phone: String(formData.get("phone") ?? "").trim(),
    company: String(formData.get("company") ?? "").trim(),
    stage: validStage,
    value: String(formData.get("value") ?? "").trim() || null,
    source: String(formData.get("source") ?? "").trim(),
    notes: String(formData.get("notes") ?? "").trim(),
  });

  await log(user.workspaceId, user.id, null, "lead.criado", name);
  revalidatePath("/marketing");
}

export async function archiveInitiativeAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = String(formData.get("initiativeId") ?? "");
  const initiative = await ownedInitiative(user.workspaceId, id);
  if (!initiative) return;

  await db
    .update(initiatives)
    .set({ status: "arquivada", updatedAt: new Date() })
    .where(eq(initiatives.id, initiative.id));

  await log(user.workspaceId, user.id, initiative.id, "projeto.arquivado", initiative.title);
  revalidatePath("/");
  redirect("/");
}
