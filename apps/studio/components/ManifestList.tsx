"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Container, Section } from "@/components/ui";

interface Manifest {
  id: number;
  agent_id: string;
  version: number;
  toml: string;
  diff_from_prev: Record<string, unknown>;
  created_at: string;
  author: string;
}

interface ManifestItemProps {
  manifest: Manifest;
  isSelected: boolean;
  isLatest: boolean;
  onSelect: () => void;
  onDeploy: () => void;
  onDelete: () => void;
  canDelete: boolean;
}

function ManifestItem({
  manifest,
  isSelected,
  isLatest,
  onSelect,
  onDeploy,
  onDelete,
  canDelete,
}: ManifestItemProps) {
  const selClass = isSelected ? 'manifest-item-selected' : '';
  const borderClass = isSelected ? 'border-accent' : 'border-line';
  const textClass = isSelected ? 'text-accent' : 'text-ink';

  return (
    <li
      className={'card manifest-item ' + selClass + ' ' + borderClass}
      style={{
        display: 'grid',
        gridTemplateColumns: 'auto 1fr auto auto auto',
        gap: '12px',
        alignItems: 'center',
        padding: '12px 16px',
      }}
    >
      <span className={'manifest-version ' + textClass}>
        v{manifest.version}
      </span>
      <span className="manifest-date">
        {new Date(manifest.created_at).toLocaleString('es-CL')}
      </span>
      <span className="manifest-author">{manifest.author}</span>
      <div className="manifest-actions">
        <Button size="sm" onClick={onSelect} className={isSelected ? 'primary' : ''}>
          Ver
        </Button>
        <Button size="sm" onClick={onDeploy} className={isLatest ? 'primary' : ''}>
          Desplegar
        </Button>
        {canDelete && (
          <Button size="sm" variant="ghost" onClick={onDelete} className="btn-danger">
            Eliminar
          </Button>
        )}
      </div>
    </li>
  );
}

interface ManifestListProps {
  agentId: string;
  agentName: string;
  onSelect: (manifest: Manifest) => void;
  onDeploy: (manifest: Manifest) => void;
  onDelete: (manifest: Manifest) => void;
  onNew: () => void;
  selectedVersion?: number;
}

export default function ManifestList({
  agentId,
  agentName,
  onSelect,
  onDeploy,
  onDelete,
  onNew,
  selectedVersion,
}: ManifestListProps) {
  const [manifests, setManifests] = useState<Manifest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/manifests?agent_id=' + encodeURIComponent(agentId));
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        setManifests(data.manifests ?? []);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [agentId]);

  const handleDeploy = async (m: Manifest) => {
    try {
      const res = await fetch('/api/manifests/' + agentId + '/' + m.version, { method: 'POST' });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      alert('Manifiesto v' + m.version + ' desplegado correctamente');
      onDeploy(m);
    } catch (e: any) {
      alert('Error desplegando: ' + e.message);
    }
  };

  const handleDelete = async (m: Manifest) => {
    if (!confirm('Eliminar version ' + m.version + ' de ' + agentName + '?')) return;
    try {
      const res = await fetch('/api/manifests/' + agentId + '/' + m.version, { method: 'DELETE' });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      setManifests((prev) => prev.filter((x) => x.version !== m.version));
    } catch (e: any) {
      alert('Error eliminando: ' + e.message);
    }
  };

  if (loading) return <div className="pane timeline-loading">Cargando manifiestos…</div>;
  if (error) return <div className="pane" style={{color: 'var(--bad)'}}>Error: {error}</div>;

  const isSelected = (v: number) => v === selectedVersion;
  const isLatest = (v: number) => manifests.length > 0 && v === manifests[0]?.version;
  const canDelete = manifests.length > 1;

  const items = manifests.map((m) => (
    <ManifestItem
      key={m.version}
      manifest={m}
      isSelected={isSelected(m.version)}
      isLatest={isLatest(m.version)}
      onSelect={() => onSelect(m)}
      onDeploy={() => handleDeploy(m)}
      onDelete={() => handleDelete(m)}
      canDelete={canDelete}
    />
  ));

  return (
    <Section title="Manifiestos" subtitle={'Agente: ' + agentName}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px'}}>
        <h3 style={{margin: 0, fontSize: '16px'}}>Historial de versiones</h3>
        <Button onClick={onNew} className="primary">+ Nueva version</Button>
      </div>
      {manifests.length === 0 && (
        <div className="card" style={{padding: '24px', textAlign: 'center', color: 'var(--muted)'}}>
          No hay manifiestos para este agente.
        </div>
      )}
      <ul className="manifest-list">
        {items}
      </ul>
    </Section>
  );
}