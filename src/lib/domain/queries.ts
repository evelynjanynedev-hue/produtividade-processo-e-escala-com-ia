import "server-only";

import { and, desc, eq, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import {
  evidences,
  initiatives,
  learnings,
  milestones,
  processes,
  results,
  tasks,
} from "@/lib/db/schema";
import { realityReport, type RealityInput } from "./rules";

export type InitiativeSummary = {
  id: string;
  title: string;
  objective: string;
  expectedResult: string;
  stage: number;
  status: "ativa" | "pausada" | "arquivada";
  priority: "baixa" | "media" | "alta";
  dueAt: Date | null;
  updatedAt: Date;
  tasksTotal: number;
  tasksDone: number;
  tasksBlocked: number;
  evidencesCount: number;
  resultsCount: number;
  learningsProven: number;
  milestonesCount: number;
  nextTask: string | null;
  reality: RealityInput;
};

const countsSelect = {
  tasksTotal: sql<number>`(select count(*) from tasks t where t.initiative_id = ${initiatives.id})`,
  tasksDone: sql<number>`(select count(*) from tasks t where t.initiative_id = ${initiatives.id} and t.status = 'feita')`,
  tasksBlocked: sql<number>`(select count(*) from tasks t where t.initiative_id = ${initiatives.id} and t.status = 'bloqueada')`,
  evidencesCount: sql<number>`(select count(*) from evidences e where e.initiative_id = ${initiatives.id})`,
  resultsCount: sql<number>`(select count(*) from results r where r.initiative_id = ${initiatives.id})`,
  learningsProven: sql<number>`(select count(*) from learnings l where l.initiative_id = ${initiatives.id} and l.status = 'provado')`,
  milestonesCount: sql<number>`(select count(*) from milestones m where m.initiative_id = ${initiatives.id})`,
  validatedProcesses: sql<number>`(select count(*) from processes p where p.initiative_id = ${initiatives.id} and p.status in ('validado','escalando'))`,
  nextTask: sql<
    string | null
  >`(select t.title from tasks t where t.initiative_id = ${initiatives.id} and t.status in ('a_fazer','fazendo') order by t.position asc limit 1)`,
};

export async function listInitiatives(workspaceId: string): Promise<InitiativeSummary[]> {
  const rows = await db
    .select({
      id: initiatives.id,
      title: initiatives.title,
      objective: initiatives.objective,
      expectedResult: initiatives.expectedResult,
      stage: initiatives.stage,
      status: initiatives.status,
      priority: initiatives.priority,
      dueAt: initiatives.dueAt,
      updatedAt: initiatives.updatedAt,
      ...countsSelect,
    })
    .from(initiatives)
    .where(eq(initiatives.workspaceId, workspaceId))
    .orderBy(desc(initiatives.updatedAt));

  return rows.map((row) => {
    const reality: RealityInput = {
      stage: row.stage,
      milestones: Number(row.milestonesCount),
      tasks: Number(row.tasksTotal),
      tasksDone: Number(row.tasksDone),
      tasksBlocked: Number(row.tasksBlocked),
      evidences: Number(row.evidencesCount),
      results: Number(row.resultsCount),
      learningsProven: Number(row.learningsProven),
      validatedProcesses: Number(row.validatedProcesses),
    };
    return {
      ...row,
      tasksTotal: Number(row.tasksTotal),
      tasksDone: Number(row.tasksDone),
      tasksBlocked: Number(row.tasksBlocked),
      evidencesCount: Number(row.evidencesCount),
      resultsCount: Number(row.resultsCount),
      learningsProven: Number(row.learningsProven),
      milestonesCount: Number(row.milestonesCount),
      nextTask: row.nextTask,
      reality,
    };
  });
}

export async function getWorkspaceSnapshot(workspaceId: string) {
  const all = await listInitiatives(workspaceId);

  const active = all.filter((i) => i.status === "ativa");
  const blocked = active.filter((i) => i.tasksBlocked > 0);

  const next = await db
    .select({
      id: tasks.id,
      title: tasks.title,
      requiresEvidence: tasks.requiresEvidence,
      dueAt: tasks.dueAt,
      initiativeId: initiatives.id,
      initiativeTitle: initiatives.title,
      initiativeStage: initiatives.stage,
    })
    .from(tasks)
    .innerJoin(initiatives, eq(initiatives.id, tasks.initiativeId))
    .where(and(eq(initiatives.workspaceId, workspaceId), eq(tasks.status, "a_fazer")))
    .orderBy(sql`${tasks.dueAt} asc nulls last`, desc(initiatives.priority), tasks.position)
    .limit(1);

  const recent = await db
    .select({
      id: evidences.id,
      kind: evidences.kind,
      description: evidences.description,
      occurredAt: evidences.occurredAt,
      initiativeId: initiatives.id,
      initiativeTitle: initiatives.title,
    })
    .from(evidences)
    .innerJoin(initiatives, eq(initiatives.id, evidences.initiativeId))
    .where(eq(initiatives.workspaceId, workspaceId))
    .orderBy(desc(evidences.occurredAt))
    .limit(6);

  const weekAgo = new Date(Date.now() - 7 * 86_400_000);
  const evidencesThisWeek = recent.filter((e) => e.occurredAt >= weekAgo).length;

  const stageCounts = Array.from({ length: 10 }, (_, index) => ({
    index,
    count: active.filter((i) => i.stage === index).length,
  }));

  const validatedProcesses = all.reduce((acc, i) => acc + i.reality.validatedProcesses, 0);
  const measuredResults = all.reduce((acc, i) => acc + i.resultsCount, 0);

  return {
    initiatives: all,
    active,
    blocked,
    nextStep: next[0] ?? null,
    recentEvidence: recent,
    evidencesThisWeek,
    stageCounts,
    totals: {
      active: active.length,
      blocked: blocked.length,
      evidences: all.reduce((acc, i) => acc + i.evidencesCount, 0),
      evidencesThisWeek,
      results: measuredResults,
      validatedProcesses,
      tasksOpen: active.reduce((acc, i) => acc + (i.tasksTotal - i.tasksDone), 0),
    },
  };
}

export async function getInitiative(workspaceId: string, initiativeId: string) {
  const [initiative] = await db
    .select()
    .from(initiatives)
    .where(and(eq(initiatives.id, initiativeId), eq(initiatives.workspaceId, workspaceId)))
    .limit(1);

  if (!initiative) return null;

  const [milestoneRows, taskRows, evidenceRows, resultRows, learningRows, processRows] = await Promise.all([
    db.select().from(milestones).where(eq(milestones.initiativeId, initiativeId)).orderBy(milestones.position),
    db
      .select({
        id: tasks.id,
        title: tasks.title,
        status: tasks.status,
        requiresEvidence: tasks.requiresEvidence,
        dueAt: tasks.dueAt,
        milestoneId: tasks.milestoneId,
        position: tasks.position,
        completedAt: tasks.completedAt,
      })
      .from(tasks)
      .where(eq(tasks.initiativeId, initiativeId))
      .orderBy(tasks.position),
    db
      .select()
      .from(evidences)
      .where(eq(evidences.initiativeId, initiativeId))
      .orderBy(desc(evidences.occurredAt)),
    db.select().from(results).where(eq(results.initiativeId, initiativeId)).orderBy(desc(results.measuredAt)),
    db.select().from(learnings).where(eq(learnings.initiativeId, initiativeId)).orderBy(desc(learnings.createdAt)),
    db.select().from(processes).where(eq(processes.initiativeId, initiativeId)).orderBy(desc(processes.updatedAt)),
  ]);

  const input: RealityInput = {
    stage: initiative.stage,
    milestones: milestoneRows.length,
    tasks: taskRows.length,
    tasksDone: taskRows.filter((t) => t.status === "feita").length,
    tasksBlocked: taskRows.filter((t) => t.status === "bloqueada").length,
    evidences: evidenceRows.length,
    results: resultRows.length,
    learningsProven: learningRows.filter((l) => l.status === "provado").length,
    validatedProcesses: processRows.filter((p) => p.status !== "rascunho").length,
  };

  return {
    initiative,
    milestones: milestoneRows,
    tasks: taskRows,
    evidences: evidenceRows,
    results: resultRows,
    learnings: learningRows,
    processes: processRows,
    reality: realityReport(input),
  };
}

export async function listProcesses(workspaceId: string) {
  return db
    .select({
      id: processes.id,
      name: processes.name,
      summary: processes.summary,
      status: processes.status,
      version: processes.version,
      steps: processes.steps,
      updatedAt: processes.updatedAt,
      initiativeTitle: initiatives.title,
    })
    .from(processes)
    .leftJoin(initiatives, eq(initiatives.id, processes.initiativeId))
    .where(eq(processes.workspaceId, workspaceId))
    .orderBy(desc(processes.updatedAt));
}
