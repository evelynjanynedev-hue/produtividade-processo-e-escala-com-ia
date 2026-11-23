import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { and, eq, gt } from "drizzle-orm";
import bcrypt from "bcryptjs";

import { db } from "@/lib/db";
import { memberships, sessions, users, workspaces } from "@/lib/db/schema";

export const SESSION_COOKIE = "sx_session";
const SESSION_TTL_DAYS = 30;

/* ── senhas ─────────────────────────────────────────────────────── */

export function hashPassword(plain: string) {
  return bcrypt.hash(plain, 12);
}

export function verifyPassword(plain: string, hash: string) {
  return bcrypt.compare(plain, hash);
}

/* ── tokens ─────────────────────────────────────────────────────── */

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

/* ── sessão ─────────────────────────────────────────────────────── */

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  workspaceId: string;
  workspaceName: string;
  role: "owner" | "admin" | "member";
};

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 86_400_000);

  await db.insert(sessions).values({ userId, tokenHash: hashToken(token), expiresAt });

  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    await db.delete(sessions).where(eq(sessions.tokenHash, hashToken(token)));
  }
  jar.delete(SESSION_COOKIE);
}

/**
 * Resolve usuário + workspace da sessão uma única vez por request.
 * `cache` evita múltiplas idas ao banco em layouts e páginas.
 */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const tokenHash = hashToken(token);

  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      workspaceId: workspaces.id,
      workspaceName: workspaces.name,
      role: memberships.role,
    })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .innerJoin(memberships, eq(memberships.userId, users.id))
    .innerJoin(workspaces, eq(workspaces.id, memberships.workspaceId))
    .where(and(eq(sessions.tokenHash, tokenHash), gt(sessions.expiresAt, new Date())))
    .limit(1);

  return rows[0] ?? null;
});

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/* ── cadastro ───────────────────────────────────────────────────── */

export async function registerUser(input: { name: string; email: string; password: string }) {
  const email = input.email.trim().toLowerCase();

  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing.length > 0) {
    return { ok: false as const, error: "Este e-mail já tem conta. Faça login." };
  }

  const passwordHash = await hashPassword(input.password);

  const user = await db.transaction(async (tx) => {
    const [created] = await tx
      .insert(users)
      .values({ name: input.name.trim(), email, passwordHash })
      .returning({ id: users.id, name: users.name, email: users.email });

    const [workspace] = await tx
      .insert(workspaces)
      .values({ name: `Sistema de ${created.name.split(" ")[0]}` })
      .returning({ id: workspaces.id });

    await tx.insert(memberships).values({
      workspaceId: workspace.id,
      userId: created.id,
      role: "owner",
    });

    return created;
  });

  await createSession(user.id);
  return { ok: true as const, userId: user.id };
}

/* ── rate limit simples em memória (documentado no README) ──────── */

const attempts = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(key: string, limit = 10, windowMs = 10 * 60_000) {
  const now = Date.now();
  const entry = attempts.get(key);

  if (!entry || entry.resetAt < now) {
    attempts.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true as const, remaining: limit - 1 };
  }

  entry.count += 1;
  if (entry.count > limit) {
    return { allowed: false as const, remaining: 0 };
  }
  return { allowed: true as const, remaining: limit - entry.count };
}
