import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const [{ count }] = await db.execute(sql`select count(*) from users`);
  return NextResponse.json({ ok: true, db: Number(count) });
}