import { NextRequest, NextResponse } from "next/server";
import { COOKIE, configured, safeEqual, sessionToken } from "@/lib/auth";

const PUBLIC = ["/", "/login", "/api/login", "/privacy", "/legal", "/terms", "/api/health", "/api/health/live", "/api/health/ready"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (PUBLIC.includes(pathname)) return NextResponse.next();

  // Falla cerrado: sin contraseña configurada nadie entra.
  if (!configured()) {
    return new NextResponse("Studio no está configurado: define STUDIO_PASSWORD y STUDIO_SECRET.", { status: 503 });
  }
  const cookie = req.cookies.get(COOKIE)?.value ?? "";
  const expected = await sessionToken(process.env.STUDIO_SECRET!);
  if (cookie && safeEqual(cookie, expected)) return NextResponse.next();

  if (pathname.startsWith("/api/")) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  return NextResponse.redirect(url);
}

export const config = { matcher: ["/((?!_next/|favicon.ico).*)"] };
