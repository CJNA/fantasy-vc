# 🏆 Fantasy VC

**Fantasy sports, but for venture capital.** Real startups, real rounds — everyone gets the same fund and the same blind deals. Out-pick the algorithms and you get flagged as **New Blood**: the whole point is to surface people with genuine investing judgment, no résumé required.

Two ways to play, one shared analytics + self-improvement loop behind them. No build step, no framework, no dependencies — every app is a single HTML file you can open by double-clicking.

> **Live:** [https://fvc.onrender.com](https://fvc-l5hd.onrender.com/)  ·  **Deploy your own:** one-click [Render Blueprint](#deploy-to-render) below.

---

## The games

| App | File | What you do |
|---|---|---|
| **The League** | `index.html` | Run a season (Seed → Series A/B/C/D → Exit) against AI funds. Pick a **thesis** that re-weights every deal's conviction score, allocate your fund, and try to beat the bots — especially *Bandwagon Capital*, who blindly chases hype. |
| **The Diligence Desk** | `memo.html` | Blind deals, names hidden. Spend limited diligence points on the boxes *you* think matter (Team, Market, Risk & Governance, Terms…), place a conviction wager, then invest or pass. Outcomes — including the frauds — are revealed only after you commit. |
| **Usage & Loop Console** | `usage.html` | The observability dashboard: funnel, drop-off, thesis distribution, scout-tier mix, and auto-insights — a live preview of what the weekly analyst flags. |

Finish in the green and you earn a tiered **Scout flag** — 🥉 Bronze, 🥈 Silver, 🥇 Gold (*New Blood*, the top rung: beat every bot / clean sheet on the frauds).

### 🗓 The Daily Board
The League defaults to a **date-seeded daily board** — everyone on Earth gets the *same 10 deals and the same bot behavior* that day, so ranks are directly comparable (the DFS mechanic). Free-play mode keeps the classic random board for practice.

### 💀 Survivor
The 60-second elimination game on the same board: every round the market **kills the bottom half by growth** — pick a survivor, no repeats, one miss ends the run. Hype pumps hardest early, so the "safe" early picks are exactly the names that crater later.

### 🌫 Fog of War
Factor scores are **analyst estimates**, not truth — board-seeded noise that sharpens as you spend a **6-point diligence budget** you can't stretch across the board. **A deal's stage sets where it starts on the info ladder**: a Pre-seed deal is a ±25 teaser deck, a Series B deal arrives nearly transparent (±3) — early-stage investing runs on almost no data, late-stage is closer to stock picking, so the budget only buys signal where the fog is. Everyone on the daily board sees the *same wrong numbers*. At season end the fog lifts and you get a **calibration score**: did you read through the noise, or did it read you? (Partial-information design inspired by Princeton's [CEO-Bench](https://ceobench.com/) — see `FOG-OF-WAR.md` and `vcbench/` for the agent interface that mirrors their `tools.py` format, with attribution.)

### 📋 Share your Scout Card · 📜 LP letter
Every finished run generates a nicely-formatted **markdown Scout Card** you can copy to share privately, or push straight to **X / LinkedIn** (the public share carries a link back to the game). Optionally add your handle and opt in to a **consent-based VC scout leaderboard**. League seasons also end with a one-click **LP letter** — your vintage retold in authentic quarterly-letter voice, anti-portfolio included. See [Sharing & monetization](#sharing--monetization).

---

## Quick start

Just open it:

```bash
open index.html          # macOS — or double-click the file
```

To exercise the multi-user analytics collector, serve over http (not `file://`) and start the collector:

```bash
python3 -m http.server 8000 --bind 127.0.0.1 --directory .   # → http://localhost:8000/index.html
node collector.js                                            # → 127.0.0.1:8787, appends usage/events.jsonl
```

> ⚠️ Analytics are **opt-in and off by default.** A build only phones home if it carries a
> `<meta name="fvc-collector" content="https://…/collect">` tag. Offline / double-clicked play
> stores events in `localStorage` only. In the browser console you can also point at any collector
> with `FVC.setSink('http://localhost:8787/collect')` (or `FVC.setSink('')` to disable).

---

## The self-improvement loop

The interesting part isn't the game — it's that the prototype **improves itself from real usage**, structured on LangChain's *Art of Loop Engineering* (four stacked loops). Full write-up in [`LOOP.md`](./LOOP.md).

```
LOOP 4 — HILL CLIMBING     read usage traces → find friction → propose harness changes
   ▲ traces          │ proposed diffs
OBSERVABILITY        LOOP 2 — VERIFICATION     grader checks each diff against a 5-point rubric
analytics.js →       │ pass → human checkpoint → apply
usage.html           ▼
LOOP 1 — AGENT       build the feature / apply the approved change
LOOP 3 — EVENT-DRIVEN     a weekly schedule runs Loop 4 over new traces (proposer only)
```

The loop **proposes**; a human **approves**. Every proposal must cite a real number from the trace, and nothing auto-edits app files. Example output: [`usage/REPORT.md`](./usage/REPORT.md).

---

## Deploy to Render

The repo ships a [`render.yaml`](./render.yaml) Blueprint that stands up **both** the static games and the usage collector:

1. Push this repo to GitHub.
2. Render dashboard → **New +** → **Blueprint** → pick the repo → **Apply**.
3. The games go live at `https://fvc.onrender.com`; the collector at `https://fvc-collector.onrender.com`.

If Render appends a suffix to the collector name (because `fvc-collector` is taken), update the
`<meta name="fvc-collector">` tag in the three HTML files to the real collector URL, then redeploy.

> **Free-tier caveat:** the collector's disk is **ephemeral** and the service **spins down when idle**,
> so `usage/events.jsonl` is wiped on redeploy/restart. Fine for a demo. For durable multi-user data,
> attach a paid **Render Disk** at `./usage` or point the collector at a database.

---

## Sharing & monetization

The Scout Card is designed to be the growth loop **and** an optional revenue seam:

- **Private share** — copy the markdown card anywhere (Notion, DM, résumé).
- **Public share** — one click to X/LinkedIn with a link back to the game → players advertise it for you.
- **Consent-based VC leaderboard** — players may *opt in* (checkbox, with handle) to be listed for VC firms browsing top performers. This is **opt-in only**; the app never sells or exposes a player's identity without that explicit consent. The opt-in emits a `leaderboard_optin` event.
- **Paywall seam (not built)** — the natural gate is *premium cards / a private leaderboard / verified track-record export*, not the core game. Keep play free; charge for the credential and the VC-facing data (with consent). See the roadmap note in `LOOP.md`.

---

## Repo layout

```
index.html    The League (season game)
memo.html     The Diligence Desk (blind deals)
usage.html    Usage & Loop console
analytics.js  observability + the shareable Scout Card module
collector.js  zero-dep Node usage collector (JSONL + snapshot)
render.yaml   Render Blueprint (static site + collector)
LOOP.md       the four-loop self-improvement design
usage/        synthetic demo traces + example analyst report
```

The diligence model is inspired by SimCap's 6-factor scorecard; the competitive league, scouting, and self-improvement loop are ours.

## License

MIT — see [`LICENSE`](./LICENSE).
