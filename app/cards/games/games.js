// games.js — 🕹️ the ARCADE card. the games-store thesis, living inside oz: a launcher that plays the
// self-contained HTML games (the same ones in the 🏁 monaco template drop-down) right here in a card.
// "take a break from studying — open the arcade." any bot can open this card (toggleCard('games')).
// games are played from window.MONACO_TEMPLATE_FILES (the baked template bundle) via an iframe srcdoc —
// single-file games only (each is one self-contained .html). (Sum, 2026-06-29.)

;(function () {
  // the playable single-file games (key = monaco template key). 'toto' (v1 app) and multi-file 'snake' excluded.
  // mirrors the standalone arcade's manifest (~/Local/0z-arcade, Sum's live source, synced 2026-07-15).
  // jenga2 retired from the MENU (butcher superseded it as the wood game) — its template stays in monaco.
  const GAMES = [
    { key: 'colonialism', name: 'Space Colonialism',  glyph: '👾', blurb: 'conquer the galaxy, one system at a time',  accent: '#ff5a7a' },
    { key: 'butcher',     name: 'Butcher Block Maker', glyph: '🪵', blurb: 'seven woods, one endless glue-up',          accent: '#c8a96b' },
    { key: 'pong',        name: 'Ping',                glyph: '🏓', blurb: 'spin & force — first to five',              accent: '#3fdd6a' },
    // PARKED 2026-08-29 (Sum: "park jenga on bench next to sphinx — remove from arcade in live
    // build"). Template folder → _bench-for-totois/jenga-game; build.js prints "skip (no folder)"
    // for its ENTRY line, which is honest. jenga2 was already off the menu (butcher superseded it).
    // { key: 'jenga',       name: 'Jenga',               glyph: '🗼', blurb: 'physics stacker — reach the ceiling',       accent: '#bd9a5c' },
    { key: 'snek',        name: 'Snek',                glyph: '🐍', blurb: 'steer left / right — reach nirvana at 108', accent: '#48d597' },
  ]

  // pull a single-file game's full HTML out of the baked bundle (entry file's data).
  function gameHTML(key) {
    const b = (window.MONACO_TEMPLATE_FILES || {})[key]
    if (!b || !b.files) return null
    const f = b.files.find(x => x.name === b.entry) || b.files[0]
    return f && f.data
  }

  function injectCSS() {
    if (document.getElementById('arcade-css')) return
    const s = document.createElement('style'); s.id = 'arcade-css'
    s.textContent = `
      .arcade{display:flex;flex-direction:column;height:100%;min-height:420px}
      .arc-menu{padding:18px;flex:1;min-height:0;overflow-y:auto;-webkit-overflow-scrolling:touch}   /* 3 Sep 2026: on a phone the four game cards stack taller than the pane — the menu scrolls, or Snek is unreachable (Sum: "can't even get to snake") */
      .arc-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px}
      .arc-card{display:flex;flex-direction:column;align-items:flex-start;gap:3px;cursor:pointer;text-align:left;
        border:1px solid rgba(255,255,255,.12);border-radius:14px;padding:16px 14px;color:#e9eef3;
        background:linear-gradient(180deg,rgba(255,255,255,.05),rgba(0,0,0,.18));font:inherit;transition:transform .08s,border-color .15s}
      .arc-card:hover{transform:translateY(-2px);border-color:var(--ac)}
      .arc-gly{font-size:30px;line-height:1}
      .arc-name{font-weight:700;font-size:16px;margin-top:8px}
      .arc-blurb{color:#8aa0ad;font-size:12px}
      .arc-card::after{content:'play ▸';margin-top:8px;font-size:11px;font-weight:700;letter-spacing:.06em;
        text-transform:uppercase;color:#0b0e13;background:var(--ac);padding:5px 10px;border-radius:7px}
      .arc-foot{margin-top:16px;color:#8aa0ad;font-size:12px;text-align:center}
      .arc-foot b{color:#c8a96b}
      .arc-play{flex:1;display:flex;flex-direction:column;background:#000;min-height:0}
      .arc-pbar{display:flex;align-items:center;gap:10px;padding:8px 12px;background:#0b0e13;border-bottom:1px solid rgba(255,255,255,.1)}
      .arc-back{border:1px solid rgba(255,255,255,.12);border-radius:8px;background:#11161f;color:#e9eef3;
        padding:6px 12px;cursor:pointer;font:inherit;font-weight:700}
      .arc-back:hover{background:#1a2230}
      .arc-title{font-weight:700;color:#e9eef3}
      .arc-frame{flex:1;width:100%;min-height:0;border:0;background:#000;display:block}
      .arc-stage{flex:1;position:relative;min-height:0;display:flex}
      .arc-curtain{position:absolute;inset:0;border:0;background:#0b0e13;color:#e9eef3;font:inherit;font-weight:700;font-size:18px;cursor:pointer}
      .arc-curtain[hidden]{display:none}
      .arc-pause[aria-pressed="true"]{border-color:#48d597;color:#48d597}
      .arc-cabinet{margin-left:auto;display:flex;align-items:center;gap:8px}
      .arc-hud{display:none;position:absolute;top:0;left:0;height:44px;padding:0 0 0 6px;gap:6px;z-index:2;align-items:center}
      .arc-fab,.arc-home{height:40px;width:44px;border-radius:10px;border:1px solid rgba(255,255,255,.2);background:rgba(11,14,19,.6);color:#e9eef3;font:inherit;font-weight:700;font-size:18px;cursor:pointer;padding:0;display:grid;place-items:center}
      .arc-home img{width:30px;height:30px;object-fit:contain;pointer-events:none}
    `
    document.head.appendChild(s)
  }

  // 15:40 — app/?game=<key> opens the arcade on its own (topbar's ?open=<id> road is for cards and suites; the tile is this card's
  //    business). After 'load' so the saved layout is already restored (topbar.js bootLayout runs at DOMContentLoaded).
  try { if (new URLSearchParams(location.search).get('game')) window.addEventListener('load', () => { try { window.toggleCard && window.toggleCard('games', true) } catch (_) {} }) } catch (_) {}
  window.CARD_BUILDERS = window.CARD_BUILDERS || {}
  window.CARD_BUILDERS.games = function buildGames() {
    injectCSS()
    const body = document.createElement('div'); body.className = 'arcade'
    body.innerHTML = `
      <div class="arc-menu">
        <div class="arc-grid"></div>
        <div class="arc-foot">take a break — every game is one HTML file (same ones in the 🏁 monaco drop-down). <b>any bot can open the arcade.</b></div>
      </div>
      <div class="arc-play" style="display:none">
        <div class="arc-pbar"><button class="arc-back">‹ arcade</button><button class="arc-back arc-pause" aria-pressed="false">⏸ pause</button><span class="arc-title"></span></div>
        <div class="arc-stage"><iframe class="arc-frame" allow="autoplay"></iframe><div class="arc-hud"><button class="arc-home" aria-label="back to the arcade" title="back to the arcade (pauses first)"><img src="cards/games/games.png" alt=""></button><button class="arc-fab" aria-label="pause" title="pause">⏸</button></div><button class="arc-curtain" hidden>paused — tap to resume</button></div>
      </div>`
    const grid = body.querySelector('.arc-grid')
    const menu = body.querySelector('.arc-menu'), play = body.querySelector('.arc-play')
    const frame = body.querySelector('.arc-frame'), titleEl = body.querySelector('.arc-title')
    // ⏸ PAUSE OUTSIDE THE GAME (Sum, 2 Sep 2026, portrait: "just back to arcade and pause outside game play"). The game
    //    never knows: cabinet.js rigs EVERY game with a timer shim (rAF · setInterval · setTimeout hold while paused) and
    //    listens for cabinet-ctl pause/resume; the curtain covers the frame so a thumb cannot poke a frozen board. Same
    //    button resumes; tapping the curtain resumes. Leaving the game clears it.
    const pauseBtn = body.querySelector('.arc-pause'), curtain = body.querySelector('.arc-curtain'), fab = body.querySelector('.arc-fab'), home = body.querySelector('.arc-home')
    let paused = false
    // ⭐ 3 Sep 2026 — THE PAUSE BUTTON TOGGLES THE NAV (Sum: "pause button toggles nav, done"). Two states, one switch:
    //    PLAY  → html[data-game="play"]: on the phone the nav, the card head and the play bar fold away and the frame owns the
    //            whole glass (skin/mobile.css); the ⏸ floats over the game. Every touch inside the frame is the game's.
    //    PAUSE → the attribute goes: the pane, the nav, ‹ arcade · ▶ resume, the curtain. Back to the arcade lives here only.
    //    No gesture does either. The shim inside the frame holds the game's timers while paused (cabinet.js).
    const setPaused = (on, why) => {
      paused = !!on
      try { (window.__ozArcadeLog = window.__ozArcadeLog || []).push({ t: Date.now(), paused, why: why || '?' }); if (window.__ozArcadeLog.length > 30) window.__ozArcadeLog.shift() } catch (_) {}   // 13:10 — who paused the desk, for the rig (Sum: "something is turning off nav on rotate")
      try { frame.contentWindow && frame.contentWindow.postMessage({ oz: 'cabinet-ctl', cmd: paused ? 'pause' : 'resume' }, '*') } catch (_) {}
      curtain.hidden = true   // 3 Sep 10:55 — no curtain: the paused game stays visible in its card with its own pause screen and buttons (Sum: "no new thing")
      pauseBtn.textContent = paused ? '▶ resume' : '⏸ pause'; pauseBtn.setAttribute('aria-pressed', String(paused))
      // 3 Sep 11:10 (Sum: "then we never leave game play… pause screen needs full paint but not 0z, just a back to arcade button
      //    simplifies all nav, no zoom out needed"). The play view stays for the whole game — pause no longer brings the desk back.
      //    Paused → html[data-game-paused]: the ⏸ reads ▶ and ‹ arcade appears beside it, top-right; the game paints its own pause
      //    screen under them (cabinet.js lets a game with its own pause keep drawing). Back is the only way out.
      try { if (paused) document.documentElement.dataset.gamePaused = '1'; else delete document.documentElement.dataset.gamePaused } catch (_) {}
      fab.textContent = paused ? '▶' : '⏸'; fab.setAttribute('aria-label', paused ? 'resume' : 'pause')   // 11:20 — the joystick is always there now (Sum: "joystick icon pauses and returns to arcade, if paused already just returns")
      if (!paused) { try { frame.contentWindow && frame.contentWindow.focus() } catch (_) {} }
      setTimeout(fit, 0)
    }
    pauseBtn.addEventListener('click', () => setPaused(!paused, 'play bar'))
    fab.addEventListener('click', () => setPaused(!paused, 'fab'))
    home.addEventListener('click', () => { const back = () => body.querySelector('.arc-back').click(); if (!paused) { setPaused(true, 'joystick'); setTimeout(back, 160) } else back() })   // pause first: a game with its own pause autosaves on it (Butcher)
    curtain.addEventListener('click', () => setPaused(false, 'curtain'))
    // the game's own pause button / P key → the desk follows (cabinet.js posts cabinet-paused). Idempotent: an echo changes nothing.
    window.addEventListener('message', e => { try { if (e.source !== frame.contentWindow) return; const d = e.data; if (!d) return
      if (d.oz === 'cabinet-side') { try { if (d.side) document.documentElement.dataset.gameSide = String(d.side); else delete document.documentElement.dataset.gameSide } catch (_) {} return }   // 3 Sep: a game says which side the player holds — the column goes to the other (skin/mobile.css)
      if (d.oz !== 'cabinet-paused') return; if (!!d.paused !== paused) setPaused(!!d.paused, 'game said ' + (d.paused ? 'pause' : 'play')) } catch (_) {} })
    // 3 Sep 10:30 — THE VISIBLE VIEWPORT. On his iPhone Chrome's bottom bar clipped the board: the pinned stage was 100dvh and the
    //    bar did not count against it. visualViewport is the honest number; the stage takes it while a game plays and lets go on pause.
    const stage = body.querySelector('.arc-stage')
    // 10:45 — the stage's HEIGHT is CSS now (top 0 → bottom var(--play-gutter)): Chrome iOS overlays its bottom bar and every JS
    //    height counts the strip under it. fit() only follows the visual viewport's top offset (the collapsing URL bar).
    // 3 Sep 14:05 (Sum, sideways Ping: "bottom of play is offscreen on my iPhone again"): in LANDSCAPE Chrome iOS puts its bar on TOP and
    //    the visual viewport starts ~50–75px down the layout (vv.offsetTop). fit() pushed the stage down by that much and left its CSS
    //    height alone, so the same amount fell off the bottom. Whatever offset the stage takes at the top it now gives back at the
    //    bottom: height = calc(100dvh - gutter - offsetTop). offsetTop is 0 in portrait (bar at the bottom), so the 10:45 rule holds there.
    // ⚠ CORRECTION 15:15 — the 14:05 line above was half right and the 14:50 CSS reserve (76px) doubled it: Sum's screenshot had the
    //    court ending 31px short with a black band under it. Read off the glass: layout viewport 393 tall, shifted ~45px under Chrome's
    //    top bar; visible = layout 30..348; vv.offsetTop = 30. Subtracting BOTH the offset and a 76px reserve from 100dvh left 287. The
    //    honest number is visualViewport.height itself (318): when Chrome has shifted the visual viewport (offsetTop > 0) it is tracking
    //    the bar, so the stage takes its top AND its height from it and no CSS reserve applies. offsetTop 0 (portrait, the Pixel, the
    //    pane) keeps the CSS height and the 10:45 gutter — that geometry is the bottom-bar overlay, where vv.height is the one that lies.
    // ⚠ CORRECTION 15:40 — vv.height was NOT honest either: "bottom is cut off again" (Sum). So it counts the strip past the glass
    //    like every other JS height here (10:45 was right about all of them). Sum: "can we find a middle path" — the two measured
    //    builds bracket the answer: 8px reserve → 37px past the glass, 76px reserve → 31px short. The middle, 42px, lands within 3px.
    //    So: height = calc(100dvh − gutter − offsetTop), the 14:05 form, with the iOS-only landscape gutter at 42 (skin/mobile.css).
    //    And a PROBE so the next number comes off the glass, not a screenshot: app/?probe prints innerHeight · vv.height/offsetTop ·
    //    screen · the gutter in the corner of the stage. One screenshot of that ends the guessing (and it is the APK's number too).
    let probe = null; try { if (new URLSearchParams(location.search).has('probe')) { probe = document.createElement('div'); probe.style.cssText = 'position:absolute;right:4px;bottom:4px;z-index:99;font:11px/1.3 ui-monospace,monospace;color:#9fb3c8;background:rgba(0,0,0,.7);padding:3px 6px;border-radius:6px;pointer-events:none;white-space:pre'; stage.appendChild(probe) } } catch (_) {}
    const fit = () => { try { const vv = window.visualViewport; if (document.documentElement.dataset.game === 'play' && vv && getComputedStyle(stage).position === 'fixed') { const off = Math.round(vv.offsetTop || 0); stage.style.top = off + 'px'; stage.style.height = off ? 'calc(100dvh - var(--play-gutter) - ' + off + 'px)' : '' } else { stage.style.top = ''; stage.style.height = '' }
      if (probe) { const vv2 = window.visualViewport; probe.textContent = 'inner ' + innerWidth + 'x' + innerHeight + '  vv ' + (vv2 ? Math.round(vv2.width) + 'x' + Math.round(vv2.height) + ' @' + Math.round(vv2.offsetTop) : '-') + '  scr ' + screen.width + 'x' + screen.height + '  gutter ' + getComputedStyle(document.documentElement).getPropertyValue('--play-gutter').trim() + '  stage ' + Math.round(stage.getBoundingClientRect().height) } stage.style.height = '' } catch (_) {} }
    try { if (window.visualViewport) { window.visualViewport.addEventListener('resize', fit); window.visualViewport.addEventListener('scroll', fit) } } catch (_) {}
    window.addEventListener('resize', fit)

    const tiles = {}
    GAMES.forEach(g => {
      const c = document.createElement('button'); c.className = 'arc-card'; c.style.setProperty('--ac', g.accent)
      c.innerHTML = `<span class="arc-gly">${g.glyph}</span><span class="arc-name">${g.name}</span><span class="arc-blurb">${g.blurb}</span>`
      c.dataset.key = g.key; tiles[g.key] = c   // 15:40 — the deep link finds its tile by key
      c.addEventListener('click', () => {
        const html = gameHTML(g.key)
        if (!html) { titleEl.textContent = g.name + ' — not loaded'; return }
        // THE CABINET (2026-08-29): rig the srcdoc with the gofai driver + seat the 🤖 controls.
        // Same-origin srcdoc is what makes this possible — cabinet.js owns everything else.
        titleEl.textContent = g.name
        frame.srcdoc = window.OZ_CABINET ? window.OZ_CABINET.rig(g.key, html) : html
        if (window.OZ_CABINET) window.OZ_CABINET.opened(g.key, frame, body.querySelector('.arc-pbar'))
        menu.style.display = 'none'; play.style.display = 'flex'
        try { document.documentElement.dataset.arcade = 'play'; document.documentElement.dataset.game = 'play' } catch (_) {}   // the play view, for the whole game
        setPaused(false, 'open')   // portrait: the hull goes near-fullscreen for the game (skin/mobile.css)
      })
      grid.appendChild(c)
    })
    // 3 Sep 15:40 (Sum: "butcher and space are ready for a direct link to this game open in com — but let's do all 4 at once"):
    //    app/?game=<key> (butcher · colonialism · snek · pong) lands on that tile. The bundle that holds the games is lazy (shell/lazy.js
    //    pulls it on idle), so the press waits for it. Fires once per page; the card itself is opened by the load hook above.
    try { const want = new URLSearchParams(location.search).get('game'); if (want && !window.__ozDeepLinked && tiles[want]) { window.__ozDeepLinked = true; const go = () => { try { tiles[want].click() } catch (_) {} }; if (window.OZ_LAZY && !window.OZ_LAZY.ready('games')) window.OZ_LAZY.need('games').then(go).catch(() => {}); else go() } } catch (_) {}
    body.querySelector('.arc-back').addEventListener('click', () => {
      if (window.OZ_CABINET) window.OZ_CABINET.closed()   // the 🤖 controls leave with the game
      frame.srcdoc = ''; play.style.display = 'none'; menu.style.display = 'block'   // stop the running game
      setPaused(true, 'back'); try { delete document.documentElement.dataset.arcade; delete document.documentElement.dataset.game; delete document.documentElement.dataset.gamePaused; delete document.documentElement.dataset.gameSide } catch (_) {}   // leaving: the desk returns, flags off
    })

    return window.makeCard({ id: 'games', icon: 'cards/games/games.png', title: 'ARCADE', body, bottom: true })
  }
})()
