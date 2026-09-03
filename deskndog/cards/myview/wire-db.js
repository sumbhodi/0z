// wire-db.js — THE LINK BOOK (Sum 2026-08-22: "a living database of live links from pulls, so newsie doesn't have
// to make a fresh pull each time, just updates on fresh pulls; anything dropped from a fresh pull stays in archive
// as option till its link dies, then links to the wayback machine; a tiny little text file tracking the news").
// ONE factory for every pull (My View's FILL and The Feedline's cut both call upsert). One row per link, no pictures,
// no summaries: { l link · t title · s source id · ts published · f first seen · e last seen · d dead }. Lives in the
// sandbox as feedline/links.json through the parent (never a local SANDBOX: the two-maps trap). Capped; the cap is
// the reader's (localStorage wire-db-max, the box on The Feedline's deck); past it the oldest-seen rows go first.
(function () {
  'use strict'
  const P = window.parent, FILE = 'feedline/links.json', MAX_DEFAULT = 3000
  const SB = () => { try { return P && P.SANDBOX } catch (_) { return null } }
  const load = () => { try { const sb = SB(); const f = sb && sb[FILE]; const v = f ? JSON.parse(f.data || '[]') : []; return Array.isArray(v) ? v : [] } catch (_) { return [] } }
  const save = rows => { try { const sb = SB(); if (sb) sb[FILE] = { kind: 'code', ext: 'json', mime: '', data: JSON.stringify(rows) } } catch (_) {} }
  const max = () => { try { return Math.max(200, parseInt(localStorage.getItem('wire-db-max') || '', 10) || MAX_DEFAULT) } catch (_) { return MAX_DEFAULT } }
  const setMax = n => { try { localStorage.setItem('wire-db-max', String(Math.max(200, n | 0))) } catch (_) {} }

  // a fresh pull lands: every link seen now; new ones get a first-seen; the book is trimmed to the cap
  function upsert(items, now) {
    const rows = load(), by = new Map(rows.map(r => [r.l, r])); now = now || Date.now(); let fresh = 0
    ;(items || []).forEach(it => {
      if (!it || !it.link) return
      const r = by.get(it.link)
      if (r) { r.e = now; if (it.title) r.t = it.title; if (!r.s && it.source) r.s = it.source }
      else { by.set(it.link, { l: it.link, t: String(it.title || '').slice(0, 200), s: it.source || '', ts: it.ts || 0, f: now, e: now, d: 0 }); fresh++ }
    })
    let out = [...by.values()]
    if (out.length > max()) out = out.sort((a, b) => b.e - a.e).slice(0, max())
    save(out); return { total: out.length, fresh }
  }
  // the archive: what the book holds for these sources that a fresh pull did NOT bring today, live links only, newest seen first
  function archive(sourceIds, excludeLinks, limitPerSource) {
    const ex = new Set(excludeLinks || []), per = {}, out = []
    load().filter(r => !r.d && sourceIds.includes(r.s) && !ex.has(r.l)).sort((a, b) => b.e - a.e).forEach(r => {
      per[r.s] = (per[r.s] || 0) + 1; if (per[r.s] <= (limitPerSource || 12)) out.push(r)
    })
    return out
  }
  function markDead(link) { const rows = load(); const r = rows.find(x => x.l === link); if (r && !r.d) { r.d = 1; save(rows) } }
  const wayback = link => 'https://web.archive.org/web/2/' + link
  const stats = () => { const rows = load(); const day = Date.now() - 864e5; return { total: rows.length, dead: rows.filter(r => r.d).length, today: rows.filter(r => r.f > day).length, max: max() } }
  window.WIRE_DB = { FILE, load, upsert, archive, markDead, wayback, stats, max, setMax }
})()
