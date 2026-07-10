# Steering intelligence for VCs — CEO-Bench-inspired scope

> Inspiration: [CEO-Bench](https://ceobench.com/) (Princeton, 2026) — benchmarks an agent running a
> simulated startup for 500 days. Score = final cash. Design pillars: **hidden information** (you see
> churn and tickets, not true willingness-to-pay), **delayed consequences** (costs now, effects weeks
> later), **noisy signals** (simulated social media), **non-stationarity** (macro cycle, competitors),
> and **deterministic-given-seed** (reproducible runs). Notably: a rule-based baseline beat every LLM.
>
> The user's ask: *"this, but the information VCs would have — and an advising/driving mode where
> they engage portcos."* Companion docs: `STAGE-SCOPE.md`, `PLAYBOOK-IDEAS.md`, `LP-NETWORK.md`.

## 1. The honest translation — CEOs operate, VCs steer a portfolio

CEO-Bench measures *operating* skill: the agent IS the company (sets prices, buys capacity).
A VC's steering problem is different in three structural ways, and the game should model all three:

| CEO-Bench | The VC version |
|---|---|
| Full SQL access to 19 business tables | **Founder-filtered, lagged, tiered information** (see §2) |
| Direct control levers (pricing, capacity, R&D) | **Influence, not control** — advice, intros, board votes; the founder decides |
| One company, 500 days | **A portfolio + finite attention** — the binding constraint is partner-hours, not capital |
| Score = final cash | Score = fund multiple, **decomposed into selection / capital-steering / advising α** (§4) |

Fantasy VC today measures almost pure **selection**. The mechanics of steering exist (reserves,
follow-ons, sells) but are unscored, and advising doesn't exist at all. This doc adds both — with
CEO-Bench's key property preserved: **everything stays deterministic given the seed + actions**, so
every layer of skill is *exactly attributable* (no "was it luck?" ambiguity).

## 2. The VC information layer (what you see instead of a database)

The defining property of VC information: **low-frequency, lagged, founder-spun, and tiered by your
position.** Concretely, per portco per round:

- **Investor update** (always, if you're on the cap table): founder-written 2-liner. Spin level scales
  with the deal's hidden `ar` (governance) score — *bad-governance founders write the best updates*.
  Going quiet is itself a signal (updates skip a round before a down round / death).
- **Board deck** (only with a board seat, §3): real KPI band (burn, runway band, growth band) — still
  quantized, one round lagged.
- **The tape** (public, everyone): round announcements, hype stars, press noise — the crowd signal
  that already exists.
- **Backchannel** (costs attention): one noisy true-signal draw about any ONE company per round —
  the diligence-desk mechanic imported into the season.

Free-play/blind interactions: in blind mode the updates are the *main* characterization surface —
de-fingerprinted voice, no names. (Pairs with the blind-mode work already discussed.)

## 3. Partner Mode — the advising/driving loop

Each round you get **N partner-hours** (e.g. 3). Spend them on portcos; unspent hours ≠ banked
(attention doesn't compound — the point is scarcity). Menu per portco:

| Action | Cost | Effect (delayed, deterministic) |
|---|---|---|
| **Take a board seat** | 1h/round recurring | Unlocks board deck info stream + governance actions; capped seats total |
| **Exec intro** | 1h | +`comm` bump → path multiplier improves **two rounds later** (delayed consequence) |
| **Customer intro** | 1h | Small immediate mark support + reduces next-round downside band |
| **Founder coaching** | 1h | Reduces the chance a mid `team`-score company stalls at the next round |
| **Governance audit** | 2h | Reveals the true `ar` tell NOW (catches frauds early) but marks the company down one notch (founders hate audits) — the trust-vs-verify tension |
| **Help raise the round** | 2h | Next round's raise happens at better terms (less dilution → better exit math) |

Design rules (straight from CEO-Bench's pillars):
- **Delayed consequences**: no action pays off in the round you take it. Advising alpha is invisible
  until C/D — exactly the long-horizon steering being tested.
- **Influence, not control**: effects are path-*modifiers* on the base path, bounded (you can't
  advise Quibi into Stripe — a +1 notch on a dying path just makes a softer landing).
- **Deterministic given actions**: modifiers are pure functions of (deal, action, round) — no dice.
  Same seed + same actions = same outcome, so runs are comparable and replayable.
- **The core tension**: hours spent driving portcos are hours not spent on the backchannel
  (information) — sourcing vs supporting, the real VC attention dilemma.

## 4. Measurement — yes, we can measure it (exactly)

Because paths are deterministic, every counterfactual is *computable, not estimated*:

- **Selection α** — frozen-portfolio counterfactual: seed checks held untouched to Exit.
  `selection = frozenValue − CAPITAL`
- **Capital-steering α** — value added/destroyed by follow-ons & sells vs doing nothing:
  `steering = actualValue − frozenValue`  *(✅ SHIPPED 2026-07-08 — endcard, Scout Card, `season_end.steerAlpha`; auto-resolvers get exactly 0 by construction, a clean segmentation. 2026-07-10: sells now price as secondaries — hype/momentum haircuts, no bid on down rounds — so steering α prices liquidity honestly instead of assuming costless exits.)*
- **Advising α** (once Partner Mode exists) — path-with-interventions vs base path:
  `advising = Σ (modifiedPath − basePath) × unitsHeld`
- **Information efficiency** (diagnostic): outcome per backchannel/board-seat consumed — CEO-Bench's
  "tool usage patterns" analog.

Total: `fund multiple = 1 + (selection + steering + advising) / CAPITAL`, three separately-ranked
leaderboard columns. The scout credential sharpens from "good score" to **which skill**: top
*selector* vs top *steward* vs top *operator-whisperer* — which is precisely how LPs think about GP
skill attribution (picking vs value-add). Feeds `LP-NETWORK.md` directly.

## 5. Rigor — what makes a bench hard to game (CEO-Bench's real lesson)

CEO-Bench's most interesting property isn't the sim — it's the discipline that makes results
*mean something*: mechanistic rules an agent can't sweet-talk, a rule-based baseline that
embarrasses sophisticated players, reproducible randomness, and released decision logs. Applied
to us, honestly:

1. **Mechanistic, exploit-resistant rules.** ✅ mostly there — paths are data, scoring is pure
   functions, no LLM-judge anywhere. Partner-Mode modifiers (§3) must stay pure functions of
   (deal, action, round) to keep it that way.
2. **Published baseline to beat.** ✅ our bots are baselines; **Index Ventures Bot (spray evenly,
   never touch it) is our "$15.8M rule-based baseline"** — an indexer with zero skill. Rigor move:
   report every score as a margin over Index Bot on the same board, and require beating it for any
   scout tier. If most players lose to the index (CEO-Bench's LLM result), *that's the headline*.
3. **⚠️ The memorization hole — our biggest rigor gap.** The universe is 16 fixed companies with
   fixed paths. A grinder memorizes "Fast dies at Series B" once and the daily leaderboard measures
   *recall*, not judgment — the exact failure blind-mode addresses for names, reappearing as paths.
   **Fix (the load-bearing one): an archetype generator.** Companies become seeded instances of
   outcome archetypes (rocket / compounder / hype-crater / fraud / bleeder / sleeper) with
   board-seeded parameters: factor profiles, path shapes, and *which archetype wears which sector
   costume* vary per day. Same rigor properties (deterministic per board), nothing to memorize
   across days. This is what makes the daily leaderboard a real instrument long-term.
4. **First attempt counts.** Daily-board replays are practice; the leaderboard scores each `cid`'s
   first `season_end` per board (replay = information leak: you've seen today's paths). Enforce in
   the collector's leaderboard query, not the client — and label shared cards `attempt #n`.
5. **Reproducible + auditable.** ✅ seeded boards; the event stream is our decision log. Publish
   per-board trajectories like CEO-Bench does (a `usage.html` view over `season_*`/`survivor_*`
   events) so claims are checkable.
6. **Difficulty that scales honestly.** CEO-Bench is hard because signal is scarce, not because the
   dice are mean. Same rule here: harder = noisier information + tighter attention budget (§2-3),
   never hidden RNG penalties.

## 6. VC-Bench — the distribution play (scope only)

CEO-Bench benchmarks LLM agents; our AI funds are already personas on the same board. The daily
board is seeded and comparable → expose a headless harness (the game engine already runs without
UI) and let LLM agents play the SAME daily board as humans, on the same leaderboard.
**"Can you out-pick Claude?"** is both a legitimate benchmark result (steering intelligence,
VC flavor) and the single best marketing hook we have for the AI-community audience. Cheap v0: a
JSON action protocol over the existing engine + a runner script.

## 7. Phasing

| Phase | Scope | Effort |
|---|---|---|
| **v0 ✅** | Steering α (actual vs frozen counterfactual) on endcard/Scout Card/events | shipped |
| **v1** | Investor updates + quiet-signal (info layer lite, no actions yet) | S-M |
| **v1.5** | **Archetype generator** (kills path memorization — prerequisite for the leaderboard to stay honest at scale) + first-attempt leaderboard rule | M |
| **v2** | Partner-hours + 3 actions (board seat, exec intro, governance audit) + advising α | M |
| **v3** | Full menu, attention-vs-backchannel tension, 3-column leaderboard | M |
| **v4** | VC-Bench headless harness + LLM runner | M, high leverage |

Guardrail (from the loop): instrument each phase's events first, watch uptake in the weekly
analyst, then deepen. Don't build v3 before v1's updates prove players actually read them.
