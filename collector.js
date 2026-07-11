#!/usr/bin/env node
/* Fantasy VC — usage collector (Loop 3 data path: "swap the localStorage sink for a
 * sendBeacon POST to a tiny collector appending JSONL"). Zero dependencies.
 *
 *   node collector.js            # listen on 127.0.0.1:8787, write usage/events.jsonl
 *   PORT=9000 node collector.js  # custom port (also set FVC.setSink in the browser)
 *
 * Endpoints:
 *   POST /collect   append an event (or array of events) as JSONL. Returns 204.
 *   GET  /export    the full event array as JSON (curl it, or feed the analyst).
 *   GET  /health    { events, sessions, clients, file } counts.
 *   GET  /pod?board=YYYY-MM-DD&cid=…   your pod of 8 humans on that daily board (FUN-FIRST P1).
 *   GET  /          tiny human status page.
 *
 * Durable log:   usage/events.jsonl   (one JSON event per line, append-only)
 * Analyst snapshot: usage/live-events.json   (array; debounced rewrite — matches the
 *                   weekly analyst's "every JSON file in usage/" glob with no prompt change).
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = parseInt(process.env.PORT || '8787', 10);
const HOST = process.env.HOST || '0.0.0.0'; // 0.0.0.0 so Render (and LAN) can route to it; PORT is injected by Render
const USAGE_DIR = path.join(__dirname, 'usage');
const JSONL = path.join(USAGE_DIR, 'events.jsonl');
const SNAPSHOT = path.join(USAGE_DIR, 'live-events.json');
const SNAPSHOT_CAP = 20000;

fs.mkdirSync(USAGE_DIR, { recursive: true });

// Load any prior durable log into memory so /export and the snapshot are complete on restart.
let events = [];
try {
  if (fs.existsSync(JSONL)) {
    events = fs.readFileSync(JSONL, 'utf8').split('\n').filter(Boolean).map(function (l) {
      try { return JSON.parse(l); } catch (e) { return null; }
    }).filter(Boolean);
  }
} catch (e) { console.error('warn: could not read existing log:', e.message); }

let snapTimer = null;
function scheduleSnapshot() {
  if (snapTimer) return;
  snapTimer = setTimeout(function () {
    snapTimer = null;
    try { fs.writeFileSync(SNAPSHOT, JSON.stringify(events.slice(-SNAPSHOT_CAP))); }
    catch (e) { console.error('warn: snapshot write failed:', e.message); }
  }, 1500);
}

function ingest(raw) {
  let parsed;
  try { parsed = JSON.parse(raw); } catch (e) { return 0; }
  const batch = Array.isArray(parsed) ? parsed : [parsed];
  let n = 0;
  const lines = [];
  for (const ev of batch) {
    if (!ev || typeof ev !== 'object') continue;
    ev.srv_ts = Date.now();                 // server receive time (client clocks vary)
    events.push(ev);
    lines.push(JSON.stringify(ev));
    n++;
  }
  if (n) {
    try { fs.appendFileSync(JSONL, lines.join('\n') + '\n'); }
    catch (e) { console.error('warn: append failed:', e.message); }
    scheduleSnapshot();
  }
  return n;
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

/* ---- RANDO PODS (FUN-FIRST P1) ----
 * Everyone who finishes today's daily board gets grouped, by arrival order, into pods of 8
 * humans. First attempt per client counts (the honest fantasy rule — no rerolling until you
 * like your score). Raw cids never leave the server: other players appear under a
 * deterministic scout alias unless their season_end carried an opted-in handle. */
