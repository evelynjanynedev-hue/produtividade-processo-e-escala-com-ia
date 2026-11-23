export type StageKey =
  | "intencao"
  | "clareza"
  | "estrutura"
  | "plano"
  | "acao"
  | "evidencia"
  | "resultado"
  | "aprendizado"
  | "padronizacao"
  | "escala";

export type Stage = {
  key: StageKey;
  index: number;
  label: string;
  short: string;
  question: string;
  color: "gold" | "blue" | "green" | "red" | "ink";
};

export const STAGES: Stage[] = [
  {
    key: "intencao",
    index: 0,
    label: "Intenção",
    short: "Intenção",
    question: "O que você quer que exista?",
    color: "ink",
  },
  {
    key: "clareza",
    index: 1,
    label: "Clareza",
    short: "Clareza",
    question: "Qual é o objetivo real, em uma frase?",
    color: "gold",
  },
  {
    key: "estrutura",
    index: 2,
    label: "Estrutura",
    short: "Estrutura",
    question: "Quais são as etapas?",
    color: "gold",
  },
  {
    key: "plano",
    index: 3,
    label: "Plano",
    short: "Plano",
    question: "Qual é a menor ação de hoje?",
    color: "blue",
  },
  {
    key: "acao",
    index: 4,
    label: "Ação",
    short: "Ação",
    question: "O que já saiu do papel?",
    color: "blue",
  },
  {
    key: "evidencia",
    index: 5,
    label: "Evidência",
    short: "Evidência",
    question: "Qual é a prova de que aconteceu?",
    color: "blue",
  },
  {
    key: "resultado",
    index: 6,
    label: "Resultado",
    short: "Resultado",
    question: "Que número isso moveu?",
    color: "green",
  },
  {
    key: "aprendizado",
    index: 7,
    label: "Aprendizado",
    short: "Aprendizado",
    question: "O que funcionou, para quem e por quê?",
    color: "green",
  },
  {
    key: "padronizacao",
    index: 8,
    label: "Padronização",
    short: "Processo",
    question: "Como repetir sem depender de sorte?",
    color: "red",
  },
  {
    key: "escala",
    index: 9,
    label: "Escala",
    short: "Escala",
    question: "O que pode ser repetido, automatizado e delegado?",
    color: "red",
  },
];

export function stageOf(index: number): Stage {
  return STAGES[Math.min(Math.max(index, 0), STAGES.length - 1)];
}

export const EVIDENCE_KINDS = [
  { value: "entrega", label: "Entrega produzida" },
  { value: "arquivo", label: "Arquivo criado" },
  { value: "publicacao", label: "Publicação realizada" },
  { value: "contato", label: "Cliente contatado" },
  { value: "reuniao", label: "Reunião realizada" },
  { value: "venda", label: "Venda realizada" },
  { value: "receita", label: "Receita gerada" },
  { value: "metrica", label: "Métrica registrada" },
  { value: "feedback", label: "Feedback recebido" },
  { value: "processo", label: "Processo documentado" },
  { value: "outro", label: "Outra prova" },
] as const;

export type EvidenceKind = (typeof EVIDENCE_KINDS)[number]["value"];

export const EVIDENCE_WEIGHT: Record<EvidenceKind, string> = {
  entrega: "prova de execução",
  arquivo: "prova de execução",
  publicacao: "prova pública",
  contato: "prova de movimento",
  reuniao: "prova de movimento",
  venda: "prova de resultado",
  receita: "prova de resultado",
  metrica: "prova de resultado",
  feedback: "prova de mercado",
  processo: "prova de método",
  outro: "prova",
};
