import type { Metrics } from "./grade";
export const TOLERANCE = { accuracyDrop: 0.02, answerAccuracyDrop: 0.03, newHallucinations: 0 };
export function gate(base: Metrics, cand: Metrics) {
  const reasons: string[] = [];
  if (base.accuracy - cand.accuracy > TOLERANCE.accuracyDrop) reasons.push(`accuracy ${pct(base.accuracy)} -> ${pct(cand.accuracy)}`);
  if (base.answerAccuracy - cand.answerAccuracy > TOLERANCE.answerAccuracyDrop) reasons.push(`answer accuracy ${pct(base.answerAccuracy)} -> ${pct(cand.answerAccuracy)}`);
  if (cand.hallucinatedAnswers - base.hallucinatedAnswers > TOLERANCE.newHallucinations) reasons.push(`answered ${cand.hallucinatedAnswers - base.hallucinatedAnswers} more must-refuse items`);
  return { pass: reasons.length === 0, reasons };
}
const pct = (x: number) => (x * 100).toFixed(1) + "%";
