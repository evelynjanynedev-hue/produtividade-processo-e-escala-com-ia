import Link from "next/link";
import { DollarSign, Megaphone, Plus, Target, TrendingUp, Users, Video } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { AppShell } from "@/components/app-shell";
import { cn, formatDate, pct } from "@/lib/ui";
import { getMarketingSnapshot } from "@/lib/domain/queries";

export const dynamic = "force-dynamic";

export default async function MarketingPage() {
  const user = await requireUser();
  const snapshot = await getMarketingSnapshot(user.workspaceId);

  const leadStages = ["novo", "contatado", "qualificado", "proposta", "negociacao", "fechado", "perdido"];
  const stageLabels: Record<string, string> = {
    novo: "Novo",
    contatado: "Contatado",
    qualificado: "Qualificado",
    proposta: "Proposta",
    negociacao: "Negociação",
    fechado: "Fechado",
    perdido: "Perdido",
  };

  return (
    <AppShell user={user} active="/marketing">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="eyebrow">Marketing & Vendas</div>
          <h1 className="mt-2 text-[34px] leading-tight">Receita previsível.</h1>
          <p className="mt-2 max-w-[54ch] text-sm text-muted">
            Pipeline de vendas, conteúdo e comunidade — tudo conectado à realidade.
            Cada lead, cada vídeo, cada membro gera evidência de crescimento.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/marketing/leads/new" className="btn btn-primary">
            <Plus className="h-4 w-4" /> Novo lead
          </Link>
          <Link href="/marketing/content/new" className="btn">
            <Plus className="h-4 w-4" /> Novo conteúdo
          </Link>
        </div>
      </header>

      {/* ── KPIs ──────────────────────────────────────────────── */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Leads ativos", value: snapshot.totals.activeLeads, icon: Users },
          { label: "Pipeline (R$)", value: snapshot.totals.pipelineValue, icon: DollarSign },
          { label: "Fechados (R$)", value: snapshot.totals.closedValue, icon: Target },
          { label: "Conteúdos publicados", value: snapshot.totals.publishedContent, icon: Video },
        ].map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="card card-pad">
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-muted">{kpi.label}</span>
                <Icon className="h-4 w-4 text-muted/60" />
              </div>
              <div className="mt-2 font-serif text-2xl">
                {typeof kpi.value === "number" && kpi.label.includes("R$")
                  ? kpi.value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
                  : kpi.value}
              </div>
            </div>
          );
        })}
      </section>

      {/* ── Pipeline de vendas ────────────────────────────────── */}
      <section className="card mt-5 px-6 pb-5 pt-6">
        <div className="mb-5 flex items-end justify-between">
          <div>
            <div className="eyebrow">Pipeline de vendas</div>
            <h2 className="mt-1 text-[22px]">Funil de receita</h2>
          </div>
          <Link href="/marketing/leads" className="text-[12px] text-muted hover:text-ink">
            ver todos
          </Link>
        </div>
        <div className="grid gap-2 sm:grid-cols-7">
          {leadStages.map((stage) => {
            const leads = snapshot.leadsByStage[stage] || [];
            const total = leads.reduce((acc, l) => acc + (Number(l.value) || 0), 0);
            return (
              <div key={stage} className="rounded-lg border border-line bg-shell/30 p-3">
                <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted">
                  {stageLabels[stage]}
                </div>
                <div className="mt-1 font-serif text-lg">{leads.length}</div>
                {total > 0 && (
                  <div className="mt-0.5 text-[10px] text-muted">
                    {total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Leads recentes ────────────────────────────────────── */}
      <section className="mt-5 grid gap-5 lg:grid-cols-2">
        <div>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-[22px]">Leads recentes</h2>
            <Link href="/marketing/leads" className="text-[12px] text-muted hover:text-ink">
              ver todos
            </Link>
          </div>
          <div className="card divide-y divide-line">
            {snapshot.recentLeads.length === 0 && (
              <p className="p-5 text-sm text-muted">Nenhum lead ainda. Adicione o primeiro.</p>
            )}
            {snapshot.recentLeads.map((lead) => (
              <div key={lead.id} className="flex items-center justify-between px-5 py-3">
                <div className="min-w-0">
                  <div className="truncate text-[14px] font-medium">{lead.name}</div>
                  <div className="text-[11px] text-muted">
                    {lead.company || "—"} · {lead.source || "sem origem"}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {lead.value && (
                    <span className="mono text-[12px]">
                      {Number(lead.value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </span>
                  )}
                  <span className={cn(
                    "badge",
                    lead.stage === "fechado" && "border-green/30 bg-green/5 text-green",
                    lead.stage === "perdido" && "border-red/30 bg-red/5 text-red",
                    lead.stage !== "fechado" && lead.stage !== "perdido" && "border-blue/30 bg-blue/5 text-blue",
                  )}>
                    {stageLabels[lead.stage]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Conteúdo ────────────────────────────────────────── */}
        <div>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-[22px]">Conteúdo</h2>
            <Link href="/marketing/content" className="text-[12px] text-muted hover:text-ink">
              ver todos
            </Link>
          </div>
          <div className="card divide-y divide-line">
            {snapshot.recentContent.length === 0 && (
              <p className="p-5 text-sm text-muted">Nenhum conteúdo ainda. Crie o primeiro.</p>
            )}
            {snapshot.recentContent.map((content) => (
              <div key={content.id} className="flex items-center justify-between px-5 py-3">
                <div className="min-w-0">
                  <div className="truncate text-[14px] font-medium">{content.title}</div>
                  <div className="text-[11px] text-muted">
                    {content.type} · {content.platform || "—"}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {content.views > 0 && (
                    <span className="mono text-[11px] text-muted">{content.views} views</span>
                  )}
                  <span className={cn(
                    "badge",
                    content.status === "publicado" && "border-green/30 bg-green/5 text-green",
                    content.status !== "publicado" && "border-gold/30 bg-gold/5 text-gold",
                  )}>
                    {content.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Princípio de receita previsível ───────────────────── */}
      <section className="card mt-5 px-6 py-5">
        <div className="eyebrow mb-2">Princípio de receita previsível</div>
        <p className="text-[13px] leading-relaxed text-muted">
          Receita previsível não vem de sorte — vem de sistema. Cada lead tem um próximo passo.
          Cada conteúdo tem uma métrica. Cada comunidade tem um funil.
          O que não é medido não é gerenciado. O que não é gerenciado não escala.
        </p>
        <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
          <span className="badge border-blue/30 bg-blue/5 text-blue">prospectar → contatar → qualificar → propor → fechar</span>
          <span className="badge border-green/30 bg-green/5 text-green">ideia → roteiro → gravação → edição → publicação</span>
          <span className="badge border-gold/30 bg-gold/5 text-gold">atrair → engajar → converter → reter → indicar</span>
        </div>
      </section>
    </AppShell>
  );
}
