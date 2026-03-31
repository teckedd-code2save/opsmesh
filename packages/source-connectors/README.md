# @opsmesh/source-connectors

Planned connectors:
- RSS connector ✅
- generic HTML connector
- board-specific parser

## Current state
The RSS connector is implemented in `src/rss.ts`.
The worker can already consume connector output through the normalization and scoring path.

Start with the simplest legally accessible sources first.
