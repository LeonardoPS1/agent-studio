import { NextRequest, NextResponse } from 'next/server';
import { isDbConfigured, getAgentManifests, createAgentManifestVersion } from '@/lib/db';
import { diffPayload } from '@/lib/toml-diff';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  if (!isDbConfigured()) {
    return NextResponse.json({ manifests: [], db: false });
  }
  try {
    const { searchParams } = new URL(req.url);
    const agent_id = searchParams.get('agent_id');
    if (!agent_id) {
      return NextResponse.json({ error: 'agent_id requerido' }, { status: 400 });
    }
    const manifests = await getAgentManifests(agent_id);
    return NextResponse.json({ manifests, db: true });
  } catch (e: any) {
    return NextResponse.json({ manifests: [], db: true, error: e?.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!isDbConfigured()) {
    return NextResponse.json({ ok: false, db: false }, { status: 503 });
  }
  try {
    const body = await req.json().catch(() => ({}));
    const { agent_id, toml, author } = body;
    if (!agent_id || !toml) {
      return NextResponse.json({ ok: false, error: 'agent_id y toml son requeridos' }, { status: 400 });
    }
    // Atomic: version allocation, previous-version read and diff happen inside
    // one transaction serialized per agent id.
    const { id, version } = await createAgentManifestVersion({
      agent_id,
      toml,
      author,
      diff: diffPayload,
    });
    return NextResponse.json({ ok: true, id, version });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message }, { status: 500 });
  }
}
