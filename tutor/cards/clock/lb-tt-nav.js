// lb-tt-nav.js — THE TOOL NAV shared by all four time-tool cards (Sum 2026-07-21:
// "we need to be able to nav from stopwatch to timer in card").
// One slim row at the top of every card: ‹  TOOL NAME  ›  — walking the four tools in SETTINGS
// ORDER (alarm → countdown → timer → stopwatch), wrapping at both ends. Tools switched OFF in
// clock-time-on are skipped, so the arrows never land on something the user has hidden.
;(function () {
  const ORDER = ['alarm', 'countdown', 'timer', 'stopwatch']
  const LABEL = { alarm: 'alarm', countdown: 'countdown', timer: 'timer', stopwatch: 'stopwatch' }
  const J = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); if (v != null) return v } catch (_) {}
                        try { return typeof d === 'string' ? JSON.parse(d) : d } catch (_) { return d } }   // accepts a STRING default ('[]') or a VALUE default ([]) — never throws
  // which tools are live: toggled on AND actually openable (their card bean loaded)
  const CARD = t => ({ alarm: window.AL_CARD, countdown: window.CD_CARD, timer: window.TM_CARD, stopwatch: window.SW_CARD })[t]
  function live() {
    const on = J('clock-time-on', null)
    const kinds = Array.isArray(on) ? on : ORDER
    return ORDER.filter(t => kinds.includes(t) && CARD(t))
  }
  function go(from, dir) {
    const l = live()
    if (l.length < 2) return
    const i = l.indexOf(from)
    const next = l[((i < 0 ? 0 : i) + dir + l.length) % l.length]
    const cur = CARD(from), nxt = CARD(next)
    try { cur && cur.close && cur.close() } catch (_) {}
    try { nxt && nxt.open && nxt.open() } catch (_) {}
  }
  // WINGS, not a row (Sum 2026-07-21: "remove tiny arrow at top, make huge, in middle of card so
  // it looks like next last — peep at the koan card for consistency"). Same shape the koan/headline
  // overlay uses: buttons that straddle the card's edges, fixed at mid-height. Mounted on the
  // OVERLAY (siblings of the card), never inside it.
  function mount(ov, tool) {
    if (!ov || ov.querySelector('.tt-wing')) return
    const l = live()
    const mk = (cls, glyph, dir, label) => {
      const b = document.createElement('button')
      b.className = 'tt-wing ' + cls; b.textContent = glyph; b.setAttribute('aria-label', label)
      if (l.length < 2) b.hidden = true
      b.addEventListener('click', e => { e.stopPropagation(); go(tool, dir) })
      return b
    }
    ov.insertBefore(mk('tt-wing-prev', '‹', -1, 'previous tool'), ov.firstChild)
    ov.appendChild(mk('tt-wing-next', '›', 1, 'next tool'))
    place(ov)
    let rt = null
    window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => place(ov), 90) })
  }
  // ⚠️ Do NOT re-state the card's width in CSS. Duplicating a dimension in two places is exactly
  // how the counter reserve drifted earlier — measure the card and put the wings on its edges.
  function place(ov) {
    const card = ov && ov.querySelector('.sw-ov-card'); if (!card) return
    const r = card.getBoundingClientRect(); if (!r.width) return
    const prev = ov.querySelector('.tt-wing-prev'), next = ov.querySelector('.tt-wing-next')
    if (prev) prev.style.left = r.left + 'px'
    if (next) next.style.left = r.right + 'px'
  }
  window.TT_NAV_PLACE = place

  // THE ADD SLOT (Sum 2026-07-21: "I want add alarm / add timer / add countdown on the card as
  // LAST in list, or showing if none saved"). The item pager runs over n+1 positions — page past
  // the last saved one and you land on "＋ add".
  //
  // It does NOT build a form. The studio already owns creating and editing; a second editor on the
  // card would be two sources of truth for the same record. So this hands off: it asks the shell to
  // flip the clock's iframe to its settings page (see app-card.js) and leaves a focus hint so
  // settings can scroll to the right group.
  const NOUN = { alarm: 'an alarm', countdown: 'a countdown', timer: 'a timer', stopwatch: 'a stopwatch' }
  function openSettings(tool) {
    try { localStorage.setItem('clock-settings-focus', tool) } catch (_) {}
    try { parent.postMessage({ type: 'oz-open-settings', card: 'clock', focus: tool }, '*') } catch (_) {}
  }
  function addPanel(tool) {
    const d = document.createElement('div')
    d.className = 'tt-add'
    const b = document.createElement('button')
    b.type = 'button'; b.className = 'tt-add-btn'
    b.textContent = '＋  add ' + (NOUN[tool] || tool)
    b.addEventListener('click', e => { e.stopPropagation(); openSettings(tool) })
    d.appendChild(b)
    return d
  }

  window.TT_NAV = { mount, go, live, ORDER, addPanel, openSettings }
})()
