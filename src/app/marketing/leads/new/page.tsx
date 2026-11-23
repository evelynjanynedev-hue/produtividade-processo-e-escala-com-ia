import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { AppShell } from "@/components/app-shell";
import { addLeadAction } from "@/lib/domain/actions";

export const dynamic = "force-dynamic";

export default async function NewLeadPage() {
  const user = await requireUser();

  return (
    <AppShell user={user} active="/marketing">
      <header className="mb-8">
        <div className="flex flex-wrap items-center gap-2 text-[12px] text-muted">
          <Link href="/marketing" className="link">Marketing & Vendas</Link>
        </div>
        <h1 className="mt-2 text-[34px] leading-tight">Novo lead.</h1>
      </header>

      <form action={addLeadAction} className="card card-pad space-y-4">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1">
            <label className="label" htmlFor="name">Nome</label>
            <input id="name" name="name" type="text" required className="field" placeholder="Nome do lead" />
          </div>
          <div className="flex-1">
            <label className="label" htmlFor="company">Empresa</label>
            <input id="company" name="company" type="text" className="field" placeholder="Empresa" />
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="flex-1">
            <label className="label" htmlFor="email">E-mail</label>
            <input id="email" name="email" type="email" className="field" placeholder="email@exemplo.com" />
          </div>
          <div className="flex-1">
            <label className="label" htmlFor="phone">Telefone</label>
            <input id="phone" name="phone" type="text" className="field" placeholder="(00) 00000-0000" />
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="w-40">
            <label className="label" htmlFor="stage">Etapa</label>
            <select id="stage" name="stage" className="field" defaultValue="novo">
              <option value="novo">Novo</option>
              <option value="contatado">Contatado</option>
              <option value="qualificado">Qualificado</option>
              <option value="proposta">Proposta</option>
              <option value="negociacao">Negociação</option>
              <option value="fechado">Fechado</option>
              <option value="perdido">Perdido</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="label" htmlFor="value">Valor (R$)</label>
            <input id="value" name="value" type="number" step="0.01" className="field" placeholder="0,00" />
          </div>
          <div className="flex-1">
            <label className="label" htmlFor="source">Origem</label>
            <input id="source" name="source" type="text" className="field" placeholder="Ex.: YouTube, indicação, site" />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="notes">Notas</label>
          <textarea id="notes" name="notes" rows={3} className="field" placeholder="Observações sobre o lead..." />
        </div>
        <button type="submit" className="btn btn-primary w-full">
          Salvar lead
        </button>
      </form>
    </AppShell>
  );
}
