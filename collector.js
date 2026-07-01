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
