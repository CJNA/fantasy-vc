# Fun first — the two-critic verdict and the reset (2026-07-11)

> Two fresh Claude agents reviewed the game cold — no design docs, no context, explicitly told
> to ignore educational and career-credential value. One played 4 full episodes through the
> harness ("player critic"); one judged it as a social/competitive game designer ("social
> critic"). This doc is the synthesis and the new build order. **Fun ships first; the
> career/analyst layer becomes the advanced (later: paid) tier.**

## The verdict

**Player critic: 3.5/10.** *"A slot machine that almost always pays 20×, wearing a finance
textbook as a costume."* Receipts: a zero-effort auto-resolve run took **Gold at 20.66×**; a
careful all-6-diligence-points run scored **worse** (Silver, 18.96×); the only losing run was
deliberately buying famous flameouts. The win condition is recognizing real companies — trivia
you have before you press start.

**Social critic:** *"You've built the hardest part of a social daily game and then didn't ship
the game."* The seeded daily board (identical deals/bots/fog/fills for everyone — Wordle's core
trick) currently powers **nothing**: you play 4 scripted bots, never see a human, and the share
is a stats table nobody screenshots.

## The convergent diagnosis (both critics, independently)

1. **Real companies are the fun-killer.** Famous names telegraph outcomes → no discovery, no
   risk, diligence can't matter. (Also the benchmark's memorization hole — STEERING-SCOPE §5
   already scoped the fix as the archetype generator. The fun agenda and the rigor agenda want
   the same feature.)
2. **You can't lose.** Median outcome ~20× green wall → wins unearned, losses impossible, no
   "one more try."
3. **The endcard is a quant's dashboard.** Judgment % / Steering α / Access α / Calibration %
   is a lecture, not a scoreboard. (Access α specifically lands as "a scold you can't avoid.")
4. **No humans.** Beating a script isn't winning. The one asset that enables human competition
   (board comparability) is live but unused — and actually **broken**: fog/allocation/secondaries
   toggles aren't locked on the daily board, so two players' "same board" scores may not be
   comparable at all.

What already works (keep, promote): follow-on compounding ("the game's real toy"), Survivor's
sudden-death tension and taunt voice, the LP letter as shareable flavor.

## Scope reduction (2026-07-11) — two company modes, YC-grounded

No bespoke fictional-world engine. Companies come from **YC-batch archetypes**, two modes:

- **Synthetic mode ✅ (shipped, default):** YC-shaped archetypes (fintech infra, devtools, AI
  agents, health ops, logistics, consumer, climate, edtech, bio tools, space/defense) with
  generated fake names, factors, outcome paths, and **daily seeded news** — headlines on every
  card plus news-flavored round events. New board + new news every day; identical for everyone.
- **Real mode (P1, later):** fake names layered over *actual current YC companies*, where the
  news is **genuine** — requires monitoring real coverage and adding companies over time. Goes
  with the P1 collector work.

Shipped with it: the **daily ruleset lock** (fog/allocation/secondaries forced on, chips inert
on the daily board — comparability restored; toggles live in Free Play only).

Verified the fun loop turned over: on the first synthetic board, an all-hype portfolio finished
**rank 5/5 at 0.93×** (you can lose now), a careful reader made 13.45×, and the demo agent that
spent all 6 diligence points took **rank #1** — diligence finally beats non-diligence, because
the fraud (juiced fin 88, ar 22, dies at Series C) is only catchable through the fog.

## The reset — build order

