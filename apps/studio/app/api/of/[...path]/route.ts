import { NextRequest, NextResponse } from "next/server";
import { of } from "@/lib/of";

export const dynamic = "force-dynamic";

// Lista blanca: Studio solo puede usar lo que su interfaz necesita.
const GET_OK = [
  /^\/api\/(status|health|version|budget|usage|security|channels|hands|cron|workflows|schedules|triggers|skills|tools|models|providers)(\/|$)/,
  /^\/api\/agents(\/[\w-]+(\/(tools|skills|mcp_servers|session|sessions|history|config))?)?$/,
  /^\/api\/approvals$/,
  /^\/api\/audit\/(recent|verify)$/,
  /^\/api\/comms\/(topology|events)$/,
  /^\/api\/budget\/agents$/,
];
const POST_OK = [
  /^\/api\/approvals\/[\w-]+\/(approve|reject)$/,
  /^\/api\/agents\/[\w-]+\/(message|stop|start|restart)$/,
];

export async function GET(req: NextRequest, ctx: { params: { path: string[] } }) {
  return forward(req, ctx.params.path, GET_OK);
}
export async function POST(req: NextRequest, ctx: { params: { path: string[] } }) {
  return forward(req, ctx.params.path, POST_OK);
}

async function forward(req: NextRequest, parts: string[], allow: RegExp[]) {
  const path = "/" + parts.map(encodeURIComponent).join("/");
  if (!allow.some((re) => re.test(path))) return NextResponse.json({ error: "Ruta no permitida" }, { status: 403 });
  try {
    const init: RequestInit = { method: req.method, signal: AbortSignal.timeout(120_000) };
    if (req.method === "POST") {
      init.body = await req.text();
      init.headers = { "content-type": "application/json" };
    }
    const r = await of(path + req.nextUrl.search, init);
    return new NextResponse(r.body, {
      status: r.status,
      headers: { "content-type": r.headers.get("content-type") ?? "application/json" },
    });
  } catch {
    return NextResponse.json({ error: "No se pudo conectar con OpenFang" }, { status: 502 });
  }
}
