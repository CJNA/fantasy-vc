# Fantasy VC — The Improvement Loop

A self-improving loop for the prototype, structured on LangChain's *Art of Loop Engineering*
(four stacked loops). The goal: **monitor real usage → automatically propose (and, gated by review,
apply) improvements.**

```
            ┌────────────────────────────────────────────────────────┐
            │  LOOP 4 — HILL CLIMBING (self-improvement)               │
            │  read traces → find friction → propose harness changes   │
            └───────────────▲───────────────────────────┬────────────┘
                            │ usage traces              │ proposed diffs
            ┌───────────────┴───────────┐   ┌───────────▼────────────┐
            │ OBSERVABILITY (prereq)     │   │ LOOP 2 — VERIFICATION   │
            │ analytics.js → usage.html  │   │ grader checks each diff │
            └───────────────▲───────────┘   └───────────┬────────────┘
                            │ events                    │ pass → human checkpoint → apply
            ┌───────────────┴───────────────────────────▼────────────┐
            │ LOOP 1 — AGENT (build the feature / apply the change)    │
            └─────────────────────────────────────────────────────────┘
              LOOP 3 — EVENT-DRIVEN: a schedule/trigger runs Loop 4
```

## What exists now (this commit)

- **`analytics.js`** — observability layer. Captures structured events to `localStorage`
  (`fvc_events_v1`), ring-buffered to 5k. Exposes `window.FVC` = `{track, load, summary, exportJSON, download, clear}`.
- **Instrumented apps** — `index.html` (league) and `memo.html` (diligence) emit:
  `app_open`, `drop`, `thesis_select`, `season_begin`, `season_end`, `memo_start`,
  `diligence_open`, `decision`, `memo_end`.
- **`usage.html`** — the console: funnel, drop-off, which diligence boxes get opened,
  thesis distribution, outcome averages, and **auto-insights** (a hand-rolled preview of what
  Loop 4 will flag), plus a JSON export button.

### Event schema (the trace)
| event | key fields |
|---|---|
| `app_open` / `drop` | `path` |
| `thesis_select` | `thesis`, `finW` — preset (or `Custom`) chosen |
| `thesis_custom` | `factor`, `val` — a factor slider was dragged (fine-tune granularity) |
| `board_mode` | `board` — player toggled Daily (`YYYY-MM-DD`) vs Free play (`free`) |
| `fog_toggle` / `fog_spend` | fog of war: `on`; spends carry `deal`, `level` (2-4), `left`, `board` |
| `season_begin` | `deals`, `deployed`, `thesis`, `finW`, `customW` (the raw weight vector when `thesis==='Custom'`, else `null`), `board` |
| `auto_resolve` | `fromRound` — player skipped the rest of the season to the Exit marks |
| `season_end` | `rank`, `funds`, `profit`, `mult`, `judgment`, `newBlood`, `scoutTier`, `thesis`, `board`, `selProfit`, `steerAlpha` (decomposition vs the frozen-seed counterfactual — `STEERING-SCOPE.md`), `fog`, `dpSpent`, `calibration` (estimate-vs-truth ranking concordance — `FOG-OF-WAR.md`) |
| `memo_start` | `deals` |
| `diligence_open` | `cat`, `deal` |
| `decision` | `deal`, `company`, `invested`, `amount`, `boxes`, `pBreak`, `pWipe`, `mult` |
| `wager_nudge` | `deal` — fired once/run when a player commits with the wager still at 50/50 |
| `memo_end` | `profit`, `mult`, `acc`, `bank`, `bankDelta`, `trapsDodged`, `traps`, `newBlood`, `scoutTier` |
| `survivor_start` / `survivor_pick` / `survivor_end` | `board`; picks carry `round`, `company`, `ok`, `rank`; end carries `survived` (0-5), `win`, `picks` |
| `share_open` / `share_copy` / `share_close` | `mode`, `tier` — Scout Card (or `mode:'lp_letter'`/`'survivor'`) opened / copied / dismissed |
| `share_click` | `net` (`x｜linkedin`), `mode`, `tier` — public share pushed |
| `leaderboard_optin` / `leaderboard_optout` | `mode`, `tier`, `handle` — consent-based VC-leaderboard toggle |

> `scoutTier` ∈ `gold｜silver｜bronze｜none` (tiered scout flag); `newBlood` stays = `gold` for back-compat.
> Thesis is now either a preset name or `Custom` (per-factor sliders); `customW` on `season_begin`
> carries the tuned mix. Stage-as-an-axis is scoped but not built — see `STAGE-SCOPE.md`.

