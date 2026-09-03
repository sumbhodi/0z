// lb-tm-card.js — THE TIMER CARD, inside the clock (Sum 2026-07-21: "great settings for timer,
// just no working timer — borrow numbers and buttons from stopwatch, replace laps with interval
// scroll").
// FOR HUMANS: tap a timer on the time-tools bar → a big card. The interval you're in fills the
//   card; start/stop and clear sit under it. Show the whole interval list, or just THIS and NEXT
//   stacked. More than one timer saved? Page between them with ‹ ›.
// FOR AI:
//   1. The phase maths is NOT reimplemented here — window.TIMER_ENGINE (lb-time.js) owns it, so
//      the bar and this card can never disagree about which interval is running.
//   2. Type is fitted by measuring (window.SW_FIT), same as the stopwatch.
//   3. ⚠️ DROPPED-CLICK RULE: renders 25×/sec — every DOM write goes through set().
//   4. clock-tm-disp = current | next | all — how much of the interval sequence the card shows.
;(function () {
  const J = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); if (v != null) return v } catch (_) {}
                        try { return typeof d === 'string' ? JSON.parse(d) : d } catch (_) { return d } }   // accepts a STRING default ('[]') or a VALUE default ([]) — never throws
  const ENG = () => window.TIMER_ENGINE
  const FIT = () => window.SW_FIT
  const pad = n => String(n).padStart(2, '0')
  const timers = () => { const v = J('clock-timers', []); return Array.isArray(v) ? v : [] }
  const disp = () => { const v = J('clock-tm-disp', 'next'); return ['current', 'next', 'all'].includes(v) ? v : 'next' }   // current | current+next | all

  function flat(ms) {
    ms = Math.max(0, ms)
    const cs = Math.floor(ms / 10) % 100, t = Math.floor(ms / 1000)
    return `${pad(Math.floor(t / 60))}:${pad(t % 60)}.${pad(cs)}`
  }
  const dur = p => (p.d + (p.unit === 'min' ? 'm' : 's'))

  let ov = null, el = {}, idx = 0
  const was = {}
  const set = (k, node, prop, v) => { if (was[k] !== v) { node[prop] = v; was[k] = v } }

  function build() {
    if (ov) return ov
    ov = document.createElement('div'); ov.className = 'sw-ov'
    ov.innerHTML = `<div class="sw-ov-card" role="dialog" aria-modal="true" aria-label="timer" tabindex="-1">
      <button class="sw-ov-x" aria-label="close">✕</button>
      <div class="tm-nav" id="tm-nav">
        <button class="tm-arrow" id="tm-prev" aria-label="previous timer">‹</button>
        <div class="tm-name" id="tm-name">timer</div>
        <button class="tm-arrow" id="tm-next" aria-label="next timer">›</button>
      </div>
      <div class="sw-top">
        <div class="sw-heads" id="tm-heads">
          <div class="sw-head"><small id="tm-phase">—</small><div class="sw-num" id="tm-num">00:00<span class="cs">.00</span></div></div>
        </div>
        <div class="sw-count" id="tm-step" hidden>1/1</div>
      </div>
      <div class="sw-btns">
        <button class="sw-btn step" id="tm-iprev" aria-label="previous interval">‹</button>
        <button class="sw-btn go" id="tm-go">start</button>
        <button class="sw-btn" id="tm-restart">restart</button>
        <button class="sw-btn step" id="tm-inext" aria-label="next interval">›</button>
      </div>
      <div class="tm-nap" id="tm-nap"><i>nap</i><button class="sw-btn nap" data-nap="20" aria-label="20 minute nap">20m</button><button class="sw-btn nap" data-nap="30" aria-label="30 minute nap">30m</button><button class="sw-btn nap" data-nap="90" aria-label="90 minute nap">90m</button></div>
      <div class="tm-next-row" id="tm-nextrow" hidden><i>next</i><span id="tm-nextval">—</span></div>
      <div class="sw-laps" id="tm-list"></div>
      <button class="sw-export" id="tm-export">👟 export to exercise</button>
    </div>`
    document.body.appendChild(ov)
    try { window.TT_NAV.mount(ov, 'timer') } catch (_) {}
    try { ov.querySelector('.sw-ov-card').appendChild(window.TT_NAV.addPanel('timer')) } catch (_) {}
    const q = s => ov.querySelector(s)
    el = { card: q('.sw-ov-card'), nav: q('#tm-nav'), name: q('#tm-name'), prev: q('#tm-prev'), next: q('#tm-next'),
           heads: q('#tm-heads'), phase: q('#tm-phase'), num: q('#tm-num'), step: q('#tm-step'),
           go: q('#tm-go'), restart: q('#tm-restart'), bprev: q('#tm-iprev'), bnext: q('#tm-inext'), nextRow: q('#tm-nextrow'), nextVal: q('#tm-nextval'), list: q('#tm-list'), exp: q('#tm-export') }
    q('.sw-ov-x').addEventListener('click', () => { hush(); close() })
    ov.addEventListener('mousedown', e => { if (e.target === ov) close() })
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && ov.classList.contains('open')) close() })
    el.prev.addEventListener('click', () => { const n = timers().length + 1; idx = (idx - 1 + n) % n; was.fit = null; paint() })
    el.next.addEventListener('click', () => { const n = timers().length + 1; idx = (idx + 1) % n; was.fit = null; paint() })
    // a looping "till dismissed" tone is silenced by ANY button here — that IS the dismiss.
    const hush = () => { try { window.TT_STOPTONE && window.TT_STOPTONE() } catch (_) {} }
    // pause is FORGIVING by design (Sum: "if you hit it and don't notice, oh no, longer plank")
    el.go.addEventListener('click', () => { hush(); const t = cur(); if (t && ENG()) { ENG().toggleTimer(t.id); paint() } })
    // all three jumps go to the TOP of an interval and preserve the run state
    const jump = d => { hush(); const t = cur(); if (t && ENG() && ENG().stepTimer) { ENG().stepTimer(t.id, t, d); was.list = null; paint() } }
    el.restart.addEventListener('click', () => jump(0))
    el.bprev.addEventListener('click', () => jump(-1))
    el.bnext.addEventListener('click', () => jump(1))
    // NAP CHIPS (wishlist r2 2026-07-23: "a nap preset, one tap"). one tap writes/updates the ONE
    // 'nap' timer — a single phase, bowl first then klaxon till dismissed — and starts it fresh.
    // never a second copy: 20 then 30 just re-aims the same nap.
    ov.querySelectorAll('[data-nap]').forEach(b => b.addEventListener('click', () => {
      hush()
      const mins = parseInt(b.dataset.nap, 10)
      const all = timers()
      const nap = { id: 'nap', label: 'nap', seq: [{ n: 'nap', d: mins, unit: 'min', plays: 'repeat', tone: ['bowl', 'klaxon'] }], unit: 'min', loop: false }
      const i = all.findIndex(x => x.id === 'nap')
      if (i >= 0) all[i] = nap; else all.push(nap)
      try { localStorage.setItem('clock-timers', JSON.stringify(all)) } catch (_) {}
      const r = J('clock-timer-run', {}); delete r.nap                       // clear any stale run…
      try { localStorage.setItem('clock-timer-run', JSON.stringify(r)) } catch (_) {}
      const eng = ENG(); if (eng) eng.toggleTimer('nap')                     // …so this STARTS it
      idx = all.findIndex(x => x.id === 'nap')
      was.fit = null; was.list = null; paint()
    }))
    // debounce the resize: a drag fires this continuously, and refitting mid-drag is what lets a
    // measure→layout→measure loop build up momentum. Settle first, then fit once.
    let rt = null
    el.exp.addEventListener('click', () => { hush()

      const t = cur(), eng = ENG(); if (!t || !eng) return
      const ph = eng.phases(t), ms = eng.seqMs(t)
      const total = ms.reduce((a, b) => a + b, 0)
      try {
        parent.OZ_EXPORT_EXERCISE({ min: total / 60000, startISO: new Date(Date.now() - total).toISOString(),
          name: t.label || '', intervals: ph.map((p, i) => ({ n: p.n, ms: ms[i] })), source: 'timer' })
      } catch (_) {}
      close()
    })
    window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { was.fit = null; paint() }, 90) })
    return ov
  }
  const cur = () => timers()[idx] || null
  // the last pager position is "＋ add" — a class on the card hides the timer body (see the CSS)
  function adding(all, title) {
    const on = idx >= all.length
    if (was.adding !== on) { el.card.classList.toggle('tt-adding', on); was.adding = on }
    if (!on) return false
    set('name', el.name, 'textContent', title)
    set('arrP', el.prev, 'hidden', all.length < 1)
    set('arrN', el.next, 'hidden', all.length < 1)
    return true
  }

  // fit the big number the same way the stopwatch does — measure, don't model
  function fit(nSteps) {
    const f = FIT(); if (!f) return
    const cardW = el.card.clientWidth; if (!cardW) return
    // Reserve the counter's ACTUAL box. Estimating it (a % of the card) under-reserved, and the
    // nowrap time overflowed straight through the counter. (Sum 2026-07-21: "1/2 overlaps hundredths".)
    const res = nSteps > 1 ? Math.round(cardW * 0.10) : 0
    const W = cardW - 40 - 96 - (res ? res + 22 : 0)
    const Wq = Math.round(W / 12) * 12   // quantise: a few px of jitter must not restart the fit
    const key = Wq + '|' + nSteps + '|' + disp()
    if (was.fit === key) return
    was.fit = key
    const nat = f.measure('<span>00:00</span><span class="cs">.00</span>', 'sw-num')
    const px = Math.max(28, Math.min(f.pxFor(nat, Wq), 340))
    el.num.style.fontSize = px + 'px'
    // /1.9 so three characters actually FIT the box (they were overflowing it)
    if (res) { el.step.style.width = res + 'px'; el.step.style.fontSize = Math.min(Math.round(px * 0.30), Math.round(res / 1.9)) + 'px' }
    const rNat = f.measure('<span class="n">rest</span><span class="t">00:00.00</span>', 'sw-lap sw-lap-measure')
    const lp = Math.max(18, Math.min(f.pxFor(rNat, Wq), Math.round(px * 0.62)))
    el.list.style.setProperty('--sw-lap-fs', lp + 'px')
    el.list.style.setProperty('--sw-lap-h', Math.round(lp * 1.45) + 'px')
    el.nextRow.style.setProperty('--tm-next-fs', Math.round(px * 0.42) + 'px')
  }

  function paint() {
    if (!ov || !ov.classList.contains('open')) return
    const all = timers()
    set('navH', el.nav, 'hidden', false)
    if (adding(all, 'new timer')) return
    const tm = cur(), eng = ENG(); if (!tm || !eng) return
    const st = eng.timerState(tm)
    const p = st.ph[st.order[st.step]] || { n: '', d: 0, unit: 'sec' }
    // header + paging
    set('navH', el.nav, 'hidden', false)
    set('name', el.name, 'textContent', tm.label || 'timer')
    set('arrH', el.prev, 'hidden', all.length < 2)
    set('arrH2', el.next, 'hidden', all.length < 2)
    // the interval you're in, filling the card
    set('phase', el.phase, 'textContent', st.done ? 'done' : (p.n || 'interval'))
    const t = flat(st.left)
    set('num', el.num, 'innerHTML', `${t.slice(0, 5)}<span class="cs">${t.slice(5)}</span>`)
    set('stepH', el.step, 'hidden', st.total < 2)
    if (st.total > 1) set('stepV', el.step, 'textContent', `${st.step + 1}/${st.total}`)
    set('go', el.go, 'textContent', st.running ? 'pause' : (st.paused ? 'resume' : (st.done ? 'again' : 'start')))
    if (was.run !== st.running) { el.go.classList.toggle('on', st.running); was.run = st.running }
    set('prevD', el.bprev, 'disabled', st.step <= 0)
    set('nextD', el.bnext, 'disabled', st.step >= st.total - 1)
    fit(st.total)
    // three display modes: just the current interval · current + next (stacked) · the whole list
    const mode = disp()
    set('listH', el.list, 'hidden', mode !== 'all')
    set('nextH', el.nextRow, 'hidden', mode !== 'next')
    if (mode === 'next') {
      const nx = st.step + 1 < st.total ? st.ph[st.order[st.step + 1]] : (tm.loop ? st.ph[st.order[0]] : null)
      set('nextV', el.nextVal, 'textContent', nx ? `${nx.n ? nx.n + ' · ' : ''}${dur(nx)}` : '—')
    } else if (mode === 'all') paintList(tm, st)
  }

  function paintList(tm, st) {
    let html = ''
    st.order.forEach((oi, i) => {
      const p = st.ph[oi]
      const on = i === st.step && st.running
      html += `<div class="sw-lap${on ? ' tm-on' : ''}"><span class="n">${p.n || (i + 1)}</span>` +
              `<span class="t">${on ? flat(st.left) : dur(p)}</span></div>`
    })
    if (was.list !== html) { el.list.innerHTML = html; was.list = html }
  }

  function open(id) {
    build()
    const all = timers()
    if (id) { const i = all.findIndex(t => t.id === id); if (i >= 0) idx = i }
    if (idx > all.length) idx = 0   // idx === length is the add slot
    ov.classList.add('open'); try { window.TT_NAV_PLACE && window.TT_NAV_PLACE(ov) } catch (_) {}; was.fit = null; was.list = null; paint(); el.card.focus()
  }
  function close() { if (ov) ov.classList.remove('open') }
  window.TM_CARD = { open, close }

  setInterval(paint, 40)
})()
