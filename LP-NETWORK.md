# Wanna-be LPs — the demand side of the scout network (SCOPE, not built)

> Status: **design only.** Nothing here functions yet. The goal is to capture LP demand now and
> charge for it later, without shipping anything that turns a game into regulated territory before
> we mean to. Companion to [`LOOP.md`](./LOOP.md) (the self-improvement loop) and the Scout Card in
> `analytics.js` (the supply side).

## The thesis in one line
Fantasy VC manufactures the one thing capital can't easily buy: a **verifiable track record of
investing judgment** from people with no résumé. Players already opt in to be seen
(`leaderboard_optin`). **Wanna-be LPs is the demand side** — people eager to *back* those players —
captured as a waitlist today, monetized once there's something to sell.

## The two-sided marketplace
| Side | Who | Status |
|---|---|---|
| **Supply** | Players earning 🥇 Gold / 🥈 Silver, opting into the leaderboard | ✅ built (`leaderboard_optin`) |
| **Demand** | LPs, angels, family offices, scouts, funds who want to back a proven player | 🔲 this doc (`lp_interest`) |
| **Us** | The matchmaking + credentialing + lead-gen layer | the business |

"They go off and do stuff" = the actual backing happens **off-platform**, between the parties under
their own counsel. That's not a limitation to fix — it's the legally-safe shape (see guardrails).

## What "poll LPs" means concretely (v0 — interest capture only)
No matching, no money, no intros. Just a demand signal + an email list to activate later:

- A **"Back a player" / "For LPs"** CTA (nav + footer + on shared Scout Card landings).
- A short form → waitlist:
  - **who** they are (name, contact — server-side only)
  - **type**: angel · family office · fund · scout · "just curious"
  - **check size band**: <$10k · $10–50k · $50–250k · $250k+
  - **target**: a specific player handle · a thesis (e.g. "Product/Moat") · "the top pool"
  - **note** (free text: what they're looking for)
- Persist as a `lp_interest` event **and** a durable waitlist row in the collector.

Value delivered on day one: a **ranked demand list** and a warm audience, both before we build fulfillment.

## Surfaces (where the CTA lives)
- **Shared Scout Card → public rank page** (the X/LinkedIn link already drives strangers here) → "Back this player."
- A dedicated **`/for-lps`** page (static, explains the pitch + the form).
- On the future **public leaderboard**, a "N LPs watching" counter — social proof that pulls players to opt in *and* LPs to raise their hand.
- Player-side echo: after a player opts in, show "3 LPs are watching this board" — closes the loop both ways.

## Data model
```
event  lp_interest {
  cid, ts,
  type:      'angel'|'family_office'|'fund'|'scout'|'curious',
  checkSize: '<10k'|'10-50k'|'50-250k'|'250k+',
  target:    { kind:'player'|'thesis'|'pool', value:'@handle'|'Product/Moat'|'top' },
  horizon:   'now'|'6-12mo'|'watching',
  contact,   note                      // ← PII: collector-side only, NEVER in localStorage/export/public JSON
}
```
- Mirror of `leaderboard_optin`. Together they give the analyst a **liquidity metric**: supply
  (opted-in players) vs demand (LP interest), and a demand-per-thesis breakdown.
- Collector gets a `POST /waitlist` that appends to `usage/lp-waitlist.jsonl` (gitignored, PII).

## Monetization — the "charge them down the line" (ordered by friction)
1. **Lead-gen / warm-intro fee** — LP pays per intro to a scout. Lowest lift, clearest value.
2. **LP subscription** — recurring access to the verified leaderboard + track records.
3. **Curation** — a curated "class" of scouts; LPs pay for vetted access / demo days.
4. **Carry / rev-share** — a cut if a real backing closes. Highest value, highest legal load; last.

Players always play free. We charge the demand side and for the credential — never for participation.

## ⚠️ Legal / trust guardrails (read before this functions)
The moment real intros or money flow, this stops being a game:
- **Not investment advice, not a broker-dealer, not an RIA.** No solicitation or offer of securities.
- **Matching capital to managers can trigger broker-dealer / "finder" rules.** v0 stays at *interest
  capture + disclaimers only.* Get securities counsel before any **paid** intro or fund formation.
- **KYC + accreditation** on LPs before anything real changes hands.
- **Double consent**: players already opt in; LPs must too. Never expose a player's identity/contact
  without their explicit consent (the existing opt-in), and never expose LP contact publicly.
- Every LP surface carries a plain **"this is a demo — no offer or solicitation"** disclaimer.
- PII (LP + player contact) lives collector-side only, gitignored, never in the public export.

## Phasing
| Phase | Scope | Effort |
|---|---|---|
| **v0** (approve to build) | "For LPs" CTA + waitlist form + `lp_interest` event + collector `/waitlist`. Capture only. Disclaimer. | ~1 hr |
| **v1** | Public verified leaderboard, per-player "Back this player" + watcher count, double-opt-in email. | small |
| **v2** | Gated LP dashboard (subscription), verified track records, intro-request flow (fulfillment still off-platform). | medium |
| **v3** | Paid intros / curation / carry. **Only after counsel + KYC.** | large + legal |

## How it plugs into today's code
- Reuses `FVC.track` (analytics.js) and `collector.js` (add one `POST /waitlist` handler).
- `leaderboard_optin` (supply) ↔ `lp_interest` (demand) become the marketplace's two liquidity
  numbers; the weekly Loop-4 analyst can report the supply/demand ratio per thesis with no new plumbing.
- No new game mechanics, no scoring changes — purely additive, fully reversible.
