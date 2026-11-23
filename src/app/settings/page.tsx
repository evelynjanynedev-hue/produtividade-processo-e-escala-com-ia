import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { AppShell } from "@/components/app-shell";
import { addAiProviderAction } from "@/lib/domain/actions";
import { listAiProviders } from "@/lib/domain/queries";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await requireUser();
  const providers = await listAiProviders(user.workspaceId);

  return (
    <AppShell user={user} active="/settings">
      <header className="mb-8">
        <div className="flex flex-wrap items-center gap-2 text-[12px] text-muted">
          <Link href="/settings" className="link">Configurações</Link>
        </div>
        <h1 className="mt-2 text-[34px] leading-tight">Agentes de IA.</h1>
        <p className="mt-2 max-w-[54ch] text-sm text-muted">
          Configure as APIs de IA (Groq, OpenAI, Anthropic, etc.) para que agentes executem tarefas automaticamente.
          Cada agente usa um provedor configurado.
        </p>
      </header>

      <div className="card divide-y divide-line">
        <div className="px-6 py-5">
          <h2 className="text-[22px] mb-4">Provedores configurados</h2>
          {providers.length === 0 ? (
            <p className="text-sm text-muted">Nenhum provedor configurado. Adicione um abaixo.</p>
          ) : (
            <ul className="divide-y divide-line">
              {providers.map((p) => (
                <li key={p.id} className="flex items-center justify-between py-3">
                  <div>
                    <span className="font-medium">{p.name}</span>
                    <span className="ml-2 text-[11px] text-muted">{p.provider} · {p.model || "modelo padrão"}</span>
                  </div>
                  <span className={`badge ${p.enabled ? "border-green/30 bg-green/5 text-green" : "border-red/30 bg-red/5 text-red"}`}>
                    {p.enabled ? "ativo" : "inativo"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="px-6 py-5">
          <h2 className="text-[22px] mb-4">Adicionar provedor</h2>
          <form action={addAiProviderAction} className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <div className="w-40">
                <label className="label" htmlFor="provider">Provedor</label>
                <select id="provider" name="provider" className="field" defaultValue="groq">
                  <option value="groq">Groq</option>
                  <option value="openai">OpenAI</option>
                  <option value="anthropic">Anthropic</option>
                  <option value="google">Google</option>
                  <option value="ollama">Ollama (local)</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="label" htmlFor="name">Nome</label>
                <input id="name" name="name" type="text" required className="field" placeholder="Ex.: Groq Llama 3" />
              </div>
            </div>
            <div>
              <label className="label" htmlFor="apiKey">API Key</label>
              <input id="apiKey" name="apiKey" type="password" required className="field" placeholder="gsk_... ou sk-..." />
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="flex-1">
                <label className="label" htmlFor="model">Modelo</label>
                <input id="model" name="model" type="text" className="field" placeholder="Ex.: llama-3.3-70b-versatile" />
              </div>
              <div className="flex-1">
                <label className="label" htmlFor="baseUrl">Base URL (opcional)</label>
                <input id="baseUrl" name="baseUrl" type="text" className="field" placeholder="https://api.groq.com/openai/v1" />
              </div>
            </div>
            <button type="submit" className="btn btn-primary w-full">
              Adicionar provedor
            </button>
          </form>
        </div>
      </div>
    </AppShell>
  );
}
