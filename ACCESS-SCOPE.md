# Access & allocation — the mechanic that makes it VC, not stock picking (SCOPE, not built)

> Advisor feedback (Ryan, 2026-07-09): *"Fantasy VC seems very similar to stock picking games.
> Everyone has access to the same companies, but in reality it's not true. Smaller-name investors,
> no-name investors, don't have access and can't invest, even if they have the money."*
> The information half of his critique shipped as fog F0.5 (stage sets the info level —
> `FOG-OF-WAR.md`). This scopes the **access** half.
>
> **Answers received (2026-07-10)** and folded in below. What earns access into a hot round,
> per Ryan (secondhand — he's never gotten into one himself, itself a data point):
> 1. *"Diamond in the rough — you backed them before anyone else did. Now the founder wants to
>    make sure you are taken care of."* 2. Personal connections to the founder. 3. A super-strong
> recommendation from someone the founder trusts. The only path he could name for an unknown
> angel: **finding the diamond in the rough.** On whether a verified game record is a real
> signal: *"I'd be skeptical. But if I have confidence that the game closely mirrors the real
> world (e.g. real-game-stat-based fantasy baseball), I'd want to learn more about her"* — like
> an MLB scouting manager meeting someone with out-of-this-world prediction ability.

## The two-sided answer

**Keep the equal-access daily board** — it's deliberate. It is the judgment instrument: it strips
away access precisely because access is the thing a no-name scout can't demonstrate in real life.
The New Blood pitch is "here's the track record I'd have if deal flow were open." The game is the
counterfactual real VC can't run.

**But add access as a mechanic layer on top**, because in venture *getting into the deal* is a
scored skill, not noise. The game currently rewards "spot the best company"; with access it rewards
"spot the best company **you can actually get into**" — the actual job.

## The mechanic — oversubscription

- **Hot deals cut you back.** Each deal gets an oversubscription factor from hype (board-seeded, so
  the same squeeze for everyone): a 5-star deal might honor only 30% of your intended check; a
  2-star deal takes every dollar. The rockets nobody believed in (Airbnb, hype 2) stay wide open —
  historically true and mechanically the "path in" for new players.
- **Access edges lift the cutback** — ranked by Ryan's answers, which changed the order:
  1. **Early conviction is THE mechanism** (his #1, "diamond in the rough"): if you backed a deal
     **before it got hot** — a seed check while hype was low, or in-season before the up-round —
     the founder takes care of you: full pro-rata in every later round, no cutback, ever. Loyalty
     is earned company-by-company, not carried as a global stat. Cheap to build, and it *is* the
     unknown angel's only real-world path in, so the game's path in matches reality exactly.
  2. **Founder trust network** (his #2 and #3 — personal connection / a recommendation the founder
     trusts) is a social-graph effect a single-player game can only proxy: spending a diligence
     point to "network in" (the F2 off-market mechanic) is the closest honest analog. Multiplayer
     leagues could someday make intros a real tradeable (a player vouches for another), but that's
     far out.
  3. **Track record — demoted.** Notably absent from Ryan's list: a good record impresses *LPs*,
     not founders — it belongs to the LP-network funnel (`LP-NETWORK.md`), not the allocation
     mechanic. Drop the persistent access-tier idea from the core loop; it also would have broken
     same-board comparability, so this simplifies v0.
- **The difficulty curve becomes the critique.** New players are locked out of the obvious hot
  rounds and must win on overlooked deals — per Ryan the *only* way an unknown angel gets into a
  competitive round is finding the diamond first. Beating the wall *is* the proof of judgment, and
  the wall's one gate (get there early) is the same gate reality has.

## Access α — exactly computable, like everything else

The current unconstrained game IS the counterfactual. So:

```
access α = your realized profit − profit of the same picks with no allocation cutbacks
```

Both terms are exact (paths deterministic given board + actions). Reported alongside selection α /
steering α / calibration on the endcard, Scout Card, and `get_result`. An agent or player with high
selection α but deeply negative access α is a good picker who only picks crowded deals — a real
and diagnosable investor archetype.

## Leaderboard integrity (the hard constraint)

- Oversubscription factors must be **board-seeded** — same squeeze for every player on the daily
  board (same discipline as fog noise).
- Personal access edges (track record) break same-board comparability → segment the leaderboard by
  access tier, or score access-adjusted and raw side by side. **v0 avoids the problem entirely** by
  shipping only impersonal edges (early conviction, diligence-unlocks) that any player can earn
  within a single board.

## The credential bar (his answer #3): fidelity is the moat

Ryan on a great verified game record: skeptical by default, **but** — *"if I have confidence that
the game closely mirrors the real world (e.g. real-game-stat-based fantasy baseball), I'd want to
learn more about her."* The MLB-scout analogy is the whole LP-network thesis in one line
(`LP-NETWORK.md` demand side, independently confirmed). Two hard implications:

1. **Fidelity is what converts the credential.** Fantasy baseball works because the stats are
   real. Our boards use real companies but stylized paths; the archetype generator
   (`STEERING-SCOPE.md` v1.5) must be calibrated to *real* stage/outcome distributions, and a
   "real vintages" mode (historical cohorts, actual outcomes, scored against what actually
   happened) is the strongest possible credibility artifact. The pitch shifts from "I win a game"
   to "I called the 2019 vintage blind."
2. **Verifiability already matters** — first-attempt scoring, seeded boards, and the auditable
   event stream (all shipped) are what let us say "this record couldn't be reroll-farmed." Keep
   treating that as a product feature, not plumbing.

## Events

`allocation_cut {deal, wanted, honored, factor, board}` · `access_unlock {deal, via}` ·
`season_end` gains `accessAlpha`. Weekly analyst gets: how often players get cut back, whether
they route around the wall (do cutbacks push allocations toward low-hype deals?), and access-α
distribution.

## Phasing

| Phase | Scope | Effort |
|---|---|---|
| **A0** | Oversubscription from hype (board-seeded), visible on the card ("🔥 oversubscribed — expect ~30% fill"); pro-rata cutback at begin_season; **early-conviction exemption** for follow-ons (seed-backed = founder loyalty = full fill in every later round — Ryan's #1, promoted from A1); access α on the endcard + events | M |
| **A1** | "Network in" — spend a diligence point to lift one deal's cutback (proxy for his #2/#3, the founder-trust channel; composes with F2 off-market discovery) | S |
| **A2** | Multiplayer vouching in private leagues (a player's intro lifts your cutback — the real trust network, tradeable); `get_board` exposes your fill per deal for VC-Bench agents. Track-record access tier is **dropped** per Ryan — record belongs to the LP funnel, not the founder's cap table | M |

**Interaction notes:** composes with fog (the two scarcities can share the diligence budget in A1);
Survivor stays access-free (timing game); STAGE-SCOPE's player-side entry stage is orthogonal but
access pressure realistically differs by stage (pre-seed = relationship game, growth = allocation
war) — revisit when both exist.
