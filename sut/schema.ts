// Postgres schema. Runs unchanged on PGlite (tests, in-browser demo) and on a hosted Postgres (Supabase/Neon).
export const SCHEMA_SQL = `
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS tenants (
  id   text PRIMARY KEY,
  name text NOT NULL
);

CREATE TABLE IF NOT EXISTS documents (
  id         serial PRIMARY KEY,
  tenant_id  text NOT NULL REFERENCES tenants(id),
  title      text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS chunks (
  id          serial PRIMARY KEY,
  tenant_id   text NOT NULL REFERENCES tenants(id),
  document_id int  NOT NULL REFERENCES documents(id),
  ord         int  NOT NULL,
  section     text,
  body        text NOT NULL,
  tsv         tsvector GENERATED ALWAYS AS (to_tsvector('english', coalesce(section,'') || ' ' || body)) STORED,
  embedding   vector(256) NOT NULL
);
CREATE INDEX IF NOT EXISTS chunks_tsv_idx ON chunks USING gin (tsv);
CREATE INDEX IF NOT EXISTS chunks_tenant_idx ON chunks (tenant_id);

-- Row-level security: every row is visible only when app.tenant_id matches.
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents FORCE ROW LEVEL SECURITY;
ALTER TABLE chunks    ENABLE ROW LEVEL SECURITY;
ALTER TABLE chunks    FORCE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_user') THEN
    CREATE ROLE app_user NOLOGIN NOSUPERUSER NOBYPASSRLS;
  END IF;
END $$;
GRANT SELECT ON tenants TO app_user;
GRANT SELECT, INSERT ON documents, chunks TO app_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user;

DROP POLICY IF EXISTS tenant_isolation_docs ON documents;
CREATE POLICY tenant_isolation_docs ON documents
  USING (tenant_id = current_setting('app.tenant_id', true))
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true));
DROP POLICY IF EXISTS tenant_isolation_chunks ON chunks;
CREATE POLICY tenant_isolation_chunks ON chunks
  USING (tenant_id = current_setting('app.tenant_id', true))
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true));
`;
