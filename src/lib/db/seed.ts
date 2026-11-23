import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL ?? "postgres://localhost:5432/execucao";
const client = postgres(connectionString, { prepare: false });
const db = drizzle(client, { schema });

async function seed() {
  // 1. Cria usuário demo
  const [demoUser] = await db.insert(schema.users).values({
    name: "Demo Usuário",
    email: "demo@sistema.dev",
    passwordHash: await bcrypt.hash("demo1234", 12),
    createdAt: new Date(),
  }).returning();

  // 2. Cria workspace demo
  const [workspace] = await db.insert(schema.workspaces).values({
    name: "Sistema de Execução",
    createdAt: new Date(),
  }).returning();

  // 3. Cria associação demo
  await db.insert(schema.memberships).values({
    workspaceId: workspace.id,
    userId: demoUser.id,
    role: "owner" as const,
  });

  // 4. Cria 4 iniciativas em diferentes estágios
  const stages = [
    { title: "Projeto Estratégico", stage: 0, priority: "alta" },
    { title: "Projeto em Andamento", stage: 3, priority: "media" },
    { title: "Projeto Pausado", stage: 1, priority: "baixa" },
    { title: "Projeto Arquivado", stage: 2, priority: "baixa" },
  ];

  const createdInitiatives = await Promise.all(
    stages.map((s) =>
      db.transaction(async (tx) => {
        const [created] = await tx.insert(schema.initiatives).values({
          workspaceId: workspace.id,
          title: s.title,
          intent: `Objetivo ${s.title}`,
          objective: `Realizar ${s.title} com foco em execução e evidência`,
          expectedResult: `Entregar ${s.title} com métricas comprovadas`,
          stage: s.stage,
          priority: s.priority as "alta" | "media" | "baixa",
          createdBy: demoUser.id,
          createdAt: new Date(),
        }).returning();

        // Milestones e tarefas
        const milestonePositions: string[] = [];
        for (let i = 0; i < 3; i++) {
          const [milestone] = await tx.insert(schema.milestones).values({
            initiativeId: created.id,
            title: `Marco ${i + 1}`,
            position: i,
            done: false,
            createdAt: new Date(),
          }).returning();
          milestonePositions.push(milestone.id);
        }

        for (let i = 0; i < 5; i++) {
          await tx.insert(schema.tasks).values({
            initiativeId: created.id,
            milestoneId: milestonePositions[i % milestonePositions.length],
            title: `Tarefa ${i + 1}`,
            requiresEvidence: i % 3 === 0,
            position: i,
            createdAt: new Date(),
          });
        }

        return created.id;
      })
    )
  );

  // 5. Evidências
  await db.insert(schema.evidences).values([
    {
      initiativeId: createdInitiatives[0],
      taskId: null,
      kind: "entrega" as const,
      description: "Proposta enviada ao cliente X",
      url: "https://exemplo.com/proposta-x",
      createdBy: demoUser.id,
    },
    {
      initiativeId: createdInitiatives[1],
      taskId: null,
      kind: "contato" as const,
      description: "Reunião com cliente Y",
      createdBy: demoUser.id,
    },
  ]);

  // 6. Resultados
  await db.insert(schema.results).values([
    {
      initiativeId: createdInitiatives[0],
      metric: "Receita",
      value: "125000",
      unit: "reais",
      measuredAt: new Date(),
    },
    {
      initiativeId: createdInitiatives[1],
      metric: "Alcance",
      value: "5200",
      unit: "clientes",
      measuredAt: new Date(),
    },
  ]);

  // 7. Aprendizados
  await db.insert(schema.learnings).values([
    {
      initiativeId: createdInitiatives[0],
      insight: "Estratégia de precificação aumenta taxa de conversão",
      context: "Teste A/B com dois preços",
      status: "provado" as const,
    },
    {
      initiativeId: createdInitiatives[1],
      insight: "Reuniões curtas mantêm foco",
      context: "30 minutos com agenda definida",
      status: "provado" as const,
    },
  ]);

  // 8. Processos
  await db.insert(schema.processes).values([
    {
      workspaceId: workspace.id,
      initiativeId: createdInitiatives[0],
      name: "Processo de Vendas",
      summary: "Estratégia completa para fechar clientes",
      steps: [
        { title: "Identificar lead" },
        { title: "Contatar lead" },
        { title: "Apresentar proposta" },
        { title: "Fechar contrato" },
        { title: "Entregar resultado" },
      ],
      status: "validado" as const,
    },
  ]);

  // 9. Log de atividade
  await db.insert(schema.activityEvents).values({
    workspaceId: workspace.id,
    initiativeId: createdInitiatives[0],
    actorId: demoUser.id,
    verb: "iniciativa.criada",
    summary: "Projeto Estratégico criado com 4 marcos e 15 tarefas",
    meta: { createdBy: demoUser.id },
  });

  console.log("Seed concluído.");
  await client.end();
}

seed().catch((e) => {
  console.error("Erro no seed:", e);
  process.exit(1);
});