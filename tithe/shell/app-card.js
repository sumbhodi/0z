// app-card.js — THE VANILLA ABSTRACTION (the "better bean"): run ANY self-contained app through the
// card builder. a working app (its own index.html) + an iframe + makeCard = a toto card. nothing gets
// re-implemented per card — you point a card at the app. (this is forge.js's woodshop trick, generalized.)
//
// also exports ozPopup — the ONE modular overlay every tip / pop-up uses: ✕ · click-outside · Esc.

// run an app in a card:  appCard({ id, icon, title, src, skin?, bottom?, settingsSrc?, homeSrc?, papers?, tabs? })
// settingsSrc → the app's internal settings PAGE. when present the card wears the standard ⚙ gear, and it
// swaps the iframe between the home page and that settings page (settings-or-content, at the iframe level —
// no bespoke in-app nav). homeSrc() lets the home page be computed live (e.g. the clock's themed page).
window.appCard = function (o) {
  const frame = htmlNode(`<iframe class="app-frame" src="${o.src}" title="${o.title || o.id}"></iframe>`)
  const card = window.makeCard({
    id: o.id, icon: o.icon, title: o.title || o.id,
    skin: o.skin || 'card-app', body: frame,
    jewels: false, stop: false, bottom: o.bottom !== false,
    headArt: o.headArt || '', headArtPos: o.headArtPos || 'center',   // the chrome bar can be the picture
  })
  if (o.settingsSrc) {
    const head = card.querySelector('.card-head')
    if (head) {
      const gear = htmlNode('<button class="ab-gear card-gear" type="button" title="settings">' + (window.OZ_GEAR_SVG || '⚙') + '</button>')
      const homeSrc = () => (typeof o.homeSrc === 'function' ? o.homeSrc() : o.src)
      let onSettings = false
      // ONE way to flip, so the gear's state can never disagree with what the frame is showing.
      // A card's own content can ask for settings via postMessage (see the listener below) — it
      // must NOT navigate the iframe itself, or `onSettings` goes stale and the gear reverses.
      const toSettings = on => {
        onSettings = !!on
        if (card._settingsFrame) card._settingsFrame(onSettings)   // a card with a stack of papers (below) shows settings in a frame of its own
        else frame.setAttribute('src', onSettings ? o.settingsSrc : homeSrc())
        gear.classList.toggle('on', onSettings)
      }
      gear.addEventListener('mousedown', e => e.stopPropagation())
      gear.addEventListener('click', e => { e.stopPropagation(); toSettings(!onSettings) })
      card._toSettings = toSettings
      card._settingsOpen = () => onSettings
      window.mountGear(head, gear)   // (2026-08-28) the ONE seat — far right, past STOP, squeezes away before it
    }
  }
  // THE STACK OF PAPERS — papers: [{ id, label, src, icon }] (Sum 2026-08-22: "3 prints, no words when
  // possible, just click the one you want"). tabs: [{ label, src, icon? }] is the same strip with the label
  // painted. ONE strip, ONE function: the pressed entry is what the frame shows; pressing it again does not
  // reload. The strip rides .card-ctrls (the slot makeCard always adds, cards.js L114), so desk.css L149
  // already hides it when the card collapses. The mousedown and click guards are the gear's (L32-33 above):
  // a press must never collapse or drag the card. Which paper is on top is said by CSS alone (app-card.css
  // .card-paper[aria-pressed="true"]): the glyph lifts and a rim light shows under it. No box, no dimming.
  const list = Array.isArray(o.papers) && o.papers.length ? o.papers : (Array.isArray(o.tabs) && o.tabs.length ? o.tabs : null)
  if (list) {
    const wordless = list === o.papers
    const slot = card.querySelector('.card-ctrls') || card.querySelector('.card-head')
    if (slot) {
      // THE STACK IS A STACK OF FRAMES (Sum 2026-08-22: "in 3D it just gets put on top"). The card's own
      // frame is the first paper; every other paper gets its OWN iframe, made the first time it is opened
      // and kept after, hidden under whichever is on top. A switch is show/hide, never a reload: the live
      // paper does not re-pull its pictures each time, My View keeps its fill, and a Feedline cut keeps
      // running while you read something else. The gear above still drives the card's own frame only.
      const src = t => (t.port ? 'about:blank' : (typeof t.src === 'function' ? t.src() : t.src))
      // a PORTED paper (t.port = a URL): pulled through the bolt into the frame's own document (shell/port.js),
      // so it is same-origin and dressable. Pressing its glyph while it is already on top pulls a fresh copy.
      const port = (t, f) => { if (t.port && window.OZ_PORT) window.OZ_PORT.into(f, t.port, t.id) }
      const first = list.find(t => src(t) === o.src) || list[0]
      const frames = new Map([[first, frame]])
      frame.dataset.paper = first.id || ''   // every paper's frame is findable by name (the probe, milk, the port)
      if (first.port) port(first, frame)
      const frameFor = t => {
        if (frames.has(t)) return frames.get(t)
        const f = htmlNode(`<iframe class="app-frame" src="${src(t)}" title="${t.label || o.title || o.id}"></iframe>`)
        f.dataset.paper = t.id || ''
        frame.parentNode.insertBefore(f, frame.nextSibling); frames.set(t, f); port(t, f); return f
      }
      const strip = htmlNode(`<div class="card-tabs" role="group" aria-label="${o.title || o.id} papers"></div>`)
      const btns = []
      let top = first
      const show = t => {
        const f = frameFor(t)
        if (t === top && t.port && !(card._settingsOpen && card._settingsOpen())) port(t, f)   // pressed while already on top: pull a fresh copy
        top = t
        if (card._settingsOpen && card._settingsOpen()) card._toSettings(false)   // a paper press folds the settings away
        frames.forEach(x => { x.hidden = x !== f })
        btns.forEach((b, i) => b.setAttribute('aria-pressed', String(list[i] === t)))
      }
      list.forEach(t => {
        const b = wordless
          ? htmlNode(`<button class="card-paper" type="button" aria-pressed="false" title="${t.label}" aria-label="${t.label}"><img class="card-paper-ico" src="${t.icon || ''}" alt=""></button>`)
          : htmlNode(`<button class="card-tab" type="button" aria-pressed="false" title="${t.label}" aria-label="${t.label}">${t.icon ? `<img class="card-tab-ico" src="${t.icon}" alt="">` : ''}<span class="card-tab-label">${t.label}</span></button>`)
        b.addEventListener('mousedown', e => e.stopPropagation())
        b.addEventListener('click', e => { e.stopPropagation(); show(t) })
        btns.push(b); strip.appendChild(b)
      })
      // THE GEAR ON A STACK: settings get a frame of their own under the same rule (made once, kept, show/hide);
      // off → the paper that was on top comes back. The gear block above calls this instead of swapping frame.src.
      if (o.settingsSrc) {
        let sf = null
        card._settingsFrame = on => {
          if (on) { if (!sf) { sf = htmlNode(`<iframe class="app-frame" src="${o.settingsSrc}" title="${o.title || o.id} settings"></iframe>`); sf.dataset.paper = 'settings'; frame.parentNode.insertBefore(sf, frame.nextSibling) }
            frames.forEach(x => { x.hidden = true }); sf.hidden = false }
          else { if (sf) sf.hidden = true; show(top) }
        }
      }
      card._toPaper = key => { const t = list.find(x => x.id === key || x.label === key); if (t) show(t) }   // same door shape as card._toSettings (L34)
      card._toTab = card._toPaper
      card._flip = v => { if (list[1]) show(v ? list[1] : list[0]) }   // yesterday's one-toggle door, kept for any caller
      // a paper may say it is BUSY (the Feedline while the newsie cuts): parent.postMessage({ paper: id, state: 'busy' | 'ready' })
      // and its glyph turns until it says ready. Only a frame of this card is heard.
      window.addEventListener('message', e => {
        const d = e.data; if (!d || typeof d !== 'object' || !d.paper) return
        const i = list.findIndex(t => t.id === d.paper); if (i < 0) return
        const f = frames.get(list[i]); if (!f || f.contentWindow !== e.source) return
        if (d.state) btns[i].classList.toggle('busy', d.state === 'busy')
        if (d.left && window.OZ_MILK) window.OZ_MILK.left(card, d.paper, d.left)   // cookies and milk (shell/milk.js): the reader left through a headline
        // back/gone ride the same message to milk.js's own listener (it hears window messages itself); nothing to do here
      })
      slot.appendChild(strip)
      btns[list.indexOf(first)].setAttribute('aria-pressed', 'true')   // the frame already shows o.src (or its port); light that one without a reload
    }
  }
  return card
}

