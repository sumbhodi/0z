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
      .arc-menu{padding:18px}
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
    `
    document.head.appendChild(s)
  }

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
        <div class="arc-stage"><iframe class="arc-frame" allow="autoplay"></iframe><button class="arc-curtain" hidden>paused — tap to resume</button></div>
      </div>`
    const grid = body.querySelector('.arc-grid')
    const menu = body.querySelector('.arc-menu'), play = body.querySelector('.arc-play')
    const frame = body.querySelector('.arc-frame'), titleEl = body.querySelector('.arc-title')
    // ⏸ PAUSE OUTSIDE THE GAME (Sum, 2 Sep 2026, portrait: "just back to arcade and pause outside game play"). The game
    //    never knows: cabinet.js rigs EVERY game with a timer shim (rAF · setInterval · setTimeout hold while paused) and
    //    listens for cabinet-ctl pause/resume; the curtain covers the frame so a thumb cannot poke a frozen board. Same
    //    button resumes; tapping the curtain resumes. Leaving the game clears it.
    const pauseBtn = body.querySelector('.arc-pause'), curtain = body.querySelector('.arc-curtain')
    let paused = false
    const setPaused = on => {
      paused = !!on
      try { frame.contentWindow && frame.contentWindow.postMessage({ oz: 'cabinet-ctl', cmd: paused ? 'pause' : 'resume' }, '*') } catch (_) {}
      curtain.hidden = !paused; pauseBtn.textContent = paused ? '▶ resume' : '⏸ pause'; pauseBtn.setAttribute('aria-pressed', String(paused))
      if (!paused) { try { frame.contentWindow && frame.contentWindow.focus() } catch (_) {} }
    }
    pauseBtn.addEventListener('click', () => setPaused(!paused))
    curtain.addEventListener('click', () => setPaused(false))

    GAMES.forEach(g => {
      const c = document.createElement('button'); c.className = 'arc-card'; c.style.setProperty('--ac', g.accent)
      c.innerHTML = `<span class="arc-gly">${g.glyph}</span><span class="arc-name">${g.name}</span><span class="arc-blurb">${g.blurb}</span>`
      c.addEventListener('click', () => {
        const html = gameHTML(g.key)
        if (!html) { titleEl.textContent = g.name + ' — not loaded'; return }
        // THE CABINET (2026-08-29): rig the srcdoc with the gofai driver + seat the 🤖 controls.
        // Same-origin srcdoc is what makes this possible — cabinet.js owns everything else.
        titleEl.textContent = g.name
        frame.srcdoc = window.OZ_CABINET ? window.OZ_CABINET.rig(g.key, html) : html
        if (window.OZ_CABINET) window.OZ_CABINET.opened(g.key, frame, body.querySelector('.arc-pbar'))
        menu.style.display = 'none'; play.style.display = 'flex'
        setPaused(false)
        try { document.documentElement.dataset.arcade = 'play' } catch (_) {}   // portrait: the hull goes near-fullscreen for the game (skin/mobile.css)
      })
      grid.appendChild(c)
    })
    body.querySelector('.arc-back').addEventListener('click', () => {
      if (window.OZ_CABINET) window.OZ_CABINET.closed()   // the 🤖 controls leave with the game
      frame.srcdoc = ''; play.style.display = 'none'; menu.style.display = 'block'   // stop the running game
      setPaused(false); try { delete document.documentElement.dataset.arcade } catch (_) {}
    })

    return window.makeCard({ id: 'games', icon: 'cards/games/games.png', title: 'ARCADE', body, bottom: true })
  }
})()
