# Improvement Report — Fantasy VC · Cycle 2 (re-run)

**Source:** `usage/synthetic-traces.json` · 1,105 events · 120 sessions · 14-day span
**Run by:** hill-climbing analyst (Loop 4). Proposals only — not applied. Round-1 report archived at
`usage/REPORT-round1.md`.

> ⚠️ **This trace predates Cycle-1's changes.** The five Cycle-1 fixes are already shipped, but this
> dataset contains **none** of the fields they emit (`scoutTier`, `auto_resolve`, `wager_nudge` are all
> absent). So this run **cannot measure their lift** — doing so would be circular. This report is
> therefore two things: (A) a **verification plan** for the shipped changes, to run once post-change
> traffic exists, and (B) a **residual scan** for what the current data *still* legitimately supports.
> Per the guardrail, nothing here is proposed without a number, and I will not re-propose a fixed item.

## Baseline (this trace — the "before" for Cycle-1)
| Metric | Value | Cycle-1 fix targeting it |
|---|---|---|
| League season drop-off | 56 → 17 (**70%**) | #2 auto-resolve |
| Diligence drop-off | 53 → 2 (**96%**); reach 53→30→17→8→7 by deal idx | #1 `N=5` |
| New Blood earned | **0 / 19** finishes | #3 tiered scout flag |
| Risk+Terms share of 457 opens | **15%** (risk 11% / terms 5%) | #4 coach tip |
| Trap decisions invested into a zero | 44 / 90 (**49%**) | #4 coach tip |
| Wager left at 50/50 | 120 / 220 decisions (**55%**) | #5 wager nudge |
| Avg judgment 67% · avg diligence acc 59% | (skill signal) | — |

---

## A. Verification plan for the shipped Cycle-1 changes
*Run these checks on the FIRST batch of post-change traces (≥30 completed runs/mode). No action now.*

1. **#1 `N=5`** — expect diligence completion 4% → 35–50%. **Confirm:** `memo_end / memo_start` ratio; `reach-by-deal` should be flat across idx 0–4 with no idx ≥5 (deals 5–7 no longer exist).
2. **#2 Auto-resolve** — expect league completion 30% → 55%+. **Confirm:** `season_end / season_begin`; segment by whether `auto_resolve` fired; watch it doesn't cannibalize follow-on/sell actions (compare mid-season `decision`-equivalent activity with vs without auto).
3. **#3 Tiered scout** — expect *some* tier in >50% of finishes, Gold still <15%. **Confirm:** `scoutTier` distribution on `season_end` + `memo_end` (already surfaced in `usage.html`).
4. **#4 Coach tip** — expect Risk+Terms share 15% → 25%+ and trap-invest 49% → <35%. **Confirm:** `diligence_open` category mix and trap `decision.invested` rate. *(Note: implemented as a first-deal habit tip, NOT gated on `tellsBad`, to avoid leaking the answer key — so expect a modest, broad lift, not a spike.)*
5. **#5 Wager nudge** — expect 50/50 submissions 55% → <35%. **Confirm:** share of `decision` with `pBreak===50 && pWipe===50`; `wager_nudge` fire count vs subsequent slider movement.

**Until that data exists, the weekly Loop-3 run will correctly report "not enough new data."**

---

## B. Residual finding — still supported by the current trace

### R1. Thesis choice is inertia, not strategy — Balanced is 59% of starts
**Signal.** Of 56 league starts: **Balanced 33 (59%)**, Talent-first 7, Product/Moat 7, Market-first 6,
**Risk-averse 3 (5%)**. Balanced is the default selection; four of five theses are barely explored.
(This was Cycle-1's honorable mention; with the top-5 funnel fixes shipped, it's now the strongest
*unaddressed* signal in the data — hence promoted.)
**Hypothesis.** The thesis choice has no visible consequence at selection time, so players never move
off the default. The lever exists (thesis re-weights every deal's conviction score) but is invisible
until much later, so it doesn't feel like a decision.
**Change.** `index.html` `renderThesis()` / `renderGrid()` — when the player switches thesis, briefly
highlight how the **deal cards re-rank** (they already recompute `conviction(d)`; add a one-beat
flash/arrow on cards whose rank changes, or a "top pick under this thesis: X" line). Make the
consequence legible at the moment of choice.
**Expected move & confirm.** Balanced share 59% → <45%; ≥3 theses each used in >10% of starts.
**Confirm:** distribution/entropy of `season_begin.thesis`.
**Confidence:** Medium. **Risk:** Low — purely additive UI feedback; doesn't change scoring.
**Rubric:** ✅ metric-tied ✅ specific ✅ reversible ✅ names+verifies the metric ✅ harms no healthy number.

> **Applied 2026-06-30.** `index.html` now shows a conviction **rank badge** on every deal card, a
> **top-picks line** (naming the current 🥇🥈🥉 and the biggest mover when you switch), and a **flash**
> on any card whose rank changes. **Confirm:** `season_begin.thesis` distribution should flatten
> (Balanced 59% → <45%).
>
> **Sub-finding surfaced while building R1 → APPLIED 2026-06-30 (R1b, "widen the spread").** The
> theses were barely differentiated — only the mid-pack re-ranked (5–9 of 16 cards, ≤5 places), and
> a live check showed **2 of 4 thesis switches produced zero movement**. Root cause: the weight
> vectors were mild tilts off Balanced. **Fix:** replaced them with sharp, differentiated tilts
> (each sums to 100; `finW` default left at 0.3). **Simulated effect (deterministic — provable
> without usage data): total card-moves across the 4 switches 24 → 35 (+46%), max shift 5 → 9.** The
> teaching case sharpens: **Product/Moat now lifts Theranos to #3** (a fraud in your top 3 — high
> differentiation/market), while **Risk-averse (ar-weighted) filters all five frauds to the bottom 5.**
> *Still needs post-change data* for the one behavioral question this can't settle by simulation:
> does the wider spread actually pull players off the 59% Balanced default? Confirm via
> `season_begin.thesis` distribution once real traces exist.

---

### Why only one proposal
The other live signals in this trace — mid-season and mid-desk drop-off, an unreachable scout flag,
Risk/Terms neglect, and ignored wagers — are **exactly what Cycle-1 already ships fixes for.** Re-listing
them would violate the guardrail (don't re-propose what's applied) and pad the report. A dry well is the
correct result one cycle in: the honest next step is **new data**, not more proposals.

### Notes for the next run
- **Re-baseline required.** Nothing here should be acted on as a *measured* result — the trace is the
  pre-change baseline. Wire the collector into real play (already built: `collector.js`), accumulate
  ≥30 runs/mode, then the weekly run can quantify the Cycle-1 lift against the baseline table above.
- Watch for a **new** failure the fixes could introduce: does auto-resolve (#2) suppress the
  follow-on/secondary mechanic? Does `N=5` reduce deal variety enough to hurt replay? Both are
  measurable once post-change traces land.