// the ONE pop-up. content: { icon?, title?, meta?, body } — body is a string or a DOM node.
// opens over everything; closes on the ✕, a click outside the box, or Esc. returns close().
window.ozPopup = function (content) {
  content = content || {}
  const ov = htmlNode(`<div class="oz-pop">
    <div class="oz-pop-box">
      <button class="oz-pop-x" title="close">✕</button>
      <div class="oz-pop-head">
        ${content.icon ? `<span class="oz-pop-icon">${content.icon}</span>` : ''}
        ${content.title ? `<span class="oz-pop-title">${content.title}</span>` : ''}
        ${content.meta ? `<span class="oz-pop-meta">${content.meta}</span>` : ''}
      </div>
      <div class="oz-pop-body"></div>
    </div>
  </div>`)
  const body = ov.querySelector('.oz-pop-body')
  if (content.body instanceof Node) body.appendChild(content.body)
  else body.textContent = content.body || ''

  function close() { ov.remove(); document.removeEventListener('keydown', onEsc) }
  function onEsc(e) { if (e.key === 'Escape') close() }
  ov.addEventListener('click', e => { if (e.target === ov) close() })   // click outside the box
  ov.querySelector('.oz-pop-x').addEventListener('click', close)
  document.addEventListener('keydown', onEsc)
  document.body.appendChild(ov)
  return close
}

