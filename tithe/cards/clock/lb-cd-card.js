// lb-cd-card.js — THE COUNTDOWN CARD (Sum 2026-07-21). The time left until a date you're counting
// to, filling the card. No start/stop — a countdown to a date is always running; the only controls
// are which countdown you're looking at.
// FOR AI: reads clock-countdowns (built by cs-time.js) — [{ id, label, target, time, units[] }].
//   Units come from the countdown itself (the "show it in" picker), so the SAME breakdown the bar
//   uses shows here. Type is fitted by measuring, same as the stopwatch. Guarded writes only.
;(function () {
  const J = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); if (v != null) return v } catch (_) {}
                        try { return typeof d === 'string' ? JSON.parse(d) : d } catch (_) { return d } }   // accepts a STRING default ('[]') or a VALUE default ([]) — never throws
  const FIT = () => window.SW_FIT
  const list = () => { const v = J('clock-countdowns', []); return Array.isArray(v) ? v : [] }

  // the same unit breakdown lb-time.js shows on the bar — largest chosen unit down, consuming the rest
  const ORDER = ['years', 'months', 'weeks', 'days', 'hours', 'minutes', 'seconds']
  const UNIT_MS = { years: 31557600000, months: 2629800000, weeks: 604800000, days: 86400000, hours: 3600000, minutes: 60000, seconds: 1000 }
  const pad = n => String(n).padStart(2, '0')
  function parts(ms, c) {
    if (ms < 0) ms = 0
    const units = Array.isArray(c.units) ? c.units : (c.unit && c.unit !== 'auto' ? [c.unit] : [])
    const sel = ORDER.filter(u => units.includes(u))
    if (!sel.length) {   // no units picked → a sensible clock
      const s = Math.floor(ms / 1000), d = Math.floor(s / 86400)
      return d > 0 ? [[d, 'days'], [Math.floor(s % 86400 / 3600), 'hours'], [Math.floor(s % 3600 / 60), 'min']]
                   : [[Math.floor(s / 3600), 'hours'], [Math.floor(s % 3600 / 60), 'min'], [s % 60, 'sec']]
    }
    let rem = ms
    return sel.map((u, i) => {
      const val = i === sel.length - 1 ? Math.round(rem / UNIT_MS[u]) : Math.floor(rem / UNIT_MS[u])
      rem -= val * UNIT_MS[u]
      return [val, val === 1 ? u.replace(/s$/, '') : u]
    })
  }
  const when = c => new Date(c.target + 'T' + (c.time || '00:00') + ':00')

  let ov = null, el = {}, idx = 0
  const was = {}
  const set = (k, node, prop, v) => { if (was[k] !== v) { node[prop] = v; was[k] = v } }

  function build() {
    if (ov) return ov
    ov = document.createElement('div'); ov.className = 'sw-ov'
    ov.innerHTML = `<div class="sw-ov-card" role="dialog" aria-modal="true" aria-label="countdown" tabindex="-1">
      <button class="sw-ov-x" aria-label="close">✕</button>
      <div class="tm-nav" id="cd-nav">
        <button class="tm-arrow" id="cd-prev" aria-label="previous countdown">‹</button>
        <div class="tm-name" id="cd-name">countdown</div>
        <button class="tm-arrow" id="cd-next" aria-label="next countdown">›</button>
      </div>
      <div class="cd-units" id="cd-units"></div>
      <div class="cd-target" id="cd-target"></div>
    </div>`
    document.body.appendChild(ov)
    try { window.TT_NAV.mount(ov, 'countdown') } catch (_) {}
    try { ov.querySelector('.sw-ov-card').appendChild(window.TT_NAV.addPanel('countdown')) } catch (_) {}
    const q = s => ov.querySelector(s)
    el = { card: q('.sw-ov-card'), nav: q('#cd-nav'), name: q('#cd-name'), prev: q('#cd-prev'), next: q('#cd-next'),
           units: q('#cd-units'), target: q('#cd-target') }
    q('.sw-ov-x').addEventListener('click', close)
    ov.addEventListener('mousedown', e => { if (e.target === ov) close() })
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && ov.classList.contains('open')) close() })
    el.prev.addEventListener('click', () => { const n = list().length + 1; idx = (idx - 1 + n) % n; was.fit = null; paint() })
    el.next.addEventListener('click', () => { const n = list().length + 1; idx = (idx + 1) % n; was.fit = null; paint() })
    let rt = null
    window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { was.fit = null; paint() }, 90) })
    return ov
  }
  const cur = () => list()[idx] || null
  // the last pager position is "＋ add" — a class on the card hides the countdown body (see the CSS)
  function adding(all, title) {
    const on = idx >= all.length
    if (was.adding !== on) { el.card.classList.toggle('tt-adding', on); was.adding = on }
    if (!on) return false
    set('name', el.name, 'textContent', title)
    set('arrP', el.prev, 'hidden', all.length < 1)
    set('arrN', el.next, 'hidden', all.length < 1)
    return true
  }

  // fit the row of unit blocks to the card — more units on the row ⇒ each one smaller
  function fit(nUnits) {
    const f = FIT(); if (!f) return
    const cardW = el.card.clientWidth; if (!cardW) return
    const W = Math.round((cardW - 40) / 12) * 12
    const key = W + '|' + nUnits
    if (was.fit === key) return
    was.fit = key
    const per = (W - 24 * (nUnits - 1)) / Math.max(1, nUnits)
    const nat = f.measure('<span class="cd-n">00</span>', 'cd-unit')
    const px = Math.max(24, Math.min(f.pxFor(nat, per * 0.92), 300))
    el.units.style.setProperty('--cd-fs', px + 'px')
  }

  function paint() {
    if (!ov || !ov.classList.contains('open')) return
    const all = list()
    if (adding(all, 'new countdown')) return
    const c = cur(); if (!c) return
    set('name', el.name, 'textContent', c.label || 'countdown')
    set('arrP', el.prev, 'hidden', all.length < 2)
    set('arrN', el.next, 'hidden', all.length < 2)
    const t = when(c), left = t - Date.now()
    const ps = parts(left, c)
    // one block per unit: the number over its name
    const html = ps.map(([v, u]) => `<div class="cd-unit"><span class="cd-n">${v.toLocaleString()}</span><small>${u}</small></div>`).join('')
    if (was.units !== html) { el.units.innerHTML = html; was.units = html }
    fit(ps.length)
    const arrived = left <= 0
    set('tgt', el.target, 'textContent', arrived ? 'here.' :
      t.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) +
      (c.time && c.time !== '00:00' ? ' · ' + c.time : ''))
    set('done', el.units, 'className', 'cd-units' + (arrived ? ' arrived' : ''))
  }

  function open(id) {
    build()
    const all = list()
    if (id) { const i = all.findIndex(x => x.id === id); if (i >= 0) idx = i }
    if (idx > all.length) idx = 0   // idx === length is the add slot
    ov.classList.add('open'); try { window.TT_NAV_PLACE && window.TT_NAV_PLACE(ov) } catch (_) {}; was.fit = null; was.units = null; paint(); el.card.focus()
  }
  function close() { if (ov) ov.classList.remove('open') }
  window.CD_CARD = { open, close }
  setInterval(paint, 250)   // a countdown to a date doesn't need 25fps
})()
