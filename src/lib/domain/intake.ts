/**
 * MOTOR DE INTAKE
 *
 * Transforma texto solto em estrutura executável, sem depender de LLM.
 * Regras determinísticas + templates por tipo de projeto. Quando houver
 * um provedor de IA configurado, este módulo é o ponto de troca: basta
 * implementar a mesma interface `IntakeEngine`.
 */

export type DraftTask = {
  title: string;
  requiresEvidence: boolean;
};

export type DraftMilestone = {
  title: string;
  tasks: DraftTask[];
};

export type IntakeSignal = {
  kind: "objetivo" | "resultado" | "prazo" | "público" | "tipo";
  value: string;
};

export type IntakeDraft = {
  title: string;
  objective: string;
  expectedResult: string;
  vision: string;
  milestones: DraftMilestone[];
  signals: IntakeSignal[];
};

export type IntakeEngine = (intent: string) => IntakeDraft;

const MILESTONE_TEMPLATES = {
  negocio: [
    { title: "Validar a dor", tasks: ["Conversar com 5 clientes potenciais", "Escrever a dor em uma frase"] },
    { title: "Desenhar a oferta", tasks: ["Escrever a oferta em 1 página", "Definir preço e escopo"] },
    { title: "Prospectar", tasks: ["Listar 20 contatos ideais", "Enviar 10 abordagens"] },
    { title: "Vender", tasks: ["Realizar 5 reuniões", "Fechar o primeiro cliente"] },
    { title: "Entregar e medir", tasks: ["Entregar o primeiro resultado", "Medir satisfação e prazo"] },
    { title: "Documentar e escalar", tasks: ["Documentar o processo em 6 passos", "Repetir com o próximo cliente"] },
  ],
  conteudo: [
    { title: "Definir tese e público", tasks: ["Escrever a tese em uma frase", "Definir para quem é"] },
    { title: "Criar pauta", tasks: ["Listar 10 ideias de conteúdo"] },
    { title: "Publicar", tasks: ["Publicar a primeira peça", "Publicar 3 peças na semana"] },
    { title: "Medir resposta", tasks: ["Registrar alcance e salvamentos"] },
    { title: "Repetir o que funcionou", tasks: ["Reescrever o formato vencedor"] },
    { title: "Padronizar", tasks: ["Criar o checklist de produção"] },
  ],
  produto: [
    { title: "Entender o problema", tasks: ["Mapear 5 usuários reais", "Escrever o problema sem solução"] },
    { title: "Definir o escopo mínimo", tasks: ["Cortar tudo que não é essencial", "Escrever a versão 0.1"] },
    { title: "Construir", tasks: ["Entregar o fluxo principal", "Colocar em uso com 1 pessoa"] },
    { title: "Medir uso", tasks: ["Registrar primeira sessão real"] },
    { title: "Iterar", tasks: ["Corrigir o maior atrito"] },
    { title: "Escalar", tasks: ["Documentar o processo de entrega"] },
  ],
  pessoal: [
    { title: "Clarear o objetivo", tasks: ["Escrever o resultado em número"] },
    { title: "Estruturar a rotina", tasks: ["Reservar 30 minutos por dia"] },
    { title: "Executar a primeira ação", tasks: ["Fazer a menor versão hoje"] },
    { title: "Registrar evidência", tasks: ["Fotografar ou anotar o que foi feito"] },
    { title: "Medir constância", tasks: ["Contar os dias seguidos"] },
    { title: "Padronizar", tasks: ["Definir o gatilho diário"] },
  ],
} as const;

type TemplateKey = keyof typeof MILESTONE_TEMPLATES;

function detectTemplate(text: string): TemplateKey {
  const t = text.toLowerCase();
  if (/(empresa|neg[óo]cio|jur[íi]dic|cliente|vender|venda|servi[çc]o|consultoria)/.test(t)) {
    return "negocio";
  }
  if (/(conte[úu]do|post|instagram|marketing|audiência|audiencia|p[úu]blico)/.test(t)) {
    return "conteudo";
  }
  if (/(app|produto|sistema|plataforma|software|ferramenta)/.test(t)) {
    return "produto";
  }
  return "pessoal";
}

function firstSentence(text: string) {
  return text.split(/[.!?\n]/).map((s) => s.trim()).filter(Boolean)[0] ?? text.trim();
}

function toTitle(text: string) {
  const base = firstSentence(text)
    .replace(/^(eu\s+)?(quero|preciso|gostaria de|vou|estou querendo)\s+/i, "")
    .trim();
  const short = base.length > 64 ? `${base.slice(0, 61).trimEnd()}…` : base;
  return short.charAt(0).toUpperCase() + short.slice(1);
}

function extractResult(text: string): string | null {
  const numberWithUnit =
    /(\d[\d.,]*)\s*(clientes?|alunos?|reais|r\$|mil|k|%|vendas?|contratos?|seguidores?|leads?)/i.exec(text);
  if (numberWithUnit) {
    return `Chegar a ${numberWithUnit[0].trim()}`;
  }
  const money = /r\$\s*[\d.,]+/i.exec(text);
  if (money) return `Faturar ${money[0]}`;
  return null;
}

function extractDeadline(text: string): string | null {
  const match = /(em|at[ée]|nos pr[óo]ximos)\s+(\d+)\s*(dias?|semanas?|meses?)/i.exec(text);
  if (match) return `${match[2]} ${match[3]}`;
  return null;
}

function extractAudience(text: string): string | null {
  const match = /(?:ajudar|para|atender)\s+([^.,;]{3,60})/i.exec(text);
  if (!match) return null;
  return match[1].trim();
}

export const draftFromIntent: IntakeEngine = (rawIntent) => {
  const intent = rawIntent.trim();
  const templateKey = detectTemplate(intent);
  const template = MILESTONE_TEMPLATES[templateKey];

  const deadline = extractDeadline(intent);
  const concreteResult = extractResult(intent);
  const audience = extractAudience(intent);
  const objective = firstSentence(intent);

  const expectedResult =
    concreteResult ?? (deadline ? `Primeiro resultado observável em ${deadline}` : "Primeiro resultado observável em 30 dias");

  const signals: IntakeSignal[] = [
    { kind: "objetivo", value: objective.length > 120 ? `${objective.slice(0, 117)}…` : objective },
    { kind: "resultado", value: expectedResult },
    { kind: "tipo", value: templateKey },
  ];
  if (deadline) signals.push({ kind: "prazo", value: deadline });
  if (audience) signals.push({ kind: "público", value: audience });

  return {
    title: toTitle(intent),
    objective,
    expectedResult,
    vision: audience ? `Ser a melhor escolha para ${audience}.` : "",
    signals,
    milestones: template.map((milestone) => ({
      title: milestone.title,
      tasks: milestone.tasks.map((title) => ({
        title,
        requiresEvidence: /enviar|publicar|conversar|reuni|fechar|entregar|medir|realizar|prospectar/i.test(title),
      })),
    })),
  };
};