// register the clock card — the REAL clock app, run THROUGH the card builder (zero re-implementation).
window.CARD_BUILDERS = window.CARD_BUILDERS || {}
// the RED LAMP LIBRARY — Dria's front of house (Sum's canon: 'Red Lamp = a CARD in the 0z app + web like PSV').
window.CARD_BUILDERS.library = () => window.appCard({
  id: 'library', icon: 'cards/library/red-lamp.svg', title: 'the red lamp library',
  src: 'cards/library/library.html',
  headArt: 'cards/library/art/street.jpg', headArtPos: 'center',   // the lamp street, no words — the lighthouse at the end of it is the one on Dria's bar
})

window.CARD_BUILDERS.clock = () => window.appCard({
  id: 'clock', icon: 'cards/clock/clock.png', title: 'clock',
  src: 'cards/clock/clock.html',
  settingsSrc: 'cards/clock/clock-settings.html',
  // home returns to the THEMED clock page (retro is its own file), so closing settings lands on the right face
  homeSrc: () => 'cards/clock/' + (localStorage.getItem('clock-theme') === 'retro' ? 'clock-retro.html' : 'clock.html'),
})

// register the SCROLL card — 0z·Info, the ONE feed (the clock's lanes, reskinned + clumped into a
// Discover column). its own ⚙ swaps to the settings page (register + lane toggles).
window.CARD_BUILDERS.scroll = () => window.appCard({
  id: 'scroll', icon: 'cards/scroll/psv-icon.png', title: 'The Port Side View',   // the cruise ship at dawn — the paper keeps its flag; the mirror is its OWN button
  // MY VIEW (Sum 2026-08-21: "card is just viewer for latest web paper… retire gear"). The card
  // is a WINDOW on the live paper, app and browser alike — LIVE IS CANON, zero drift, nothing to
  // sync. This supersedes the 08-09 hard-copy split (the browser half of that src pointed at
  // scroll.html, which 308s — the local hard copy was guarding a door that had already moved to
  // page-one). The gear is RETIRED: a static paper needs no settings. The old settings surface
  // is parked at _archive/2026-08-17-TOTOIS-INTAKE/code/editors-gear/ beside yanker and desk.
  // NEXT (TODO-newsie-doomscroll.md): the blank paper — wire chips on the face, one FILL button.
  src: 'about:blank',   // the card's own frame is the porthole's; port.js pulls the live paper into it (papers[0].port)
  // THE STACK (Sum 2026-08-22): three papers, three glyphs, no words. The porthole = the live paper; the
  // mirror = My View (cards/myview/myview.html, local, so it reaches the bolt); newsie's roll = The Feedline,
  // its own cut (cards/feedline/feedline.html). The paper on top lifts; see app-card.css .card-paper.
  papers: [
    { id: 'psv',      label: 'The Port Side View', port: 'https://theportsideview.com/cards/scroll/page-one', icon: 'cards/scroll/art/port-side-view.png' },   // PORTED: a fresh print, dressed (shell/port.js)
    { id: 'myview',   label: 'My View',            src: 'cards/myview/myview.html',                          icon: 'cards/scroll/art/my-view.png' },
    { id: 'feedline', label: 'The Feedline',       src: 'cards/feedline/feedline.html',                      icon: 'agents/newsie/newsie-roll-sm.png' },
  ],
})

// (the LIBRARY card — The Red Lamp Library, Alexa N. Dria — is parked at _archive/…/code/library, 2026-08-22: its own suite, not the newsie's)

// register the STOPWATCH card — a SEALED, self-contained widget (Sum 2026-07-20: rebuilt done real,
// "a clock should look like a clock"). two faces (analog dial / digital) + interval mode. its own ⚙.
window.CARD_BUILDERS.stopwatch = () => window.appCard({
  id: 'stopwatch', icon: '⏱', title: 'stopwatch',
  src: 'cards/stopwatch/stopwatch.html',
  settingsSrc: 'cards/stopwatch/stopwatch-settings.html',
})

// app-card iframes can't reach window.parent at file:// — they postMessage instead. open the 💉
// injection card when one asks (e.g. the woodshop's read-only intake block → "edit in injections").
window.addEventListener('message', e => {
  if (e && e.data === 'oz-open-injection' && window.toggleCard) window.toggleCard('injection', true)
  // a card's content asking for its own settings page (the time-tool cards' "add" slot)
  const d = e && e.data
  if (d && d.type === 'oz-open-settings' && d.card) {
    if (d.focus) { try { localStorage.setItem('clock-settings-focus', d.focus) } catch (_) {} }
    const card = document.querySelector(`.card[data-card="${d.card}"]`)
    if (card && card._toSettings) card._toSettings(true)
  }
})
