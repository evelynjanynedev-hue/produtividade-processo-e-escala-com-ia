import Link from "next/link";
import { ArrowRight, FileText, Plus, Search, Tag } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { AppShell } from "@/components/app-shell";
import { cn, formatDate } from "@/lib/ui";
import { listKnowledge } from "@/lib/domain/queries";

export const dynamic = "force-dynamic";

const DOC_CATEGORIES = ["documentacao", "processo", "acao_ia", "decisao", "insight", "recurso"];

export default async function DocumentacaoPage() {
  const user = await requireUser();
  const all = await listKnowledge(user.workspaceId);
  const items = all.filter((item) => DOC_CATEGORIES.includes(item.category));

  return (
    <AppShell user={user} active="/documentacao">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="eyebrow">Documentação do processo</div>
          <h1 className="mt-2 text-[34px] leading-tight">Tudo documentado. Nada se perde.</h1>
          <p className="mt-2 max-w-[58ch] text-sm text-muted">
            Registre o que você pediu, o que a IA fez, os processos que funcionaram e as decisões tomadas.
            Estrutura, clareza e visual — para o caos virar linha reta.
          </p>
        </div>
        <Link href="/documentacao/new" className="btn btn-primary">
          <Plus className="h-4 w-4" /> Nova documentação
        </Link>
      </header>

      {items.length === 0 ? (
        <div className="card p-8 text-center text-sm text-muted">
          <FileText className="mx-auto mb-3 h-8 w-8 text-muted/50" />
          <p>Nenhuma documentação registrada ainda.</p>
          <p className="mt-1">Documente o que você pediu, o que a IA fez e os processos que funcionaram.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className="card card-pad">
              <div className="flex flex-wrap items-center gap-2">
                <span className="badge border-blue/30 bg-blue/5 text-blue">{item.category}</span>
                {item.tags.map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-1 rounded-full border border-line px-2 py-0.5 text-[10px] text-muted">
                    <Tag className="h-2.5 w-2.5" /> {tag}
                  </span>
                ))}
                {item.source && (
                  <span className="text-[10px] text-muted">fonte: {item.source}</span>
                )}
                <span className="ml-auto text-[11px] text-muted">{formatDate(item.updatedAt)}</span>
              </div>
              <h3 className="mt-2 text-[19px] leading-tight">{item.title}</h3>
              <p className="mt-1.5 whitespace-pre-wrap text-[13px] leading-relaxed text-muted">{item.content}</p>
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
