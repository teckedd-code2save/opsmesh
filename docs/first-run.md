# First Run Guide

## 1. Install dependencies
From repo root:

```bash
cd /Users/welcome/.openclaw/workspace/opsmesh
pnpm install
```

## 2. Typecheck packages
```bash
pnpm typecheck
```

## 3. Start the web app
```bash
cd apps/web
pnpm dev
```

Expected first useful pages:
- `/`
- `/dashboard/radar`
- `/dashboard/sources`
- `/dashboard/preferences`

## 4. Run the worker
In another terminal:

```bash
cd /Users/welcome/.openclaw/workspace/opsmesh
pnpm --filter @opsmesh/worker dev
```

Expected output:
- fetched item count
- normalized opportunity JSON
- analysis result
- Telegram alert preview

## 5. Database work later
The Prisma schema is in place but migrations are intentionally deferred until runtime wiring and package install are confirmed.

## 6. Next practical step after first run
- replace OpenClaw fallback analysis with real OpenClaw execution
- connect one real RSS feed into the worker
- replace mock repository data with DB persistence
