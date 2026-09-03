// lazy.js — 💤 OZ_LAZY. The heavy wings load AFTER first paint, not before it.
//
// FOR HUMANS:
//   three files were 3.4 MB of the 6.2 MB the app downloaded before it could draw anything: the
//   library's whole book corpus (Aurelius, Walden, the Tao…), the monaco game templates, and the
//   editor itself. None of them is needed to show a desk. They come in on idle now, a moment after
//   you can already see and use the app — and if you press one of their cards before they land,
//   the press waits for them instead of failing.
//
// FOR AI:
//   OZ_LAZY.need(name) → a memoized Promise; injects that bundle's scripts once, in order.
//   OZ_LAZY.covers(id) → does a card id have a bundle waiting?
//   OZ_LAZY.ready(name) → already in?
//   BUNDLES below is the whole map. Adding a heavy file = one line there + deleting its <script>
//   from index.html. Nothing else in the app changes.
//
//   ⚠ WHY IDLE AND NOT PURE ON-DEMAND: the card that needs a bundle can be pressed at any time, so
//     the warm-up removes the wait for the common case while `need()` still covers the race. Pure
//     on-demand would save a stranger the bytes they never use; that is a real win and a bigger
//     change (see 0zcom/PORT-NOTE-lazy-and-library.md).
;(function () {
  'use strict'
  // the map. ORDER MATTERS inside a bundle — templates must exist before the card that reads them.
  var BUNDLES = {
    // 🏮 the red lamp's corpus — 1.75 MB of public-domain text. The CARD carries its own copy in its
    //    iframe (library.html loads stacks-text.js itself), so this shell copy exists only for DRIA'S
    //    BEANS (library-tools.js: lamp_find · lamp_read · lamp_thread read window.LAMP_TEXT).
    library: ['cards/library/stacks-text.js'],
    // 🏁 monaco: the templates are ALSO the arcade's game bundle (games.js reads
    //    MONACO_TEMPLATE_FILES), so 'games' asks for the same file and the memo hands both the one load.
    // 2026-08-30 — the DOC TEMPLATES join this bundle. parts/00-deck.js:170 corporateTemplates()
    // reads window.TIPTAP_TEMPLATES at click time and always could; the CORPORATE shelf read
    // COMING SOON only because parking the tiptap writer took that global with it. These three
    // files ARE the global. 291 KB, costing nothing at boot because they ride here instead of
    // index.html.
    // ⚠ THE ORDER IS LOAD-BEARING, and it is exactly the rule stated at the top of this map: the
    // base file ASSIGNS the array, book and novella CONCAT onto it. Sorted alphabetically they
    // land on undefined and the shelf goes quiet again. Do not tidy this list.
    monaco:  ['cards/monaco/docs/site-templates.js',
              'cards/monaco/docs/tiptap-templates.js',
              'cards/monaco/docs/tiptap-templates-book.js',
              'cards/monaco/docs/tiptap-templates-novella.js',
              'cards/monaco/templates.gen.js', 'cards/monaco/demo-brahman.js', 'cards/monaco/monaco.js'],
    games:   ['cards/monaco/templates.gen.js'],
  }
  var jobs = {}, done = {}
  function inject(src) {
    return new Promise(function (res, rej) {
      var s = document.createElement('script')
      s.src = src + (window.OZ_BUILD ? '?v=' + window.OZ_BUILD : '')
      s.onload = res
      s.onerror = function () { rej(new Error('lazy: could not load ' + src)) }
      document.head.appendChild(s)
    })
  }
  function need(name) {
    if (jobs[name]) return jobs[name]
    var list = BUNDLES[name]
    if (!list) return (jobs[name] = Promise.resolve())
    // sequential on purpose: templates.gen.js must be in before monaco.js reads it
    jobs[name] = list.reduce(function (p, src) { return p.then(function () { return inject(src) }) }, Promise.resolve())
      .then(function () { done[name] = true })
      .catch(function (e) { console.warn('[lazy]', e && e.message); delete jobs[name]; throw e })
    return jobs[name]
  }
  window.OZ_LAZY = {
    need: need,
    covers: function (id) { return !!BUNDLES[id] },
    ready: function (n) { return !!done[n] },
    bundles: BUNDLES,
  }
  // ── the warm-up: once the browser is idle (the desk is drawn and the human is reading it), pull
  //    them in quietly. requestIdleCallback where it exists, a timer where it does not (Safari).
  function warm() { Object.keys(BUNDLES).forEach(function (n) { need(n).catch(function () {}) }) }
  var kick = function () { window.requestIdleCallback ? requestIdleCallback(warm, { timeout: 4000 }) : setTimeout(warm, 1500) }
  if (document.readyState === 'complete') kick()
  else window.addEventListener('load', kick)
})()
