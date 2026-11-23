import Link from "next/link";
import { ArrowRight, Brain, Plus, Search, Tag } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { AppShell } from "@/components/app-shell";
import { cn, formatDate } from "@/lib/ui";
import { listKnowledge } from "@/lib/domain/queries";

export const dynamic = "force-dynamic";

export default async function KnowledgePage() {
  const user = await requireUser();
  const items = await listKnowledge(user.workspaceId);

  return (
    <AppShell user={user} active="/knowledge">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="eyebrow">Segundo cérebro</div>
          <h1 className="mt-2 text-[34px] leading-tight">Base de conhecimento.</h1>
          <p className="mt-2 max-w-[54ch] text-sm text-muted">
            Tudo que você aprende, decide e descobre — organizado, buscável e conectado aos seus projetos.
            O caos vira linha reta.
          </p>
        </div>
        <Link href="/knowledge/new" className="btn btn-primary">
          <Plus className="h-4 w-4" /> Novo conhecimento
        </Link>
      </header>

      {items.length === 0 ? (
        <div className="card p-8 text-center text-sm text-muted">
          <Brain className="mx-auto mb-3 h-8 w-8 text-muted/50" />
          <p>Nenhum conhecimento registrado ainda.</p>
          <p className="mt-1">Escreva o que aprendeu, decidiu ou descobriu — o sistema organiza.</p>
        </div>
      ) : (
        <div className="card divide-y divide-line">
          {items.map((item) => (
            <div key={item.id} className="px-6 py-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="badge border-blue/30 bg-blue/5 text-blue">{item.category}</span>
                {item.tags.map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-1 rounded-full border border-line px-2 py-0.5 text-[10px] text-muted">
                    <Tag className="h-2.5 w-2.5" /> {tag}
                  </span>
                ))}
                <span className="ml-auto text-[11px] text-muted">{formatDate(item.updatedAt)}</span>
              </div>
              <h3 className="mt-2 text-[19px] leading-tight">{item.title}</h3>
              <p className="mt-1.5 line-clamp-3 text-[13px] leading-relaxed text-muted">{item.content}</p>
              {item.initiativeTitle && (
                <Link href={`/initiatives/${item.initiativeId}`} className="mt-2 inline-flex items-center gap-1 text-[11px] text-muted hover:text-ink">
                  <ArrowRight className="h-3 w-3" /> {item.initiativeTitle}
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
