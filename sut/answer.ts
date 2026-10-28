import { Hit } from "./retrieve";
import { tokens, expand } from "./embed";

export interface Answer { text: string; citations: { n: number; title: string; section: string | null; quote: string }[]; refused: boolean }

/**
 * Extractive, cited answer: picks the sentences that best overlap the question from the top hits.
 * Every sentence in the answer carries a [n] citation. If nothing overlaps, it says so instead of guessing.
 */
export function answer(question: string, hits: Hit[], maxSentences = 3): Answer {
  const qt = new Set(expand(tokens(question)));
  const cands: { s: string; hit: Hit; score: number }[] = [];
  for (const h of hits) for (const s of h.body.split(/(?<=[.;])\s+/)) {
    const st = tokens(s); if (!st.length) continue;
    const overlap = st.filter((t) => qt.has(t)).length;
    if (overlap) cands.push({ s: s.trim(), hit: h, score: overlap / Math.sqrt(st.length) + h.score });
  }
  cands.sort((a, b) => b.score - a.score);
  const picked = cands.slice(0, maxSentences);
  if (!picked.length || picked[0].score < 0.3)
    return { text: "I couldn't find that in this association's documents.", citations: [], refused: true };
  const order: number[] = [];
  const citations: Answer["citations"] = [];
  const parts = picked.map((p) => {
    let n = order.indexOf(p.hit.id) + 1;
    if (!n) { order.push(p.hit.id); n = order.length; citations.push({ n, title: p.hit.title, section: p.hit.section, quote: p.hit.body.slice(0, 240) }); }
    return `${p.s} [${n}]`;
  });
  return { text: parts.join(" "), citations, refused: false };
}
