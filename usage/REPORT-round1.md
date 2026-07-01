# Improvement Report — Fantasy VC

**Source:** `usage/synthetic-traces.json` · 1,105 events · 120 sessions · 14-day span
**Run by:** hill-climbing analyst (Loop 4). Proposals only — not applied. Each passed the 5-point
verification rubric (Loop 2); see the check line under each.

> ⚠️ This run is on **synthetic** data generated to exercise the pipeline. Treat the *format and
> mechanism* as the deliverable; re-run on real traces before acting.

> **Applied 2026-06-30 — all 5 shipped.** #1 (`N=5`), #2 (Auto-resolve to Exit + `auto_resolve`
> event), #3 (tiered Bronze/Silver/Gold scout flag + `scoutTier` field), #4 (Risk/Terms coach tip),
> and #5 (50/50 wager nudge + `wager_nudge` event). `usage.html` shows scout-tier distribution and
> auto-resolve uptake to confirm the moves.
>
> **Note on #4:** implemented as a once-per-run coaching tip on the *first* deal, NOT gated on
> `tellsBad` as originally written — a nudge that appeared only on trap deals would leak the answer
> key and defeat the game's core skill. Same target metric (Risk+Terms open share ↑ → trap-invest
> rate ↓), no cheating. Confirm via `diligence_open` category mix and trap `decision.invested` rate.

## Funnel at a glance
| Stage | Count | Drop-off |
|---|---|---|
| App opens | 120 (64 league / 56 diligence) | — |
| League: season begun → finished | 56 → 17 | **70%** |
| Diligence: started → finished | 53 → 2 | **96%** |
| New Blood earned | **0 / 19** finishes | — |

---

## 1. The Diligence desk is far too long — players bleed out deal-by-deal
**Signal.** Diligence completion is 2/53 (**96% drop-off**). Reach by deal index decays monotonically:
deal 0 = 53 decisions → deal 4 = 23 → deal 6 = 8 → deal 7 = 7. Roughly **half the players are gone by deal 3**, ~85% by deal 6.
**Hypothesis.** An 8-deal desk with no save point is a long, unbroken commitment; attention dies before the payoff (the end-of-run track record).
**Change.** `memo.html` → `const DP_PER_DEAL=3, CAP=25, START=100, N=8;` set **`N=5`**. (Optional follow-up: a "deal X of 5" progress bar + resumable run.)
**Expected move & confirm.** Diligence completion 4% → 35–50%. Confirm: `memo_end / memo_start` ratio and a flatter `reach-by-deal` curve next run.
**Confidence:** High. **Risk:** Low — fewer deals slightly reduces variety per run; mitigated by reshuffle.
**Rubric:** ✅ metric-tied ✅ specific ✅ reversible (one constant) ✅ names+verifies metric ✅ no healthy number harmed.

## 2. League loses 70% mid-season — the round-by-round flow is friction
**Signal.** 56 seasons begun, 17 finished (**70% drop-off**), despite the season being the core loop.
**Hypothesis.** Clicking **Advance** through 5 rounds and managing positions each round is more micro-management than many players want; they bail before the leaderboard payoff.
**Change.** `index.html` → add an **"⏩ Auto-resolve to Exit"** button next to `advBtn` that loops `advance()` to round 5 without per-round interaction (keeps the manual path for players who want depth).
**Expected move & confirm.** League completion 30% → 55%+. Confirm: `season_end / season_begin`; segment by whether `auto_resolve` event fired.
**Confidence:** Medium-High. **Risk:** Low-Med — could mask the follow-on/sell mechanic; mitigate by making manual the default and auto the escape hatch. Add an `auto_resolve` event to measure uptake.
**Rubric:** ✅ ✅ ✅ ✅ ✅

## 3. New Blood is unreachable — 0 of 19 finishers earned it
**Signal.** Across 17 league + 2 diligence completions, **New Blood = 0**. The flag requires four
simultaneous conditions; nobody cleared all four.
**Hypothesis.** A reward that literally never fires gives players nothing to climb toward — it reads as broken, not aspirational.
**Change.** Make it **tiered** instead of binary. `memo.html` `endRun()` (`const newBlood=profit>0 && cleanSheet && acc>=70 && forecastEdge;`): add Bronze (profit>0), Silver (+ acc≥70), Gold (all four). Mirror in `index.html` `endSeason()`.
**Expected move & confirm.** Some scout tier earned in >50% of finishes; Gold stays rare (<15%). Confirm: distribution of a new `scout_tier` field on the end events.
**Confidence:** High. **Risk:** Low — preserves Gold's prestige while giving a progression ladder.
**Rubric:** ✅ ✅ ✅ ✅ ✅

## 4. Players don't look where the traps hide — and pay for it
**Signal.** Risk & Terms are only **15%** of all 457 diligence opens (Team/Market/Product dominate).
Consequently players invest into a zero in **44 of 90** trap decisions (**49%**).
**Hypothesis.** The decisive tell is gated behind the two least-opened boxes; the reveal teaches *after*
the loss, but the lesson isn't landing fast enough to change behavior within a run.
**Change.** `memo.html` `showDeal()` — when a deal carries a `tellsBad` flag, render a subtle pre-decision nudge once per run: *"🚩 Something here doesn't add up — have you checked Risk & Terms?"* (don't say which deal is bad — just prompt the habit).
**Expected move & confirm.** Risk+Terms share 15% → 25%+; trap-investment rate 49% → <35%. Confirm: `diligence_open` cat distribution and trap `decision.invested` rate.
**Confidence:** Medium. **Risk:** Med — a blanket nudge could over-trigger checking; A/B by showing it to half of sessions.
**Rubric:** ✅ ✅ ✅ ✅ ✅

## 5. The conviction wager is being ignored — 55% leave it at 50/50
**Signal.** 120 of 220 decisions (**55%**) submit with both prediction sliders untouched at 50% — i.e., no wager placed.
**Hypothesis.** The wager sits below the diligence boxes and competes with the check-size decision; many players don't realize it's a scored, separate track.
**Change.** `memo.html` — when a player commits with sliders still at 50/50, show a one-time inline prompt: *"You skipped the wager — moving the odds is how you build a forecasting track record."* Plus surface the live "if right / if wrong" hint earlier (it already exists; make it bolder).
**Expected move & confirm.** 50/50 submissions 55% → <35%. Confirm: share of `decision` events with `pBreak===50 && pWipe===50`.
**Confidence:** Medium. **Risk:** Low — purely additive nudge.
**Rubric:** ✅ ✅ ✅ ✅ ✅

---

### Honorable mention (below the cut)
**Thesis choice is mostly inertia** — Balanced is **59%** of league starts (33/56); Risk-averse only 3.
The thesis may not feel consequential at selection time. *Possible later fix:* preview how conviction
scores re-rank the visible deals the instant you switch thesis. Confidence: Low without more data.

### Notes for the next run
- Synthetic memo drop-off (96%) is harsher than a real cohort will likely be — the generator
  compounds an abandon probability per deal. Re-baseline on real traces before trusting the absolute number; the *shape* (monotonic decay) is the real finding.
- Minimum data bar before acting on any single proposal: ≥30 completed runs of that mode.
