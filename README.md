# OpsMesh

Agent-native operations platform built to sit atop OpenClaw.

Initial product: **Gig Radar**

Future product on the same foundation: **DM Shop Agent** (WhatsApp + Telegram).

## What exists now
- Product architecture docs
- Gig Radar build checklist
- Prisma schema for the first real data model
- App/package scaffold for web + worker + OpenClaw adapter
- Mock-backed dashboard shell with inbox, sources, preferences, and opportunity detail pages
- Worker pipeline shape for connectors → normalization → OpenClaw scoring → alerting
- One real RSS connector implementation
- OpenClaw task contract for analysis and high-signal Telegram alert formatting

## Phase 1 goal
Ship a working Gig Radar that:
- polls selected gig/job sources
- normalizes and deduplicates opportunities
- scores them using OpenClaw-powered analysis
- sends Telegram alerts
- lets the operator review, save, reject, and draft responses

## Planned structure
- `apps/web` — dashboard and API
- `apps/worker` — polling, scoring, drafting, alerts
- `packages/db` — Prisma schema and db client
- `packages/radar-core` — normalization, dedupe, workflows
- `packages/openclaw-adapter` — task execution + notifications
- `packages/source-connectors` — RSS/HTML/source-specific connectors

## OpenClaw role
OpenClaw provides the agent runtime, reasoning, Telegram delivery, memory patterns, and scheduled task intelligence.
OpsMesh provides the business data model, workflow state, dashboard, and domain logic.
