# VC-Bench — booked scores

Cold LLM playtest runs through the real harness (`node vcbench/harness.js`, stdio tool
contract). Rules of the run: agents could read only `vcbench/README.md` + `tool_docs.json` —
no game source, no design docs, no RNG reconstruction. Scores were booked to the live
collector under transparent `🤖` handles, so they seed the day's pods as visible AI
competition (they occupy pod slots like any first attempt).

## 2026-07-10 board · Claude (Fable 5) × 3 briefs

| agent (handle) | brief | profit | mult | judgment | calibration | steering α | access α | risk |
|---|---|---|---|---|---|---|---|---|
| 🤖 fable-baseline | none (pure ability) | +$2,289M | 23.89× | 87% | 95% | +675 | −330 | 3/5 |
| 🤖 fable-aggro | aggressive steerer | +$2,236M | 23.36× | 83% | 100% | +700 | −330 | 4/5 |
| 🤖 fable-contrarian | diamond-in-the-rough hunter | +$2,113M | 22.13× | 88% | 100% | +594 | −235 | 2/5 |

Reference points on the same board: scripted demo agent 15.26×; a careful human read 13.45×;
an all-hype portfolio 0.93× (rank 5/5).

## What the runs say about the game

- **Skill expression is real and convergent.** All three independently used diligence to find
  the same hidden rocket (Velpoint, hype 2 → full fill) and to flag the fraud by its signature
  (juiced `fin` vs rotten `ar`), and all three dodged all three zeros. The fog is readable by a
  strong player — by design — and the win path is the intended one: diligence → conviction →
  follow-ons.
- **The α decomposition separates the briefs exactly as designed.** The aggressive brief posted
  the highest steering α (+700) and the worst access α (−330, maxed checks into hot rounds);
  the contrarian posted the best access α (−235) and the lowest steering α. Different books,
  different failure surfaces, ~same total — that's a balanced strategy space.
- **Ceiling watch (balance flag):** skilled play lands 22–24× and beats every bot by ~10×.
  Top-end humans will find the same line. The archetype-generator balancing session
  (FUN-FIRST.md) should consider tightening the rocket's exit multiple or making the fraud
  tell noisier at L3.
- **UX friction the agents hit** (candidates for the improvement loop):
  1. Oversubscription sizing is opaque — should you max the check or size to the expected
     honored amount? A one-line hint on the check input when fill < 1 would answer it.
  2. Early standings mislead — an all-in-good-deals portfolio ranks last after round 1 purely
     because idle reserves drag vs deployed bots; nearly baited a re-think of correct picks.
  3. Follow-on ceilings are unknowable under fog ("is 11× still cheap?") — arguably the game
     working as intended, but worth a tooltip acknowledging it.
