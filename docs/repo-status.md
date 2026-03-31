# Repo Status

## What is real now
- monorepo scaffold
- web dashboard shell
- worker shell
- source connector contract
- one real RSS parser
- in-memory repository/store for opportunities, sources, preferences
- opportunity list/detail/action routes
- OpenClaw integration contract for analysis and alerts

## What is still placeholder/stub
- DB client implementation
- Prisma-generated migration output
- real OpenClaw execution
- real Telegram send path
- persistent action history

## Architectural principle
OpsMesh is intentionally built as a business layer atop OpenClaw, not as a replacement runtime.
