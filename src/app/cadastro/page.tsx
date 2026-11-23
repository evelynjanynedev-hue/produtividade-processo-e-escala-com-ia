import Link from "next/link";
import { redirect } from "next/navigation";

import { signupAction } from "@/app/actions/auth";
import { AuthShell } from "@/components/auth-shell";
import { getCurrentUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) redirect("/");

  const { erro } = await searchParams;

  return (
    <AuthShell
      title="Criar seu sistema"
      subtitle="Um espaço por pessoa, com regra de realidade desde a primeira intenção."
      error={erro}
      footer={
        <>
          Já tem conta?{" "}
          <Link href="/login" className="link text-ink">
            Entrar
          </Link>
        </>
      }
    >
      <form action={signupAction} className="space-y-4">
        <div>
          <label className="label" htmlFor="name">
            Nome
          </label>
          <input id="name" name="name" required className="field" placeholder="Seu nome" />
        </div>
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
            autoComplete="new-password"
            required
            minLength={8}
            className="field"
            placeholder="mínimo 8 caracteres"
          />
        </div>
        <button type="submit" className="btn btn-primary w-full">
          Criar conta
        </button>
      </form>
    </AuthShell>
  );
}
