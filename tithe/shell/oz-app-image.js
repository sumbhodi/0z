// oz-app-image.js — `ozimage`: Jem's 🍌 paintbrush (nano banana) as a CLI.
//
// FOR HUMANS
//   one verb: make a picture from a description. it opens the 🍌 image card and starts the paint,
//   then returns immediately — the picture renders a few seconds later, for the HUMAN to see (the
//   model never sees it back, so the description has to be rich the first time). BYOK: it needs the
//   human's Google key (⚙ settings) — that's the only toll. keep every image wholesome + PG.
//
// FOR AI
//   1. `ozimage generate "…"` — one full, vivid description (subject · setting · mood · style · light).
//   2. no key saved → tell the human to paste one in ⚙ settings. one picture per call.
//
// registers on window.OZ_APP_CLI (oz-app-cli.js). depends on: window.ozNano (the painter) ·
// window.ozOpenGenerate / window.igResultOverlay (the 🍌 studio).

;(function () {
  'use strict'

  var APP = window.OZ_APP_CLI; if (!APP) return

  APP.makeApp({
    name: 'ozimage',
    blurb: "Jem's paintbrush — make a picture from a description (nano banana). keep it wholesome + PG",
    clue:
`ozimage — make a PICTURE from words (nano banana / google). it renders in the 🍌 image card for the human
to see (you won't see it back — describe it richly the first time). keep every image wholesome + PG.
  ozimage generate "a full, vivid description — subject, setting, mood, style, lighting"`,

    subs: {

      generate: function (a) {
        var scene = a._.join(' ').trim()
        if (!scene) return 'ozimage generate: give me a full description of the picture to make.'
        if (!window.ozNano || !window.ozNano.ready()) return 'ozimage generate: no Google key yet — ask the human to paste one in ⚙ settings, then try again.'
        if (window.ozOpenGenerate) window.ozOpenGenerate(scene, true, true)   // open the 🍌 generate tab + fire it (the bot made it → it gets the pic)
        else window.ozNano.paint(scene).then(function (res) { if (window.igResultOverlay) window.igResultOverlay(res.b64, scene) }).catch(function () {})
        return 'ozimage generate — opened the 🍌 studio with "' + scene + '" and started it; it appears there + in the gallery. the human can tweak the prompt + re-run.'
      }

    }
  })

})()
