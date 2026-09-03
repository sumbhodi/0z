// scan.js — OZ_SCAN: the switch-access / scanning layer (Sum 2026-07-11). The ADA input model for people who
// can't drive a mouse/keyboard: auto-cycle a highlight over the buttons in a card, one press to pick. Works with
// a JOYSTICK (its 4 directions = arrows, its button = space/enter), a SWITCH, or just the keyboard. Self-contained
// — no framework, no 0z internals; drop it on ANY card by handing it a container. Built for tiptap, stripped for
// Monaco. Standalone-ready.
//   auto-scan: a ring walks the options on a timer · SPACE/ENTER picks the ringed one · ← → ↑ ↓ step manually
//   (pauses the auto-walk) · ESC stops. the ring is one amber outline; picking clicks it + re-reads the card.
;(function () {
  if (window.OZ_SCAN) return
  if (!document.getElementById('oz-scan-style')) {
    const s = document.createElement('style'); s.id = 'oz-scan-style'
    s.textContent = `
      .oz-scan-on { outline: 4px solid var(--mc-amber, #ffb000) !important; outline-offset: 2px !important;
        box-shadow: 0 0 0 6px rgba(255,176,0,.35) !important; border-radius: 7px !important; position: relative; z-index: 6; }
      .oz-scanning { cursor: default; }
      .oz-scan-badge { position: fixed; z-index: 100050; bottom: 14px; left: 50%; transform: translateX(-50%);
        background: #16130a; color: var(--mc-amber, #ffb000); border: 1px solid var(--mc-amber, #ffb000); border-radius: 10px;
        padding: 8px 16px; font: 700 var(--fs-ui, 20px)/1 system-ui; box-shadow: 0 8px 24px rgba(0,0,0,.6); pointer-events: none; }`
    document.head.appendChild(s)
  }
  let A = null   // the active scan session

  const scannable = c => Array.from(c.querySelectorAll('button, [role="button"], a[href], input:not([type="hidden"]), select, textarea, [data-scan], [tabindex]'))
    .filter(el => el.offsetParent !== null && !el.disabled && el.getAttribute('aria-hidden') !== 'true' && el.offsetWidth > 0)

  function paint() {
    if (!A) return
    A.els.forEach((el, i) => el.classList.toggle('oz-scan-on', i === A.idx))
    const cur = A.els[A.idx]; if (cur) try { cur.scrollIntoView({ block: 'nearest', inline: 'nearest' }) } catch (_) {}
  }
  function reread() { if (A) { const cur = A.els[A.idx]; A.els = scannable(A.container); A.idx = Math.max(0, cur ? A.els.indexOf(cur) : 0); if (A.idx < 0) A.idx = 0; paint() } }
  function step(d) { if (A && A.els.length) { A.idx = (A.idx + d + A.els.length) % A.els.length; paint() } }
  function pause() { if (A && A.timer) { clearInterval(A.timer); A.timer = null } }
  function resume() { if (A && !A.timer && A.speed > 0) A.timer = setInterval(() => step(1), A.speed) }
  function pick() {
    if (!A) return; const cur = A.els[A.idx]; if (!cur) return
    try { cur.focus() } catch (_) {}
    cur.click()
    setTimeout(reread, 60)   // the pick may have changed the card — re-read the options
  }
  function start(container, opts) {
    stop(); opts = opts || {}
    A = { container, els: scannable(container), idx: 0, timer: null, speed: opts.speed || 1400 }
    if (!A.els.length) { A = null; return false }
    container.classList.add('oz-scanning'); paint(); resume()
    A.badge = document.createElement('div'); A.badge.className = 'oz-scan-badge'
    A.badge.textContent = '⇄ scan — SPACE picks · arrows step · ESC off'; document.body.appendChild(A.badge)
    A.keyh = e => {
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); pick() }
      else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); e.stopPropagation(); pause(); step(1) }
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); e.stopPropagation(); pause(); step(-1) }
      else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); stop() }
    }
    document.addEventListener('keydown', A.keyh, true)
    return true
  }
  function stop() {
    if (!A) return
    pause(); A.els.forEach(el => el.classList.remove('oz-scan-on'))
    A.container.classList.remove('oz-scanning')
    document.removeEventListener('keydown', A.keyh, true)
    if (A.badge) A.badge.remove()
    A = null
  }
  window.OZ_SCAN = {
    start, stop, step, pick,
    toggle: (container, opts) => (A && A.container === container) ? (stop(), false) : start(container, opts),
    isOn: c => !!A && (!c || A.container === c),
    setSpeed: ms => { if (A) { A.speed = ms; pause(); resume() } },   // dial it slower/faster
  }
})()
