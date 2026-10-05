import { NextResponse } from "next/server";
import { getPool, checkDbConnection } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const checks: Record<string, { ok: boolean; latencyMs?: number; error?: string }> = {};

  // 1. Database check
  const dbStart = Date.now();
  try {
    const dbOk = await checkDbConnection();
    checks.database = { ok: dbOk, latencyMs: Date.now() - dbStart };
  } catch (e: any) {
    checks.database = { ok: false, latencyMs: Date.now() - dbStart, error: e?.message ?? "unknown" };
  }

  // 2. OpenFang motor check
  const ofStart = Date.now();
  try {
    const ofUrl = process.env.OPENFANG_URL ?? "http://openfang:4200";
    const ofKey = process.env.OPENFANG_API_KEY;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(`${ofUrl}/health`, {
      headers: ofKey ? { Authorization: `Bearer ${ofKey}` } : {},
      signal: controller.signal,
    });
    clearTimeout(timeout);
    checks.openfang = { ok: res.ok, latencyMs: Date.now() - ofStart };
  } catch (e: any) {
    checks.openfang = { ok: false, latencyMs: Date.now() - ofStart, error: e?.message ?? "unknown" };
  }

  const allOk = Object.values(checks).every((c) => c.ok);
  const status = allOk ? 200 : 503;

  return NextResponse.json(
    {
      ok: allOk,
      timestamp: new Date().toISOString(),
      checks,
    },
    { status }
  );
}