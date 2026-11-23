import { STAGES, stageOf, type Stage } from "./stages";

export type RealityInput = {
  stage: number;
  milestones: number;
  tasks: number;
  tasksDone: number;
  tasksBlocked: number;
  evidences: number;
  results: number;
  learningsProven: number;
  validatedProcesses: number;
};

export type Check = {
  label: string;
  ok: boolean;
  hint: string;
};

export type RealityReport = {
  stage: Stage;
  nextStage: Stage | null;
  canAdvance: boolean;
  checks: Check[];
  blockers: string[];
  label: string;
  sentence: string;
  isValidated: boolean;
};

/**
 * REGRA DE REALIDADE
 * Uma ideia não vira resultado só porque foi escrita.
 * Um plano não vira execução só porque foi criado.
 * Uma tarefa concluída não vira sucesso sem prova e sem número.
 *
 * Cada avanço de etapa tem um pré-requisito observável.
 */
export function realityReport(input: RealityInput): RealityReport {
  const stage = stageOf(input.stage);
  const nextStage = input.stage >= STAGES.length - 1 ? null : stageOf(input.stage + 1);

  const checks: Check[] = [
    {
      label: "Objetivo em uma frase",
      ok: input.stage >= 1,
      hint: "Sem objetivo claro, tudo vira urgência.",
    },
    {
      label: "Estrutura com etapas",
      ok: input.milestones > 0,
      hint: "Quebre o objetivo em etapas antes de executar.",
    },
    {
      label: "Tarefa executável",
      ok: input.tasks > 0,
      hint: "Plano sem tarefa é intenção com boa redação.",
    },
    {
      label: "Algo saiu do papel",
      ok: input.tasksDone > 0,
      hint: "Marque como feita a primeira ação real.",
    },
    {
      label: "Evidência registrada",
      ok: input.evidences > 0,
      hint: "Qual é a prova de que isso aconteceu?",
    },
    {
      label: "Resultado medido",
      ok: input.results > 0,
      hint: "Prova mostra que aconteceu. Resultado mostra o que mudou.",
    },
    {
      label: "Aprendizado provado",
      ok: input.learningsProven > 0,
      hint: "O que funcionou, para quem e em qual contexto?",
    },
    {
      label: "Processo validado",
      ok: input.validatedProcesses > 0,
      hint: "Só escale o que já provou funcionar.",
    },
  ];

  const gate = gateFor(input);
  const blockers = gate.blockers;

  const label = realityLabel(input);
  const sentence = sentenceFor(label);

  return {
    stage,
    nextStage,
    canAdvance: blockers.length === 0 && nextStage !== null,
    checks,
    blockers,
    label,
    sentence,
    isValidated: input.evidences > 0 && input.results > 0 && input.learningsProven > 0,
  };
}

function gateFor(input: RealityInput): { blockers: string[] } {
  const next = input.stage + 1;

  if (next >= STAGES.length) {
    return { blockers: ["Este projeto já está em escala."] };
  }

  const blockers: string[] = [];

  const requires: Partial<Record<number, [boolean, string]>> = {
    2: [input.milestones > 0, "Adicione pelo menos uma etapa."],
    3: [input.tasks > 0, "Transforme uma etapa em tarefa."],
    4: [input.tasksDone > 0, "Conclua uma tarefa antes de falar em ação."],
    5: [input.tasksDone > 0, "Registre a execução: uma tarefa feita, no mínimo."],
    6: [input.evidences > 0, "Sem evidência não existe resultado. Registre a prova."],
    7: [input.results > 0, "Meça um número antes de gerar aprendizado."],
    8: [input.learningsProven > 0, "Marque um aprendizado como provado."],
    9: [input.validatedProcesses > 0, "Documente o processo e valide antes de escalar."],
  };

  const rule = requires[next];
  if (rule && !rule[0]) blockers.push(rule[1]);

  if (input.tasksBlocked > 0 && next === 5) {
    blockers.push("Existem tarefas bloqueadas. Resolva o bloqueio antes de avançar.");
  }

  return { blockers };
}

/**
 * O rótulo nunca mente: ele descreve o maior nível que possui prova.
 */
function realityLabel(input: RealityInput): string {
  if (input.stage >= 9) return "Escalável";
  if (input.validatedProcesses > 0) return "Processo validado";
  if (input.learningsProven > 0) return "Aprendizado provado";
  if (input.results > 0) return "Resultado com prova";
  if (input.evidences > 0) return "Execução com prova";
  if (input.tasksDone > 0) return "Execução em curso";
  if (input.tasks > 0) return "Plano em execução";
  if (input.milestones > 0) return "Estrutura definida";
  if (input.stage >= 1) return "Intenção clara";
  return "Ideia";
}

function sentenceFor(label: string): string {
  switch (label) {
    case "Escalável":
      return "Tem processo, tem prova, tem número. Pode crescer.";
    case "Processo validado":
      return "Já pode ser repetido por outra pessoa sem você no meio.";
    case "Aprendizado provado":
      return "Você sabe o que funcionou — agora transforme em processo.";
    case "Resultado com prova":
      return "Existe número e existe prova. Falta virar método.";
    case "Execução com prova":
      return "Saiu do papel e pode ser mostrado. Meça o efeito.";
    case "Execução em curso":
      return "Tem movimento, mas ainda sem prova registrada.";
    case "Plano em execução":
      return "Existe caminho. Falta a primeira ação concreta.";
    case "Estrutura definida":
      return "Tem etapas. Falta virar tarefa de hoje.";
    case "Intenção clara":
      return "Objetivo definido. Falta estrutura.";
    default:
      return "Ainda é ideia. Nada aqui conta como resultado.";
  }
}
