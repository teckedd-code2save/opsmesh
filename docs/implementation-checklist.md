# Implementation Checklist

## Phase 1 — Foundation
- [ ] Initialize monorepo package manifests
- [ ] Add workspace config
- [ ] Add root TypeScript config
- [ ] Add Prisma schema under `packages/db`
- [ ] Add first migration
- [ ] Add db client package
- [ ] Scaffold Next.js web app shell
- [ ] Scaffold worker app shell
- [ ] Add basic dashboard routes

## Phase 2 — Ingestion
- [ ] Create `RadarSource` CRUD
- [ ] Add RSS connector
- [ ] Add HTML connector
- [ ] Add one source-specific parser
- [ ] Add fetch run logging
- [ ] Add normalization pipeline
- [ ] Add dedupe by content hash
- [ ] Store opportunities in DB

## Phase 3 — Review UI
- [ ] Radar inbox page
- [ ] Opportunity detail page
- [ ] Save / reject / archive actions
- [ ] Source management page
- [ ] Preferences page

## Phase 4 — OpenClaw intelligence
- [ ] Add `analyzeOpportunity` adapter
- [ ] Add `draftProposal` adapter
- [ ] Persist opportunity scores
- [ ] Persist proposal drafts
- [ ] Show scoring + drafts in UI

## Phase 5 — Alerts
- [ ] Telegram alert formatting
- [ ] Threshold rules for alerting
- [ ] Notify on strong matches
- [ ] Store alert actions in DB

## Phase 6 — Hardening
- [ ] Add retry handling for failed fetches
- [ ] Add source health status
- [ ] Add opportunity status filters
- [ ] Add latest-run dashboard widgets
- [ ] Add basic tests for connectors and normalization
