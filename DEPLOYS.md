# Deploys

| When (CT) | Worker version | Deployment | Rollback point |
| --- | --- | --- | --- |
| 2026-10-28 09:40 | 77d8f3c6-f5d3-4216-a96b-55f4d16f588d | 81772924-5421-4ad9-ac74-49385f01bd40 | First deploy, nothing before it. To take it offline without deleting anything, disable the workers.dev route. Later deploys roll back to this version via `wrangler rollback 77d8f3c6-f5d3-4216-a96b-55f4d16f588d` or Dashboard → Deployments. |

Post-deploy check (09:40 CT): `/` and `/report.json` returned 200.
