import Link from "next/link";
import { ArrowUpRight, Boxes, BookOpen, Brain, DollarSign, FileText, LayoutDashboard, LogOut, Settings, Target, Workflow } from "lucide-react";

import { logoutAction } from "@/app/actions/auth";
import type { SessionUser } from "@/lib/auth/session";
import { cn, initials } from "@/lib/ui";

const NAV = [
  { href: "/", label: "Painel", icon: LayoutDashboard },
  { href: "/initiatives", label: "Intenções", icon: Target },
  { href: "/knowledge", label: "Segundo cérebro", icon: Brain },
  { href: "/documentacao", label: "Documentação", icon: FileText },
  { href: "/marketing", label: "Marketing & Vendas", icon: DollarSign },
  { href: "/processes", label: "Processos", icon: Workflow },
  { href: "/settings", label: "Agentes IA", icon: Settings },
];

export function AppShell({
  user,
  active,
  children,
}: {
  user: SessionUser;
  active: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen lg:flex">
      {/* ── sidebar ─────────────────────────────────────────────── */}
      <aside className="sticky top-0 hidden h-screen w-[248px] shrink-0 flex-col border-r border-line bg-shell px-5 py-6 lg:flex">
        <Link href="/" className="mb-9 block">
          <div className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-md bg-ink text-[13px] font-bold text-paper">
              E
            </span>
            <span className="eyebrow">Sistema operacional</span>
          </div>
          <div className="mt-3 font-serif text-[26px] leading-none">Execução.</div>
          <div className="mt-1.5 text-[11px] uppercase tracking-[0.16em] text-muted">
            conectar → criar → contribuir
          </div>
        </Link>

        <nav className="flex flex-col gap-1">
          {NAV.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] transition",
                  isActive
                    ? "bg-card font-semibold text-ink shadow-sm"
                    : "text-muted hover:bg-card/60 hover:text-ink",
                )}
              >
                <Icon className="h-4 w-4" strokeWidth={1.75} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-8 rounded-lg border border-line/80 bg-card/60 p-3">
          <div className="eyebrow mb-1.5">Regra de realidade</div>
          <p className="text-[12px] leading-relaxed text-muted">
            Ideia não é resultado. Plano não é execução. Só avança com prova.
          </p>
          <p className="mt-2 text-[12px] leading-relaxed text-muted">
            Pergunta-chave: <span className="font-medium text-ink">“Estou deixando passar alguma coisa que eu não estou enxergando?”</span>
          </p>
          <p className="mt-2 text-[12px] leading-relaxed text-muted">
            Confiança não vem de afirmações. Vem de evidências vividas de que você consegue se sustentar.
          </p>
          <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink">
            Tudo deve ter limite e ordem.
          </p>
          <p className="mt-2 text-[12px] leading-relaxed text-muted">
            Princípio de apresentação: use teoria da mente e imagens visualmente claras para gerar familiaridade e evitar sobrecarga mental. Objetivo simples, fácil de compreender para qualquer nível de consciência.
          </p>
        </div>

        <div className="mt-auto pt-6">
          <div className="flex items-center gap-2.5 rounded-lg border border-line bg-card/70 px-3 py-2.5">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ink text-[11px] font-semibold text-paper">
              {initials(user.name)}
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-medium">{user.name}</div>
              <div className="truncate text-[11px] text-muted">{user.workspaceName}</div>
            </div>
            <form action={logoutAction}>
              <button
                className="rounded-md p-1.5 text-muted transition hover:bg-ink/5 hover:text-ink"
                title="Sair"
                aria-label="Sair"
              >
                <LogOut className="h-4 w-4" strokeWidth={1.75} />
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* ── mobile ──────────────────────────────────────────────── */}
      <div className="lg:hidden">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-line bg-paper/95 px-4 py-3 backdrop-blur">
          <Link href="/" className="flex items-center gap-2">
            <span className="grid h-6 w-6 place-items-center rounded bg-ink text-[11px] font-bold text-paper">
              E
            </span>
            <span className="font-serif text-lg leading-none">Execução.</span>
          </Link>
          <form action={logoutAction}>
            <button className="btn btn-sm btn-ghost" aria-label="Sair">
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        </header>
        <nav className="scroll-thin flex gap-1 overflow-x-auto border-b border-line px-3 py-2 text-sm">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "whitespace-nowrap rounded-full px-3 py-1.5",
                active === item.href ? "bg-ink text-paper" : "text-muted",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* ── conteúdo ────────────────────────────────────────────── */}
      <main className="min-w-0 flex-1">
        <div className="mx-auto w-full max-w-[1120px] px-5 py-8 sm:px-8 lg:py-10">{children}</div>
        <footer className="mx-auto flex w-full max-w-[1120px] flex-wrap items-center justify-between gap-2 px-5 pb-8 text-[11px] text-muted sm:px-8">
          <span>Nada permanece apenas na ideia.</span>
          <Link href="/processes" className="inline-flex items-center gap-1 hover:text-ink">
            <Boxes className="h-3.5 w-3.5" /> biblioteca de processos
            <ArrowUpRight className="h-3 w-3" />
          </Link>
        </footer>
      </main>
    </div>
  );
}
