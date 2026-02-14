# AI Cost Tracking (MVP)

## What is tracked now

- Per AI request (when available from OpenRouter `usage`):
  - `costCredits`
  - `promptTokens`
  - `completionTokens`
  - `totalTokens`
  - `cachedTokens`
  - `reasoningTokens`
- Running adventure totals in `adventure.aiCostMetrics`:
  - `totalCostCredits`
  - `trackedRequestCount`
  - `missingCostRequestCount`
  - token totals
- Transcript-level request metadata:
  - `transcript[].aiRequest` is attached for AI debug transcript entries.
  - `TranscriptItem` renders request-level cost/tokens when this metadata is present.
- Header rollup:
  - `AdventureHeader` renders running AI cost and request counts.
  - USD estimate in header uses `1 credit ~= $1.00` and rounds to `$0.001`.

## Known tracking gaps

- Provider omissions:
  - If OpenRouter response does not include `usage.cost` (or `usage` entirely), request cost is unknown.
  - These requests increment `missingCostRequestCount`.
- Error/timeout paths:
  - Hard failures, moderation failures, and transport timeouts usually do not include usage/cost payloads.
- Scope of transcript attribution:
  - Request metadata is attached only to AI debug transcript entries, not all storyteller/player/system entries.
  - In non-debug mode, those AI debug entries are not shown to players.
- Unit source:
  - Costs are sourced from OpenRouter response usage fields (`cost`/`total_cost`) and treated as credits.
  - No extra reconciliation against account invoices is performed.
- Persistence:
  - Cost totals are in-memory per adventure session and reset if the server process restarts.
