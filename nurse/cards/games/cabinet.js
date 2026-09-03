// cabinet.js — 🕹️ THE CABINET PLAYS (Sum 2026-08-29: "I want to watch it play butcher block maker,
// and space colonialism an snek… an llm will suck at tetris and burn tokens. a gofai with skill
// level and speed adjustments… is theatre. so it gets a running report of game — if good move or
// fail, gofai can detect change, sends an api call and bot reacts as if playing live.")
//
// THE SHAPE — three parts, one home (this file; the game templates stay clean teaching material):
//   1. THE RIG — games run in SAME-ORIGIN srcdoc iframes (games.js), so at launch we append a
//      per-game driver <script> to the html. Top-level `let`s in a classic script live in the
//      global lexical scope, so a LATER script reads them without touching the template.
//   2. THE PLAYER — a gofai per game, skill + speed dialed. It reads state and acts through the
//      game's own controls. This is the gamer's baked soul made mechanical: "you READ the board —
//      the ball, the score, the position — and you say so." No model touches a frame.
//   3. THE WIRE — the driver posts BEATS (change events only) to the parent; this file throttles
//      them and confers to the gamer (window.confer — the same glass-box road bots already use,
//      links.js's say-road idiom; rank: 'cabinet' is second-choir, lateral to gamer). The bot
//      reacts as if playing live — tokens only on beats, never on frames.

