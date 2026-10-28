// CI gate: re-runs the eval and fails (exit 1) if the shipped config regresses vs reports/baseline.json.
// Usage: tsx scripts/gate.ts [configName]  (defaults to the baseline config; pass an ablation name to see a failing gate)
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { gate } from "../src/gate";
execFileSync("npx", ["tsx", "scripts/run-eval.ts", "reports/latest.json"], { stdio: "inherit" });
const base = JSON.parse(readFileSync("reports/baseline.json", "utf8")).configs[0];
const latest = JSON.parse(readFileSync("reports/latest.json", "utf8")).configs;
const name = process.argv[2] ?? base.config.name;
const cand = latest.find((c: any) => c.config.name === name);
if (!cand) { console.error("unknown config", name); process.exit(2); }
const r = gate(base.metrics, cand.metrics);
console.log(r.pass ? `GATE PASS: ${name}` : `GATE FAIL: ${name}\n - ${r.reasons.join("\n - ")}`);
process.exit(r.pass ? 0 : 1);
