import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

/* ══════════════════════════════════════════════════════════════════
   ENUMS
   ══════════════════════════════════════════════════════════════════ */

export const roleEnum = pgEnum("app_role", ["owner", "admin", "member"]);

export const initiativeStatusEnum = pgEnum("app_initiative_status", [
  "ativa",
  "pausada",
  "arquivada",
]);

export const priorityEnum = pgEnum("app_priority", ["baixa", "media", "alta"]);

export const taskStatusEnum = pgEnum("app_task_status", [
  "a_fazer",
  "fazendo",
  "feita",
  "bloqueada",
]);

export const evidenceKindEnum = pgEnum("app_evidence_kind", [
  "entrega",
  "arquivo",
  "publicacao",
  "contato",
  "reuniao",
  "venda",
  "receita",
  "metrica",
  "feedback",
  "processo",
  "outro",
]);

export const learningStatusEnum = pgEnum("app_learning_status", [
  "aberto",
  "provado",
  "descartado",
]);

export const processStatusEnum = pgEnum("app_process_status", [
  "rascunho",
  "validado",
  "escalando",
]);

/* ══════════════════════════════════════════════════════════════════
   IDENTIDADE
   ══════════════════════════════════════════════════════════════════ */

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("users_email_unique").on(t.email)],
);

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("sessions_token_unique").on(t.tokenHash),
    index("sessions_user_idx").on(t.userId),
  ],
);

/* ══════════════════════════════════════════════════════════════════
   ESPAÇO DE TRABALHO (multi-tenant desde o primeiro dia)
   ══════════════════════════════════════════════════════════════════ */

export const workspaces = pgTable("workspaces", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const memberships = pgTable(
  "memberships",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: roleEnum("role").notNull().default("owner"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("memberships_unique").on(t.workspaceId, t.userId),
    index("memberships_user_idx").on(t.userId),
  ],
);

/* ══════════════════════════════════════════════════════════════════
   NÚCLEO: INTENÇÃO → ESCALA
   stage: 0 intenção · 1 clareza · 2 estrutura · 3 plano · 4 ação
          5 evidência · 6 resultado · 7 aprendizado · 8 padronização · 9 escala
   ══════════════════════════════════════════════════════════════════ */

export const initiatives = pgTable(
  "initiatives",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    intent: text("intent").notNull(),
    vision: text("vision").notNull().default(""),
    objective: text("objective").notNull(),
    expectedResult: text("expected_result").notNull(),
    stage: integer("stage").notNull().default(0),
    status: initiativeStatusEnum("status").notNull().default("ativa"),
    priority: priorityEnum("priority").notNull().default("media"),
    dueAt: timestamp("due_at", { withTimezone: true }),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("initiatives_workspace_idx").on(t.workspaceId, t.status),
    index("initiatives_stage_idx").on(t.workspaceId, t.stage),
  ],
);

export const milestones = pgTable(
  "milestones",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    initiativeId: uuid("initiative_id")
      .notNull()
      .references(() => initiatives.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    position: integer("position").notNull().default(0),
    done: boolean("done").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("milestones_initiative_idx").on(t.initiativeId, t.position)],
);

export const tasks = pgTable(
  "tasks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    initiativeId: uuid("initiative_id")
      .notNull()
      .references(() => initiatives.id, { onDelete: "cascade" }),
    milestoneId: uuid("milestone_id").references(() => milestones.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    status: taskStatusEnum("status").notNull().default("a_fazer"),
    requiresEvidence: boolean("requires_evidence").notNull().default(false),
    dueAt: timestamp("due_at", { withTimezone: true }),
    position: integer("position").notNull().default(0),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("tasks_initiative_idx").on(t.initiativeId, t.status),
    index("tasks_due_idx").on(t.dueAt),
  ],
);

export const evidences = pgTable(
  "evidences",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    initiativeId: uuid("initiative_id")
      .notNull()
      .references(() => initiatives.id, { onDelete: "cascade" }),
    taskId: uuid("task_id").references(() => tasks.id, { onDelete: "set null" }),
    kind: evidenceKindEnum("kind").notNull().default("entrega"),
    description: text("description").notNull(),
    url: text("url"),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).defaultNow().notNull(),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("evidences_initiative_idx").on(t.initiativeId, t.occurredAt)],
);

