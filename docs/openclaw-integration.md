# OpenClaw Integration Plan

## Principle
OpsMesh is built on top of OpenClaw, not as a replacement for it.

## What OpenClaw should own
- agent reasoning
- Telegram delivery
- memory and context
- scheduled execution / periodic analysis
- optional browser/web fetch augmentation

## What OpsMesh should own
- business records
- source definitions
- opportunity states
- approval and review flows
- dashboard surfaces
- product packaging

## Current integration status
- `packages/openclaw-adapter/src/tasks.ts` defines the task contract for opportunity analysis and Telegram alert formatting
- `packages/openclaw-adapter/src/runtime.ts` is the integration boundary where real OpenClaw execution should be plugged in
- current behavior is heuristic fallback output so the rest of the app can move forward without blocking

## Next real integration step
Replace the runtime fallback with a direct OpenClaw execution path that:
1. sends the analysis task into OpenClaw
2. receives strict JSON back
3. parses and validates the result
4. stores the score for the opportunity

## Telegram integration step
Replace the alert stub with a real OpenClaw-backed send operation for high-signal opportunities.
