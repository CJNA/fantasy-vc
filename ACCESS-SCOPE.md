# Access & allocation — the mechanic that makes it VC, not stock picking (SCOPE, not built)

> Advisor feedback (Ryan, 2026-07-09): *"Fantasy VC seems very similar to stock picking games.
> Everyone has access to the same companies, but in reality it's not true. Smaller-name investors,
> no-name investors, don't have access and can't invest, even if they have the money."*
> The information half of his critique shipped as fog F0.5 (stage sets the info level —
> `FOG-OF-WAR.md`). This scopes the **access** half. Follow-up questions are out to Ryan
> (what earns access; how unknowns break into hot rounds; whether a verified game record moves
> a real VC) — his answers should be folded in here before building.

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
- **Access edges lift the cutback** (candidates, pending Ryan's answers on what really earns it):
  1. **Track record** — scout tier from prior daily boards raises your allocation cap (season-over-
     season progression finally means something mechanically). Needs persistent identity.
  2. **Early conviction** — committing before hype spikes (in-season: before an up-round) gets the
     full check; chasing after the mark-up gets crumbs. Cheap to build, deeply on-theme.
  3. **Do the work** — diligence points spent on a deal double as relationship-building: L3+ on a
     deal unlocks full allocation. Makes one budget serve two scarcities (information AND access).
- **The difficulty curve becomes the critique.** New players are locked out of the obvious hot
  rounds and must win on overlooked deals — mechanically identical to how no-name investors
  actually break in. Beating the wall *is* the proof of judgment.

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

## Events

`allocation_cut {deal, wanted, honored, factor, board}` · `access_unlock {deal, via}` ·
`season_end` gains `accessAlpha`. Weekly analyst gets: how often players get cut back, whether
they route around the wall (do cutbacks push allocations toward low-hype deals?), and access-α
distribution.

## Phasing

| Phase | Scope | Effort |
|---|---|---|
| **A0** | Oversubscription from hype (board-seeded), visible on the card ("🔥 oversubscribed — expect ~30% fill"); pro-rata cutback at begin_season; access α on the endcard + events | M |
| **A1** | Impersonal edges: diligence-unlocks-allocation + early-conviction fills for in-season follow-ons | S |
| **A2** | Persistent track-record tier (needs identity/collector), tier-segmented leaderboard, `get_board` exposes your access per deal for VC-Bench agents | M |

**Interaction notes:** composes with fog (the two scarcities can share the diligence budget in A1);
Survivor stays access-free (timing game); STAGE-SCOPE's player-side entry stage is orthogonal but
access pressure realistically differs by stage (pre-seed = relationship game, growth = allocation
war) — revisit when both exist.
