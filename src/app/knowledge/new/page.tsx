import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { AppShell } from "@/components/app-shell";
import { addKnowledgeAction } from "@/lib/domain/actions";

export const dynamic = "force-dynamic";

export default async function NewKnowledgePage() {
  const user = await requireUser();

  return (
    <AppShell user={user} active="/knowledge">
      <header className="mb-8">
        <div className="flex flex-wrap items-center gap-2 text-[12px] text-muted">
          <Link href="/knowledge" className="link">Segundo cérebro</Link>
        </div>
        <h1 className="mt-2 text-[34px] leading-tight">Novo conhecimento.</h1>
      </header>

      <form action={addKnowledgeAction} className="card card-pad space-y-4">
        <div>
          <label className="label" htmlFor="title">Título</label>
          <input id="title" name="title" type="text" required className="field" placeholder="Ex.: O que aprendi sobre precificação" />
        </div>
        <div>
          <label className="label" htmlFor="content">Conteúdo</label>
          <textarea id="content" name="content" required rows={6} className="field" placeholder="Escreva o que aprendeu, decidiu ou descobriu..." />
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="w-40">
            <label className="label" htmlFor="category">Categoria</label>
            <select id="category" name="category" className="field" defaultValue="insight">
              <option value="insight">Insight</option>
              <option value="referencia">Referência</option>
              <option value="decisao">Decisão</option>
              <option value="contato">Contato</option>
              <option value="recurso">Recurso</option>
              <option value="ideia">Ideia</option>
              <option value="outro">Outro</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="label" htmlFor="tags">Tags (separadas por vírgula)</label>
            <input id="tags" name="tags" type="text" className="field" placeholder="ex.: vendas, precificação, cliente" />
          </div>
          <div className="w-48">
            <label className="label" htmlFor="source">Fonte (opcional)</label>
            <input id="source" name="source" type="text" className="field" placeholder="De onde veio?" />
          </div>
        </div>
        <button type="submit" className="btn btn-primary w-full">
          Salvar no segundo cérebro
        </button>
      </form>
    </AppShell>
  );
}
