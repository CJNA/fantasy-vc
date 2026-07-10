#!/usr/bin/env node
/* VC-Bench harness — runs THE ACTUAL GAME (index.html's inline script) headlessly in Node
 * and exposes the 13-tool contract from tool_docs.json over stdin/stdout JSON lines.
 *
 * Attribution: the interface mirrors CEO-Bench's agent interface (zlab-princeton/ceobench-src,
 * Zhuang Liu Lab @ Princeton) — their tools.py / api_server.py pattern, including fog-of-war
 * enforced AT THE TOOL LAYER (their _filter_hidden: get_board never returns true scores while
 * fog is active). See tool_docs.json and ../FOG-OF-WAR.md.
 *
 * Design choice: no reimplementation. We evaluate index.html's own <script> in a vm sandbox
 * behind a universal DOM stub, so the harness and the browser can never drift apart — an agent
 * and a human on the same daily board play byte-identical games (rng is board-seeded).
 *
 * Usage:
 *   node vcbench/harness.js                # stdio server: one JSON request per line
 *   node vcbench/harness.js --demo         # scripted baseline agent plays one episode
 *   echo '{"tool":"get_board","input":{}}' | node vcbench/harness.js
 *
 * Request:  {"tool":"get_board","input":{}}
 * Response: {"ok":true,"result":{...}} | {"ok":false,"error":"..."}
 * Zero dependencies, same as the rest of the repo. */

'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm'), readline = require('readline');

/* ---------- universal DOM stub ----------
 * Render functions touch the DOM freely; none of the game MATH does. Every element is a
 * callable Proxy: any property read returns another stub (or a sane primitive for value-ish
 * props), any call returns a stub, any assignment is swallowed. querySelectorAll returns a
 * real [] so .forEach chains no-op. */
function makeEl(){
  const fn = function(){ return makeEl(); };
  return new Proxy(fn, {
    get(_, p){
      if (p === Symbol.toPrimitive || p === 'toString') return () => '';
      if (typeof p === 'symbol') return undefined;
      if (p === 'value' || p === 'textContent' || p === 'innerHTML' || p === 'className') return '';
      if (p === 'disabled' || p === 'checked') return false;
      if (p === 'length') return 0;
      if (p === 'querySelectorAll') return () => [];
      return makeEl();
    },
    set(){ return true; },
    apply(){ return makeEl(); },
  });
}

/* ---------- load the game ---------- */
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const gameSrc = html.split('<script>')[1].split('</script>')[0];   // the single inline script

const events = [];                                                  // captured FVC stream
const FVC = { track: (t, p) => events.push(Object.assign({ t }, p)), share(){}, load: () => events };
const sandbox = {
  document: {
    getElementById: () => makeEl(), createElement: () => makeEl(),
    querySelector: () => makeEl(), querySelectorAll: () => [],
    addEventListener(){}, body: makeEl(), documentElement: makeEl(),
  },
  window: { FVC, scrollTo(){}, addEventListener(){} },
  FVC, location: { origin: '' },
  setTimeout, clearTimeout, console,
};
vm.createContext(sandbox);
// Top-level let/const in the script are scoped to it, not the context — append an accessor
// shim in the SAME script so the harness can reach live bindings (deals/alloc rebind per flow).
vm.runInContext(gameSrc + `
;globalThis.__E = {
  get deals(){return deals}, get alloc(){return alloc}, get thesis(){return thesis},
  get G(){return G}, get dpLeft(){return dpLeft},
  get fogOn(){return fogOn}, set fogOn(v){fogOn=v}, get fogRevealed(){return fogRevealed},
  get accessOn(){return accessOn}, set accessOn(v){accessOn=v}, FILL, fillOf,
  get secOn(){return secOn}, set secOn(v){secOn=v}, SEC_HAIR, secBid,
  THESES, CAPITAL, MIN_DEALS, ROUNDS, DP_BUDGET, FOG_NOISE, STAGE_LVL,
  boardId, todayId, fogLvl, fogVal, conviction, convictionTrue, spendDP,
  newDealFlow, enterSeason, advance, value, followOn, doSell, curName, curW,
};`, sandbox, { filename: 'index.html<script>' });
const E = sandbox.__E;

