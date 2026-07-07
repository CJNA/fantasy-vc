/* Fantasy VC — observability layer (Loop-engineering prerequisite: "instrument all traces").
 * Captures structured usage events. Dual sink:
 *   1) localStorage  — always on, powers usage.html and offline single-machine play.
 *   2) collector     — optional sendBeacon POST to a tiny server (collector.js) that appends
 *                      JSONL, so the weekly hill-climbing analyst sees MULTI-USER traces.
 * The collector sink fails silently when no server is running, so double-clicking the HTML
 * with no backend behaves exactly like before. Browser-only; Date.now()/Math.random() are fine. */
(function () {
  const KEY = 'fvc_events_v1';
  const CAP = 5000;            // ring buffer so localStorage never overflows
  const SINK_KEY = 'fvc_sink'; // localStorage override for the collector URL ('' disables)
  const CID_KEY = 'fvc_cid';   // persistent per-browser client id (multi-user attribution)
  // The collector URL comes from an OPT-IN meta tag the deploy sets, e.g.
  //   <meta name="fvc-collector" content="https://fvc-collector.onrender.com/collect">
  // No tag => no phone-home. So a bare fork / double-clicked file never sends anything,
  // and only builds that explicitly opt in (our deploy) stream to the collector.
  function metaSink() {
    try { const m = document.querySelector('meta[name="fvc-collector"]'); return (m && m.content) || ''; }
    catch (e) { return ''; }
  }
  const DEFAULT_SINK = metaSink();

  // per-tab session id, and a persistent per-browser client id
  const sid = Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
  let cid;
  try {
    cid = localStorage.getItem(CID_KEY);
    if (!cid) { cid = 'c-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8); localStorage.setItem(CID_KEY, cid); }
  } catch (e) { cid = 'c-anon'; }

  function sink() {
    try { const v = localStorage.getItem(SINK_KEY); return v === null ? DEFAULT_SINK : v; }
    catch (e) { return DEFAULT_SINK; }
  }
  function setSink(url) { try { localStorage.setItem(SINK_KEY, url || ''); } catch (e) {} }

  function load() { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { return []; } }
  function save(a) { try { localStorage.setItem(KEY, JSON.stringify(a.slice(-CAP))); } catch (e) {} }

  // Send one event to the collector. String body => text/plain => no CORS preflight from file://.
  function beacon(ev) {
    const url = sink(); if (!url) return false;
    const body = JSON.stringify(ev);
    try {
      if (navigator.sendBeacon && navigator.sendBeacon(url, body)) return true;
    } catch (e) {}
    try { fetch(url, { method: 'POST', body: body, mode: 'no-cors', keepalive: true, headers: { 'Content-Type': 'text/plain' } }).catch(function () {}); } catch (e) {}
    return false;
  }

  function track(type, data) {
    const ev = Object.assign({ t: type, sid: sid, cid: cid, ts: Date.now() }, data || {});
    const a = load(); a.push(ev); save(a);  // sink 1: localStorage
    beacon(ev);                              // sink 2: collector (silent if none)
  }

  // Backfill: replay every locally-stored event to the collector once (e.g. first time you
  // start the server on a machine that already has play history). Not automatic — avoids dupes.
  function syncAll() { const a = load(); a.forEach(beacon); return a.length; }

  function exportJSON() { return JSON.stringify(load(), null, 2); }

  function download() {
    const blob = new Blob([exportJSON()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fvc_usage_' + new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-') + '.json';
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  }

  function clear() { localStorage.removeItem(KEY); }

  function summary() {
    const ev = load();
    const sessions = new Set(ev.map(e => e.sid));
    const by = t => ev.filter(e => e.t === t);
    return {
      events: ev.length,
      sessions: sessions.size,
      opens: by('app_open').length,
      leagueStarts: by('season_begin').length,
      leagueFinishes: by('season_end').length,
      memoStarts: by('memo_start').length,
      memoFinishes: by('memo_end').length,
      newBlood: by('season_end').filter(e => e.newBlood).length + by('memo_end').filter(e => e.newBlood).length,
    };
  }

  /* ─────────────────────────────────────────────────────────────────────────
   * SHARE CARD — turn a finished run into a nicely-formatted markdown "Scout Card"
   * the player can copy (private) or push to X / LinkedIn (public). Every public
   * share carries the app URL, so players advertise the game for us.
   *
   * result = {
   *   mode:   'league' | 'diligence',
   *   tier:   'gold'|'silver'|'bronze'|'none',
   *   rank:   'Rank #1 of 8'  (or any headline string),
   *   thesis: 'Product / Moat',            // optional
   *   stats:  [{k:'Fund Multiple', v:'2.31×'}, ...],
   *   line:   'Beat every bot — pure judgment.'   // one plain-text sentence
   * }
   * ──────────────────────────────────────────────────────────────────────── */
  const TIER_LABEL = { gold: '🥇 New Blood', silver: '🥈 Silver Scout', bronze: '🥉 Bronze Scout', none: '🔓 Unranked' };
  const APP_URL = (function () { try { return location.origin && location.origin.indexOf('http') === 0 ? location.origin + '/' : 'https://github.com/'; } catch (e) { return ''; } })();
  function handleGet() { try { return localStorage.getItem('fvc_handle') || ''; } catch (e) { return ''; } }
  function handleSet(h) { try { localStorage.setItem('fvc_handle', h || ''); } catch (e) {} }

  function shareMarkdown(r) {
    const who = handleGet();
    const mode = r.mode === 'diligence' ? 'Diligence Desk' : 'The League';
    const tier = TIER_LABEL[r.tier] || TIER_LABEL.none;
    const rows = (r.stats || []).map(s => '| ' + s.k + ' | ' + s.v + ' |').join('\n');
    return [
      '## 🏆 Fantasy VC — ' + mode + ' Scout Card',
      '',
      '**' + tier + '**' + (r.rank ? ' · ' + r.rank : '') + (who ? ' · ' + who : ''),
      '',
      '| Metric | Result |',
      '| --- | --- |',
      rows,
      '',
      (r.thesis ? '_Thesis: ' + r.thesis + '._ ' : '') + (r.line || ''),
      '',
      'Think you can out-pick the algorithms? → ' + APP_URL,
      '',
      '`#FantasyVC` `#VentureCapital` `#StartupInvesting`',
    ].join('\n');
  }

  function tweetText(r) {
    if (r.tweet) return r.tweet;
    const who = handleGet();
    const tier = (TIER_LABEL[r.tier] || '').replace(/^[^ ]+ /, ''); // drop the emoji for the tweet lead
    const lead = r.tier === 'gold' ? 'I got flagged as New Blood on Fantasy VC 🥇'
      : r.tier === 'none' ? 'I just ran a fund on Fantasy VC'
        : 'I scored ' + (TIER_LABEL[r.tier] || 'a card') + ' on Fantasy VC';
    const stat = (r.stats && r.stats[0]) ? ' (' + r.stats[0].v + ' ' + r.stats[0].k.toLowerCase() + ')' : '';
    return (who ? '' : '') + lead + stat + ' — beating the bots on real startups & rounds. Can you? #FantasyVC';
  }

  let styled = false;
  function injectStyle() {
    if (styled) return; styled = true;
    const s = document.createElement('style');
    s.textContent =
      '#fvc-share-ov{position:fixed;inset:0;background:rgba(6,7,12,.72);backdrop-filter:blur(4px);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px;font:14px/1.5 system-ui,-apple-system,Segoe UI,Roboto,sans-serif}' +
      '#fvc-share{background:#0f1118;border:1px solid #262a3a;border-radius:16px;max-width:520px;width:100%;padding:24px;color:#e7e9f0;box-shadow:0 24px 80px rgba(0,0,0,.6)}' +
      '#fvc-share h3{margin:0 0 4px;font-size:18px}' +
      '#fvc-share .sub{color:#8b90a4;font-size:13px;margin-bottom:14px}' +
      '#fvc-share textarea{width:100%;height:190px;background:#0a0b10;color:#cfd3e0;border:1px solid #262a3a;border-radius:10px;padding:12px;font:12px/1.5 ui-monospace,SFMono-Regular,Menlo,monospace;resize:vertical;box-sizing:border-box}' +
      '#fvc-share .row{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}' +
      '#fvc-share button{flex:1;min-width:120px;border:0;border-radius:10px;padding:11px 14px;font-weight:600;font-size:13px;cursor:pointer;color:#fff}' +
      '#fvc-share .b-copy{background:#7c5cff}#fvc-share .b-x{background:#111}#fvc-share .b-in{background:#0a66c2}#fvc-share .b-close{background:#232838;color:#c7ccdb}' +
      '#fvc-share .handle{margin-top:14px;display:flex;gap:8px;align-items:center}' +
      '#fvc-share .handle input{flex:1;background:#0a0b10;border:1px solid #262a3a;border-radius:8px;color:#e7e9f0;padding:9px 11px;font-size:13px}' +
      '#fvc-share .optin{margin-top:12px;font-size:12px;color:#8b90a4;display:flex;gap:8px;align-items:flex-start;line-height:1.45}' +
      '#fvc-share .optin input{margin-top:2px}#fvc-share a{color:#9b8cff}';
    document.head.appendChild(s);
  }

  // r.md (prebuilt markdown, e.g. the LP letter) skips the Scout Card builder and hides the
  // handle/opt-in rows — those only make sense for the card. r.title/r.sub/r.tweet override copy.
  function share(r) {
    injectStyle();
    track('share_open', { mode: r.mode, tier: r.tier });
    const md = r.md || shareMarkdown(r);
    const ov = document.createElement('div'); ov.id = 'fvc-share-ov';
    const url = encodeURIComponent(APP_URL);
    const xUrl = 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(tweetText(r)) + '&url=' + url;
    const inUrl = 'https://www.linkedin.com/sharing/share-offsite/?url=' + url;
    ov.innerHTML =
      '<div id="fvc-share" role="dialog" aria-label="Share">' +
      '<h3>' + (r.title || '📋 Your Scout Card') + '</h3>' +
      '<div class="sub">' + (r.sub || 'Copy the markdown to share privately, or post your rank publicly.') + '</div>' +
      (r.md ? '' : '<div class="handle"><input id="fvc-h" placeholder="@yourhandle (optional — shown on the card)" value="' + handleGet().replace(/"/g, '&quot;') + '"></div>') +
      '<textarea id="fvc-md" spellcheck="false"></textarea>' +
      '<div class="row">' +
      '<button class="b-copy" id="fvc-copy">Copy markdown</button>' +
      '<button class="b-x" id="fvc-x">Post on X</button>' +
      '<button class="b-in" id="fvc-in">Share on LinkedIn</button>' +
      '</div>' +
      (r.md ? '' : '<label class="optin"><input type="checkbox" id="fvc-optin"><span>List me on the public VC scout leaderboard (Gold/Silver only). Consent-based — VC firms browse opted-in performers. Uncheck to stay private.</span></label>') +
      '<div class="row"><button class="b-close" id="fvc-close">Close</button></div>' +
      '</div>';
    document.body.appendChild(ov);
    const ta = ov.querySelector('#fvc-md'); ta.value = md;
    const hi = ov.querySelector('#fvc-h');
    function refresh() { if (hi) { handleSet(hi.value.trim()); } ta.value = r.md || shareMarkdown(r); }
    if (hi) hi.addEventListener('input', refresh);
    ov.querySelector('#fvc-copy').addEventListener('click', function () {
      refresh(); ta.select();
      const done = function () { const b = ov.querySelector('#fvc-copy'); b.textContent = '✓ Copied'; setTimeout(function () { b.textContent = 'Copy markdown'; }, 1600); };
      try { navigator.clipboard ? navigator.clipboard.writeText(ta.value).then(done, function () { document.execCommand('copy'); done(); }) : (document.execCommand('copy'), done()); }
      catch (e) { document.execCommand('copy'); done(); }
      track('share_copy', { mode: r.mode, tier: r.tier });
    });
    ov.querySelector('#fvc-x').addEventListener('click', function () { refresh(); track('share_click', { net: 'x', mode: r.mode, tier: r.tier }); window.open(xUrl, '_blank', 'noopener'); });
    ov.querySelector('#fvc-in').addEventListener('click', function () {
      refresh(); track('share_click', { net: 'linkedin', mode: r.mode, tier: r.tier });
      try { navigator.clipboard && navigator.clipboard.writeText(ta.value); } catch (e) {}
      window.open(inUrl, '_blank', 'noopener'); // LinkedIn prefills only the URL — card is on the clipboard to paste
    });
    const oi = ov.querySelector('#fvc-optin');
    if (oi) oi.addEventListener('change', function (e) {
      refresh();
      if (e.target.checked) track('leaderboard_optin', { mode: r.mode, tier: r.tier, handle: handleGet(), rank: r.rank || '' });
      else track('leaderboard_optout', { mode: r.mode, tier: r.tier });
    });
    function close() { track('share_close', { mode: r.mode }); ov.remove(); }
    ov.querySelector('#fvc-close').addEventListener('click', close);
    ov.addEventListener('click', function (e) { if (e.target === ov) close(); });
  }

  window.FVC = {
    track: track, exportJSON: exportJSON, download: download, clear: clear, load: load,
    summary: summary, sid: sid, cid: cid, setSink: setSink, getSink: sink, syncAll: syncAll,
    share: share, shareMarkdown: shareMarkdown,
  };

  // auto-capture page lifecycle (the spine of the funnel)
  window.addEventListener('load', function () {
    track('app_open', { path: (location.pathname.split('/').pop() || 'index.html') });
  });
  window.addEventListener('beforeunload', function () {
    track('drop', { path: (location.pathname.split('/').pop() || 'index.html') });
  });
})();
