# Fog of War — the partial-information League (SPEC, grounded in ceobench-src)

> Source study: [`zlab-princeton/ceobench-src`](https://github.com/zlab-princeton/ceobench-src)
> (Zhuang Liu Lab, Princeton). This spec lifts CEO-Bench's *actual implementation mechanics* —
> file/line references below — and translates them to Fantasy VC. It concretizes §2 (information
> layer) and §5 (rigor) of `STEERING-SCOPE.md` into a buildable mode.

## What the repo actually does (the five mechanics worth stealing)

| # | CEO-Bench mechanic | Where in repo | The idea |
|---|---|---|---|
| 1 | **Graded info levels** — group parameter estimates carry ±65% noise at L1 → ±40% → ±25% → ±15% → ±5% at L5 | `config.py:799-804` | Information has a *quality ladder*, not on/off |
| 2 | **Research costs time, arrives async** — upgrading L1→2 takes 3 days … L4→5 takes 10, results via inbox | `config.py:792-796` | You pay for information with your scarcest resource and it arrives *late* |
| 3 | **Level 0 = invisible** — discoverable customer groups don't appear at all until found | `simulation.py:736-739` | True map fog: you don't know what you don't know |
| 4 | **Lagged public data** — macro PMI published with a 30-day delay; "the agent cannot see current macroeconomic conditions — only lagged data" | `config.py:934-937` | Even public information is stale |
| 5 | **Sticky hidden per-entity noise, on separate seeded RNG streams** — each customer gets a persistent hidden quality-perception multiplier; every noise channel has its own PCG64 stream (XOR-derived seeds) so runs are reproducible | `simulation.py:182-210, 250-262` | Fog is *deterministic given the seed* — reproducible, auditable, fair |

Plus the analysis pattern: ground truth is written to `_hidden_*` tables (e.g.
`_hidden_leads_per_1k_snapshot`, hidden churn reasons at `config.py:10`) — never shown to the
agent, always available to the grader. Our analog: true scores stay in the event stream for the
weekly analyst; the player sees only estimates.

## The Fantasy VC translation — "Fog board"

Today the League shows **true factor scores** — perfect information, so conviction-building is
arithmetic. Fog mode replaces every displayed factor score with an **analyst estimate**:

```
shown[k] = clamp(true[k] + noise(level) , 5, 99)      noise ~ seeded, per (board, deal, factor)
```

### 1. Info levels per deal (their #1)
- **L1:** ±25 pts of noise per factor — you're reading a teaser deck.
- **L2:** ±15 — you've done a call. **L3:** ±8 — data room. **L4:** ±3 — deep diligence.
- **Stage sets the starting level** *(✅ shipped 2026-07-09, advisor feedback)*: Pre-seed → L1,
  Seed → L2, Series A → L3, Series B → L4. Pre-seed deals are judged on almost no data; later-stage
  deals are "closer to stock picking" — the diligence budget only buys signal where the fog is.
- UI: estimates render with an uncertainty tint (e.g. `~62?`) that sharpens as level rises;
  a per-deal level pip (▂▄▆█) replaces false precision.

### 2. Diligence budget (their #2, our currency)
- The seed phase gets **6 diligence points** (tunable). 1 pt = +1 level on one deal.
- **The attention dilemma, imported intact:** 10 deals × 4 levels ≫ 6 points. You cannot
  de-fog the board; you choose *where to see clearly* — this IS the skill being measured.
- Optional stagger (their async inbox): spending a point reveals the sharper estimate only on
  the **next round's** board render for held deals — information arrives late.

### 3. Held deals de-fog themselves (board-seat effect)
- Each season round, every **held** deal auto-upgrades one level (you're on the inside now).
  Passed deals stay foggy to the end — you never learn what the lemon really was unless it
  exits loudly. Ties into the STEERING-SCOPE board-seat/info-tiering design.

### 4. Two off-market deals (their #3, Level 0)
- The daily board becomes 8 visible + 2 **hidden** deals ("off-market — spend 1 pt to network
  in"). Same 10 for everyone (board-seeded which two are hidden). Sometimes the hidden ones are
  the rockets; sometimes they're bait. Discoverability = a spendable edge.

### 5. Lagged crowd signal (their #4)
- Hype stars become **last round's hype** — the crowd number you see is always one beat stale
  (their 30-day PMI delay, our scale). Cheap to implement, deeply on-theme: you never trade on
  the present.

### 6. Rigor — fog must be board-seeded (their #5, non-negotiable)
- All noise draws come from **dedicated mulberry32 streams derived from the board seed**
  (`seedFrom('fvc-fog-'+boardId+'-'+deal+'-'+factor)`) — NOT `Math.random`, NOT per-player.
- Consequences: everyone on the daily board sees the **same wrong numbers** (comparable),
  replays see the same fog (no reroll-scouting), and the analyst can reconstruct exactly what
  every player saw (auditable). Free-play fog can be per-run random; daily fog is canonical.
- True scores never render in fog mode until season end (the reveal moment) — but they're in
  the deal data, so a determined cheater reads source. Same posture as the rest of the game:
  the leaderboard's integrity comes from first-attempt scoring + archetype rotation
  (STEERING-SCOPE §5), not client-side secrecy.

## What this measures (new, and exactly computable)

- **Calibration α** — rank deals by conviction-on-*estimates* vs conviction-on-*truth*: the gap
  is your information disadvantage; the residual after diligence spend is your *inference* skill
  (did you read through the fog, or just get lucky?). Both computable at season end since truth
  is known.
- **Information efficiency** (CEO-Bench's tool-usage analog) — steering-α-per-diligence-point;
  did you spend points on decision-relevant deals (close calls) or waste them sharpening
  already-obvious rockets/corpses?
- **Discovery premium** — return differential on off-market deals for players who unlocked them.
- Events: `fog_spend {deal, level, board}`, `fog_discover {deal}`, `season_end` gains
  `fog:true, dpSpent, calibration` fields. True-vs-shown deltas ride along for the analyst.

## Phasing

| Phase | Scope | Effort |
|---|---|---|
| **F0 ✅ shipped 2026-07-08** | Fog toggle chip (default ON): ±25/15/8/3 noise ladder, 6-pt budget, level pips + per-card 🔍 sharpen, conviction-on-estimates (incl. risk color — no truth leaks), canonical per-(board,deal,factor) noise so sharpening converges monotonically, end-of-season reveal + calibration α + biggest-misread callout, `fog_toggle`/`fog_spend`/`season_end.{fog,dpSpent,calibration}` events, Scout Card rows | M |
| **F0.5 ✅ shipped 2026-07-09** | Stage sets the starting info level (`st` per deal + `STAGE_LVL`): Pre-seed L1 → Series B L4; stage badge on cards; `stage` on `fog_spend` events (advisor: "pre-seed = almost no data; late stage = stock picking") | S |
| **F1** | Held-deal auto-de-fog per round + lagged hype | S |
| **F2** | Off-market deals (Level 0) | S |
| **F3** | Async staggered reveals; fog params into the archetype generator (STEERING-SCOPE v1.5) | M |

**Interaction notes:** blind mode (names) and fog mode (scores) compose — blind hides *identity*,
fog hides *quality*; together they're the full instrument. Survivor stays fog-free (it's a timing
game). The Diligence Desk already IS fog-of-war at the single-deal scale — F0 effectively imports
its core mechanic into the portfolio game, which also makes the two modes teach each other.
