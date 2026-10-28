# Eval Regression Lab with Ablations

A regression-testing harness for a RAG assistant: a 100-item hand-labelled set, four ablations, a judge-vs-reference agreement check (Cohen's κ), a CI gate that fails the build on regression, and a dashboard.

**Dashboard:** https://eval-regression-lab.braylo777.workers.dev (raw: `/report.json`, `/eval-set.json`)

**System under test:** the [Governing-Docs Copilot](https://github.com/braylo777/governing-docs-copilot) retrieval + cited-answer pipeline, copied verbatim into `sut/` from commit `2f59679`, running on Postgres (PGlite + pgvector) with row-level security.

## Results (2026-10-28)
| Config | Accuracy | Answerable | Must-refuse handled | Judge κ |
| --- | --- | --- | --- | --- |
| Baseline: hybrid RRF (dense + full-text), k=4 | **89%** | 94% | 50% | 0.947 |
| No full-text (dense only) | 83% | 88% | 50% | 0.964 |
| No dense (full-text only) | 85% | 90% | 50% | 0.917 |
| No synonym expansion | 87% | 92% | 50% | 0.954 |
| Top-1 retrieval | 80% | 84% | 50% | 0.901 |

What it shows: hybrid fusion is worth +4 to +6 pts over either retriever alone; k=4 context is worth +9 pts over k=1. The weak spot is **refusals**: 6 of 12 out-of-scope questions get a confident-but-wrong answer from a nearby section (e.g. "pool hours" asked of a condo with no pool returns guest-parking hours). That's the next fix for the Copilot, and the gate now blocks it from getting worse.

## Method
- **Dataset** (`data/build-dataset.mjs` → `data/eval-set.json`): 22 facts × 4 phrasings (plain, slangy, negated, keyword-only) = 88 answerable items, plus 12 must-refuse items (other tenant's rules, missing info, off-topic). Each answerable item is labelled with the required fact (regex) and the gold section.
- **Reference label**: correct only if the answer states the fact **and** cites the gold section; must-refuse items pass only if the assistant refuses.
- **Judge**: a cheap lenient grader (fact present, or the answer is on-topic). κ between judge and reference measures how far you could trust it alone; it is 0.90–0.96 here because it over-credits on-topic wrong answers. The reference labels were hand-specified by the builder, not by an independent annotator panel.
- **Gate** (`src/gate.ts`): fails if accuracy drops > 2 pts, answerable accuracy > 3 pts, or **any** extra must-refuse item gets answered. `npm run gate -- "top-1 retrieval"` demonstrates a failing gate (89% → 80%).

## Run
```bash
npm ci
npm test                 # 15 Vitest tests (dataset integrity, grading, kappa, gate, SUT + tenant isolation)
npm run eval             # all 5 configs x 100 items -> reports/latest.json
npm run gate             # CI gate vs reports/baseline.json
npm run dashboard && npm run build   # static dashboard -> Cloudflare Worker
```
No API keys are used anywhere. See `DEPLOYS.md` for deploys and rollback points.
