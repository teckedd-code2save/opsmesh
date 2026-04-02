# OpsMesh cron wiring

Minimal cron-safe worker command:

```bash
cd /Users/welcome/.openclaw/workspace/opsmesh && pnpm --filter @opsmesh/worker run-once
```

Example every 30 minutes:

```bash
*/30 * * * * cd /Users/welcome/.openclaw/workspace/opsmesh && pnpm --filter @opsmesh/worker run-once >> /tmp/opsmesh-worker.log 2>&1
```

## What it does
- acquires a local worker lock
- polls active RSS sources
- scores and stores opportunities
- sends unsent strong matches to Telegram
- records last run summary in local state
- releases the lock when done

## Current lock model
- local JSON-backed lock in `.opsmesh/radar-state.json`
- enough for single-machine cron runs
- not suitable for distributed/multi-instance deployment
