-- Provision a dedicated Studio database and a least-privilege role.
--
-- Run once as a superuser / database owner (e.g. `postgres`) on the target
-- PostgreSQL instance. Adjust the password before running; it must match
-- DATABASE_URL in the Studio environment.
--
--   psql -U postgres -f scripts/provision-studio-db.sql
--
-- Rationale: Studio keeps runs, events, agent_manifests and views in its own
-- database with its own role, so it never shares tables with, or gains write
-- access to, any other application's data.

-- 1. Dedicated role with a password (change it).
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'studio_app') THEN
    CREATE ROLE studio_app LOGIN PASSWORD 'CHANGE_ME';
  END IF;
END $$;

-- 2. Dedicated database owned by the role.
--    CREATE DATABASE cannot run inside a transaction block / DO block.
SELECT 'CREATE DATABASE studio OWNER studio_app'
WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = 'studio')\gexec

-- 3. Lock down the database to this role only.
REVOKE ALL ON DATABASE studio FROM PUBLIC;
GRANT CONNECT ON DATABASE studio TO studio_app;

-- 4. Schema privileges. Connect to `studio` first for these to take effect:
--      \c studio
--    then run the block below.
-- REVOKE ALL ON SCHEMA public FROM PUBLIC;
-- GRANT USAGE, CREATE ON SCHEMA public TO studio_app;
-- ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO studio_app;
-- ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO studio_app;

-- Note: Studio applies its own migrations (migrations/*.sql) at startup through
-- the _migrations control table, so no table DDL is needed here.
