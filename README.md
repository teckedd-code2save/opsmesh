# OpsMesh

OpsMesh is a Telegram-first lead and operations layer built on top of OpenClaw.

The first product inside OpsMesh is **Gig Radar**.
Its job is simple:
- watch selected lead sources
- find small, winnable technical opportunities
- score and filter them
- send the good ones to Telegram
- let you act from Telegram or the app

## What the product is

Gig Radar is meant to feel like a working operator feed, not a job board.

Instead of checking multiple sites manually, the system should do the scanning for you, reduce noise, and deliver only leads worth attention.

The intended flow is:
1. sources are polled on a schedule
2. leads are normalized and deduplicated
3. OpenClaw helps score them for fit
4. strong matches are sent to Telegram
5. you can respond with actions like save, reject, draft, or more
6. the app keeps the state and history

## Why it exists

The goal is to reduce lead-hunting friction.

OpsMesh should help you move from:
- scattered sources
- too much noise
- manual triage
- slow follow-up

to:
- one filtered feed
- fast decision-making
- Telegram-first action
- a clean system of record

## What exists right now

Current working pieces include:
- a web dashboard for inbox, sources, preferences, and opportunity detail
- live RSS polling
- opportunity scoring through the OpenClaw adapter path
- Telegram delivery for leads
- Telegram action buttons
- inbound action hooks for save, reject, draft, and more
- local persistence for opportunities, drafts, and delivery state
- dedupe logic to avoid re-sending the same strong lead repeatedly

## What is still rough or incomplete

This is still early-stage and not fully production-ready yet.

Main gaps:
- persistence is still local-state oriented, not proper database-backed runtime state
- scheduling exists in shape, but deployment-grade automation is still being tightened
- Telegram interaction works in structure, but can still be improved for richer message correlation
- some app flows are still more functional than polished

## Product direction

OpsMesh is not trying to replace OpenClaw.

OpenClaw handles the agent runtime, reasoning, and messaging surface.
OpsMesh adds the product layer on top:
- lead workflow
- domain state
- operator actions
- business-specific logic
- app views and history

## In one sentence

**OpsMesh turns noisy lead sources into a Telegram-first, action-ready operator workflow.**
