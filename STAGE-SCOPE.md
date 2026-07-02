# Stage as a strategy axis (SCOPE, not built)

> Advisor feedback (2026-07-02): *"the stage pick — like preseed, seed, series a etc."* Today
> everyone enters at **Seed** and rides a fixed Seed → A → B → C → D → Exit ladder, so stage is
> invisible and identical for every player. This scopes making **entry stage a strategic choice.**
> Companion to the custom-thesis work (shipped) and [`LP-NETWORK.md`](./LP-NETWORK.md).

## The insight
Stage is the single biggest driver of a fund's risk/return shape, and real VCs *specialize* by it.
Right now the thesis answers **how** you weigh a deal; stage would answer **where you play** — a
genuine second axis of judgment. Preseed is a different game from Growth, and forcing everyone
through the same ladder throws that away.

## What "pick a stage" can mean (options, increasing depth)
- **A — Entry stage (recommended).** You choose where you write your first check: Preseed / Seed /
  Series A / Series B / Growth. Earlier = fewer data points, higher variance, bigger multiples, more
  zeros; later = more signal, compressed multiples, fewer wipeouts.
- **B — Stage mandate.** You *are* a "Seed fund"; you can only deploy in a band and are scored against
  same-mandate peers → enables stage-specific leaderboards.
- **C — Stage-aware ladder.** Reserves / follow-ons become stage-aware; each round you decide whether
  to follow into the next stage or sell.

**Recommendation: ship A, with the data hooks for B.** It's the smallest change that answers the
advisor's ask and it composes with the existing engine — the round ladder already exists; we're just
choosing the entry point and reshaping the return distribution.

## Model changes (this is an engine change, not just UI)
- **Entry index.** Each company's `path[]` (Seed→Exit marks) is entered at `path[0]` today. A stage
  pick sets the entry index and rescales cost basis + outcome distribution.
- **Per-stage return curve.** A variance multiplier + a "zero rate" per stage so Preseed genuinely
  feels like Preseed (fatter tail, more wipeouts) and Growth feels compressed.
- **Diligence availability by stage.** Gate factors that wouldn't exist yet — no real financials at
  Preseed (cap `finW` low); governance/terms weigh heavier late. Ties the two axes together.
- **⚠️ Scoring baseline (the balance risk).** Scoring stays profit-based, but stage shifts the
  baseline. If late-stage simply looks "safer/better," everyone clusters there — the *exact*
  default-clustering problem the thesis had (59% Balanced). Likely need **stage-relative New Blood
  thresholds**. This is the part to get right, and the reason to scope rather than rush.

## UX
- A **Stage** chip row *above* the thesis panel (Preseed · Seed · Series A · Series B · Growth), each
  with a one-line risk/return descriptor + a mini risk gauge.
- Entry marks and the round ladder re-label to start at the chosen stage.
- Surface the implied shape, e.g. Preseed → *"~1 in 3 go to zero; winners 20–100×."* (legibility, same
  as R1's "make the consequence visible at the moment of choice").

## Events
- `stage_select {stage}` at pick time; add `stage` to `season_begin` / `season_end`.
- The weekly Loop-4 analyst then gets **stage distribution** and stage↔New-Blood correlation for free.
  Guardrail: if >~50% pick one stage, the granularity isn't landing — same signal we watch on thesis.

## Effort · risk · reversibility
- **Effort:** medium — entry index + return curves + diligence gating + scoring baseline. A focused
  session plus balancing passes.
- **Risk:** medium, concentrated in the scoring baseline (clustering). De-risk by shipping behind the
  loop: instrument `stage` first, watch the distribution, then tune thresholds.
- **Reversible:** yes — additive pre-season pick; defaulting to Seed reproduces today's game exactly.

## Phasing
| Phase | Scope |
|---|---|
| **v0** | Stage picker UI + entry-index + per-stage return curves + `stage` in events. Default Seed = current game. |
| **v1** | Stage-relative New Blood thresholds + stage-segmented leaderboard. |
| **v2** | Stage-aware follow-ons (option C). |

## How it ties to existing work
- Composes cleanly with the **custom thesis** (thesis = *how* you weigh · stage = *where* you play).
- Feeds the **LP network** — "best Seed scout" vs "best Growth scout" is a natural LP filter, and a
  more sellable credential than one undifferentiated leaderboard.
- Zero new plumbing for the analyst once `season_begin` carries `stage`.
