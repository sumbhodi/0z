// meter.js — THE RECEIPTS (window.OZ_METER). a private, LOCAL tally of what the app routes, per provider:
// requests + an estimate of tokens. NO content, NO keys, NO identity — just counts, in localStorage, on THIS
// device. it never phones home. (the grand total across users, when you want it, is a SEPARATE anonymous
// counter — an integers-only Cloudflare Worker; this file deliberately holds nothing that could go public-
// unsafe, so the aggregate can be public.) this is the dashboard you bring to the steaks-and-scotch.
//
// PORTABLE — self-contained, no deps. drop it into ANY oz app and call OZ_METER.hit(provider, inTok, outTok).
// (pass token numbers, or pass the strings and it estimates at ~4 chars/token.)

;(function () {
  const KEY = 'toto_meter'
  function load() {
    try { return JSON.parse(localStorage.getItem(KEY) || 'null') || { since: Date.now(), by: {} } }
    catch (_) { return { since: Date.now(), by: {} } }
  }
  function save(m) { try { localStorage.setItem(KEY, JSON.stringify(m)) } catch (_) {} }
  const est = s => Math.max(0, Math.round(('' + (s || '')).length / 4))   // ~4 chars per token

  window.OZ_METER = {
    // count ONE routed call. inTok/outTok may be numbers (token estimates) or strings (we estimate).
    hit(provider, inTok, outTok) {
      if (!provider) return
      const i = typeof inTok === 'string' ? est(inTok) : (inTok | 0)
      const o = typeof outTok === 'string' ? est(outTok) : (outTok | 0)
      const m = load(); const b = m.by[provider] || (m.by[provider] = { req: 0, in: 0, out: 0 })
      b.req++; b.in += i; b.out += o; save(m)
    },
    stats() { return load() },
    // the receipt — flat, human + machine readable. (this is also exactly the shape the anonymous aggregate
    // counter would receive: provider + counts, never anything else.)
    export() {
      const m = load(), days = Math.max(1, Math.round((Date.now() - m.since) / 86400000))
      const by = Object.entries(m.by).map(([provider, b]) => ({ provider, requests: b.req, tokens_in: b.in, tokens_out: b.out, tokens: b.in + b.out }))
      const total = by.reduce((a, r) => ({ requests: a.requests + r.requests, tokens: a.tokens + r.tokens }), { requests: 0, tokens: 0 })
      return { since: new Date(m.since).toISOString(), days, by_provider: by, total }
    },
    reset() { save({ since: Date.now(), by: {} }) },
  }
})()
