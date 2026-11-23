import Link from "next/link";
import { CircleAlert } from "lucide-react";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
  error,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
  error?: string;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      {/* manifesto */}
      <aside className="relative hidden flex-col justify-between bg-ink px-12 py-12 text-paper lg:flex">
        <div className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-md bg-paper text-[13px] font-bold text-ink">
            E
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-paper/60">
            sistema operacional pessoal
          </span>
        </div>

        <div className="max-w-[30ch]">
          <h1 className="font-serif text-[52px] leading-[1.02]">
            Nada permanece
            <br />
            apenas na ideia.
          </h1>
          <p className="mt-6 text-[14px] leading-relaxed text-paper/65">
            Intenção → clareza → estrutura → plano → ação → evidência → resultado →
            aprendizado → processo → escala.
          </p>
        </div>

        <div className="flex items-center gap-6 text-[11px] uppercase tracking-[0.16em] text-paper/45">
          <span>prova &gt; opinião</span>
          <span>execução &gt; intenção</span>
          <span>processo &gt; sorte</span>
        </div>

        <div className="pointer-events-none absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-gold/15 blur-3xl" />
      </aside>

      {/* formulário */}
      <main className="flex items-center justify-center px-6 py-14">
        <div className="w-full max-w-[380px]">
          <div className="mb-8 lg:hidden">
            <div className="eyebrow">Sistema operacional pessoal</div>
            <div className="mt-1 font-serif text-2xl">Execução.</div>
          </div>

          <h2 className="text-[30px] leading-tight">{title}</h2>
          <p className="mt-2 text-[13px] leading-relaxed text-muted">{subtitle}</p>

          {error && (
            <div className="mt-5 flex items-start gap-2 rounded-lg border border-red/30 bg-red/5 px-3 py-2.5 text-[13px] text-red">
              <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="mt-6">{children}</div>

          <div className="mt-6 text-[13px] text-muted">{footer}</div>

          <p className="mt-10 text-[11px] leading-relaxed text-muted/80">
            Ao entrar você aceita que este sistema registra execução e evidência —{" "}
            <Link href="/login" className="link">
              é o ponto
            </Link>
            .
          </p>
        </div>
      </main>
    </div>
  );
}
