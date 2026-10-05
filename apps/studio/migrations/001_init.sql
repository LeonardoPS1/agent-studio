-- Migración inicial OpenFang Studio (Fase 2)
CREATE TABLE IF NOT EXISTS runs (
  id TEXT PRIMARY KEY,
  agent_id TEXT,
  name TEXT,
  status TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration_ms BIGINT,
  cost_usd NUMERIC(12,6),
  tokens_in BIGINT,
  tokens_out BIGINT,
  meta JSONB DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS events (
  id BIGSERIAL PRIMARY KEY,
  run_id TEXT,
  ts TIMESTAMPTZ DEFAULT NOW(),
  agent_id TEXT,
  type TEXT,
  data JSONB DEFAULT '{}',
  seq BIGINT
);

CREATE INDEX IF NOT EXISTS idx_events_run_ts ON events(run_id, ts);
CREATE INDEX IF NOT EXISTS idx_events_ts ON events(ts);
CREATE INDEX IF NOT EXISTS idx_events_agent ON events(agent_id);

CREATE TABLE IF NOT EXISTS agent_positions (
  agent_id TEXT PRIMARY KEY,
  x REAL,
  y REAL,
  view JSONB DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS agent_manifests (
  id BIGSERIAL PRIMARY KEY,
  agent_id TEXT,
  version INT,
  toml TEXT,
  diff_from_prev JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  author TEXT
);

CREATE INDEX IF NOT EXISTS idx_manifests_agent_ver ON agent_manifests(agent_id, version);

CREATE TABLE IF NOT EXISTS views (
  id BIGSERIAL PRIMARY KEY,
  name TEXT,
  layout JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