## The data path (prototype → production)
- **Single-machine:** play → events in `localStorage` → `usage.html` → **Download usage JSON**
  into `usage/` → the analysis agent reads `usage/*.json`.
- **Multi-user (✅ wired):** `analytics.js` now *dual-writes* — localStorage (unchanged) **and** a
  `navigator.sendBeacon` POST to **`collector.js`**, a zero-dep Node server. Each event is sent as a
  text/plain string (no CORS preflight from `file://`) and carries a persistent `cid` per browser.

  ```
  node collector.js                 # 127.0.0.1:8787 — appends usage/events.jsonl
  ```

  The collector keeps a durable `usage/events.jsonl` (append-only) **and** a debounced
  `usage/live-events.json` snapshot — the latter is a plain `.json` array, so the weekly analyst's
  "read every JSON file in `usage/`" picks up real traffic with **no prompt change**.
  `GET /export` returns the array; `GET /health` returns counts. The sink fails silently when the
  server isn't running, so double-clicking the HTML offline behaves exactly as before. Point the
  browser at a different collector with `FVC.setSink('http://host:port/collect')` (or `''` to
  disable); `FVC.syncAll()` backfills a machine's existing local history once.

  **⚠️ Serve the app over `http://localhost`, not `file://`, when exercising the collector.**
  Two reasons, both learned from the live smoke test:
  1. **Tooling:** the Claude-in-Chrome extension cannot inject into `file://` pages (no "Allow
     access to file URLs"), so any browser-driven test of the beacon must go through an http origin.
     Quick static server: `python3 -m http.server 8000 --bind 127.0.0.1 --directory .` then open
     `http://localhost:8000/index.html`.
  2. **Mixed content:** browsers block a `sendBeacon` from an **https** page to an **http** endpoint.
     So `https://app → http://localhost:8787` will silently fail. For real (non-local) multi-user,
     deploy the collector behind **https on the same/sibling origin as the app** and set
     `FVC.setSink('https://…/collect')`. Local dev (http app → http collector) is fine — no mixed
     content, and `text/plain` keeps it CORS-preflight-free.

---

## LOOP 4 — the hill-climbing analysis agent

Run this as a Claude Code agent over the latest export. It does **not** auto-apply; it proposes,
the grader checks, a human approves (the article's "human checkpoint at sensitive decisions").

**Prompt:**
> You are the improvement analyst for the Fantasy VC prototype. Read every JSON file in `usage/`
> (schema in `LOOP.md`). Produce a ranked list of **at most 5** concrete, shippable improvements.
> For each: (1) the **signal** in the data with numbers, (2) the **hypothesis** for why,
> (3) the **specific change** (file + what to edit), (4) the **expected metric move** and how we'd
> confirm it, (5) **confidence** (low/med/high) and any risk. Prefer changes that fix funnel
> drop-off and under-used mechanics. Do not propose anything you can't tie to a number in the data.
> Output `usage/REPORT.md`. Do not edit app files.

**Grading rubric (Loop 2 — verification, run before any change is applied):**
- Tied to a real metric in the trace? (not a hunch)
- Specific enough to implement without guessing?
- Reversible / low-blast-radius?
- Names the metric it should move *and* how we'd verify the move?
- Doesn't degrade an already-healthy number?

A proposal must pass all five to reach the human checkpoint.

## LOOP 3 — make it event-driven  ✅ WIRED

**Live schedule:** a Claude Code routine runs the analyst **weekly, Mondays 13:07 UTC (9:07am
ET during EDT)**, as a
fresh session per fire over `usage/`. It is a *proposer* only — it overwrites `usage/REPORT.md`
and pings the owner (push + email) with a ranked summary; it never edits app files. If there isn't
≥~30 new completed runs of a mode since the last report, it says so and skips (the guardrail below).

- Trigger id: `trig_01DG6E11QdcvPyVUHXdscLF8` (env `env_01U9E6cdu7uduZUpoYzTeZoh`).
- Change cadence / pause / delete via the scheduler ("update the Fantasy VC analyst trigger to …").
- Until the multi-user collector lands, `usage/` holds only local/synthetic traces, so most weekly
  runs will correctly report "not enough new data" rather than churn the report.

Alternative not yet wired:
- **On-export**: trigger the analyst whenever a new `usage/*.json` lands (needs a file watcher /
  the collector). Switch to this once real traces stream in.

## Guardrails
- The loop **proposes**; humans **approve**. No auto-edits to app files.
- Every proposal cites a number. No number → not a proposal, just an idea.
- Watch for over-fitting to a tiny n — require a minimum session count before acting.
