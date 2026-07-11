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

## The reset — build order

### P0 · Make it a game (no backend needed)
| # | Change | Why |
|---|---|---|
| 1 | **Lock the daily ruleset** — fog ON, allocation ON, secondaries ON, no toggles on the daily board (chips move to Free Play) | Comparability is the whole social asset; ~5 lines |
| 2 | **Fictional deal generator** (the archetype generator, promoted from STEERING-SCOPE v1.5) — board-seeded fictional startups, tuned outcome distribution where the median decent run is *tense* and bad reads genuinely lose money | Kills trivia-as-win-condition; makes diligence the difference between a blow-up and a winner; makes losses possible → wins earned. One feature fixes fun-killers 1–3 AND the benchmark's memorization hole |
| 3 | **Casual endcard** — big number (profit/multiple), one-line verdict, one fat taunt-share button. Judgment/Steering α/Access α/Calibration move behind a **🔬 Analyst** toggle | The scoreboard should answer: how'd I do, who'd I beat, what do I paste in the chat |
| 4 | **Challenge links** — result encoded in the URL hash; friend opens it, plays the same board, gets head-to-head on their endcard ("You +$142M vs CJ +$98M") | Zero-backend human competition; the group-chat acquisition wedge |

### P1 · Add the humans (one collector endpoint)
| # | Change | Why |
|---|---|---|
| 5 | **Rando pods** — `GET /pod?board&cid` on collector.js (~40 lines over the existing events array): dedupe `season_end` per cid, chunk into pods of 8, return standings. Endcard right rail flips from bots to **"Your Pod — 8 humans on today's board"**; bots demote to a "dumb-money par" line | The first time you place 2nd of 8 real people is the hook. Write path already exists — every season_end already POSTs |
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
- **P1 needs the real collector URL** (Render dashboard) — the meta tags still point at the
  placeholder, so no season_end reaches the server today. P0 needs nothing.
- Deal-generator balancing is the one genuinely hard design task (outcome distribution, fraud
  rate, hype-vs-quality correlation). Budget a dedicated session; everything else in P0 is small.