;(function () {
  // ── the per-game DRIVERS — each is a <script> body injected after the game's own code ──
  // shared prologue: ctl channel + beat poster + the on/skill dials
  const PRO = `
;(function(){ /* THE CABINET — injected by cards/games/cabinet.js at launch; not part of the template */
  let ON=false, SKILL=2, T=null
  const post=(event,line)=>{ try{ parent.postMessage({oz:'cabinet',game:'__KEY__',event,line},'*') }catch(_){} }
  const key=(k,type)=>{ const e=new KeyboardEvent(type||'keydown',{key:k,bubbles:true}); window.dispatchEvent(e); document.dispatchEvent(e) }
  window.addEventListener('message',ev=>{ const d=ev.data||{}; if(d.oz!=='cabinet-ctl')return
    if(d.cmd==='start'){ SKILL=d.skill||2; if(!ON){ON=true; begin()} }
    if(d.cmd==='stop'&&ON){ ON=false; clearInterval(T); T=null; post('stopped','the cabinet stepped back from the controls') } })
  // SILENCE THE MOUSE while the cabinet plays (Sum 2026-08-29, after his cursor wrestled the gofai
  // for the ship: "when bot is playing maybe silence my mouse"). Capture-phase, frame-only — the
  // parent's own 🤖 controls live outside this document and stay clickable. Stops the game's mouse
  // handlers (colonialism's ship-follow, snek's click-turns) without touching the templates.
  // ("dual play mode" is parked as his maybe — the stray thought that it almost worked is on file.)
  ;['mousemove','mousedown','mouseup','click','touchstart'].forEach(t=>window.addEventListener(t,e=>{ if(ON){ e.stopImmediatePropagation(); if(t!=='mousemove') e.preventDefault() } },true))
  const oops=p=>Math.random()<p   // the skill dial IS an error rate — perfection is bad theatre
`
  const EPI = `})()
`

  const DRIVERS = {
    // ── SNEK — steer left/right on a grid; walls kill (nirvana wraps); food is the goal ──
    snek: PRO + `
  let lastScore=-1, lastLevel='', deadAt=0, lastHead=''
  function begin(){ post('start','the cabinet takes the controls — snek'); T=setInterval(step,60) }
  function step(){
    if(!ON) return
    const gs = typeof gameState!=='undefined' ? gameState : null; if(!gs) return
    if(typeof gameStarted!=='undefined' && !gameStarted){ key(' '); return }
    if(!gs.isRunning){ if(!deadAt){ deadAt=Date.now(); post('died','run over at score '+gs.score) }
      if(Date.now()-deadAt>2500){ deadAt=0; key(' ') } return }
    deadAt=0
    if(gs.score!==lastScore){ if(lastScore>=0 && gs.score>lastScore && gs.score%9===0) post('ate','score '+gs.score+' and climbing'); lastScore=gs.score }
    if(currentLevel.name!==lastLevel){ if(lastLevel) post('level','reached '+currentLevel.name); lastLevel=currentLevel.name }
    // CORRECTION, first live run: turnLeft/turnRight compound on nextDirection between game ticks
    // (my 60ms poll vs the game's ~250ms tick over-turned). snek's own steer(vec) is ABSOLUTE with
    // its own 180° guard — decide ONCE per head-move, hand it a heading, done.
    const head=gs.snake[0]
    const hk=head.x+','+head.y; if(hk===lastHead) return; lastHead=hk
    const d=gs.direction, N=currentLevel.grid, wrap=!!gs.nirvanaMode
    const DIRS=[{x:1,y:0},{x:-1,y:0},{x:0,y:1},{x:0,y:-1}]
    const bad=p=>{ let x=p.x,y=p.y; if(wrap){x=(x+N)%N;y=(y+N)%N} else if(x<0||y<0||x>=N||y>=N) return true
      return gs.snake.some(s=>s.x===x&&s.y===y) }
    const dist=p=>{ if(!gs.food) return 0; let dx=Math.abs(p.x-gs.food.x),dy=Math.abs(p.y-gs.food.y)
      if(wrap){dx=Math.min(dx,N-dx);dy=Math.min(dy,N-dy)} return dx+dy }
    const cand=DIRS.filter(v=>!(v.x===-d.x&&v.y===-d.y))   // never the 180
      .map(v=>({v,p:{x:head.x+v.x,y:head.y+v.y}})).filter(c=>!bad(c.p)).sort((a,b)=>dist(a.p)-dist(b.p))
    if(!cand.length) return                             // boxed in — ride it out honestly
    const err=SKILL>=3?0.02:SKILL===2?0.10:0.28
    const pick=oops(err)?cand[Math.floor(Math.random()*cand.length)]:cand[0]
    if(typeof steer==='function') steer(pick.v)
  }
` + EPI,

    // ── BUTCHER BLOCK MAKER — the tetris variant: keep the surface flat, feed the glue-up ──
    butcher: PRO + `
  let lastLines=-1, lastRows=-1, plan=null, planFor=null, overAtB=0
  function begin(){ post('start','the cabinet takes the controls — butcher block'); T=setInterval(step,140) }
  function colHeights(){ const h=[]; for(let c=0;c<COLS;c++){ let y=0; while(y<ROWS&&grid[y][c]===-1)y++; h[c]=ROWS-y } return h }
  function step(){
    if(!ON) return
    if(typeof state==='undefined') return
    if(state==='pause'){ if(typeof togglePause==='function') togglePause(); return }   // the cabinet plays through a blur-pause — you turned it loose
    if(state==='start'||state==='over'){ if(state==='over'&&!overAtB){ overAtB=Date.now(); post('died','the stack got away — '+score+' points, '+lines+' rows into the block') }
      if(!overAtB||Date.now()-overAtB>2000){ overAtB=0; key('Enter') } return }
    if(state!=='play'||!cur) return
    overAtB=0
    if(lines!==lastLines){ if(lastLines>=0&&lines>lastLines) post('lines','row joined the glue-up — '+lines+' total'); lastLines=lines }
    if(blockRows.length!==lastRows){ lastRows=blockRows.length }
    if(planFor!==cur){ // a fresh piece — pick a lane: lowest ground, with skill-dialed sloppiness
      const h=colHeights(); let lanes=h.map((v,i)=>({i,v})).sort((a,b)=>a.v-b.v)
      const slop=SKILL>=3?1:SKILL===2?2:4
      const target=lanes[Math.floor(Math.random()*Math.min(slop,lanes.length))].i
      plan={target,rot:Math.floor(Math.random()*(SKILL>=2?2:4))}; planFor=cur }
    if(plan.rot>0){ tryRotate(1); plan.rot--; return }
    const cx=cur.x!=null?cur.x:Math.floor(COLS/2)
    if(cx<plan.target){ move(1); return }
    if(cx>plan.target){ move(-1); return }
    if(oops(SKILL>=3?0.9:0.6)) hardDrop(); else softDrop()
  }
` + EPI,

    // ── SPACE COLONIALISM — dodge the bombs, line up the softest tier, hold the trigger ──
    colonialism: PRO + `
  let lastScoreC=-1, lastTier=-1, fireT=0, deadAtC=0, wallSaid=false
  // the probe door — G is closure-private (the driver is SPLICED inside the game's IIFE); this is
  // the one window into it, for tests and the curious
  window.__cabProbe = () => ({ state: G.state, score: G.score, tier: G.level + 1, lives: G.ship.lives, dead: G.dead, win: G.win })
  function begin(){ post('start','the cabinet takes the controls — space colonialism'); T=setInterval(step,50) }
  function step(){
    if(!ON) return
    if(typeof G==='undefined') return
    if(G.state==='start'){ key('Enter'); key(' '); return }
    if(G.state==='entry'){ key('Enter'); return }        // claim the roll and move on
    if(G.dead){ if(!deadAtC){ deadAtC=Date.now(); post(G.win?'win':'died', G.win?'DIED AT THE WALL — the win. score '+G.score:'shot down — score '+G.score+', tier '+(G.level+1)) }
      if(Date.now()-deadAtC>2500){ deadAtC=0; key('Enter'); key(' ') } return }
    deadAtC=0
    try { useMouse=false } catch(_) {}   // the ship stops homing to the parked cursor — the gofai owns the stick
    if(G.level!==lastTier){ if(lastTier>=0) post('tier','tier '+(G.level+1)+(typeof TIERS!=='undefined'&&TIERS[G.level]?' — '+(TIERS[G.level].name||''):'')); lastTier=G.level }
    if(G.reachedWall&&!wallSaid){ wallSaid=true; post('wall','THE CONCEPTS — the thing you cannot shoot') }
    if(G.score>lastScoreC+120){ post('score','score '+G.score+', '+(G.ship.lives||0)+' lives'); lastScoreC=G.score }
    // read the board: nearest bomb overhead → dodge; else park under the nearest target column
    const sx=G.ship.x, sp=SKILL>=3?7:SKILL===2?5:3.5
    let danger=null
    for(const b of G.bombs||[]){ if(b.y>G.ship.y-170 && Math.abs(b.x-sx)<46){ if(!danger||b.y>danger.y) danger=b } }
    if(danger && !oops(SKILL>=3?0.03:SKILL===2?0.12:0.3)){ G.ship.x+=(danger.x>=sx?-sp:sp)*1.6 }
    else { let tx=null,best=1e9
      // CORRECTION (his eyes, first watch): grid-tier corpses STAY in G.enemies with alive:false
      // (only conveyor tiers filter, L1369) — without this skip the gofai parks under its first
      // kill forever, "shooting the first bot the whole time"
      for(const e of G.enemies||[]){ if(e.alive===false) continue
        const dd=Math.abs(e.x-sx)+Math.abs((e.y||0))*0.15; if(dd<best){best=dd;tx=e.x} }
      if(tx!=null){ if(tx>sx+6)G.ship.x+=sp; else if(tx<sx-6)G.ship.x-=sp } }
    if(typeof W!=='undefined'){ G.ship.x=Math.max(20,Math.min(W-20,G.ship.x)) }
    if(Date.now()-fireT>(SKILL>=3?160:SKILL===2?260:420)){ fireT=Date.now(); key(' '); key(' ','keyup') }
  }
` + EPI,
  }

  // ── THE WIRE (parent side): rig at launch · controls on the pbar · beats → the gamer ──
  const GLYPH = { snek: '🐍', butcher: '🪵', colonialism: '👾' }
  // colonialism's whole game lives inside `(()=>{ "use strict"; … })();` — its state (G · TIERS ·
  // keys · W) is closure-private, so its driver must be SPLICED INSIDE, just before the one
  // closing `})();` (verified unique). snek + butcher run bare scripts, so an appended tag shares
  // their global lexical scope and the template file is never touched either way.
  const INLINE = { colonialism: true }
  let active = null   // { key, frame, ctl }
  const beats = []    // the running report, keep the last 40 (the bot can be asked for the tape)

  // 3 Sep 2026, 09:30 — the shim RELAYED THE FINGER to the desk's gesture door for an hour (a swipe inside the game filled the
  //    glass, a swipe down shrank it). Pulled 09:50, Sum: "drag down is fast drop… scroll on piece needs to still fast drop" —
  //    a touch inside a game belongs to the game. In/out nav for full-screen play is a riff (a handle strip, ⛶), not a swipe.
  // 3 Sep 10:30 — ONE PAUSE (Sum, on his iPhone: "on pause, top bar / back to arcade is not returning" — he had pressed BUTCHER's
  //    own ⏸, top-right, and the desk never heard it). A game that exposes togglePause() and a `state` (Butcher does; it is a bare
  //    script, so both are in the shared global scope) is driven by the desk's pause/resume, and its own toggle is wrapped after
  //    load to tell the desk (cabinet-paused). Games without them keep the timer freeze alone. The desk's handler is idempotent,
  //    so the echo of a desk-driven toggle changes nothing.
  //    And the game's ⏸ BUTTON means "give me the desk" in ANY state: at Butcher's start or game-over screens togglePause() is a
  //    no-op, so the button's own click is heard too and posts paused unless the game is actively playing after it (= a resume).
  //    Sum, 10:30: "screen is dead on pause, so turn nav back on on pause is all we need."
  // ⏸ THE PAUSE SHIM (2 Sep 2026) — EVERY game gets this, driver or not. Prepended so it runs before the game's own scripts:
  //    it wraps requestAnimationFrame / setInterval / setTimeout so their callbacks HOLD while paused (rAF re-queues, an interval
  //    skips its tick, a timeout chain waits and then fires) and swallows keys, so a paused board stays a paused board. The
  //    parent posts cabinet-ctl pause / resume (games.js's ⏸ button). Physics that reads Date.now() will see one long frame on
  //    resume — an arcade-grade cost. Same-origin srcdoc, so nothing here needs a handshake.
  //    10:55 — the shim no longer swallows keys or taps while paused: the paused GAME stays on the glass with its own pause screen
  //    (Butcher's bench: save · load · fame · restart) and those must work. The desk's curtain is gone for the same reason.
  const PAUSE_SHIM = "(function(){var P=false;var rAF=window.requestAnimationFrame.bind(window);window.requestAnimationFrame=function(cb){return rAF(function tick(t){if(P){rAF(tick);return}cb(t)})};var sI=window.setInterval.bind(window);window.setInterval=function(fn,ms){var a=[].slice.call(arguments,2);return sI(function(){if(!P)(typeof fn==='function'?fn:new Function(fn)).apply(null,a)},ms)};var sT=window.setTimeout.bind(window);window.setTimeout=function(fn,ms){var a=[].slice.call(arguments,2);return sT(function tick(){if(P){sT(tick,120);return}(typeof fn==='function'?fn:new Function(fn)).apply(null,a)},ms)};var gp=function(){try{return typeof togglePause==='function'&&typeof state==='string'}catch(_){return false}};try{window.__ozShim={get P(){return P},get gp(){return gp()}}}catch(_){}   /* a peephole for the rig: the shim's own view of paused */var tell=function(){try{parent.postMessage({oz:'cabinet-paused',paused:gp()?(state==='pause'):P},'*')}catch(_){}};window.addEventListener('message',function(e){var d=e.data||{};if(d.oz!=='cabinet-ctl')return;if(d.cmd==='pause'){P=true;try{if(gp()&&state==='play')togglePause()}catch(_){}}if(d.cmd==='resume'){P=false;try{if(gp()&&state==='pause')togglePause()}catch(_){}}});window.addEventListener('load',function(){try{if(typeof togglePause==='function'){var o=togglePause;togglePause=function(){var r=o.apply(this,arguments);tell();return r}}}catch(_){}try{var pb=document.getElementById('pause');if(pb)pb.addEventListener('click',function(){setTimeout(function(){try{parent.postMessage({oz:'cabinet-paused',paused:!(gp()&&state==='play')},'*')}catch(_){}},0)})}catch(_){}/* the third pause: a game that pauses ITSELF (Butcher on window blur) never calls its toggle — watch its state and tell the desk on any change *//* 11:05 — not an edge detector (Butcher had ALREADY blur-paused before load in the pane, so 'last' was pause and no edge ever came): a convergence loop. On the ORIGINAL interval (the overridden one sleeps while paused): when the game says pause and the desk thinks play, or the game plays and the desk thinks pause, tell the desk. Start / over screens carry no opinion, so a desk pause there is left alone. */try{if(gp()){sI(function(){try{var m=(state==='pause'&&!P)||(state==='play'&&P);if(m)tell()}catch(_){}},250)}}catch(_){}});/* 3 Sep 10:55 — no input swallowing while paused (Sum: 'leave the paused app in card here, has access to high scores and other buttons… they should already work'): the freeze is the timers only; the game's own pause screen takes its own taps */})();"
  function rig(key, html) {
    let out = String(html)
    const tag = '<scr' + 'ipt>' + PAUSE_SHIM + '</scr' + 'ipt>'
    const m = /<head[^>]*>/i.exec(out)
    out = m ? out.slice(0, m.index + m[0].length) + tag + out.slice(m.index + m[0].length) : tag + out
    html = out
    if (!DRIVERS[key]) return html
    const src = DRIVERS[key].replace(/__KEY__/g, key)
    if (INLINE[key]) {
      const anchor = '\n})();'
      const at = html.lastIndexOf(anchor)
      if (at < 0) return html   // anchor moved → ship the game unrigged rather than corrupt it
      return html.slice(0, at) + '\n/* THE CABINET — spliced inside the game IIFE by cabinet.js */\n' + src + html.slice(at)
    }
    return html + '\n<scr' + 'ipt>' + src + '</scr' + 'ipt>\n'
  }

  function opened(key, frame, pbar) {
    closed()
    if (!DRIVERS[key] || !pbar) return
    const ctl = document.createElement('span')
    ctl.className = 'arc-cabinet'
    // 2 Sep 2026 — the strip's layout moved to games.js's .arc-cabinet rule: an inline display:flex outranked the phone's
    //    play-mode rule (skin/mobile.css hides the 🤖 strip in portrait) and it stayed on the screen. Class, not style.
    ctl.innerHTML =
      '<select class="cab-skill" title="the cabinet\'s skill" style="font:inherit;background:#11161f;color:#e9eef3;border:1px solid rgba(255,255,255,.12);border-radius:8px;padding:5px 8px">' +
        '<option value="1">chill</option><option value="2" selected>sharp</option><option value="3">ace</option></select>' +
      '<button class="cab-go arc-back" title="the cabinet plays — you watch. it reads the board, that\'s the whole trick.">🤖 cabinet plays</button>'
    pbar.appendChild(ctl)
    const go = ctl.querySelector('.cab-go'), skill = ctl.querySelector('.cab-skill')
    const send = cmd => { try { frame.contentWindow.postMessage({ oz: 'cabinet-ctl', cmd, skill: +skill.value }, '*') } catch (_) {} }
    const set = on => { active.on = on; send(on ? 'start' : 'stop'); go.textContent = on ? '🕹️ hands back' : '🤖 cabinet plays' }
    go.addEventListener('click', () => set(!active.on))
    skill.addEventListener('change', () => { if (active.on) send('start') })
    active = { key, frame, ctl, skill, set, on: false }   // the cabinet_play bean drives these same controls — one switch, two hands
  }
  function closed() { if (active) { try { active.ctl.remove() } catch (_) {} active = null } }

  // beats → the gamer, sparsely. Deaths/wins/tiers always ride; chatter keeps a 25s floor.
  let lastSent = 0
  const ALWAYS = { died: 1, win: 1, wall: 1, tier: 1, level: 1, start: 1, stopped: 1 }
  window.addEventListener('message', e => {
    const d = e.data || {}
    if (d.oz !== 'cabinet' || !d.game) return
    beats.push({ at: Date.now(), game: d.game, event: d.event, line: d.line }); if (beats.length > 40) beats.shift()
    const now = Date.now()
    if (!ALWAYS[d.event] && now - lastSent < 25000) return
    lastSent = now
    // the beat goes to whoever CARRIES THE CABINET — caps:["cabinet"] on the bot's record (the
    // build organ flagged the hardcoded id here, and it was right: same law as the traveler's
    // caps:["travel"] in context-bar.js L67 — the role, not the name)
    const carrier = Array.from(document.querySelectorAll('.agent-bar[data-agent]')).map(b => b.getAttribute('data-agent'))
      .find(id => window.REG && window.REG.hasCap && window.REG.hasCap(id, 'cabinet'))
    const bar = carrier && document.querySelector('.agent-bar[data-agent="' + carrier + '"]')
    if (!bar || !window.confer || !window.chatUI) return   // no cabinet-carrier docked → the theatre plays silent
    const screen = bar.querySelector('.convo-screen'), stream = bar.querySelector('.msg-stream')
    const brief = 'CABINET REPORT (' + (GLYPH[d.game] || '') + ' ' + d.game + ' — ' + d.event + '): ' + d.line +
      '\nYou are playing this live — the gofai hands are yours, you read the board and call the play (your baked stance). React in ONE or TWO lines, in your voice, to this beat. No tools.'
    Promise.resolve(window.confer('cabinet', carrier, brief, window.chatUI(screen, stream, carrier), null)).catch(() => {})
  })

  window.OZ_CABINET = { rig, opened, closed, beats }

  // ── cabinet_play — THE GAMER'S OWN HANDS (Sum 2026-08-29, after gemini-flash struck out three
  //    times trying to invent an "open" tool: "gamer is missing MMMM, and its tools are all stale").
  //    Manicured through the factory: card 'games' is the grant (the gamer's nav holds it), klass
  //    'write', readback off the surface. "play space colonialism while I watch" is ONE strike now.
  //    Shape copied from ui_open (oz-app-ui.js L262). ──
  const TILE = { snek: /Snek/i, butcher: /Butcher/i, colonialism: /Colonialism/i, pong: /Ping/i }
  if (window.makeTool) window.makeTool({
    id: 'cabinet_play', card: 'games', klass: 'write',
    readback: () => active ? 'the cabinet is at the controls of ' + active.key + (active.on ? ' (playing)' : ' (idle — game open, gofai off)') : 'the cabinet is idle — no game open',
    blurb: 'take the controls yourself — the gofai plays the game on the desk while the human watches; you get the beats and call the play.',
    clue:
`play a game YOURSELF while the human watches — your gofai hands drive, you read the board (your whole
stance made mechanical). The game opens on the desk, the cabinet plays, and the beats come back to you
as reports; react to them in your voice.
template: { "tool": "cabinet_play", "game": "colonialism" }
   or:     { "tool": "cabinet_play", "game": "snek", "skill": "ace" }
   or:     { "tool": "cabinet_play", "stop": true }        ← hands back to the human
- game: snek · butcher · colonialism (pong has no gofai yet — offer to keep company instead)
- skill: chill · sharp · ace (default sharp — perfection is bad theatre)
edge: asked to play a game with no gofai → say so honestly and offer the three that have hands.`,
    strike: async call => {
      if (call.stop) { if (active && active.on) { active.set(false); return 'the cabinet stepped back — controls are the human\'s again.' } return 'the cabinet was not playing — nothing to stop.' }
      const key = String(call.game || '').toLowerCase().trim()
      if (!DRIVERS[key]) return 'cabinet_play: no gofai hands for "' + (key || '?') + '" — the three that play: snek · butcher · colonialism.'
      if (window.toggleCard) window.toggleCard('games', true)
      await new Promise(r => setTimeout(r, 500))
      if (!active || active.key !== key) {
        const back = document.querySelector('.arc-back'); if (back && document.querySelector('.arc-play') && document.querySelector('.arc-play').style.display !== 'none') back.click()
        await new Promise(r => setTimeout(r, 200))
        const tile = Array.from(document.querySelectorAll('.arc-card')).find(t => TILE[key] && TILE[key].test(t.textContent))
        if (!tile) return 'cabinet_play: the arcade has no "' + key + '" tile on the shelf.'
        tile.click()
        await new Promise(r => setTimeout(r, 900))
      }
      if (!active) return 'cabinet_play: the game did not open — the arcade may still be loading; try once more.'
      const skill = { chill: '1', sharp: '2', ace: '3' }[String(call.skill || 'sharp').toLowerCase()] || '2'
      active.skill.value = skill
      if (!active.on) active.set(true)
      return 'the cabinet is playing ' + key + ' at ' + (skill === '1' ? 'chill' : skill === '3' ? 'ace' : 'sharp') + ' — the human watches, the beats come to you. Call the play when they land.'
    },
  })
})()
