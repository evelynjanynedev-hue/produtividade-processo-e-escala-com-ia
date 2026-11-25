import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { AppShell } from "@/components/app-shell";
import { addKnowledgeAction } from "@/lib/domain/actions";

export const dynamic = "force-dynamic";

export default async function NewDocumentacaoPage() {
  const user = await requireUser();

  return (
    <AppShell user={user} active="/documentacao">
      <header className="mb-8">
        <div className="flex flex-wrap items-center gap-2 text-[12px] text-muted">
          <Link href="/documentacao" className="link">Documentação</Link>
        </div>
        <h1 className="mt-2 text-[34px] leading-tight">Nova documentação.</h1>
        <p className="mt-2 max-w-[54ch] text-sm text-muted">
          Registre o que você pediu, o que a IA fez, o processo que funcionou ou a decisão tomada.
        </p>
      </header>

      <form action={addKnowledgeAction} className="card card-pad space-y-4">
        <div>
          <label className="label" htmlFor="title">Título</label>
          <input id="title" name="title" type="text" required className="field" placeholder="Ex.: Processo de criação do carrossel de propósito" />
        </div>
        <div>
          <label className="label" htmlFor="content">Conteúdo</label>
          <textarea id="content" name="content" required rows={8} className="field" placeholder="Descreva o processo, o que foi pedido, o que a IA fez, o resultado..." />
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="w-44">
            <label className="label" htmlFor="category">Tipo</label>
            <select id="category" name="category" className="field" defaultValue="documentacao">
              <option value="documentacao">Documentação</option>
              <option value="processo">Processo</option>
              <option value="acao_ia">Ação da IA</option>
              <option value="decisao">Decisão</option>
              <option value="insight">Insight</option>
              <option value="recurso">Recurso</option>
              <option value="outro">Outro</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="label" htmlFor="tags">Tags (separadas por vírgula)</label>
            <input id="tags" name="tags" type="text" className="field" placeholder="ex.: carrossel, propósito, marketing" />
          </div>
          <div className="w-48">
            <label className="label" htmlFor="source">Fonte (opcional)</label>
            <input id="source" name="source" type="text" className="field" placeholder="De onde veio?" />
          </div>
          <div className="w-52">
            <label className="label" htmlFor="initiativeId">Projeto (opcional)</label>
            <input id="initiativeId" name="initiativeId" type="text" className="field" placeholder="ID do projeto" />
          </div>
        </div>
        <button type="submit" className="btn btn-primary w-full">
          Salvar documentação
        </button>
      </form>
    </AppShell>
  );
}
