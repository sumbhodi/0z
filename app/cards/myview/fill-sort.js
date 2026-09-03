// FILL SORT. The GOFAI sorter for MY VIEW (Sum 2026-08-21): "just sort the news with its
// meta data pics, into 3 columns, balanced, best pics center, no pics rails only."
// Pure and deterministic. No model calls, no network, no DOM, no Date.now, no Math.random.
// Works as a browser script (window.FILL_SORT) and under node (module.exports).
//
// Item in:  { id, title, link, source, ts, summary, image: null | { url, w, h } }
// Call:     FILL_SORT.sortEdition(items, opts)
// Out:      { center, left, right, dropped: [{ item, why }], stats }
//
// The order of operations, each step eating the last one's output:
//   1 sort by (ts desc, id asc) so any input order lands the same
//   2 dedupe near-identical headlines, keep the better picture, else the earlier ts
//   3 round-robin by source so a 40-item wire cannot bury a 5-item wire
//   4 center = the best pictures, by picScore then ts
//   5 rails = everything else, text only, dealt to the shorter rail by estimated height
//
// Transplants, named per the house rule:
//   jac()               copied from cards/scroll/scroll.js L1201
//   interleaveBySource  the dealer loop copied from byLaneRR in cards/scroll/scroll.js L1560,
//                       keyed on source instead of lane
;(function () {
  'use strict'

  const DEFAULTS = { centerMax: 6, railMax: 9, minPicPx: 300, dedupeThreshold: 0.6, summaryChars: 220, centerShare: 0.42, centerPicUnits: 6, railPicUnits: 3, railPics: 1, boost: null,
    railSummaryChars: 140, railTitleChars: 26, railLineChars: 44, centerTitleChars: 38, centerLineChars: 60 }   // the two column measures (myview.html: rails slice summaries at 140, center at 220)

  function str(s) { return s == null ? '' : String(s) }
  function num(n) { const v = Number(n); return isFinite(v) ? v : 0 }
  function opt(o) { const out = {}; Object.keys(DEFAULTS).forEach(k => { out[k] = (o && o[k] != null && isFinite(Number(o[k]))) ? Number(o[k]) : DEFAULTS[k] }); out.boost = (o && Array.isArray(o.boost)) ? o.boost.map(w => String(w).toLowerCase().trim()).filter(Boolean) : []; return out }
  function uniq(a) { return Array.from(new Set(a)) }

  // ── 1. the canonical order. ts desc, then id asc, then title, then link. ──
  function cmpKey(a, b) {
    const ta = num(a.ts), tb = num(b.ts)
    if (ta !== tb) return tb - ta
    const ia = str(a.id), ib = str(b.id)
    if (ia !== ib) return ia < ib ? -1 : 1
    const xa = str(a.title), xb = str(b.title)
    if (xa !== xb) return xa < xb ? -1 : 1
    const la = str(a.link), lb = str(b.link)
    if (la !== lb) return la < lb ? -1 : 1
    return 0
  }
  function canonSort(items) { return items.slice().sort(cmpKey) }

  // ── 2. dedupe. normalize, shingle, jaccard. ──
  function normTitle(t) { return str(t).toLowerCase().replace(/[^a-z0-9\s]+/g, ' ').replace(/\s+/g, ' ').trim() }
  function words(t) { const n = normTitle(t); return n ? n.split(' ') : [] }
  function shingles(ws) { const out = []; for (let i = 0; i + 1 < ws.length; i++) out.push(ws[i] + ' ' + ws[i + 1]); return out }
  // jac: copied verbatim from cards/scroll/scroll.js L1201. feed it uniq'd arrays for set semantics.
  function jac(a, b) { const B = new Set(b); if (!a.length || !b.length) return 0; let i = 0; a.forEach(x => { if (B.has(x)) i++ }); return i / (a.length + b.length - i) }
  // overlap of two titles. 2-word shingles when both titles have 4+ words, else word sets.
  function titleOverlap(a, b) {
    const wa = words(a), wb = words(b)
    if (!wa.length || !wb.length) return 0
    if (wa.length < 4 || wb.length < 4) return jac(uniq(wa), uniq(wb))
    return jac(uniq(shingles(wa)), uniq(shingles(wb)))
  }

  // ── 3. the picture score. pure metadata, no pixels read. ──
  function picScore(item, minPicPx) {
    const floor = (minPicPx != null && isFinite(Number(minPicPx))) ? Number(minPicPx) : DEFAULTS.minPicPx
    const img = item && item.image
    if (!img || !str(img.url)) return 0
    const w = num(img.w), h = num(img.h)
    if (!(w > 0 && h > 0)) return 1 + 0.3                    // size unknown: a picture, but no credit for size
    const mx = Math.max(w, h), ratio = w / h
    if (mx < floor) return 0.2                                 // a logo, not a photo
    if (ratio >= 0.9 && ratio <= 1.1 && mx < 600) return 0.3   // small square: an avatar or a badge
    let s = 1 + Math.log10(Math.max(w * h, 1)) / 6
    if (ratio >= 1.2 && ratio <= 2.0) s += 0.25                // landscape reads well in the center
    return s
  }

  // ── 5. the height estimate for a text-only rail card, in rough line units. ──
  // height in LINES, for a column of a given width: the rails are narrow (1fr) and wrap a 17px title at ~26
  // characters; the center is wide (1.5fr) and wraps a 22px title at ~38. Counting every column at the wide
  // measure under-counted the rails and left one rail a screen longer than the other (Sum 2026-08-22:
  // "rails need length not count balance"). titleChars/summaryLineChars/summaryChars come from the caller.
  function estimateHeight(item, summaryChars, titleChars, summaryLineChars) {
    const cap = (summaryChars != null && isFinite(Number(summaryChars))) ? Number(summaryChars) : DEFAULTS.summaryChars
    const tc = (titleChars != null && isFinite(Number(titleChars))) ? Number(titleChars) : 38
    const lc = (summaryLineChars != null && isFinite(Number(summaryLineChars))) ? Number(summaryLineChars) : 60
    const t = str(item && item.title), s = str(item && item.summary)
    return 2 + Math.ceil(t.length / tc) + Math.ceil(Math.min(s.length, cap) / lc)
  }

  function sourceOf(it) { return str(it.source) || str(it.src) || '?' }

  // ── the fairness dealer. copied from byLaneRR in cards/scroll/scroll.js L1560, keyed on source.
  //    input must already be in canonical order, so each source's bucket is ts desc and the source
  //    order is first appearance. ──
  function interleaveBySource(arr) {
    const g = {}, order = []
    arr.forEach(x => { const l = sourceOf(x); if (!g[l]) { g[l] = []; order.push(l) } g[l].push(x) })
    const out2 = []; let more = true
    while (more) { more = false; order.forEach(l => { if (g[l].length) { out2.push(g[l].shift()); more = true } }) }
    return out2
  }

  function dedupe(sorted, threshold, minPicPx) {
    const kept = [], dropped = []
    sorted.forEach(it => {
      for (let j = 0; j < kept.length; j++) {
        const k = kept[j]
        if (titleOverlap(it.title, k.title) > threshold) {
          // the newcomer wins on a better picture, else on the earlier ts, else on id
          const si = picScore(it, minPicPx), sk = picScore(k, minPicPx)
          let newWins
          if (si !== sk) newWins = si > sk
          else if (num(it.ts) !== num(k.ts)) newWins = num(it.ts) < num(k.ts)
          else newWins = str(it.id) < str(k.id)
          if (newWins) { dropped.push({ item: k, why: 'duplicate', dupOf: it.id }); kept[j] = it }
          else dropped.push({ item: it, why: 'duplicate', dupOf: k.id })
          return
        }
      }
      kept.push(it)
    })
    return { kept: canonSort(kept), dropped }
  }

  function sortEdition(items, opts) {
    const o = opt(opts)
    const dropped = []
    const raw = Array.isArray(items) ? items : []
    const clean = []
    raw.forEach(x => { if (x && typeof x === 'object') clean.push(Object.assign({}, x)); else dropped.push({ item: x, why: 'invalid' }) })

    const sorted = canonSort(clean)
    const dd = dedupe(sorted, o.dedupeThreshold, o.minPicPx)
    dd.dropped.forEach(d => dropped.push(d))
    const dealt = interleaveBySource(dd.kept)

    // THE PAGE IS THREE COLUMNS BALANCED BY HEIGHT (Sum 2026-08-21: "fill rails better... let good pics
    // fill rails for balance if too many high score pics"). Center is the wide column and gets its SHARE
    // of the estimated height (centerShare), filled with the best pictures first. Everything past the
    // share deals to the rails in the fair (interleaved) order, KEEPING its picture when it has one; the
    // rails balance each other by height. Only centerMax/railMax (hard caps) can still drop anything.
    const scored = dealt.map((it, i) => ({ it, i, s: picScore(it, o.minPicPx) }))
    const hPic = (it, units) => estimateHeight(it, o.summaryChars, o.centerTitleChars, o.centerLineChars) + (it.image && it.image.url ? units : 0)
    const hRail = it => estimateHeight(it, o.railSummaryChars, o.railTitleChars, o.railLineChars) + (it.image && it.image.url ? o.railPicUnits : 0)   // a rail card, measured at the rail's width
    const total = dealt.reduce((acc, it) => acc + hPic(it, o.centerPicUnits), 0)   // page height in CENTER units, the scale the share is spent in (rail units undercounted it and starved centerShare:1)
    const centerTarget = total * o.centerShare
    // THE MEGAPHONE (Sum 2026-08-21: "promotes matches to top of feed, dead simple"): a story whose title or
    // summary carries a boosted word goes to the FRONT of the center, ahead of every picture, picture or not.
    const loud = it => o.boost.length ? o.boost.some(w => ((it.title || '') + ' ' + (it.summary || '')).toLowerCase().includes(w)) : false
    scored.forEach(x => { x.loud = loud(x.it); if (x.loud) x.it = Object.assign({}, x.it, { boosted: true }) })
    const centerPool = scored.filter(x => x.s >= 1 || x.loud).sort((a, b) => (a.loud !== b.loud) ? (a.loud ? -1 : 1) : (a.s !== b.s) ? b.s - a.s : cmpKey(a.it, b.it))
    const center = []
    let ch = 0
    for (const x of centerPool) {
      if (center.length >= o.centerMax) break
      const h = hPic(x.it, o.centerPicUnits)
      if (center.length && ch + h > centerTarget && !x.loud) break   // center holds at least one picture, then only up to its share; a boosted story always fits
      center.push(x.it); ch += h
    }
    const inCenter = new Set(center); scored.forEach(x => { if (x.loud && center.includes(x.it)) inCenter.add(dealt[x.i]) })

    // rails: everything else, in the fair order, pictures kept (smaller), dealt to the shorter rail.
    const left = [], right = []
    let lh = 0, rh = 0
    dealt.forEach(it => {
      if (inCenter.has(it)) return
      const keepPic = !!(o.railPics && it.image && it.image.url)
      const card = Object.assign({}, it, keepPic ? { railPic: true, textOnly: false } : { image: null, textOnly: true })
      const h = hRail(card)
      const leftOpen = left.length < o.railMax, rightOpen = right.length < o.railMax
      let side = (lh <= rh) ? 'left' : 'right'
      if (side === 'left' && !leftOpen) side = rightOpen ? 'right' : null
      else if (side === 'right' && !rightOpen) side = leftOpen ? 'left' : null
      if (side === 'left') { left.push(card); lh += h }
      else if (side === 'right') { right.push(card); rh += h }
      else dropped.push({ item: it, why: 'overflow' })
    })

    const stats = {
      inCount: raw.length,
      dedupedCount: dd.dropped.length,
      centerCount: center.length,
      leftCount: left.length,
      rightCount: right.length,
      leftHeight: lh,
      rightHeight: rh,
      centerHeight: ch,
      centerTarget: Math.round(centerTarget),
      droppedCount: dropped.length,
      boostedCount: center.filter(x => x.boosted).length
    }
    return { center, left, right, dropped, stats }
  }

  const FILL_SORT = {
    sortEdition, picScore, estimateHeight,
    // the parts, exposed so tests and the UI can use them
    normTitle, titleOverlap, interleaveBySource, canonSort, DEFAULTS
  }

  if (typeof module !== 'undefined' && module.exports) module.exports = FILL_SORT
  else if (typeof window !== 'undefined') window.FILL_SORT = FILL_SORT
})()
