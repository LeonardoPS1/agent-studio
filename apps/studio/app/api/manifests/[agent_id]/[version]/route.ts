import { NextRequest, NextResponse } from 'next/server';
import { runMigrations, isDbConfigured, getAgentManifest, deleteAgentManifest, getLatestManifestVersion, createAgentManifest } from '@/lib/db';
import { of } from '@/lib/of';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ agent_id: string; version: string }> }
) {
  await runMigrations();
  if (!isDbConfigured()) {
    return NextResponse.json({ manifest: null, db: false });
  }
  try {
    const { agent_id, version } = await ctx.params;
    const v = parseInt(version, 10);
    if (isNaN(v)) {
      return NextResponse.json({ error: 'version inválida' }, { status: 400 });
    }
    const manifest = await getAgentManifest(agent_id, v);
    if (!manifest) {
      return NextResponse.json({ manifest: null, db: true });
    }
    return NextResponse.json({ manifest, db: true });
  } catch (e: any) {
    return NextResponse.json({ manifest: null, db: true, error: e?.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ agent_id: string; version: string }> }
) {
  await runMigrations();
  if (!isDbConfigured()) {
    return NextResponse.json({ ok: false, db: false }, { status: 503 });
  }
  try {
    const { agent_id, version } = await ctx.params;
    const v = parseInt(version, 10);
    if (isNaN(v)) {
      return NextResponse.json({ ok: false, error: 'version inválida' }, { status: 400 });
    }
    const deleted = await deleteAgentManifest(agent_id, v);
    if (!deleted) {
      return NextResponse.json({ ok: false, error: 'no encontrado' }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ agent_id: string; version: string }> }
) {
  // Deploy manifest to OpenFang engine
  await runMigrations();
  if (!isDbConfigured()) {
    return NextResponse.json({ ok: false, db: false }, { status: 503 });
  }
  try {
    const { agent_id, version } = await ctx.params;
    const v = parseInt(version, 10);
    if (isNaN(v)) {
      return NextResponse.json({ ok: false, error: 'version inválida' }, { status: 400 });
    }
    const manifest = await getAgentManifest(agent_id, v);
    if (!manifest) {
      return NextResponse.json({ ok: false, error: 'manifiesto no encontrado' }, { status: 404 });
    }
    // Deploy to OpenFang via API
    const r = await of(`/api/agents/${agent_id}/manifest`, {
      method: 'POST',
      headers: { 'content-type': 'application/toml' },
      body: manifest.toml,
      signal: AbortSignal.timeout(30_000),
    });
    if (!r.ok) {
      const err = await r.text().catch(() => 'Error desplegando');
      return NextResponse.json({ ok: false, error: `OpenFang: ${err}` }, { status: 502 });
    }
    return NextResponse.json({ ok: true, deployed: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message }, { status: 500 });
  }
}