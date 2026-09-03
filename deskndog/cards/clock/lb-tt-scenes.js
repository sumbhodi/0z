// lb-tt-scenes.js — THE FILM STRIP (the traveler's painted frames on the clock)
// FOR HUMANS: on a jump, each painted frame takes ONE time digit's seat —
//   square, digit-height — and the unpainted digits keep ticking beside it.
//   the time becomes the scene one square at a time. click a frame and it
//   fills the view, caption underneath; click anywhere to put it back.
//   coming home restores the time.
// FOR AI:
//   1. window.TT_SCENES = { show(date), refresh(date), hide(), showImage } —
//      called by lb-timejump.js (dress), poked by shell/oz-ttscenes.js.
//   2. the shelf is parent.TT_STORE (IndexedDB in the shell — same origin,
//      the parent.OZ_OPEN road). no store, no frames — degrades silent.
//   3. slot N sits in digit N (h0 h1 m0 m1). FOUR frames max + one overlay
//      img — the webview never holds more than five decodes (RAM law).

;(function () {
  const store = () => { try { return window.parent && window.parent.TT_STORE } catch (_) { return null } }
  // frame N takes a DIGIT's seat, filling from the RIGHT (Sum 2026-07-18: "opposite") —
  // the restless last minute-digit yields first; the steady hour holds out longest.
  const DIGITS = ['m1', 'm0', 'h1', 'h0']

  let ov = null
  let seatH = 0, seatW = 0   // the digit seat's exact footprint, measured while one is still VISIBLE —
                             // a hidden digit measures 0. the frame wears the digit's own box: the square
                             // image crops a little at the sides (cover) until expanded (Sum 2026-07-18).

  function hide() {
    document.querySelectorAll('.tt-frame').forEach(f => f.remove())
    DIGITS.forEach(id => { const d = document.getElementById(id); if (d) d.style.display = '' })
    if (ov) { ov.remove(); ov = null }
  }

  // ONE big view for any picture (a frame, the time map…) — click anywhere puts it away
  function showImage(src, caption, credit, askSlot) {
    if (ov) ov.remove()
    ov = document.createElement('div')
    ov.className = 'tt-ov'
    const img = document.createElement('img')
    img.className = 'tt-ov-img'; img.src = src; img.alt = caption || ''
    const cap = document.createElement('div')
    cap.className = 'tt-ov-cap'
    cap.textContent = caption || ''
    const cred = document.createElement('div')
    cred.className = 'tt-ov-credit'
    cred.textContent = credit || 'painted by the traveler — from the notes, not the negatives'
    ov.append(img, cap, cred)
    // the ASK (Sum 2026-07-20: "with each of the 4 pics, chances to learn more") — a real
    // turn to the traveler about THIS frame; his persona knows the 🎞 knock and goes deeper.
    if (askSlot && window.parent && window.parent.ozAskBot) {
      const ask = document.createElement('button')
      ask.className = 'tt-ov-ask'
      ask.textContent = 'ask about this'
      ask.addEventListener('click', e => {
        e.stopPropagation()
        try { window.parent.ozAskBot('timetravel', `🎞 (frame ${askSlot}, "${(caption || 'uncaptioned').slice(0, 90)}") — tell me more about this one.`) } catch (_) {}
        ov.remove(); ov = null
      })
      ov.appendChild(ask)
    }
    ov.addEventListener('click', () => { ov.remove(); ov = null })
    document.body.appendChild(ov)
  }

  // THE GALLERY (Sum 2026-07-20: "a little gallery on that card with scroll so as you talk
  // you can ask for more") — expanding a frame opens the whole date's shelf as a scrollable
  // column, the clicked one scrolled to. new frames (ask-about-this, a story beat) append
  // live while it's open. each picture keeps its own caption + "ask about this".
  let galleryDate = null
  async function showGallery(date, focusSlot) {
    const st = store()
    if (!st) return
    let recs = []
    try { recs = await st.list(date) } catch (_) { return }
    if (!recs.length) return
    if (ov) ov.remove()
    galleryDate = date
    ov = document.createElement('div')
    ov.className = 'tt-ov tt-gallery'
    const col = document.createElement('div')
    col.className = 'tt-gal-col'
    col.addEventListener('click', e => e.stopPropagation())   // clicks inside scroll, don't close
    let focusEl = null
    recs.forEach(rec => {
      const fig = document.createElement('figure')
      fig.className = 'tt-gal-fig'
      const img = document.createElement('img')
      img.className = 'tt-gal-img'; img.src = rec.full; img.alt = rec.caption || ''
      const cap = document.createElement('figcaption')
      cap.className = 'tt-gal-cap'; cap.textContent = rec.caption || ''
      fig.append(img, cap)
      if (window.parent && window.parent.ozAskBot) {
        const ask = document.createElement('button')
        ask.className = 'tt-ov-ask'; ask.textContent = 'ask about this'
        ask.addEventListener('click', e => {
          e.stopPropagation()
          try { window.parent.ozAskBot('timetravel', `🎞 (frame ${rec.slot}, "${(rec.caption || 'this one').slice(0, 90)}") — tell me more about this one.`) } catch (_) {}
        })
        fig.appendChild(ask)
      }
      col.appendChild(fig)
      if (rec.slot === focusSlot) focusEl = fig
    })
    ov.appendChild(col)
    ov.addEventListener('click', () => { ov.remove(); ov = null; galleryDate = null })
    document.body.appendChild(ov)
    if (focusEl) focusEl.scrollIntoView({ block: 'center' })
  }

  const expand = rec => showGallery(window._ttDate || rec.date, rec.slot)

  async function show(date) {
    const st = store()
    if (!st) return
    let recs = []
    try { recs = await st.list(date) } catch (_) { return }
    if (!recs.length) return hide()
    if (window._ttDate !== date) return   // came home while the shelf was loading
    document.querySelectorAll('.tt-frame').forEach(f => f.remove())   // fresh mount (repaints swap clean)
    recs.slice(0, 4).forEach(rec => {
      const d = document.getElementById(DIGITS[rec.slot - 1])
      if (!d) return
      const live = d.offsetHeight                // measure the seat BEFORE the digit steps aside
      if (live) { seatH = live; seatW = d.offsetWidth }   // remember it — remounts find the digit already hidden
      const f = document.createElement('img')
      f.className = 'tt-frame'; f.src = rec.thumb; f.alt = rec.caption || ''
      f.title = rec.caption || ''
      f.style.height = (live || seatH || 96) + 'px'
      f.style.width = ((live ? d.offsetWidth : seatW) || seatW || 96) + 'px'
      f.addEventListener('click', () => expand(rec))
      d.parentNode.insertBefore(f, d)
      d.style.display = 'none'                   // the digit yields its seat; the others keep ticking
    })
  }

  window.TT_SCENES = {
    show,
    hide,
    showImage,
    refresh(date) {
      if (window._ttDate === date) show(date)
      // a new picture landed while the gallery is open on this date → grow it in place,
      // holding the scroll where the reader left it (Sum: "as you talk you can ask for more")
      if (galleryDate === date && ov) { const y = ov.querySelector('.tt-gal-col'); const keep = y && y.scrollTop; showGallery(date, -1).then(() => { const n = ov && ov.querySelector('.tt-gal-col'); if (n && keep != null) n.scrollTop = keep }) }
    },
  }
})()
