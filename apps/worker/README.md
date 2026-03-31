# apps/worker

Background runner for Gig Radar.

## Current jobs
- `poll-source` shape via `src/connectors.ts`
- `score-opportunity` shape via `src/scoring.ts`
- `notify-opportunity` shape via OpenClaw adapter stubs

## Current command
```bash
pnpm --filter @opsmesh/worker dev
```

This will run the stub-to-real worker flow:
1. fetch from a stub connector
2. normalize the item
3. run the OpenClaw-ready analysis path
4. print a Telegram alert preview for strong matches
