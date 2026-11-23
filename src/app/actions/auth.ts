"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";

import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import {
  checkRateLimit,
  createSession,
  destroySession,
  registerUser,
  verifyPassword,
} from "@/lib/auth/session";

const loginSchema = z.object({
  email: z.string().trim().email("E-mail inválido."),
  password: z.string().min(1, "Informe a senha."),
});

const signupSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome.").max(80),
  email: z.string().trim().email("E-mail inválido."),
  password: z
    .string()
    .min(8, "A senha precisa de pelo menos 8 caracteres.")
    .max(72, "Senha muito longa."),
});

export async function loginAction(formData: FormData): Promise<void> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    redirect(`/login?erro=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Dados inválidos")}`);
  }

  const email = parsed.data.email.toLowerCase();
  const limit = checkRateLimit(`login:${email}`);
  if (!limit.allowed) {
    redirect(`/login?erro=${encodeURIComponent("Muitas tentativas. Aguarde 10 minutos.")}`);
  }

  const [user] = await db
    .select({ id: users.id, passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    redirect(`/login?erro=${encodeURIComponent("E-mail ou senha incorretos.")}`);
  }

  await createSession(user.id);
  redirect("/");
}

export async function signupAction(formData: FormData): Promise<void> {
  const parsed = signupSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    redirect(`/cadastro?erro=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Dados inválidos")}`);
  }

  const result = await registerUser(parsed.data);
  if (!result.ok) {
    redirect(`/cadastro?erro=${encodeURIComponent(result.error)}`);
  }

  redirect("/");
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/login");
}
