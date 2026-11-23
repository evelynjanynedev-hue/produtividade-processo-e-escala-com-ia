import Link from "next/link";
import { listInitiatives } from "@/lib/domain/queries";
import { requireUser } from "@/lib/auth/session";
import { AppShell } from "@/components/app-shell";
import { createProcessAction } from "@/lib/domain/actions";

export const dynamic = "force-dynamic";

export default async function NewProcessPage() {
  const user = await requireUser();
  const initiatives = await listInitiatives(user.workspaceId);

  return (
    <AppShell user={user} active="/processes">
      <header className="mb-8">
        <div className="flex flex-wrap items-center gap-2 text-[12px] text-muted">
          <Link href="/processes" className="link">Processos</Link>
        </div>
        <h1 className="mt-2 text-[34px] leading-tight">Criar processo</h1>
      </header>

      <form action={createProcessAction} className="card card-pad space-y-4">
        <input type="hidden" name="initiativeId" value={initiatives[0].id ?? ""} />
        <div>
          <label className="label" htmlFor="name">Nome do processo</label>
          <input id="name" name="name" type="text" required className="field" placeholder="Ex.: Processo de prospecção" />
        </div>
        <div>
          <label className="label" htmlFor="summary">Resumo</label>
          <textarea id="summary" name="summary" rows={2} className="field" placeholder="Resumo do processo (opcional)" />
        </div>
        <div>
          <label className="label" htmlFor="steps">Passos (um por linha)</label>
          <textarea id="steps" name="steps" rows={5} required className="field" placeholder="Um passo por linha" />
        </div>
        <button type="submit" className="btn btn-primary w-full">
          Criar
        </button>
      </form>
    </AppShell>
  );
}
