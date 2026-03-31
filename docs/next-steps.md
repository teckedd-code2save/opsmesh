# Next Steps

## Immediate next implementation targets
1. Install workspace dependencies with `pnpm install`
2. Generate Prisma client in `packages/db`
3. Replace the placeholder migration with a real Prisma-generated initial migration
4. Add a real db client export in `packages/db/src`
5. Add the first persisted source connector in `apps/worker/src/connectors`
6. Add a real route in `apps/web/src/app/api/radar/opportunities/route.ts` backed by DB instead of in-memory state

## First real vertical slice
- create one `RadarSource`
- poll it manually from the worker
- store opportunities
- view opportunities in `/dashboard/radar`
- run one OpenClaw-backed score
- display the score in the UI
- emit a Telegram alert preview for strong matches

## First real OpenClaw integration slice
- replace heuristic fallback in `packages/openclaw-adapter/src/runtime.ts`
- send `buildAnalyzeOpportunityTask(...)` into a real OpenClaw execution path
- parse strict JSON output
- replace alert stub with a real Telegram send via OpenClaw
