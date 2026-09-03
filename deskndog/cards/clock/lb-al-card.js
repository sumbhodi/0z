// lb-al-card.js — THE ALARM CARD (Sum 2026-07-21). The alarm time, big; how long until it fires
// underneath; and the switch that arms it. Page between saved alarms with ‹ ›.
// FOR AI: reads clock-alarms (built by cs-time.js) and writes only `on` (the arm switch) — every
//   other field is edited in settings, so this card can't disagree with the studio. The firing
//   engine is lb-alarm.js; this is display + arm only.
;(function () {
  const J = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); if (v != null) return v } catch (_) {}
                        try { return typeof d === 'string' ? JSON.parse(d) : d } catch (_) { return d } }   // accepts a STRING default ('[]') or a VALUE default ([]) — never throws
  const S = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)) } catch (_) {} }
  const FIT = () => window.SW_FIT
  const list = () => { const v = J('clock-alarms', []); return Array.isArray(v) ? v : [] }
  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const pad = n => String(n).padStart(2, '0')

  // the next time THIS alarm fires (same rules the bar uses: one-off date · set days · daily)
  function nextFire(a) {
    const now = new Date()
    const [h, m] = String(a.time || '0:0').split(':').map(Number)
    if (a.date) { const d = new Date(`${a.date}T${pad(h)}:${pad(m)}:00`); return d > now ? d : null }
    if (a.days && a.days.length) {
      for (let i = 0; i < 8; i++) {
        const d = new Date(now); d.setDate(now.getDate() + i); d.setHours(h, m, 0, 0)
        if (a.days.includes(d.getDay()) && d > now) return d
      }
      return null
    }
    const d = new Date(now); d.setHours(h, m, 0, 0); if (d <= now) d.setDate(d.getDate() + 1); return d
  }
  const h12 = a => { const [h, m] = String(a.time || '0:0').split(':').map(Number)
    return { t: `${h % 12 || 12}:${pad(m)}`, ampm: h < 12 ? 'AM' : 'PM' } }
  function until(ms) {
    if (ms == null) return ''
    const s = Math.floor(ms / 1000), d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60)
    if (d > 0) return `in ${d}d ${h}h`
    if (h > 0) return `in ${h}h ${m}m`
    return `in ${m}m`
  }

  let ov = null, el = {}, idx = 0
  const was = {}
  const set = (k, node, prop, v) => { if (was[k] !== v) { node[prop] = v; was[k] = v } }

  function build() {
    if (ov) return ov
    ov = document.createElement('div'); ov.className = 'sw-ov'
    ov.innerHTML = `<div class="sw-ov-card" role="dialog" aria-modal="true" aria-label="alarm" tabindex="-1">
      <button class="sw-ov-x" aria-label="close">✕</button>
      <div class="tm-nav" id="al-nav">
        <button class="tm-arrow" id="al-prev" aria-label="previous alarm">‹</button>
        <div class="tm-name" id="al-name">alarm</div>
        <button class="tm-arrow" id="al-next" aria-label="next alarm">›</button>
      </div>
      <div class="sw-top">
        <div class="sw-heads" id="al-heads">
          <div class="sw-head"><small id="al-when">—</small><div class="sw-num" id="al-num">7:00<span class="cs" id="al-ampm">AM</span></div></div>
        </div>
      </div>
      <div class="al-until" id="al-until"></div>
      <div class="sw-btns"><button class="sw-btn go" id="al-arm">armed</button><button class="sw-btn" id="al-test">test</button></div>
      <div class="al-detail" id="al-detail"></div>
    </div>`
    document.body.appendChild(ov)
    try { window.TT_NAV.mount(ov, 'alarm') } catch (_) {}
    try { ov.querySelector('.sw-ov-card').appendChild(window.TT_NAV.addPanel('alarm')) } catch (_) {}
    const q = s => ov.querySelector(s)
    el = { card: q('.sw-ov-card'), nav: q('#al-nav'), name: q('#al-name'), prev: q('#al-prev'), next: q('#al-next'),
           heads: q('#al-heads'), when: q('#al-when'), num: q('#al-num'), ampm: q('#al-ampm'),
           until: q('#al-until'), arm: q('#al-arm'), test: q('#al-test'), detail: q('#al-detail') }
    q('.sw-ov-x').addEventListener('click', close)
    ov.addEventListener('mousedown', e => { if (e.target === ov) close() })
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && ov.classList.contains('open')) close() })
    el.prev.addEventListener('click', () => { const n = list().length + 1; idx = (idx - 1 + n) % n; was.fit = null; paint() })
    el.next.addEventListener('click', () => { const n = list().length + 1; idx = (idx + 1) % n; was.fit = null; paint() })
    // the ONLY thing this card writes — everything else is edited in the studio
    el.arm.addEventListener('click', () => {
      const a = cur(); if (!a) return
      const all = list().map(x => x.id === a.id ? { ...x, on: x.on === false } : x)
      S('clock-alarms', all); paint()
    })
    // the TRUST BUTTON — ring THIS alarm's real ladder in 10 seconds (lb-alarm.js does the firing).
    // paint() never touches this button, so the countdown text can't be clobbered mid-tick.
    let testTick = null
    el.test.addEventListener('click', () => {
      if (testTick) return
      const a = cur(); if (!a || !window.ALARM_TEST) return
      window.ALARM_TEST(a)
      let n = 10
      el.test.textContent = 'rings in 10'
      testTick = setInterval(() => {
        n--
        if (n <= 0) { clearInterval(testTick); testTick = null; el.test.textContent = 'test' }
        else el.test.textContent = 'rings in ' + n
      }, 1000)
    })
    let rt = null
    window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { was.fit = null; paint() }, 90) })
    return ov
  }
  const cur = () => list()[idx] || null
  // the last pager position is "＋ add" — a class on the card hides the alarm body (see the CSS)
  function adding(all, title) {
    const on = idx >= all.length
    if (was.adding !== on) { el.card.classList.toggle('tt-adding', on); was.adding = on }
    if (!on) return false
    set('name', el.name, 'textContent', title)
    set('arrP', el.prev, 'hidden', all.length < 1)
    set('arrN', el.next, 'hidden', all.length < 1)
    return true
  }

  function fit() {
    const f = FIT(); if (!f) return
    const cardW = el.card.clientWidth; if (!cardW) return
    const W = Math.round((cardW - 40) / 12) * 12
    if (was.fit === W) return
    was.fit = W
    const nat = f.measure('<span>12:00</span><span class="cs">AM</span>', 'sw-num')
    const px = Math.max(28, Math.min(f.pxFor(nat, W), 340))
    el.num.style.fontSize = px + 'px'
  }

  function paint() {
    if (!ov || !ov.classList.contains('open')) return
    const all = list()
    if (adding(all, 'new alarm')) return
    const a = cur(); if (!a) return
    set('armH', el.arm, 'hidden', false)
    set('name', el.name, 'textContent', a.label || 'alarm')
    set('arrP', el.prev, 'hidden', all.length < 2)
    set('arrN', el.next, 'hidden', all.length < 2)
    const t = h12(a)
    set('num', el.num, 'textContent', t.t)
    el.num.appendChild(el.ampm)                       // keep the AM/PM span attached after a text set
    set('ampm', el.ampm, 'textContent', t.ampm)
    const armed = a.on !== false
    const nf = armed ? nextFire(a) : null
    set('when', el.when, 'textContent',
      a.date ? 'once' : (a.days && a.days.length ? a.days.map(d => DAYS[d]).join(' · ') : 'every day'))
    set('until', el.until, 'textContent', !armed ? 'off' : (nf ? until(nf - Date.now()) : 'passed'))
    set('arm', el.arm, 'textContent', armed ? 'armed' : 'off')
    if (was.armed !== armed) { el.arm.classList.toggle('on', !armed); was.armed = armed }
    const snds = Array.isArray(a.sound) ? a.sound.join(' → ') : (a.sound || '')
    const dis = Array.isArray(a.dismiss) ? a.dismiss.join(' + ') : (a.dismiss || '')
    set('detail', el.detail, 'textContent',
      [snds, a.plays === 'once' ? 'plays once' : 'till dismissed', dis && ('dismiss: ' + dis),
       a.snoozeMax ? `snooze ${a.snoozeMin}m × ${a.snoozeMax}` : 'no snooze'].filter(Boolean).join('   ·   '))
    fit()
  }

  function open(id) {
    build()
    const all = list()
    if (id) { const i = all.findIndex(x => x.id === id); if (i >= 0) idx = i }
    if (idx > all.length) idx = 0   // idx === length is the add slot
    ov.classList.add('open'); try { window.TT_NAV_PLACE && window.TT_NAV_PLACE(ov) } catch (_) {}; was.fit = null; paint(); el.card.focus()
  }
  function close() { if (ov) ov.classList.remove('open') }
  window.AL_CARD = { open, close }
  setInterval(paint, 1000)   // minutes-scale — a second is plenty
})()
