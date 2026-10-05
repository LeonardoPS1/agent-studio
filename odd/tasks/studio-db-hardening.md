# Studio DB Hardening

## Objective

Isolate Studio's persistence in its own PostgreSQL database with a minimum-privilege
role, make migrations versioned and run-once, eliminate the version/seq race, use a real
connection pool, bound `events` growth, and replace the positional diff with a real
line diff.

## Problem

Six verified defects (evidence in code):

1. Studio writes `runs`, `events`, `agent_positions`, `agent_manifests`, `views` into the
   shared clinical database `consultorio_medico` using only `CREATE TABLE IF NOT EXISTS`
   (`migrations/001_init.sql:2-54`). Silent skip on collision; generic table names.
2. `runMigrations()` runs on every request (7 call sites across `api/manifests`,
   `api/runs`, `api/events/history`). Re-reads disk and re-runs all SQL each request.
3. `agent_manifests` has a non-unique index `(agent_id, version)` (`001_init.sql:47`), and
   version is `MAX+1` read-then-write (`api/manifests/route.ts:36-37`) → concurrent saves
   duplicate the version. Same class in `insertEvent` (`lib/db.ts:144-149`).
4. `getPool()` exists (`lib/db.ts:12-18`) but every function uses `getClient()`
   (`lib/db.ts:62-68`), creating and closing a fresh `Client` per call.
5. No retention: `events` (`BIGSERIAL`) grows unbounded; no prune anywhere.
6. `computeDiff` compares `oldLines[i]` vs `newLines[i]`, duplicated in
   `api/manifests/route.ts:54-71` and `components/ManifestDiff.tsx:53-72`. Inserting a line
   at the top marks everything changed.

## Why

The shared clinical DB couples Studio's lifecycle to patient-data infrastructure, and the
races corrupt history (duplicate manifest versions, colliding event seq). Correctness and
blast-radius reduction.

## Decisions

- **Isolation: separate database `studio`** (user-selected). Zero blast radius on the
  clinical DB. Requires a second `DATABASE_URL`, a role with `CONNECT` only on `studio`,
  and a Dokploy env update.
- **Minimum-privilege role** `studio_app`: `CONNECT` on `studio` only; `USAGE, CREATE` on
  its schema; `REVOKE CREATE ON SCHEMA public FROM PUBLIC`. Provisioning SQL is a one-time
  superuser script, run by the DB owner (remote step, needs authorization).
- **Migrations**: versioned with a `_migrations` control table; applied inside one
  transaction under `pg_advisory_lock`; memoized so they run once per process at startup
  (`instrumentation.ts`). Per-request calls removed.
- **Atomic version**: `createAgentManifestVersion()` uses a transaction +
  `pg_advisory_xact_lock(hashtext(agent_id))`, plus a `UNIQUE(agent_id, version)` backstop.
- **Event seq**: partial `UNIQUE(run_id, seq) WHERE run_id IS NOT NULL` backstop; insert
  retries once on conflict.
- **Pool**: a shared `getPool()` + `withClient`/`withTransaction` helpers; no per-call
  `Client`.
- **Retention**: `EVENTS_RETENTION_DAYS` (default 30; `0` disables). Prune at startup and
  hourly from the collector's audit loop.
- **Diff**: LCS (dynamic programming) in `lib/toml-diff.ts`, no new dependency; single
  implementation consumed by both the API route and the React component.

## Scope

In: `lib/db.ts`, `migrations/`, `app/api/manifests/**`, `app/api/runs/**`,
`app/api/events/history/route.ts`, `components/ManifestDiff.tsx`, `instrumentation.ts`,
`lib/ws-collector.ts` (retention tick), `lib/toml-diff.ts` (new), `scripts/provision-studio-db.sql`
(new), `.env.dokploy.example`, unit tests for the diff.

Out: no remote/VPS mutation without explicit authorization; no changes to clinical tables.

## Constraints

- Code and repo docs in English; user report in Spanish.
- No secrets in the repo.
- No new runtime dependency.

## Tasks

- [x] **DB-1** — Add `lib/toml-diff.ts` (LCS diff, `diffLines(a,b)` + `summarizeDiff` + `diffPayload`), with unit tests
      covering insertion-at-top, deletion, and pure change.
- [x] **DB-2** — `migrations/002_manifest_unique.sql`: add `UNIQUE(agent_id, version)` and
      partial `UNIQUE(run_id, seq) WHERE run_id IS NOT NULL`.
- [x] **DB-3** — Rewrite `lib/db.ts`: pool-backed `withClient`/`withTransaction`; versioned
      memoized `runMigrations()` with `_migrations` table + advisory lock; atomic
      `createAgentManifestVersion()`; race-free `insertEvent`; `pruneEvents()`.
- [x] **DB-4** — Point `app/api/manifests/**`, `app/api/runs/**`,
      `app/api/events/history/route.ts` at the new APIs; remove per-request `runMigrations()`.
- [x] **DB-5** — `components/ManifestDiff.tsx` imports the shared diff; delete both
      duplicated `computeDiff`.
- [x] **DB-6** — `instrumentation.ts` runs migrations once; collector prunes hourly per
      `EVENTS_RETENTION_DAYS`.
- [x] **DB-7** — `scripts/provision-studio-db.sql` + `.env.dokploy.example` update; document
      the one-time provisioning step.
- [x] **DB-8** — Verify: `npm run typecheck`, `npm run test:unit`, `npm run build`.

## Acceptance criteria

- Migrations run once at startup and are idempotent across restarts and instances.
- Two concurrent manifest saves for one agent never produce a duplicate version.
- No function opens a `Client` per call; all use the pool.
- `events` older than the retention window are deleted; `0` disables pruning.
- A line inserted at the top yields one `add` (or one changed hunk), not a full rewrite.
- typecheck = 0 errors, build green, unit tests pass.

## Checks

- `npm run typecheck`, `npm run test:unit`, `npm run build` (available locally).
- DB-dependent behaviour (migrations, UNIQUE, pool) verified against the VPS only after
  provisioning, which requires explicit remote authorization.

## Delivery

Work-unit commits on `main`; push and remote provisioning are the user's decision.
