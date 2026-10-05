"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Section } from "@/components/ui";

interface DiffLine {
  type: 'add' | 'remove' | 'change' | 'unchanged';
  line: number;
  old?: string;
  new?: string;
}

interface ManifestDiffProps {
  agentId: string;
  agentName: string;
  oldVersion: number;
  newVersion: number;
  onClose: () => void;
}

export default function ManifestDiff({ agentId, agentName, oldVersion, newVersion, onClose }: ManifestDiffProps) {
  const [diff, setDiff] = useState<DiffLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [oldToml, setOldToml] = useState('');
  const [newToml, setNewToml] = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [oldRes, newRes] = await Promise.all([
          fetch(`/api/manifests/${agentId}/${oldVersion}`),
          fetch(`/api/manifests/${agentId}/${newVersion}`),
        ]);
        const oldData = await oldRes.json();
        const newData = await newRes.json();
        if (!oldData.manifest || !newData.manifest) throw new Error('Manifiesto no encontrado');
        setOldToml(oldData.manifest.toml);
        setNewToml(newData.manifest.toml);
        const computedDiff = computeDiff(oldData.manifest.toml, newData.manifest.toml);
        setDiff(computedDiff);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [agentId, oldVersion, newVersion]);

  function computeDiff(oldToml: string, newToml: string): DiffLine[] {
    const oldLines = oldToml.split('\n');
    const newLines = newToml.split('\n');
    const result: DiffLine[] = [];
    const maxLen = Math.max(oldLines.length, newLines.length);
    for (let i = 0; i < maxLen; i++) {
      const oldLine = oldLines[i];
      const newLine = newLines[i];
      if (oldLine === undefined) {
        result.push({ type: 'add', line: i + 1, new: newLine });
      } else if (newLine === undefined) {
        result.push({ type: 'remove', line: i + 1, old: oldLine });
      } else if (oldLine !== newLine) {
        result.push({ type: 'change', line: i + 1, old: oldLine, new: newLine });
      } else {
        result.push({ type: 'unchanged', line: i + 1, new: newLine });
      }
    }
    return result;
  }

  const stats = {
    added: diff.filter(d => d.type === 'add').length,
    removed: diff.filter(d => d.type === 'remove').length,
    changed: diff.filter(d => d.type === 'change').length,
  };

  if (loading) return <div className="pane timeline-loading">Calculando diff…</div>;
  if (error) return <div className="pane" style={{color: 'var(--bad)'}}>Error: {error}</div>;

  return (
    <Section title={`Diff v${oldVersion} → v${newVersion}`} subtitle={agentName}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px'}}>
        <div style={{display: 'flex', gap: '16px', fontSize: '13px'}}>
          <span style={{color: 'var(--ok)'}}>+{stats.added} añadidas</span>
          <span style={{color: 'var(--bad)'}}>-{stats.removed} eliminadas</span>
          <span style={{color: 'var(--waiting)'}}>~{stats.changed} cambiadas</span>
        </div>
        <Button variant="secondary" onClick={onClose}>Cerrar</Button>
      </div>
      <div style={{maxHeight: '600px', overflow: 'auto', border: '1px solid var(--line)', borderRadius: '8px', background: 'var(--bg)'}}>
        <table style={{width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--mono)', fontSize: '12px'}}>
          <thead>
            <tr style={{background: 'var(--panel)', borderBottom: '1px solid var(--line)', position: 'sticky', top: 0}}>
              <th style={{width: '60px', textAlign: 'right', padding: '8px 12px', color: 'var(--muted)'}}>Línea</th>
              <th style={{width: '60px', textAlign: 'right', padding: '8px 12px', color: 'var(--muted)'}}>Antigua</th>
              <th style={{textAlign: 'left', padding: '8px 12px', color: 'var(--muted)'}}>Nueva</th>
            </tr>
          </thead>
          <tbody>
            {diff.map((d) => (
              <tr
                key={d.line}
                style={{
                  background:
                    d.type === 'add' ? 'color-mix(in srgb, var(--ok) 10%, transparent)' :
                    d.type === 'remove' ? 'color-mix(in srgb, var(--bad) 10%, transparent)' :
                    d.type === 'change' ? 'color-mix(in srgb, var(--waiting) 10%, transparent)' :
                    'transparent',
                }}
              >
                <td style={{padding: '4px 12px', textAlign: 'right', color: 'var(--muted)', userSelect: 'none'}}>{d.line}</td>
                <td style={{padding: '4px 12px', color: d.type === 'remove' || d.type === 'change' ? 'var(--bad)' : 'var(--ink)'}}>
                  {d.type === 'add' ? '—' : d.old ?? ''}
                </td>
                <td style={{padding: '4px 12px', color: d.type === 'add' || d.type === 'change' ? 'var(--ok)' : 'var(--ink)'}}>
                  {d.type === 'remove' ? '—' : d.new ?? ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  );
}