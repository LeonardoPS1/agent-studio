import { NextRequest, NextResponse } from "next/server";
import { COOKIE, configured, safeEqual, sessionToken } from "@/lib/auth";

const attempts = new Map<string, { n: number; reset: number }>();

export async function POST(req: NextRequest) {
  if (!configured()) return NextResponse.json({ error: "Studio no configurado" }, { status: 503 });
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const now = Date.now();
  const rec = attempts.get(ip);
  if (rec && rec.reset > now && rec.n >= 5) {
    return NextResponse.json({ error: "Demasiados intentos. Espera un minuto." }, { status: 429 });
  }
  const body = await req.json().catch(() => ({}));
  const ok = typeof body.password === "string" && safeEqual(body.password, process.env.STUDIO_PASSWORD!);
  if (!ok) {
    attempts.set(ip, { n: (rec && rec.reset > now ? rec.n : 0) + 1, reset: rec && rec.reset > now ? rec.reset : now + 60_000 });
    return NextResponse.json({ error: "Contraseña incorrecta" }, { status: 401 });
  }
  attempts.delete(ip);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, await sessionToken(process.env.STUDIO_SECRET!), {
    httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7,
    secure: req.headers.get("x-forwarded-proto") === "https",
  });
  return res;
}
