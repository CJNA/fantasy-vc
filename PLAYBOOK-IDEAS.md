# Stealing from fantasy football — mechanics scope (brainstorm, not built)

> Fantasy football spent 30 years inventing retention/competition mechanics. This maps the ones
> worth stealing onto VC, plus the VC-native twists football can't do. Companions:
> [`STAGE-SCOPE.md`](./STAGE-SCOPE.md), [`LP-NETWORK.md`](./LP-NETWORK.md). Ranked at the bottom.

## The core insight
Fantasy football's magic isn't points — it's **comparability + scarcity + cadence**:
everyone faces the *same real week* (comparable), a player rostered by your rival is *gone*
(scarce), and the season has a *weekly heartbeat* (cadence). Fantasy VC today has none of the
three: every run deals a random board (scores aren't comparable across players), everyone can
invest in the same deals (no scarcity), and a season resolves in one sitting (no heartbeat).
Each mechanic below buys back one of those.

---

## From fantasy football

### 1. 🗓 The Daily Contest (DFS / DraftKings model) — **the standout**
**FF version:** daily fantasy — same slate for everyone, one-shot lineup, daily leaderboard.
**VC version:** "**Today's Deal Flow**" — the board is **seeded by the date** (deterministic RNG),
so every player worldwide gets the *same* 10 deals, same paths, same traps. One run per day counts.
**Why it's first:** it fixes **leaderboard integrity** — scores become directly comparable, which is
the credibility the scout credential / LP pitch needs ("top 1% on the July 7 board" means something).
Also the cheapest big win: swap `Math.random()` for a date-seeded PRNG (e.g. mulberry32 of
YYYYMMDD), tag events `board:'2026-07-07'`, leaderboard groups by board id. No backend needed to
*play* — the collector already aggregates scores.
**Effort: small.** The whole feature is ~40 lines + a leaderboard view in usage/collector.

### 2. 🐍 The Draft (scarcity)
**FF version:** snake draft — a player taken is gone.
**VC version:** allocation is contested. The AI funds **draft into rounds before you**: if Bandwagon
Capital leads Stripe's Series A, your check size is capped (or you pay a marked-up round). Deal
access becomes a resource, like real VC — you can't just index the board.
**Design choice:** vs-bots draft first (single-player, no backend), human leagues later.
**Effort: medium.** Round-robin pick order + per-deal remaining-allocation; UI for "taken" states.

### 3. 📰 Event cards (the injury report)
**FF version:** mid-week news — "questionable, hamstring" — forces start/sit calls on partial info.
**VC version:** between rounds, 1–2 **event cards** fire on your holdings: *"Regulator subpoenas
Company C — hold or sell at a 30% haircut?"*, *"Founder feud leaks at D"*, *"A files a mega-round —
pro-rata window open."* Some are noise, some are the trap deals' tells surfacing early. Skill =
telling signal from noise mid-flight (currently the mid-season rounds are pure watching).
**Effort: medium.** An event deck keyed to deal archetypes + a hold/sell/follow-on decision modal;
scoring already handles sells/follow-ons.

### 4. 🔁 Keeper / dynasty leagues (multi-season track record)
**FF version:** keep N players across seasons; your team compounds.
**VC version:** **vintages.** Season = Fund I. Next season you raise Fund II — and may **carry one
unexited position** forward. Your Scout Card grows a *fund history* ("Fund III, net 2.1× avg") —
which is exactly the artifact an LP would actually want (consistency across vintages, not one hot
run). Persistence is just localStorage.
**Effort: medium-small.** Serialize end-of-season state; a "Your funds" strip; Scout Card gains a
vintage table.

### 5. ⚔️ Head-to-head + playoffs (cadence & rivalry)
**FF version:** weekly matchup vs one league-mate; playoffs in December.
**VC version:** each round you're benchmarked vs **one** rival fund (not the whole table); win the
round = a W. Best record makes the "Midas bracket" playoff where only playoff-period returns count.
Makes the mid-season legible and dramatic instead of a table you glance at.
**Effort: small-medium.** Pure presentation over existing per-round marks.

### 6. 💀 Survivor pool (the viral cheapie)
**FF version:** pick one team to win each week; one miss and you're out; can't reuse a team.
**VC version:** "**Survive the vintage**" — each round, pick ONE holding that won't go down this
round; can't pick the same company twice. One wrong pick = eliminated. 60-second daily mode, brutal
and shareable ("made it to round 4 🪦"). Pairs perfectly with the daily seed (#1).
**Effort: small.** It's a stripped read of data the engine already computes.

### 7. 🤝 Trades & the deadline (secondaries)
**FF version:** player-for-player trades, trade deadline drama.
**VC version:** **secondaries** — mid-season, bots offer to buy your positions (at hype-driven, not
truth-driven, prices — selling to Bandwagon at a hype peak IS the skill), and you can bid on theirs.
A **deadline at Series C** forces the "take liquidity vs ride to exit" call.
**Effort: medium.** Bot pricing = f(hype, marks); offer modal; P&L already handles sells.

### 8. 🏟 Private leagues (the actual growth engine)
**FF version:** 10 friends, a commissioner, a group chat, a trophy. This is why fantasy football is
a cultural institution and not a solo game.
**VC version:** invite-link leagues on the same daily seed; league-only leaderboard; season
champion. **Needs identity + a real backend** (the collector grows a `/league` API or we adopt a
tiny DB) — this is the first mechanic that can't ship client-only.
**Effort: large.** Scope after #1 proves comparable scoring works.

## VC-native (no football equivalent — our unfair content)
- **LP letter generator** — end of season, auto-write your fund's quarterly-style letter in
  authentic VC voice (markdown, like the Scout Card): "We passed on Company H (governance)…
  Our thesis cost us 40% of upside in…" *Funny, deeply shareable, and secretly a teaching
  instrument.* Effort: small — it's templating over data we already track. Arguably #2 overall.
- **Carry & hurdle scoring** — score = your 20% carry above an 8% hurdle, not raw profit. One
  formula swap that teaches the single most misunderstood thing about VC economics.
- **Capital calls / dry-powder discipline** — deploy too fast and you can't follow on; the reserve
  mechanic already exists, this just prices it.
- **Party-round trap archetype** — a deal every bot piles into with no lead diligence (event-card
  deck material; it's the social-proof trap as content).

---

## Ranked (value ÷ effort, with what each buys)
| # | Mechanic | Buys | Effort | Verdict |
|---|---|---|---|---|
| 1 | **Daily seeded contest** | comparability → credible leaderboard → LP story | S | **build next** |
| 2 | **LP letter generator** | shareability + teaching, pure content | S | **build next** |
| 3 | Survivor pool | daily habit + virality | S | soon, rides on #1 |
| 4 | Event cards | mid-season skill (fixes the "watching" dead zone) | M | soon |
| 5 | Keeper/vintages | multi-season credential depth | M-S | after #1 |
| 6 | H2H + playoffs | drama/cadence | S-M | nice-to-have |
| 7 | Draft scarcity | strategic depth | M | with stage work |
| 8 | Trades/secondaries | depth + authentic VC lesson | M | later |
| 9 | Private leagues | the real growth engine | L | needs backend; scope after #1 |

**Sequencing logic:** #1 is the keystone — the leaderboard, survivor pool, private leagues, and the
LP-network credential all inherit their meaning from a shared board. #2 is the best
effort-to-delight ratio in the list and feeds the same share loop as the Scout Card. Everything
else layers on those two. Blind-mode (name obfuscation, discussed 2026-07-07) multiplies #1: a
shared *blind* daily board is the fairest possible instrument.

**Loop hooks:** every mechanic above emits its own events (`board` id, `survivor_round`,
`event_card_choice`, `trade_accept`, `vintage_n`) — the weekly analyst gets each experiment's
uptake and drop-off for free, and the usual guardrail applies: instrument first, then tune.
