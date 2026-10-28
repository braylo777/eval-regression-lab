// Deterministic feature-hashing embedding (no API key, no network). 256 dims, L2-normalised.
// Swap for a hosted embedding model in production; the pgvector column and queries stay the same.
export const DIM = 256;
const STOP = new Set("the a an of to and or in on for by is are be shall may with at as that this any from it its not no all".split(" "));

// Small domain synonym list so everyday wording finds governing-document wording.
const SYN: Record<string, string[]> = {
  tall: ["height"], high: ["height"], airbnb: ["rental", "short"], vrbo: ["rental", "short"], rent: ["rental", "lease"],
  car: ["vehicle"], truck: ["vehicle"], dues: ["assessment"], hoa: ["association"], dog: ["pet"], cat: ["pet"],
  hardwood: ["flooring"], floor: ["flooring"], swim: ["pool"],
};
export function expand(toks: string[]): string[] {
  const out = [...toks];
  for (const t of toks) for (const s of SYN[t] ?? []) out.push(stem(s));
  return out;
}

export function tokens(text: string): string[] {
  return text.toLowerCase().normalize("NFKD").replace(/[^a-z0-9\s]/g, " ").split(/\s+/)
    .filter((t) => t.length > 1 && !STOP.has(t)).map(stem);
}
function stem(t: string) { if (t.length < 4) return t; return t.replace(/ies$/, "y").replace(/(ings|ing|ed|s)$/, "").replace(/e$/, "") || t; }

function fnv1a(s: string) { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); } return h >>> 0; }

export function embed(text: string): number[] {
  const v = new Array(DIM).fill(0);
  const toks = tokens(text);
  const feats = [...toks, ...toks.slice(1).map((t, i) => toks[i] + "_" + t)];
  for (const f of feats) { const h = fnv1a(f); v[h % DIM] += (h & 0x80000000) ? -1 : 1; }
  const n = Math.hypot(...v) || 1;
  return v.map((x) => x / n);
}
export const toVectorLiteral = (v: number[]) => "[" + v.map((x) => x.toFixed(6)).join(",") + "]";
