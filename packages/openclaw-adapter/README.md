# @opsmesh/openclaw-adapter

Thin integration boundary between OpsMesh and OpenClaw.

Initial adapter functions:
- `analyzeOpportunity(opportunity, preferences)`
- `draftProposal(opportunity, score)`
- `notifyHighSignalOpportunity(opportunity, score)`

The goal is to keep OpsMesh product-specific while delegating reasoning and messaging to OpenClaw.