### P0 · Make it a game (no backend needed)
| # | Change | Why |
|---|---|---|
| 1 | ✅ **Lock the daily ruleset** — fog ON, allocation ON, secondaries ON, no toggles on the daily board (chips move to Free Play) | Comparability is the whole social asset; ~5 lines |
| 2 | ✅ **Synthetic YC-archetype generator** (see scope reduction above) — board-seeded startups + daily news, tuned outcome mix (1 rocket / 2 solid / 2 grinders / 2 fades / 2 zeros / 1 fraud per 10) | Kills trivia-as-win-condition; makes diligence the difference between a blow-up and a winner; makes losses possible → wins earned. Also closes the benchmark's memorization hole |
| 3 | ✅ **Casual endcard** — multiple + profit only, one-line verdict, ⚔️ Challenge button first. Judgment/Steering α/Access α/Calibration + their coaching paragraphs behind the **🔬 Analyst breakdown** toggle (`analyst_open` event = the paywall-seam metric) | The scoreboard should answer: how'd I do, who'd I beat, what do I paste in the chat |
| 4 | ✅ **Challenge links** — `#vs=` hash carries {board, handle, profit, mult, tier}; opener sees a banner ("@cjna posted +$1,245M on today's board — beat it"), plays the same board, endcard resolves the head-to-head and the return-taunt notes the dethroning. Daily boards only (the link must be playable) | Zero-backend human competition; the group-chat acquisition wedge |

### P1 · Add the humans (one collector endpoint)
| # | Change | Why |
|---|---|---|
| 5 | ✅ **Rando pods** — `GET /pod?board&cid` on collector.js: dedupe `season_end` per cid (**first attempt counts** — no rerolling), chunk into pods of 8 by arrival, return standings. Endcard flips from bots to **"Your Pod — N humans on today's board"**; bots demote to a "dumb-money par" line. Other players show as deterministic scout aliases ("Feral Otter") unless they opted in a handle; raw cids never leave the server | The first time you place 2nd of 8 real people is the hook. Write path already existed — every season_end already POSTs |
| 5b | ✅ **Copy trading (eToro CopyTrader-inspired)** — challenge links now carry the challenger's **seed book** (`a`) and a 1-5 **risk score** (`r`, hype-weighted seed dollars). The banner shows performance + risk side by side and a **"📋 Copy their picks — then out-steer them"** button; run the book untouched and the endcard prints **Copy α**: "the $132M gap is pure steering." Risk also sits on the casual endcard, the Scout Card, and the taunt | eToro's loop (metrics + risk score → one-click mirror) is exactly Ryan's demand side: proven books become copyable, and copying isolates the *other* skill — steering. Events: `copy_apply`, `challenge_result.copied` |
| 6 | **Friend leagues** — same endpoint keyed by a shared code (`VELVET-OTTER`); daily points (8/5/3/1…) roll into a weekly table; Sunday recap card ("Champion: Dana. Wooden spoon: Marcus") | The 5-friend loop: daily appointment + weekly redemption arc + a permanent loser who wants revenge |
| 7 | **Streaks & pod promotion** — top-3 promote to tougher pods, bottom-2 relegate; personal streak counter | The reason midnight pulls you back |

### The advanced tier (career layer — later, gated, eventually paid)
Everything both critics said to hide is exactly the credential product: **Analyst Mode** (full α
decomposition, calibration, information efficiency), verified first-attempt track record,
stage/access analytics, the scout leaderboard and LP-network funnel (`LP-NETWORK.md`), VC-Bench
comparisons. Casual players never see it; the 5% who want to know *why* — and anyone building a
résumé for the scout network — opt in. That's the paywall seam, and it now has a product reason
to exist rather than being the default UI.

## Blocked / prerequisites
- ~~P1 needs the real collector URL~~ **Resolved 2026-07-10:** `https://fvc-collector.onrender.com`
  is live and answering `/health` — the meta tags in all three HTML files already point at it, so
  season_end events flow as soon as anyone plays the deployed site. (Free-tier caveat still
  applies: the events file is wiped on restart, so pods reset when the service redeploys — a paid
  Render Disk at `./usage` makes them durable.)
- Deal-generator balancing is the one genuinely hard design task (outcome distribution, fraud
  rate, hype-vs-quality correlation). Budget a dedicated session; everything else in P0 is small.
