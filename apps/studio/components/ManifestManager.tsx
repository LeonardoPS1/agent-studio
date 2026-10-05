"use client";
import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Container, Section } from "@/components/ui";
import ManifestList from "./ManifestList";
import ManifestEditor from "./ManifestEditor";
import ManifestDiff from "./ManifestDiff";
import { ofJson } from "@/lib/of";

interface AgentInfo {
  id: string;
  name: string;
  emoji?: string;
}

export default function ManifestManager() {
  const [agents, setAgents] = useState<AgentInfo[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [selectedManifest, setSelectedManifest] = useState<{
    version: number;
    toml: string;
    diff_from_prev: Record<string, unknown>;
    created_at: string;
    author: string;
  } | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [editToml, setEditToml] = useState('');
  const [editVersion, setEditVersion] = useState<number | null>(null);
  const [showDiff, setShowDiff] = useState<{oldV: number, newV: number} | null>(null);
  const [loadingAgents, setLoadingAgents] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/agents');
        if (res.ok) {
          const data = await res.json();
          setAgents(data.agents ?? []);
        }
      } catch {
        // fallback to localStorage if API fails
      } finally {
        setLoadingAgents(false);
      }
    }
    load();
  }, []);

  // Get selected agent info
  const selectedAgent = useMemo(
    () => agents.find(a => a.id === selectedAgentId) ?? null,
    [agents, selectedAgentId]
  );

  const handleSelectManifest = (manifest: {
    version: number;
    toml: string;
    diff_from_prev: Record<string, unknown>;
    created_at: string;
    author: string;
  }) => {
    setSelectedManifest(manifest);
    setShowEditor(false);
    setShowDiff(null);
  };

  const handleNewVersion = () => {
    const baseToml = selectedManifest?.toml || '';
    setEditToml(baseToml);
    setEditVersion(null);
    setShowEditor(true);
    setSelectedManifest(null);
    setShowDiff(null);
  };

  const handleEditVersion = () => {
    if (!selectedManifest) return;
    setEditToml(selectedManifest.toml);
    setEditVersion(selectedManifest.version);
    setShowEditor(true);
  };

  const handleSave = async (toml: string) => {
    try {
      const res = await fetch(`/api/manifests?agent_id=${encodeURIComponent(selectedAgentId!)}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ agent_id: selectedAgentId, toml, author: 'studio' }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      alert(`Manifiesto v${data.version} guardado`);
      setShowEditor(false);
      setSelectedManifest(null);
      // Refresh will happen via ManifestList useEffect
    } catch (e: any) {
      alert(`Error guardando: ${e.message}`);
    }
  };

  const handleShowDiff = (oldV: number, newV: number) => {
    setShowDiff({oldV, newV});
    setShowEditor(false);
  };

  const handleCompare = () => {
    if (!selectedManifest) return;
    // Compare with previous version
    const prevV = selectedManifest.version - 1;
    if (prevV > 0) {
      handleShowDiff(prevV, selectedManifest.version);
    }
  };

  if (loadingAgents) return <div className="pane timeline-loading">Cargando agentes…</div>;

  return (
    <Container>
      <div style={{display: 'grid', gridTemplateColumns: '280px 1fr', gap: '16px', height: 'calc(100vh - 120px)'}}>
        {/* Sidebar - Agent Selector */}
        <Section title="Agentes" subtitle={`${agents.length} disponibles`}>
          <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
            {agents.map((a) => (
              <Button
                key={a.id}
                variant={selectedAgentId === a.id ? 'primary' : 'ghost'}
                className="w-full"
                style={{justifyContent: 'flex-start', textAlign: 'left'}}
                onClick={() => {
                  setSelectedAgentId(a.id);
                  setSelectedManifest(null);
                  setShowEditor(false);
                  setShowDiff(null);
                }}
              >
                <span style={{fontSize: '18px', marginRight: '8px'}}>{a.emoji || '🤖'}</span>
                <span>{a.name}</span>
              </Button>
            ))}
            {agents.length === 0 && (
              <div style={{color: 'var(--muted)', textAlign: 'center', padding: '20px'}}>
                No hay agentes conectados
              </div>
            )}
          </div>
        </Section>

        {/* Main Content */}
        <div style={{display: 'flex', flexDirection: 'column', gap: '16px', overflow: 'auto'}}>
          {showDiff && (
            <ManifestDiff
              agentId={selectedAgentId!}
              agentName={selectedAgent?.name ?? ''}
              oldVersion={showDiff.oldV}
              newVersion={showDiff.newV}
              onClose={() => setShowDiff(null)}
            />
          )}

          {showEditor && selectedAgent && (
            <ManifestEditor
              agentId={selectedAgentId!}
              agentName={selectedAgent.name}
              initialToml={editToml}
              initialVersion={editVersion ?? undefined}
              onSave={handleSave}
              onCancel={() => { setShowEditor(false); setSelectedManifest(null); }}
              isEditing={editVersion !== null}
            />
          )}

          {!showEditor && !showDiff && selectedAgent && (
            <ManifestList
              agentId={selectedAgentId!}
              agentName={selectedAgent.name}
              onSelect={handleSelectManifest}
              onDeploy={() => {}}
              onDelete={() => {}}
              onNew={handleNewVersion}
              selectedVersion={selectedManifest?.version}
            />
          )}

          {!showEditor && !showDiff && selectedManifest && selectedAgent && (
            <Section title={`Detalle v${selectedManifest.version}`} subtitle={selectedAgent.name}>
              <div style={{display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap'}}>
                <Button variant="ghost" onClick={handleEditVersion}>Editar</Button>
                <Button variant="ghost" onClick={handleCompare} disabled={selectedManifest.version <= 1}>
                  Comparar con anterior
                </Button>
                <Button variant="secondary" onClick={() => setShowEditor(true)}>Nueva versión</Button>
              </div>
              <Card style={{maxHeight: '400px', overflow: 'auto', fontFamily: 'var(--mono)', fontSize: '12px', lineHeight: '1.6', whiteSpace: 'pre-wrap'}}>
                {selectedManifest.toml}
              </Card>
              <div style={{fontSize: '12px', color: 'var(--muted)', marginTop: '8px'}}>
                Creado: {new Date(selectedManifest.created_at).toLocaleString('es-CL')} · 
                Autor: {selectedManifest.author} · 
                Diff: {JSON.stringify(selectedManifest.diff_from_prev).length > 2 ? 'Sí' : 'No'}
              </div>
            </Section>
          )}

          {!selectedAgent && !showEditor && !showDiff && (
            <Section title="Manifiestos" subtitle="Selecciona un agente">
              <div style={{textAlign: 'center', padding: '40px', color: 'var(--muted)'}}>
                Elige un agente en la lista para ver sus manifiestos
              </div>
            </Section>
          )}
        </div>
      </div>
    </Container>
  );
}