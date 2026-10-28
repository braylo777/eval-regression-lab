import { SCHEMA_SQL } from "./schema";

/** Minimal surface shared by PGlite and node-postgres clients. */
export interface Queryable {
  query<T = any>(sql: string, params?: unknown[]): Promise<{ rows: T[] }>;
  exec?(sql: string): Promise<unknown>;
}

export async function migrate(db: Queryable) {
  if (db.exec) await db.exec(SCHEMA_SQL);
  else await db.query(SCHEMA_SQL);
}

/**
 * Run fn as the non-privileged app_user with app.tenant_id set for this transaction only.
 * RLS is FORCED on documents/chunks, so a missing or wrong tenant id returns zero rows.
 */
export async function withTenant<T>(db: Queryable, tenantId: string, fn: (q: Queryable) => Promise<T>): Promise<T> {
  if (!/^[a-z0-9-]{1,64}$/.test(tenantId)) throw new Error("invalid tenant id");
  await db.query("BEGIN");
  try {
    await db.query("SET LOCAL ROLE app_user");
    await db.query("SELECT set_config('app.tenant_id', $1, true)", [tenantId]);
    const out = await fn(db);
    await db.query("COMMIT");
    return out;
  } catch (e) {
    await db.query("ROLLBACK");
    throw e;
  }
}

export async function createTenant(db: Queryable, id: string, name: string) {
  await db.query("INSERT INTO tenants (id, name) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING", [id, name]);
}