/* ---------- the 13 tools (contract: tool_docs.json) ---------- */
const FACTORS = ['team', 'ps', 'diff', 'market', 'comm', 'ar'];
const fail = (msg) => ({ ok: false, error: msg });
const ok = (result) => ({ ok: true, result });
const findDeal = (name) => E.deals.find(d => d.n === name);
const player = () => E.G.funds[E.G.pIdx];
const estimatesOf = (d) => {                       // tool-layer fog enforcement: fogVal only
  const est = {}; FACTORS.forEach(k => est[k] = E.fogVal(d, k)); est.fin = E.fogVal(d, 'fin');
  return est;
};

const TOOLS = {
  get_board(){
    if (E.G) return fail('Season already running — board is locked.');
    return ok({
      board: E.boardId(), fog: E.fogOn && !E.fogRevealed, diligencePointsLeft: E.dpLeft,
      deals: E.deals.map(d => ({
        name: d.n, sector: d.s, stage: d.st, blurb: d.b, hype: d.hype, maxCheck: d.maxCheck,
        fill: E.fillOf(d),
        infoLevel: E.fogLvl(d), estimates: estimatesOf(d), conviction: E.conviction(d),
      })),
    });
  },
  get_thesis(){
    return ok({ name: E.curName(), weights: Object.assign({}, E.curW()), finW: E.thesis.finW });
  },
  set_thesis(input){
    if (E.G) return fail('Season already running — thesis is locked.');
    if (input.weights){
      const w = Object.assign({}, E.curW());
      for (const k of Object.keys(input.weights)){
        if (!FACTORS.includes(k)) return fail(`Unknown factor '${k}' (use ${FACTORS.join('/')})`);
        const v = input.weights[k];
        if (typeof v !== 'number' || v < 0 || v > 50) return fail(`Weight ${k}=${v} out of range 0-50`);
        w[k] = v;
      }
      E.thesis.custom = w;
    } else if (input.preset){
      const i = E.THESES.findIndex(t => t.n === input.preset);
      if (i < 0) return fail(`Unknown preset '${input.preset}' (one of: ${E.THESES.map(t => t.n).join(', ')})`);
      E.thesis.custom = null; E.thesis.wIdx = i;
    }
    if (input.finW !== undefined){
      if (typeof input.finW !== 'number' || input.finW < 0.1 || input.finW > 0.6) return fail('finW out of range 0.1-0.6');
      E.thesis.finW = input.finW;
    }
    const w = E.curW();
    return ok(`Thesis set: ${E.curName()} (${FACTORS.map(k => k + ' ' + w[k]).join(', ')}) · finW ${E.thesis.finW}`);
  },
  spend_diligence(input){
    const d = findDeal(input.deal);
    if (!d) return fail(`Unknown deal '${input.deal}'`);
    if (E.G) return fail('Season running — diligence is locked.');
    if (E.dpLeft <= 0) return fail('No points left');
    if (E.fogLvl(d) >= 4) return fail(`${d.n} is already fully diligenced (L4)`);
    E.spendDP(d.n);
    return ok({ deal: d.n, stage: d.st, infoLevel: E.fogLvl(d), pointsLeft: E.dpLeft, estimates: estimatesOf(d) });
  },
  set_seed_allocation(input){
    if (E.G) return fail('Season already running — allocations are locked.');
    const alloc = input.allocations || {};
    for (const [n, v] of Object.entries(alloc)){
      const d = findDeal(n);
      if (!d) return fail(`Unknown deal '${n}'`);
      if (typeof v !== 'number' || v < 0) return fail(`Bad amount for ${n}`);
      if (v > d.maxCheck) return fail(`Check into ${n} exceeds round cap ($${d.maxCheck}M)`);
    }
    const next = Object.assign({}, E.alloc, alloc);
    const total = Object.values(next).reduce((a, b) => a + b, 0);
    if (total > E.CAPITAL) return fail(`Total $${total}M exceeds the $${E.CAPITAL}M fund`);
    Object.assign(E.alloc, alloc);
    const count = Object.values(E.alloc).filter(v => v > 0).length;
    return ok({ deployed: total, reserves: E.CAPITAL - total, deals: count, qualified: count >= E.MIN_DEALS });
  },
  begin_season(input){
    if (E.G) return fail('Season already running.');
    const count = Object.values(E.alloc).filter(v => v > 0).length;
    if (count < E.MIN_DEALS) return fail(`Fewer than ${E.MIN_DEALS} deals backed`);
    E.enterSeason();
    if (input.fundName) player().name = String(input.fundName).slice(0, 22);
    const cuts = E.deals
      .filter(d => (E.G.intended[d.n] || 0) > (E.G.honored[d.n] || 0))
      .map(d => ({ deal: d.n, wanted: E.G.intended[d.n], honored: E.G.honored[d.n] || 0, fill: E.fillOf(d) }));
    return ok({ round: 0, funds: E.G.funds.length,
      deployed: E.CAPITAL - player().cash, reserves: player().cash, cuts });
  },
  get_holdings(){
    if (!E.G) return fail('No season running.');
    const p = player(), r = E.G.round;
    return ok({
      round: r, cash: +p.cash.toFixed(2),
      positions: E.deals.filter(d => p.pos[d.n] && p.pos[d.n].units > 1e-9).map(d => {
        const pos = p.pos[d.n], val = pos.units * d.path[r];
        return { deal: d.n, units: +pos.units.toFixed(3), cost: pos.cost, mark: d.path[r],
          value: +val.toFixed(2), pnl: +(val - pos.cost).toFixed(2),
          foRoom: +Math.max(0, d.maxCheck - (E.G.foRound[d.n] || 0)).toFixed(2),
          secondaryBid: (r >= 1 && r <= 4) ? E.secBid(d, r) : null };
      }),
    });
  },
  follow_on(input){
    if (!E.G) return fail('No season running.');
    const r = E.G.round, p = player(), d = findDeal(input.deal);
    if (!d || !p.pos[d.n] || p.pos[d.n].units <= 1e-9) return fail('Deal not held');
    if (r < 1 || r > 4) return fail('Round not actionable');
    if (d.path[r] <= 0) return fail(`${d.n} is dead`);
    const room = Math.max(0, d.maxCheck - (E.G.foRound[d.n] || 0));
    let amt = input.amount === -1 ? Math.min(p.cash, room) : input.amount;
    amt = Math.min(amt, room, p.cash);
    if (!(amt > 0)) return fail('No cash / no follow-on room');
    const added = E.followOn(p, d, amt, r);
    E.G.foRound[d.n] = (E.G.foRound[d.n] || 0) + added;
    E.G.hist[E.G.pIdx][r] = E.value(p, r);
    return ok(`Followed on $${added.toFixed(1)}M into ${d.n} at ${d.path[r].toFixed(0)}× → position $${(p.pos[d.n].units * d.path[r]).toFixed(1)}M.`);
  },
  sell(input){
    if (!E.G) return fail('No season running.');
    const r = E.G.round, p = player(), d = findDeal(input.deal);
    if (!d || !p.pos[d.n] || p.pos[d.n].units <= 1e-9) return fail('Deal not held / nothing to sell');
    if (r < 1 || r > 4) return fail('Round not actionable');
    const frac = input.fraction;
    if (!(frac > 0 && frac <= 1)) return fail('fraction must be in (0, 1]');
    const bid = E.secBid(d, r);
    if (bid <= 0) return fail(`No bid — ${d.n} just marked down and the secondary market has dried up. No buyer at any price this round.`);
    const proceeds = E.doSell(p, d, frac, r);
    E.G.hist[E.G.pIdx][r] = E.value(p, r);
    return ok(`Sold ${Math.round(frac * 100)}% of ${d.n} at ${d.path[r].toFixed(0)}×${bid < 1 ? ` via secondary (−${Math.round((1 - bid) * 100)}% to mark)` : ''} → $${proceeds.toFixed(1)}M to reserves.`);
  },
  advance_round(){
    if (!E.G) return fail('No season running.');
    if (E.G.round >= 5) return fail('Season over — call get_result.');
    const p = player(), prevR = E.G.round;
    const held = {}; E.deals.forEach(d => held[d.n] = !!(p.pos[d.n] && p.pos[d.n].units > 1e-9));
    E.advance();
    const r = E.G.round, evs = [];
    E.deals.forEach(d => {                          // mirrors logRound's narration
      const prev = d.path[r - 1], cur = d.path[r];
      if (cur === 0 && prev !== 0) evs.push(`${d.n} collapsed to $0.${held[d.n] ? ' Your stake is wiped.' : ''}`);
      else if (held[d.n] && cur > prev) evs.push(`${d.n} raised an up-round — now ${cur.toFixed(0)}× on cost.`);
      else if (held[d.n] && cur < prev) evs.push(`${d.n} marked down to ${cur.toFixed(0)}×.`);
    });
    return ok({ round: r, roundName: E.ROUNDS[r], yourValue: +E.value(p, r).toFixed(2), events: evs, done: r >= 5 });
  },
  auto_resolve(){
    if (!E.G) return fail('No season running.');
    if (E.G.round >= 5) return fail('Season over — call get_result.');
    events.push({ t: 'auto_resolve', fromRound: E.G.round });
    while (E.G.round < 5) E.advance();               // synchronous — no UI timers headless
    return ok({ round: 5, done: true });
  },
  get_standings(){
    if (!E.G) return fail('No season running.');
    const r = E.G.round;
    return ok(E.G.funds.map(f => ({ fund: f.you ? 'You' : f.name, profit: +(E.value(f, r) - E.CAPITAL).toFixed(1) }))
      .sort((a, b) => b.profit - a.profit));
  },
  get_result(){
    const e = events.filter(x => x.t === 'season_end').slice(-1)[0];
    if (!e) return fail('Season not finished.');
    return ok({ rank: e.rank, funds: e.funds, mult: e.mult, profit: e.profit,
      selProfit: e.selProfit, steerAlpha: e.steerAlpha, accessAlpha: e.accessAlpha,
      judgment: e.judgment, calibration: e.calibration, scoutTier: e.scoutTier,
      thesis: e.thesis, board: e.board, fog: e.fog, access: e.access, dpSpent: e.dpSpent });
  },
};

