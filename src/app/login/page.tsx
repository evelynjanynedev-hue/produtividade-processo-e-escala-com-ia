import Link from "next/link";
import { redirect } from "next/navigation";

import { loginAction } from "@/app/actions/auth";
import { AuthShell } from "@/components/auth-shell";
import { getCurrentUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) redirect("/");

  const { erro } = await searchParams;

  return (
    <AuthShell
      title="Entrar no sistema"
      subtitle="Continue de onde parou: o próximo passo está esperando."
      error={erro}
      footer={
        <>
          Ainda não tem conta?{" "}
          <Link href="/cadastro" className="link text-ink">
            Criar sistema
          </Link>
        </>
      }
    >
      <form action={loginAction} className="space-y-4">
        <div>
          <label className="label" htmlFor="email">
            E-mail
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="field"
            placeholder="voce@exemplo.com"
          />
        </div>
        <div>
          <label className="label" htmlFor="password">
            Senha
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="field"
            placeholder="••••••••"
          />
        </div>
        <button type="submit" className="btn btn-primary w-full">
          Entrar
        </button>
      </form>

      {process.env.NODE_ENV !== "production" && (
        <p className="mt-4 rounded-lg border border-line bg-card px-3 py-2 text-[11px] text-muted">
          Demo: <span className="font-medium text-ink">demo@sistema.dev</span> · senha{" "}
          <span className="font-medium text-ink">demo1234</span>
        </p>
      )}
    </AuthShell>
  );
}
