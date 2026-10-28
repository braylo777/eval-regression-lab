import type { Answer } from "../sut/answer";
export interface Item { id: string; tenant: string; question: string; expect: "answer" | "refuse"; fact?: string; section?: string }

/** Reference label (strict, item-level gold spec written by hand): right fact AND cited from the gold section. */
export function reference(item: Item, a: Answer): boolean {
  if (item.expect === "refuse") return a.refused;
  if (a.refused) return false;
  return new RegExp(item.fact!, "i").test(a.text) && a.citations.some((c) => (c.section ?? "").startsWith(item.section!));
}

/**
 * Automated judge (cheap, lenient, no gold citation): passes a cited answer if it states the fact
 * OR looks on-topic (>=1 question content word echoed). This mirrors how a naive LLM judge rewards
 * fluent, on-topic answers; kappa vs. the reference shows how far it can be trusted.
 */
export function judge(item: Item, a: Answer): boolean {
  if (item.expect === "refuse") return a.refused;
  if (a.refused || !a.citations.length) return false;
  if (new RegExp(item.fact!, "i").test(a.text)) return true;
  const words = (s: string) => new Set(s.toLowerCase().match(/[a-z]{4,}/g) ?? []);
  const STOP = new Set(["what","when","where","does","have","must","with","that","this","there","many","much","long","allowed","rules","need"]);
  const q = new Set([...words(item.question)].filter((w) => !STOP.has(w))), t = words(a.text);
  return [...q].filter((w) => t.has(w)).length >= 1;
}

export function cohenKappa(x: boolean[], y: boolean[]): number {
  if (x.length !== y.length || !x.length) throw new Error("length mismatch");
  const n = x.length;
  let agree = 0, x1 = 0, y1 = 0;
  for (let i = 0; i < n; i++) { if (x[i] === y[i]) agree++; if (x[i]) x1++; if (y[i]) y1++; }
  const po = agree / n, pe = (x1 / n) * (y1 / n) + (1 - x1 / n) * (1 - y1 / n);
  return pe === 1 ? 1 : (po - pe) / (1 - pe);
}

export interface Metrics { accuracy: number; answerAccuracy: number; refusalAccuracy: number; falseRefusals: number; hallucinatedAnswers: number; n: number }
export function metrics(items: Item[], pass: boolean[], answers: Answer[]): Metrics {
  const idx = (p: (i: Item) => boolean) => items.map((it, i) => (p(it) ? i : -1)).filter((i) => i >= 0);
  const ans = idx((i) => i.expect === "answer"), ref = idx((i) => i.expect === "refuse");
  const rate = (ix: number[]) => ix.filter((i) => pass[i]).length / Math.max(1, ix.length);
  return {
    n: items.length,
    accuracy: pass.filter(Boolean).length / items.length,
    answerAccuracy: rate(ans), refusalAccuracy: rate(ref),
    falseRefusals: ans.filter((i) => answers[i].refused).length,
    hallucinatedAnswers: ref.filter((i) => !answers[i].refused).length,
  };
}