function call(req){
  try {
    const t = TOOLS[req.tool];
    if (!t) return fail(`Unknown tool '${req.tool}' — see tool_docs.json`);
    return t(req.input || {});
  } catch (err){ return fail('Harness error: ' + err.message); }
}

/* ---------- demo agent: a scripted baseline plays one episode ---------- */
function demo(){
  const log = (s) => console.error('· ' + s);
  let board = call({ tool: 'get_board' }).result;
  log(`board ${board.board} — ${board.deals.length} deals, fog ${board.fog}, ${board.diligencePointsLeft} diligence pts`);
  // spend every point on the foggiest deal with the highest current conviction (re-read each time)
  while (true){
    board = call({ tool: 'get_board' }).result;
    if (!board.diligencePointsLeft) break;
    const target = board.deals.filter(d => d.infoLevel < 4)
      .sort((a, b) => a.infoLevel - b.infoLevel || b.conviction - a.conviction)[0];
    if (!target) break;
    const r = call({ tool: 'spend_diligence', input: { deal: target.name } });
    log(`sharpen ${target.name} (${target.stage}) → L${r.result.infoLevel}`);
  }
  board = call({ tool: 'get_board' }).result;
  const ranked = [...board.deals].sort((a, b) => b.conviction - a.conviction);
  const allocations = {}; let left = 100;
  ranked.slice(0, 5).forEach(d => { const amt = Math.min(d.maxCheck, 12, left); if (amt > 0){ allocations[d.name] = amt; left -= amt; } });
  log('allocate ' + Object.entries(allocations).map(([n, v]) => `${n} $${v}M`).join(', '));
  call({ tool: 'set_seed_allocation', input: { allocations } });
  call({ tool: 'begin_season', input: { fundName: 'Harness Demo Fund' } });
  call({ tool: 'auto_resolve' });
  const res = call({ tool: 'get_result' }).result;
  log(`rank #${res.rank}/${res.funds} · ${res.mult}× · profit $${res.profit}M (selection $${res.selProfit}M + steering $${res.steerAlpha}M) · judgment ${res.judgment}% · calibration ${res.calibration}%`);
  console.log(JSON.stringify(res, null, 2));
}

/* ---------- entry ---------- */
if (process.argv.includes('--demo')) { demo(); }
else {
  console.error('vcbench harness ready — one JSON request per line, e.g. {"tool":"get_board","input":{}}');
  const rl = readline.createInterface({ input: process.stdin, terminal: false });
  rl.on('line', (line) => {
    line = line.trim(); if (!line) return;
    let req; try { req = JSON.parse(line); } catch { console.log(JSON.stringify(fail('Bad JSON'))); return; }
    console.log(JSON.stringify(call(req)));
  });
}
