import { Queryable, withTenant } from "./db";
import { embed, toVectorLiteral, tokens, expand } from "./embed";

export interface Hit { id: number; title: string; section: string | null; body: string; score: number }

/** Hybrid retrieval: pgvector cosine + Postgres full-text, fused with reciprocal rank fusion (k=60). */
export async function retrieve(db: Queryable, tenantId: string, question: string, k = 4): Promise<Hit[]> {
  const vec = toVectorLiteral(embed(question + " " + expand(tokens(question)).join(" ")));
  const tsq = [...new Set(expand(tokens(question)))].join(" | ") || "''";
  return withTenant(db, tenantId, async (q) => {
    const dense = await q.query<any>(
      `SELECT c.id, d.title, c.section, c.body FROM chunks c JOIN documents d ON d.id = c.document_id
       ORDER BY c.embedding <=> $1::vector LIMIT 20`, [vec]);
    const sparse = await q.query<any>(
      `SELECT c.id, d.title, c.section, c.body FROM chunks c JOIN documents d ON d.id = c.document_id
       WHERE c.tsv @@ to_tsquery('english', $1)
       ORDER BY ts_rank(c.tsv, to_tsquery('english', $1)) DESC LIMIT 20`, [tsq]);
    const fused = new Map<number, Hit>();
    for (const list of [dense.rows, sparse.rows]) list.forEach((r: any, i: number) => {
      const cur = fused.get(r.id) ?? { ...r, score: 0 };
      cur.score += 1 / (60 + i + 1);
      fused.set(r.id, cur);
    });
    return [...fused.values()].sort((a, b) => b.score - a.score).slice(0, k);
  });
}
