// zoom.js — EAT ME / DRINK ME (Alice in Wonderland, public domain). grow + shrink the
// whole UI: font · sliders · buttons · the dog — all of it. window.zoomBy(step) from the
// topbar's 🍰 / 🧪 buttons.
//
// WHY TRANSFORM, NOT body.zoom: CSS `zoom` on an ANCESTOR mis-sizes descendant iframes in
// WebKit — the iframe's internal viewport doesn't match its rendered box, so preview/ban/
// monaco letterbox in WHITE at any zoom ≠ 1. `transform: scale()` scales the whole stage as
// ONE composited layer: iframes lay out at natural size, then the layer scales — they FILL.
// (this cost a whole session to pin down — the tell was toto_zoom=0.9 in localStorage.)
//
// the stage is #zoom-root (topbar · subbar · desk). overlays live on <body>, OUTSIDE it, so
// menus/toasts/modals stay viewport-pinned (transform would re-anchor their fixed positions).

function applyZoom() {
  const z = parseFloat(localStorage.getItem('toto_zoom') || '1')
  const root = document.getElementById('zoom-root')
  if (!root) return
  // size the stage to 100/z (in viewport units — they auto-track window resizes), so scaling
  // it by z lands it exactly on the viewport: (100/z)vw · z = 100vw. origin top-left.
  root.style.width = 100 / z + 'vw'
  // 2 Sep 2026 — 100vh on iOS is the LARGEST viewport (browser toolbars collapsed). With the toolbars showing the stage's bottom
  //    56–80px sat under Chrome's bar: Sum, on his iPhone — "the bottom of the screen keeps getting cut off… the controls on
  //    the bottom of toto and the arcade card scroll back off the bottom" (the desk rubber-banded them into view, then the
  //    page snapped back). dvh tracks the visible height as the toolbars come and go. vh stays for engines without it.
  const vhUnit = (window.CSS && CSS.supports && CSS.supports('height', '100dvh')) ? 'dvh' : 'vh'
  root.style.height = 100 / z + vhUnit
  root.style.transform = z === 1 ? 'none' : 'scale(' + z + ')'
  // ── THE WINDOW FLOOR (Sum 2026-08-29: "set a realistic min on window… big enough to not cover
  //    the stop button, so min width will have to scale with zoom") — the stage never lays out
  //    under 360×480 (#zoom-root's min in base.css, in the stage's OWN px, so eat-me multiplies
  //    it for free). This is the only place that knows when the floor is actually hit — a plain
  //    body{overflow:auto} grew scrollbars at drink-me for a stage that FIT (the layout box is
  //    143vw at z=0.7; Chromium counts it) — so the body scrolls ONLY while clamped.
  // 2 Sep 2026 — the floor is a WINDOW floor. In the hull (≤800px, skin/mobile.css) the stage's min-width is 0 — the glass is
  //    the floor — so the clamp never applies there; an 'auto' overflow on a phone was the horizontal pan Sum saw as the desk
  //    bleeding off the right of his iPhone.
  const hull = (() => { try { return window.matchMedia && window.matchMedia('(max-width: 800px)').matches } catch (_) { return false } })()
  document.body.style.overflowX = (!hull && window.innerWidth / z < 360) ? 'auto' : ''
  document.body.style.overflowY = (!hull && window.innerHeight / z < 480) ? 'auto' : ''
}
window.addEventListener('resize', applyZoom)   // the clamp state changes with the window, not just the dial

window.zoomBy = function (step) {
  let z = parseFloat(localStorage.getItem('toto_zoom') || '1') + step
  z = Math.max(0.7, Math.min(2.0, Math.round(z * 100) / 100))   // drink down to 0.7, eat up to 2.0 — WCAG's 200% low-vision bar (the stage REFLOWS at 100/z, so nothing clips)
  localStorage.setItem('toto_zoom', String(z))
  applyZoom()
}

applyZoom()