export const results = pgTable(
  "results",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    initiativeId: uuid("initiative_id")
      .notNull()
      .references(() => initiatives.id, { onDelete: "cascade" }),
    evidenceId: uuid("evidence_id").references(() => evidences.id, { onDelete: "set null" }),
    metric: text("metric").notNull(),
    value: numeric("value", { precision: 14, scale: 2 }).notNull(),
    target: numeric("target", { precision: 14, scale: 2 }),
    unit: text("unit").notNull().default("un"),
    measuredAt: timestamp("measured_at", { withTimezone: true }).defaultNow().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("results_initiative_idx").on(t.initiativeId, t.measuredAt)],
);

export const learnings = pgTable(
  "learnings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    initiativeId: uuid("initiative_id")
      .notNull()
      .references(() => initiatives.id, { onDelete: "cascade" }),
    insight: text("insight").notNull(),
    context: text("context").notNull().default(""),
    status: learningStatusEnum("status").notNull().default("aberto"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("learnings_initiative_idx").on(t.initiativeId)],
);

export const processes = pgTable(
  "processes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    initiativeId: uuid("initiative_id").references(() => initiatives.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    summary: text("summary").notNull().default(""),
    steps: jsonb("steps").$type<{ title: string; owner?: string; detail?: string }[]>().notNull().default([]),
    status: processStatusEnum("status").notNull().default("rascunho"),
    version: integer("version").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("processes_workspace_idx").on(t.workspaceId, t.status)],
);

/* ══════════════════════════════════════════════════════════════════
   RASTREABILIDADE
   ══════════════════════════════════════════════════════════════════ */

export const activityEvents = pgTable(
  "activity_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    initiativeId: uuid("initiative_id").references(() => initiatives.id, { onDelete: "cascade" }),
    actorId: uuid("actor_id").references(() => users.id, { onDelete: "set null" }),
    verb: text("verb").notNull(),
    summary: text("summary").notNull(),
    meta: jsonb("meta").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("activity_workspace_idx").on(t.workspaceId, t.createdAt)],
);

/* ══════════════════════════════════════════════════════════════════
   RELAÇÕES (para queries tipadas com `db.query`)
   ══════════════════════════════════════════════════════════════════ */

export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  memberships: many(memberships),
}));

export const workspacesRelations = relations(workspaces, ({ many }) => ({
  memberships: many(memberships),
  initiatives: many(initiatives),
  processes: many(processes),
}));

export const membershipsRelations = relations(memberships, ({ one }) => ({
  workspace: one(workspaces, { fields: [memberships.workspaceId], references: [workspaces.id] }),
  user: one(users, { fields: [memberships.userId], references: [users.id] }),
}));

export const initiativesRelations = relations(initiatives, ({ one, many }) => ({
  workspace: one(workspaces, { fields: [initiatives.workspaceId], references: [workspaces.id] }),
  milestones: many(milestones),
  tasks: many(tasks),
  evidences: many(evidences),
  results: many(results),
  learnings: many(learnings),
}));

export const milestonesRelations = relations(milestones, ({ one, many }) => ({
  initiative: one(initiatives, { fields: [milestones.initiativeId], references: [initiatives.id] }),
  tasks: many(tasks),
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  initiative: one(initiatives, { fields: [tasks.initiativeId], references: [initiatives.id] }),
  milestone: one(milestones, { fields: [tasks.milestoneId], references: [milestones.id] }),
  evidences: many(evidences),
}));

export const evidencesRelations = relations(evidences, ({ one }) => ({
  initiative: one(initiatives, { fields: [evidences.initiativeId], references: [initiatives.id] }),
  task: one(tasks, { fields: [evidences.taskId], references: [tasks.id] }),
}));

export const resultsRelations = relations(results, ({ one }) => ({
  initiative: one(initiatives, { fields: [results.initiativeId], references: [initiatives.id] }),
  evidence: one(evidences, { fields: [results.evidenceId], references: [evidences.id] }),
}));

export const learningsRelations = relations(learnings, ({ one }) => ({
  initiative: one(initiatives, { fields: [learnings.initiativeId], references: [initiatives.id] }),
}));

export const processesRelations = relations(processes, ({ one }) => ({
  workspace: one(workspaces, { fields: [processes.workspaceId], references: [workspaces.id] }),
  initiative: one(initiatives, { fields: [processes.initiativeId], references: [initiatives.id] }),
}));
