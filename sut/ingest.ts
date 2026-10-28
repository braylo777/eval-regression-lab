import { Queryable, withTenant } from "./db";
import { chunkText } from "./chunk";
import { embed, toVectorLiteral } from "./embed";

export async function ingestDocument(db: Queryable, tenantId: string, title: string, text: string) {
  const chunks = chunkText(text);
  if (!chunks.length) throw new Error("document has no text");
  return withTenant(db, tenantId, async (q) => {
    const { rows } = await q.query<{ id: number }>(
      "INSERT INTO documents (tenant_id, title) VALUES ($1, $2) RETURNING id", [tenantId, title]);
    const docId = rows[0].id;
    for (const c of chunks) {
      await q.query(
        "INSERT INTO chunks (tenant_id, document_id, ord, section, body, embedding) VALUES ($1,$2,$3,$4,$5,$6::vector)",
        [tenantId, docId, c.ord, c.section, c.body, toVectorLiteral(embed((c.section ?? "") + " " + c.body))]);
    }
    return { documentId: docId, chunks: chunks.length };
  });
}
