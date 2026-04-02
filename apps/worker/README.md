# apps/worker

Background runner for OpsMesh Gig Radar. Polls RSS sources, scores opportunities with OpenClaw, and delivers strong matches to Telegram.

## What it does

1. Fetches items from active RSS sources
2. Filters by relevance (API, automation, backend keywords)
3. Scores each item with OpenClaw AI analysis
4. Persists results to local state (`.opsmesh/radar-state.json`)
5. Sends `strong_match` opportunities to Telegram (once per item)
6. Records run summary and handles a worker lock to prevent overlap

## Commands

```bash
# Run once (recommended for cron)
pnpm --filter @opsmesh/worker run-once

# Dev watch mode
pnpm --filter @opsmesh/worker dev
```

## Cron setup

```bash
# Every 30 minutes
*/30 * * * * cd /Users/welcome/.openclaw/workspace/opsmesh && pnpm --filter @opsmesh/worker run-once >> /tmp/opsmesh-worker.log 2>&1
```

## Notes

- IDs are capped at 50 chars so Telegram `callback_data` stays within the 64-byte limit
- A worker lock prevents concurrent runs — if a run is stuck, clear it via the web UI (Clear button)
- Telegram delivery is tracked per-opportunity; already-sent items are not re-sent
