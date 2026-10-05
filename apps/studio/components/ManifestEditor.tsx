"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Container, Section } from "@/components/ui";

interface ManifestEditorProps {
  agentId: string;
  agentName: string;
  initialToml?: string;
  initialVersion?: number;
  onSave: (toml: string) => void;
  onCancel: () => void;
  isEditing?: boolean;
}

const TOML_TEMPLATE = `# Agent Manifest Template
name = "my-agent"
version = "0.1.0"
description = "Descripción del agente"
author = "tu-usuario"
module = "builtin:chat"
tags = ["tag1", "tag2"]

[model]
provider = "default"
model = "default"
max_tokens = 8192
temperature = 0.5
system_prompt = \"\"\"
Eres un agente especializado en...
\"\"\"

[[fallback_models]]
provider = "default"
model = "gemini-2.0-flash"
api_key_env = "GEMINI_API_KEY"

[resources]
max_llm_tokens_per_hour = 300000
max_concurrent_tools = 10

[capabilities]
tools = ["file_read", "file_write", "file_list", "memory_store", "memory_recall", "web_fetch", "shell_exec", "agent_send", "agent_list"]
network = ["*"]
memory_read = ["*"]
memory_write = ["self.*", "shared.*"]
agent_message = ["*"]
shell = ["python *", "cargo *", "git *", "npm *"]

[autonomous]
max_iterations = 100
`;

export default function ManifestEditor({
  agentId,
  agentName,
  initialToml = "",
  initialVersion,
  onSave,
  onCancel,
  isEditing = false,
}: ManifestEditorProps) {
  const [toml, setToml] = useState(initialToml || TOML_TEMPLATE);
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initialToml) setToml(initialToml);
  }, [initialToml]);

  const validateToml = (content: string): string[] => {
    const errs: string[] = [];
    try {
      // Basic TOML validation - check required fields
      if (!content.includes('name =')) errs.push('Falta campo "name"');
      if (!content.includes('version =')) errs.push('Falta campo "version"');
      if (!content.includes('module =')) errs.push('Falta campo "module"');
      // Try parsing as basic check
      const lines = content.split('\n');
      let inArray = false;
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith('[') && !line.startsWith('[[') && !line.endsWith(']')) {
          errs.push(`Línea ${i + 1}: Sección mal formada: ${line}`);
        }
      }
    } catch {
      errs.push('Error parseando TOML');
    }
    return errs;
  };

  useEffect(() => {
    const errs = validateToml(toml);
    setErrors(errs);
  }, [toml]);

  const handleSave = () => {
    const errs = validateToml(toml);
    if (errs.length > 0) {
      alert('Errores de validación:\n' + errs.join('\n'));
      return;
    }
    setSaving(true);
    onSave(toml);
    setSaving(false);
  };

  return (
    <Section title={isEditing ? `Editar v${initialVersion}` : 'Nuevo manifiesto'} subtitle={`Agente: ${agentName}`}>
      <div style={{display: 'grid', gap: '12px'}}>
        <div style={{display: 'flex', gap: '8px', flexWrap: 'wrap'}}>
          <Button onClick={handleSave} className="primary" disabled={saving || errors.length > 0}>
            {saving ? 'Guardando…' : 'Guardar manifiesto'}
          </Button>
          <Button variant="secondary" onClick={onCancel}>Cancelar</Button>
          <Button variant="ghost" onClick={() => setToml(TOML_TEMPLATE)}>Plantilla</Button>
        </div>

        {errors.length > 0 && (
          <Card style={{borderColor: 'var(--bad)', background: 'color-mix(in srgb, var(--bad) 5%, var(--panel))'}}>
            <strong style={{color: 'var(--bad)'}}>Errores de validación:</strong>
            <ul style={{margin: '8px 0 0', paddingLeft: '20px'}}>
              {errors.map((e, i) => <li key={i} style={{color: 'var(--bad)', fontSize: '13px'}}>{e}</li>)}
            </ul>
          </Card>
        )}

        <div style={{position: 'relative'}}>
          <textarea
            value={toml}
            onChange={(e) => setToml(e.target.value)}
            style={{
              width: '100%',
              minHeight: '500px',
              fontFamily: 'var(--mono)',
              fontSize: '13px',
              lineHeight: '1.6',
              padding: '16px',
              border: '1px solid var(--line)',
              borderRadius: '8px',
              background: 'var(--panel)',
              color: 'var(--ink)',
              resize: 'vertical',
              outline: 'none',
            }}
            spellCheck={false}
            placeholder="Escribe el manifiesto TOML aquí…"
          />
        </div>

        <div style={{fontSize: '12px', color: 'var(--muted)', display: 'flex', gap: '16px', flexWrap: 'wrap'}}>
          <span>Líneas: {toml.split('\n').length}</span>
          <span>Caracteres: {toml.length}</span>
          <span>Válido: {errors.length === 0 ? '✓ Sí' : '✗ No'}</span>
        </div>
      </div>
    </Section>
  );
}