import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { AppShell } from "@/components/app-shell";
import { cn, formatDate } from "@/lib/ui";
import { listInitiatives } from "@/lib/domain/queries";
import type { DimensionKey } from "@/lib/domain/intake";

export const dynamic = "force-dynamic";

const DIMENSIONS: { key: DimensionKey; label: string; desc: string; color: string }[] = [
  { key: "tecnologia", label: "Tecnologia", desc: "Executa. Automatiza. Escala.", color: "blue" },
  { key: "negocios", label: "Negócios", desc: "Direciona. Prioriza. Monetiza.", color: "gold" },
  { key: "criatividade", label: "Criatividade", desc: "Inova. Diferencia. Surpreende.", color: "green" },
  { key: "conhecimento", label: "Conhecimento", desc: "Acumula. Organiza. Alimenta.", color: "red" },
  { key: "pessoas", label: "Pessoas", desc: "Conectam. Relacionam. Constroem.", color: "ink" },
  { key: "expressao", label: "Expressão", desc: "Comunica. Posiciona. Vende.", color: "blue" },
];

export default async function DimensoesPage() {
  const user = await requireUser();
  const all = await listInitiatives(user.workspaceId);

  return (
    <AppShell user={user} active="/dimensoes">
      <header className="mb-8">
        <div className="eyebrow">Dimensões do sistema</div>
        <h1 className="mt-2 text-[34px] leading-tight">Seis dimensões. Um sistema.</h1>
        <p className="mt-2 max-w-[58ch] text-sm text-muted">
          Tecnologia + Negócios + Criatividade + Conhecimento + Pessoas + Expressão.
          Essas dimensões não competem — se complementam. A IA é a cola.
        </p>
      </header>

      <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
        {DIMENSIONS.map((dim) => {
          const items = all.filter((i) => i.dimension === dim.key);
          return (
            <div key={dim.key} className="card card-pad">
              <div className="flex items-center justify-between">
                <div>
                  <div className="eyebrow">{dim.label}</div>
                  <p className="mt-1 text-[12px] text-muted">{dim.desc}</p>
                </div>
                <span className="font-serif text-2xl">{items.length}</span>
              </div>
              <div className="divider my-3" />
              {items.length === 0 ? (
                <p className="text-[12px] text-muted">Nenhum projeto nesta dimensão ainda.</p>
              ) : (
                <ul className="space-y-2">
                  {items.slice(0, 5).map((i) => (
                    <li key={i.id}>
                      <Link href={`/initiatives/${i.id}`} className="flex items-center justify-between gap-2 text-[13px] hover:text-ink">
                        <span className="truncate">{i.title}</span>
                        <span className="text-[11px] text-muted">{i.tasksDone}/{i.tasksTotal}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}
