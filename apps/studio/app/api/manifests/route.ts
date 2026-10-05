import { NextRequest, NextResponse } from 'next/server';
import { runMigrations, isDbConfigured, getAgentManifests, createAgentManifest, getLatestManifestVersion } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  await runMigrations();
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
  await runMigrations();
  if (!isDbConfigured()) {
    return NextResponse.json({ ok: false, db: false }, { status: 503 });
  }
  try {
    const body = await req.json().catch(() => ({}));
    const { agent_id, toml, author } = body;
    if (!agent_id || !toml) {
      return NextResponse.json({ ok: false, error: 'agent_id y toml son requeridos' }, { status: 400 });
    }
    // Calcular siguiente versión
    const latestVersion = await getLatestManifestVersion(agent_id);
    const version = latestVersion + 1;
    // Calcular diff si hay versión anterior
    let diff_from_prev: Record<string, unknown> = {};
    if (latestVersion > 0) {
      const { getAgentManifest } = await import('@/lib/db');
      const prev = await getAgentManifest(agent_id, latestVersion);
      if (prev) {
        diff_from_prev = computeDiff(prev.toml, toml);
      }
    }
    const { id } = await createAgentManifest({ agent_id, version, toml, diff_from_prev, author: author ?? 'studio' });
    return NextResponse.json({ ok: true, id, version });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message }, { status: 500 });
  }
}

function computeDiff(oldToml: string, newToml: string): Record<string, unknown> {
  const oldLines = oldToml.split('\n');
  const newLines = newToml.split('\n');
  const changes: Array<{ type: 'add' | 'remove' | 'change'; line: number; old?: string; new?: string }> = [];
  const maxLen = Math.max(oldLines.length, newLines.length);
  for (let i = 0; i < maxLen; i++) {
    const oldLine = oldLines[i];
    const newLine = newLines[i];
    if (oldLine === undefined) {
      changes.push({ type: 'add', line: i + 1, new: newLine });
    } else if (newLine === undefined) {
      changes.push({ type: 'remove', line: i + 1, old: oldLine });
    } else if (oldLine !== newLine) {
      changes.push({ type: 'change', line: i + 1, old: oldLine, new: newLine });
    }
  }
  return { changes, old_line_count: oldLines.length, new_line_count: newLines.length };
}