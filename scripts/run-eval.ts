import { readFileSync, writeFileSync } from "node:fs";
import { createDb, run, BASELINE, ABLATIONS } from "../src/pipeline";
import { reference, judge, cohenKappa, metrics, Item } from "../src/grade";

const items: Item[] = JSON.parse(readFileSync("data/eval-set.json", "utf8"));
const db = await createDb();
const configs = [BASELINE, ...ABLATIONS];
const out: any = { ranAt: new Date().toISOString(), sut: "governing-docs-copilot@2f59679", configs: [] };
for (const c of configs) {
  const answers = [];
  for (const it of items) answers.push(await run(db, it.tenant, it.question, c));
  const ref = items.map((it, i) => reference(it, answers[i]));
  const jud = items.map((it, i) => judge(it, answers[i]));
  out.configs.push({
    config: c, metrics: metrics(items, ref, answers), judgeAccuracy: jud.filter(Boolean).length / items.length,
    kappa: Number(cohenKappa(ref, jud).toFixed(3)),
    failures: items.filter((_, i) => !ref[i]).map((it) => ({ id: it.id, q: it.question, expect: it.expect, got: answers[items.indexOf(it)].text.slice(0, 160) })),
  });
  const m = out.configs.at(-1).metrics;
  console.log(`${c.name.padEnd(28)} acc=${(m.accuracy * 100).toFixed(0)}% ans=${(m.answerAccuracy * 100).toFixed(0)}% refuse=${(m.refusalAccuracy * 100).toFixed(0)}% kappa=${out.configs.at(-1).kappa}`);
}
writeFileSync(process.argv[2] ?? "reports/latest.json", JSON.stringify(out, null, 1));
