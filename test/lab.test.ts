import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "node:fs";
import { cohenKappa, reference, judge, metrics, Item } from "../src/grade";
import { gate } from "../src/gate";
import { createDb, run, BASELINE, ABLATIONS } from "../src/pipeline";

const items: Item[] = JSON.parse(readFileSync("data/eval-set.json", "utf8"));
const A = (text: string, section: string | null = "Article 4", refused = false) =>
  ({ text, refused, citations: refused ? [] : [{ n: 1, title: "t", section, quote: "" }] });

describe("dataset", () => {
  it("has 100 items, 88 answerable + 12 must-refuse, unique ids", () => {
    expect(items).toHaveLength(100);
    expect(items.filter((i) => i.expect === "refuse")).toHaveLength(12);
    expect(new Set(items.map((i) => i.id)).size).toBe(100);
  });
  it("every answerable item has a valid fact regex and gold section", () => {
    for (const i of items.filter((i) => i.expect === "answer")) {
      expect(() => new RegExp(i.fact!)).not.toThrow();
      expect(i.section).toMatch(/^(Article|Section) \d/);
    }
  });
});

describe("grading", () => {
  const item: Item = { id: "x", tenant: "t", question: "How tall can my fence be?", expect: "answer", fact: "6 feet", section: "Article 4" };
  it("reference needs the fact AND the gold section", () => {
    expect(reference(item, A("Fences may not exceed 6 feet. [1]"))).toBe(true);
    expect(reference(item, A("Fences may not exceed 6 feet. [1]", "Article 6"))).toBe(false);
    expect(reference(item, A("", null, true))).toBe(false);
  });
  it("judge is lenient: on-topic answer passes even without the fact", () => {
    expect(judge(item, A("Fence material must be wood. [1]"))).toBe(true);
    expect(reference(item, A("Fence material must be wood. [1]"))).toBe(false);
  });
  it("refuse items pass only when refused", () => {
    const r: Item = { id: "r", tenant: "t", question: "capital of France?", expect: "refuse" };
    expect(reference(r, A("", null, true))).toBe(true);
    expect(judge(r, A("Paris [1]"))).toBe(false);
  });
});

describe("kappa", () => {
  it("is 1 for perfect agreement and 0 for chance-level", () => {
    expect(cohenKappa([true, false, true], [true, false, true])).toBe(1);
    expect(cohenKappa([true, true, false, false], [true, false, true, false])).toBeCloseTo(0);
  });
  it("matches a hand-computed value", () => {
    // po=0.8, pe=0.5*0.6+0.5*0.4=0.5 -> kappa=0.6
    const x = [1, 1, 1, 1, 1, 0, 0, 0, 0, 0].map(Boolean), y = [1, 1, 1, 1, 0, 0, 0, 0, 0, 1].map(Boolean);
    expect(cohenKappa(x, y)).toBeCloseTo(0.6);
  });
  it("rejects mismatched inputs", () => { expect(() => cohenKappa([true], [])).toThrow(); });
});

describe("metrics + gate", () => {
  it("counts false refusals and hallucinated answers", () => {
    const its: Item[] = [{ id: "a", tenant: "t", question: "q", expect: "answer", fact: "x", section: "Article 1" }, { id: "b", tenant: "t", question: "q", expect: "refuse" }];
    const m = metrics(its, [false, false], [A("", null, true), A("made up [1]")]);
    expect(m).toMatchObject({ falseRefusals: 1, hallucinatedAnswers: 1, accuracy: 0 });
  });
  const base = { n: 100, accuracy: 0.89, answerAccuracy: 0.94, refusalAccuracy: 0.5, falseRefusals: 2, hallucinatedAnswers: 6 };
  it("passes within tolerance", () => { expect(gate(base, { ...base, accuracy: 0.88 }).pass).toBe(true); });
  it("fails on an accuracy regression", () => { expect(gate(base, { ...base, accuracy: 0.8 }).pass).toBe(false); });
  it("fails on a new hallucinated answer even if accuracy holds", () => {
    const r = gate(base, { ...base, hallucinatedAnswers: 7 });
    expect(r.pass).toBe(false);
    expect(r.reasons[0]).toContain("must-refuse");
  });
});

describe("system under test", () => {
  let db: any;
  beforeAll(async () => { db = await createDb(); }, 60000);
  it("baseline answers a gold item with a citation", async () => {
    const a = await run(db, "oak-hollow", "How tall can my fence be?", BASELINE);
    expect(a.text).toMatch(/6 feet/);
    expect(a.citations.length).toBeGreaterThan(0);
  });
  it("tenant isolation holds under every ablation", async () => {
    for (const c of [BASELINE, ...ABLATIONS]) {
      const a = await run(db, "lakeside-commons", "What are the pool hours?", c);
      expect(a.text).not.toMatch(/8 AM to 9 PM/);
    }
  });
  it("committed baseline report shows the gate would catch top-1 retrieval", () => {
    const r = JSON.parse(readFileSync("reports/baseline.json", "utf8"));
    const top1 = r.configs.find((c: any) => c.config.name === "top-1 retrieval");
    expect(gate(r.configs[0].metrics, top1.metrics).pass).toBe(false);
  });
});
