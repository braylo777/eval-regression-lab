// System under test: the Governing-Docs Copilot pipeline (sut/ is copied verbatim from
// braylo777/governing-docs-copilot@2f59679), with switches for ablations.
import { PGlite } from "@electric-sql/pglite";
import { vector } from "@electric-sql/pglite-pgvector";
import { migrate, withTenant, Queryable } from "../sut/db";
import { seed } from "../sut/seed";
import { embed, toVectorLiteral, tokens, expand } from "../sut/embed";
import { answer, Answer } from "../sut/answer";
import type { Hit } from "../sut/retrieve";

export interface Config { name: string; dense: boolean; sparse: boolean; synonyms: boolean; k: number; maxSentences: number }
export const BASELINE: Config = { name: "baseline (hybrid RRF)", dense: true, sparse: true, synonyms: true, k: 4, maxSentences: 3 };
export const ABLATIONS: Config[] = [
  { ...BASELINE, name: "no sparse (dense only)", sparse: false },
  { ...BASELINE, name: "no dense (full-text only)", dense: false },
  { ...BASELINE, name: "no synonym expansion", synonyms: false },
  { ...BASELINE, name: "top-1 retrieval", k: 1 },
];

export async function createDb(): Promise<Queryable> {
  const db = new PGlite({ extensions: { vector } });
  await migrate(db as any);
  await seed(db as any);
  return db as any;
}

export async function retrieveWith(db: Queryable, tenant: string, question: string, c: Config): Promise<Hit[]> {
  const ex = c.synonyms ? expand : (t: string[]) => t;
  const toks = ex(tokens(question));
  const vec = toVectorLiteral(embed(question + " " + toks.join(" ")));
  const tsq = [...new Set(toks)].join(" | ") || "''";
  return withTenant(db, tenant, async (q) => {
    const lists: any[][] = [];
    if (c.dense) lists.push((await q.query<any>(
      `SELECT c.id, d.title, c.section, c.body FROM chunks c JOIN documents d ON d.id = c.document_id
       ORDER BY c.embedding <=> $1::vector LIMIT 20`, [vec])).rows);
    if (c.sparse) lists.push((await q.query<any>(
      `SELECT c.id, d.title, c.section, c.body FROM chunks c JOIN documents d ON d.id = c.document_id
       WHERE c.tsv @@ to_tsquery('english', $1) ORDER BY ts_rank(c.tsv, to_tsquery('english', $1)) DESC LIMIT 20`, [tsq])).rows);
    const fused = new Map<number, Hit>();
    for (const list of lists) list.forEach((r: any, i: number) => {
      const cur = fused.get(r.id) ?? { ...r, score: 0 };
      cur.score += 1 / (60 + i + 1);
      fused.set(r.id, cur);
    });
    return [...fused.values()].sort((a, b) => b.score - a.score).slice(0, c.k);
  });
}

export async function run(db: Queryable, tenant: string, question: string, c: Config): Promise<Answer> {
  return answer(question, await retrieveWith(db, tenant, question, c), c.maxSentences);
}
