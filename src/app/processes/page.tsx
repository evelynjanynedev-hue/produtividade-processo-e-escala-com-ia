import Link from "next/link";
import { listProcesses } from "@/lib/domain/queries";
import { requireUser } from "@/lib/auth/session";
import { AppShell } from "@/components/app-shell";
import { cn } from "@/lib/ui";

export const dynamic = "force-dynamic";
export default async function ProcessesPage() {
  const user = await requireUser();
  const processes = await listProcesses(user.workspaceId);

  return (
    <AppShell user={user} active="/processes">
      <header className="mb-8">
        <div className="flex flex-wrap items-center gap-2 text-[12px] text-muted">
          <Link href="/processes" className="link">
            Processos
          </Link>
        </div>
        <h1 className="mt-2 text-[34px] leading-tight">
          Processos validados e em escala
        </h1>
        <p className="mt-2 max-w-[54ch] text-sm text-muted">
          Cada processo é um caminho repetível que transforma intenção em execução comprovada.
        </p>
      </header>

      <div className="card divide-y divide-line">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[22px] mb-2">Processos</h2>
            <Link href="/processes/new" className="link text-ink">
              + Criar processo
            </Link>
          </div>
        </div>

        <div className="mt-6">
          {processes.length === 0 ? (
            <p className="text-sm text-muted">
              Nenhum processo criado. Comece criando um para seu projeto.
            </p>
          ) : (
            <ul className="divide-y divide-line">
              {processes.map(p => (
                <li key={p.id} className="px-4 py-2">
                  <span className="font-medium">{p.name}</span>
                  <span className="text-sm text-muted"> — {p.summary}</span>
                  <span className={cn(
                    "badge",
                    p.status === "validado" && "border-green/30 bg-green/5",
                    p.status !== "validado" && "border-gray/30 bg-gray/5"
                  )}>
                    {p.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </AppShell>
  );
}