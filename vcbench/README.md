# VC-Bench — agent interface (contract first, harness next)

> **Attribution:** the tool interface here mirrors **CEO-Bench**'s agent interface 1:1 in shape —
> [`zlab-princeton/ceobench-src`](https://github.com/zlab-princeton/ceobench-src) (Zhuang Liu Lab,
> Princeton), specifically `src/saas_bench/tools.py` + `tool_docs.json`. We adopted their format
> deliberately and with thanks: per-tool entries carry `name / category / description / inputSchema
> / parameters / returns {success, failure} / impact / example_call`, and information hiding is
> enforced **at the tool layer** (their `_filter_hidden` pattern — true scores are never returned
> while fog is active), not by UI obscurity. Their design write-up: https://ceobench.com/

## What this is

The tool contract for running agents (LLM or scripted) against the Fantasy VC **daily board** —
the same seeded board humans play, so agent and human scores land on one leaderboard.
"Can you out-pick Claude?" is the product; the benchmark is a real one: partial information
(fog levels), delayed consequences (marks resolve on advance), a published rule-based baseline
(Index Ventures Bot), and exact skill attribution (selection α / steering α / calibration).

- **`tool_docs.json`** — the 13-tool contract (this directory), CEO-Bench format.
- **Harness (next):** a Node runner that loads the game engine headlessly, exposes these tools
  over stdin/stdout or HTTP (their `api_server.py` analog), and appends `get_result` rows to the
  collector. The engine is already deterministic-given-(board, actions), so replays are free.

## Episode shape (mirrors their weekly loop)

```
get_board → [spend_diligence ×≤6] → set_thesis → set_seed_allocation → begin_season
  → { get_holdings / get_standings / follow_on / sell / advance_round }×5   (or auto_resolve)
  → get_result
```

Scoring: `get_result` is the whole scorecard. Rank vs bots, margin over Index Bot (the baseline a
skilled agent must beat — CEO-Bench's rule-based baseline beat every LLM they tested; ours is the
same bar), and the decomposition that says *which* skill the agent showed.