const POD_SIZE = 8;
const POD_ADJ = ['Feral', 'Quiet', 'Golden', 'Midnight', 'Turbo', 'Velvet', 'Stubborn', 'Lucky', 'Grim', 'Solar', 'Cobalt', 'Maverick', 'Humble', 'Rowdy', 'Icy', 'Neon'];
const POD_ANI = ['Otter', 'Falcon', 'Heron', 'Badger', 'Lynx', 'Mongoose', 'Walrus', 'Magpie', 'Ibex', 'Tapir', 'Puffin', 'Gecko', 'Marmot', 'Orca', 'Wombat', 'Yak'];
function scoutAlias(cid) {
  let h = 2166136261; const s = String(cid);
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  h = h >>> 0;
  return POD_ADJ[h % POD_ADJ.length] + ' ' + POD_ANI[(h >>> 4) % POD_ANI.length];
}
function podFor(board, cid) {
  const seen = new Set(); const entries = [];
  for (const e of events) {                          // append order = arrival order
    if (e.t !== 'season_end' || e.board !== board || !e.cid) continue;
    if (seen.has(e.cid)) continue;                   // first attempt counts
    seen.add(e.cid);
    entries.push({
      cid: e.cid,
      h: (typeof e.handle === 'string' && e.handle.trim()) ? e.handle.trim().slice(0, 22) : scoutAlias(e.cid),
      p: Math.round(e.profit || 0), m: +(e.mult || 0), tier: e.scoutTier || 'none',
      risk: e.risk || null,
    });
  }
  let idx = entries.findIndex(x => x.cid === cid);
  if (idx < 0) idx = entries.length;                 // not landed yet → the still-filling pod
  const podIdx = Math.floor(idx / POD_SIZE);
  const rows = entries.slice(podIdx * POD_SIZE, (podIdx + 1) * POD_SIZE)
    .map(x => ({ h: x.h, p: x.p, m: x.m, tier: x.tier, risk: x.risk, you: x.cid === cid }))
    .sort((a, b) => b.p - a.p);
  return { board: board, pod: podIdx + 1, size: rows.length, total: entries.length, rows: rows };
}

const server = http.createServer(function (req, res) {
  const url = (req.url || '/').split('?')[0];

  if (req.method === 'OPTIONS') { res.writeHead(204, CORS); return res.end(); }

  if (req.method === 'POST' && url === '/collect') {
    let body = '';
    req.on('data', function (c) { body += c; if (body.length > 1e6) req.destroy(); });
    req.on('end', function () {
      const n = ingest(body);
      if (n) process.stdout.write('+' + n + ' (' + events.length + ' total)\r');
      res.writeHead(204, CORS); res.end();
    });
    return;
  }

  if (req.method === 'GET' && url === '/export') {
    res.writeHead(200, Object.assign({ 'Content-Type': 'application/json' }, CORS));
    return res.end(JSON.stringify(events));
  }

  if (req.method === 'GET' && url === '/pod') {
    const q = new URLSearchParams((req.url || '').split('?')[1] || '');
    const board = (q.get('board') || '').slice(0, 10), cid = (q.get('cid') || '').slice(0, 40);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(board)) { res.writeHead(400, CORS); return res.end('bad board'); }
    res.writeHead(200, Object.assign({ 'Content-Type': 'application/json' }, CORS));
    return res.end(JSON.stringify(podFor(board, cid)));
  }

  if (req.method === 'GET' && url === '/health') {
    const sessions = new Set(events.map(function (e) { return e.sid; }));
    const clients = new Set(events.map(function (e) { return e.cid; }));
    res.writeHead(200, Object.assign({ 'Content-Type': 'application/json' }, CORS));
    return res.end(JSON.stringify({ events: events.length, sessions: sessions.size, clients: clients.size, file: JSONL }));
  }

  if (req.method === 'GET' && url === '/') {
    const clients = new Set(events.map(function (e) { return e.cid; })).size;
    res.writeHead(200, { 'Content-Type': 'text/html' });
    return res.end('<!doctype html><meta charset=utf-8><title>FVC collector</title>' +
      '<body style="font:15px system-ui;background:#0a0b10;color:#e7e9f0;padding:30px">' +
      '<h2>📡 Fantasy VC collector</h2><p>Listening on ' + HOST + ':' + PORT + '</p>' +
      '<p><b>' + events.length + '</b> events · <b>' + clients + '</b> clients</p>' +
      '<p style="color:#8b90a4">Durable log: usage/events.jsonl · Analyst snapshot: usage/live-events.json</p>' +
      '<p><a style="color:#7c5cff" href="/export">/export</a> · <a style="color:#7c5cff" href="/health">/health</a></p>');
  }

  res.writeHead(404, CORS); res.end('not found');
});

server.listen(PORT, HOST, function () {
  console.log('📡 Fantasy VC collector on http://' + HOST + ':' + PORT);
  console.log('   POST /collect  ·  GET /export  ·  GET /health');
  console.log('   durable log -> ' + JSONL);
  console.log('   loaded ' + events.length + ' existing event(s). Ctrl-C to stop.');
});
