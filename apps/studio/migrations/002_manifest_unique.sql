-- 002: uniqueness backstops
-- Applied exactly once via the _migrations control table (see lib/db.ts).
-- The `studio` database is dedicated, so no legacy duplicates are expected;
-- the guards keep the migration safe to inspect/re-run manually.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uq_agent_manifests_agent_version'
  ) THEN
    ALTER TABLE agent_manifests
      ADD CONSTRAINT uq_agent_manifests_agent_version UNIQUE (agent_id, version);
  END IF;
END $$;

-- The old non-unique index is now redundant with the unique constraint.
DROP INDEX IF EXISTS idx_manifests_agent_ver;

-- Event sequence must be unique per run (the seq allocator serializes on the
-- run id; this index is the backstop against any concurrent writer).
CREATE UNIQUE INDEX IF NOT EXISTS uq_events_run_seq
  ON events (run_id, seq)
  WHERE run_id IS NOT NULL;
