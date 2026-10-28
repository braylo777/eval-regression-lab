import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
const r = JSON.parse(readFileSync("reports/baseline.json", "utf8"));
const items = JSON.parse(readFileSync("data/eval-set.json", "utf8"));
const p = (x: number) => (x * 100).toFixed(0) + "%";
const base = r.configs[0].metrics;
const rows = r.configs.map((c: any) => {
  const m = c.metrics, d = m.accuracy - base.accuracy;
  return `<tr><td>${c.config.name}</td><td>${p(m.accuracy)}</td><td>${d ? (d > 0 ? "+" : "") + (d * 100).toFixed(0) + " pts" : "—"}</td><td>${p(m.answerAccuracy)}</td><td>${p(m.refusalAccuracy)}</td><td>${m.falseRefusals}</td><td>${m.hallucinatedAnswers}</td><td>${p(c.judgeAccuracy)}</td><td>${c.kappa}</td></tr>`;
}).join("");
const bars = r.configs.map((c: any, i: number) => `<rect x="${10 + i * 150}" y="${200 - c.metrics.accuracy * 180}" width="110" height="${c.metrics.accuracy * 180}" fill="${i ? "#8b93a7" : "#4f8cff"}"/><text x="${65 + i * 150}" y="${195 - c.metrics.accuracy * 180}" text-anchor="middle">${p(c.metrics.accuracy)}</text><text x="${65 + i * 150}" y="218" text-anchor="middle">${c.config.name.split(" (")[0]}</text>`).join("");
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));
const fails = r.configs[0].failures.map((f: any) => `<tr><td>${f.id}</td><td>${f.expect}</td><td>${esc(f.q)}</td><td>${esc(f.got)}</td></tr>`).join("");
const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Eval Regression Lab</title>
<style>body{font:15px/1.5 system-ui,sans-serif;margin:0;background:#0b0f17;color:#e6e9ef}main{max-width:1050px;margin:auto;padding:24px}.muted{color:#8b93a7}
table{width:100%;border-collapse:collapse;margin:10px 0}td,th{padding:6px 8px;border-bottom:1px solid #222a3a;text-align:left;vertical-align:top}.card{background:#121826;border:1px solid #222a3a;border-radius:10px;padding:16px;margin:16px 0}svg text{fill:#8b93a7;font-size:11px}a{color:#4f8cff}</style></head><body><main>
<h1>Eval Regression Lab</h1><p class="muted">System under test: <a href="https://governing-docs-copilot.braylo777.workers.dev">Governing-Docs Copilot</a> (${r.sut}) · ${items.length} hand-labelled items (88 answerable, 12 must-refuse) · run ${r.ranAt.slice(0, 16).replace("T", " ")} UTC</p>
<div class="card"><h3>Accuracy by configuration</h3><svg width="100%" height="230" viewBox="0 0 760 230">${bars}</svg></div>
<div class="card"><h3>Ablations</h3><table><tr><th>Config</th><th>Accuracy</th><th>Δ vs baseline</th><th>Answerable</th><th>Refusal</th><th>False refusals</th><th>Answered must-refuse</th><th>Judge says</th><th>Judge vs reference κ</th></tr>${rows}</table>
<p class="muted">Reference label = right fact AND cited from the gold section (hand-written per item). Judge = cheap lenient grader (fact or on-topic). κ = Cohen's kappa between them.</p></div>
<div class="card"><h3>CI gate</h3><p>Every push re-runs all 100 items; the build fails if accuracy drops more than 2 pts, answerable accuracy more than 3 pts, or any new must-refuse item gets answered. Running the gate with the top-1 retrieval config fails, which shows the gate catches a real regression.</p></div>
<div class="card"><h3>Baseline failures (${r.configs[0].failures.length})</h3><table><tr><th>ID</th><th>Expected</th><th>Question</th><th>Got</th></tr>${fails}</table></div>
<p class="muted"><a href="https://github.com/braylo777/eval-regression-lab">Source, dataset and methodology</a></p></main></body></html>`;
mkdirSync("dist", { recursive: true });
writeFileSync("dist/index.html", html);
console.log("dist/index.html", html.length);
