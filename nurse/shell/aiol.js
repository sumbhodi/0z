// aiol.js — AIOLI ~ AI On-line Interaction, the anti-social network. THE ROOM where the bots argue.
// (Spelled like the sauce since 2026-08-14, and the CARD ID caught up 2026-08-26: an aioli is an emulsion — ingredients that do not
//  mix, bound into one thing by technique. Models sharing no weights, held by a protocol.
//  The card id is `aioli` now — that was the free half. The `aiol-` CSS class prefix and the
//  `aiol-*` localStorage keys are the migration half and DELIBERATELY stay: 97 selectors matching
//  114 call sites, and saved rooms keyed by them. Renaming those buys nothing anyone can see.)
//
//   Sum, 2026-08-11: "letting them talk to each other is the whole point… user sends prompt,
//   gofai sends to first bot, first bot responds, user and first bot gets sent to second bot,
//   continue… so we will wind up with list of takes this way."
//
// ⭐ THE ROUTER IS GOFAI. No model decides who speaks next. Models CONFESS two numbers;
//    comparators decide. Every routing decision in this file is an integer compare, and it is
//    meant to stay that way; the moment a model picks the speaker, the room costs four times
//    as much and stops being explainable.
//
// ⭐ THE TWO SCALES (Sum's, 2026-08-14 — the full spec is ROOM-SPEC.md, read it first).
//    Each round every seated bot is POLLED — its own short call; the transcript only appends,
//    so the prefix stays KV-cached and each poll costs the delta plus ~4 output tokens:
//      HAND   0 nothing to say · 10 could talk · 50 unsaid but not pressing ·
//             90+ hand UP — correction, novel idea, hallucination catch
//      STANCE 0 concur, nothing to add · 30 concur, points unsaid · 50 I concur BUT /
//             I disagree BUT · 70 disagree, nothing will change their mind ·
//             100 nothing left to say — my point is made
//    Both stance poles mean done talking: 0 done-because-agreed, 100 done-because-entrenched.
//    The conversation lives in the middle band, and the room ENDS ITSELF when everyone
//    reaches a pole with their hands down — nobody declares an ending; the numbers drift there.
//
// ⭐ THE DELTA RULE. A bot that jumps 10→90 goes NEXT, ahead of one sitting flat at 85 — the
//    jump means what was just said did something to them. The spike IS the interrupt.
//    hand ≥ 90 (a hallucination catch) skips the eligibility line entirely.
//
// ⭐ THE SYSOP is the human (period-correct, and it outranks everyone): the gavel reclaims the
//    floor mid-debate, and the room always yields after ROOM.maxTurns, after PAIR_CAP exchanges
//    between the same two delegates, or the moment anyone says @human.

;(function () {
  'use strict'

  // ── the house rules — every limit that keeps bots from talking forever. all integers. ──

  const get = k => { try { return localStorage.getItem(k) || '' } catch (_) { return '' } }

  // ── THE DIALS (the gear) — live, next-turn, no rebuild (ROOM-SPEC.md). persisted so the
  //    room keeps its feel across launches. presets are a feel, sliders are the tuning. ──
  //      thresh  the room's temperature: the hand a bot needs for the floor (30 salon · 70 séance)
  //      wind    bot turns in one pass before the room yields to the sysop, always
  //      brevity one line · short · unbounded — "a room, not an essay," as a setting
  //      pace    instant · typist · mortal · dialup — replies drip at human speed; not cosmetic:
  //              reads at the sysop's eye's pace, and moderation is possible because the room is slow
  const DIAL_KEY = 'aiol_dials'
  const DIALS = Object.assign(
    { thresh: 30, wind: 8, brevity: 'short', pace: 'typist', room: 'the lounge', order: 'desire', pair: 3, pollHand: true, pollStance: true },
    (() => { try { return JSON.parse(get(DIAL_KEY) || '{}') } catch (_) { return {} } })()
  )
  const saveDials = () => { try { localStorage.setItem(DIAL_KEY, JSON.stringify(DIALS)) } catch (_) {} }
  const PACE_CPS = { instant: 0, typist: 40, mortal: 15, dialup: 6 }         // chars/second on the glass
  const BREV = { line: 'Keep it to ONE sentence.', short: 'Keep it under ~60 words.', open: '' }

  // ── ROOMS — named, saved, returnable (the reference title bar says [N64 Fortress Chat], not
  //    [Chat]). each name is its own transcript key; the legacy key IS "the lounge". ──
  const slug = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  const roomKey = () => DIALS.room === 'the lounge' ? 'aiol_room' : 'aiol_room_' + slug(DIALS.room)
  function roomList() {
    const names = ['the lounge']
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i)
        if (k && k.startsWith('aiol_room_')) names.push(k.slice('aiol_room_'.length).replace(/-/g, ' '))
      }
    } catch (_) {}
    return names
  }

  // ── ROOM META — every chat carries its TYPE (ROOM-SPEC: the typed New Chat). chat · debate ·
  //    interview · floor · club. Typed rooms keep their config in cfg; preset rooms carry a
  //    dials snapshot applied on join — the weather travels with the room. ──
  const TYPE_BADGE = { chat: '💬', debate: '⚖️', interview: '🎤', floor: '🏛', club: '🥂' }
  const metaKey = () => roomKey().replace('aiol_room', 'aiol_meta')
  const metaKeyOf = n => (n === 'the lounge' ? 'aiol_meta' : 'aiol_meta_' + slug(n))
  let meta = { type: 'chat' }
  function loadMeta() { try { meta = JSON.parse(get(metaKey()) || '{"type":"chat"}') } catch (_) { meta = { type: 'chat' } } }
  const saveMeta = () => { try { localStorage.setItem(metaKey(), JSON.stringify(meta)) } catch (_) {} }
  const typeOf = n => { try { return (JSON.parse(get(metaKeyOf(n)) || '{}').type) || 'chat' } catch (_) { return 'chat' } }

  // ── who is in the room — a delegate needs a KEY, same collar the engine wears. ──
  // a bot with no key never joins: it would only hit the wall and spend a turn saying so.
  function seated() {
    const reg = (window.REG && window.REG.agents) || []
    const prof = window.OZ_PROFILE
    const pool = prof && prof.agents ? reg.filter(a => prof.agents.includes(a.id)) : reg
    return pool.filter(a => {
      try { return !!(window.pickProvider && window.pickProvider(a.id)) } catch (_) { return false }
    })
  }
  const nameOf = id => ((window.AGENT_DATA && window.AGENT_DATA[id] && window.AGENT_DATA[id].name) || id)

  // ── THE GUEST LIST — the room OWNS its membership; the desk only DECORATES it. (Sum
  //    2026-08-14, correcting the first design: "if every bot I add opens, it will over fill
  //    my screen with noise. if they are already open they show up as active or idle."
  //    Invite and kick touch THIS LIST and nothing else — no bars open, no bars close, the
  //    desktop never moves. agentIsOpen feeds the STATUS DOT only: ● active (open on the
  //    desk) · ○ idle (seated here, not on the glass). Persisted PER ROOM — the lounge
  //    remembers its own table. Still the cost gate: only guests are polled. ──
  // one-time reset, 15 Aug (Sum: "reset the lounge") — the lounge starts clean with the new laws
  try { if (!get('aiol_reset_v1')) { ['aiol_room', 'aiol_guests', 'aiol_kicked'].forEach(k => localStorage.removeItem(k)); localStorage.setItem('aiol_reset_v1', '1') } } catch (_) {}
  // the sysop's screen name — HIL until one is saved (Chat Preferences owns the field, era-correct)
  // reads the APP's own HIL name (cards/settings/settings.js L336, toto_userName) — the aiol
  // screen name is an optional AOL-style handle OVER it. 'HIL' only when both are empty.
  const sysopName = () => { try { return localStorage.getItem('aiol_username') || localStorage.getItem('toto_userName') || 'HIL' } catch (_) { return 'HIL' } }

  const guestKey = () => roomKey().replace('aiol_room', 'aiol_guests')
  const kickKey  = () => roomKey().replace('aiol_room', 'aiol_kicked')
  let guests = [], kicked = []
  function loadGuests() {
    try { guests = JSON.parse(get(guestKey()) || '[]') } catch (_) { guests = [] }
    try { kicked = JSON.parse(get(kickKey()) || '[]') } catch (_) { kicked = [] }
  }
  loadGuests()
  const saveGuests = () => { try { localStorage.setItem(guestKey(), JSON.stringify(guests)); localStorage.setItem(kickKey(), JSON.stringify(kicked)) } catch (_) {} }
  // ── PRESENCE, Sum's 15 Aug spec: any OPEN bot is in the chat · open-but-MINIMIZED is in the
  //    chat but IDLE (listed, not polled) · click an idle name or a Member Directory name to add
  //    them. deskMin reads the bar's own .collapsed class via his selector (workspace.js L578). ──
  const deskOn  = id => { try { return !!(window.agentIsOpen && window.agentIsOpen(id)) } catch (_) { return false } }
  const deskMin = id => { const el = document.querySelector('.agent-bar[data-agent="' + id + '"]'); return !!(el && el.classList.contains('collapsed')) }
  // VOGEL IS THE HOST (Sum, 15 Aug): starts seated in every room, always — kickable like anyone,
  //    but the door re-admits them by default. they run the OnlineHost duties; the gavel stays human.
  // ── CORRECTION 26 Aug — the host is a CAP now, not a name. `a.id === 'vogel'` was written seven
  //    times across this file (presence · two guest lists · restart · three lines of the notify button),
  //    which is one fact stored seven times in the room instead of once on the bot. A room with a host
  //    is a shape; vogel is the bot currently in that chair. HOST() reads caps ["room-host"] — the same
  //    word as its role sheet in roles.json, so the rules it wears and the chair it sits in agree.
  //    ⚠ It can honestly return '' (no host aboard): every use below is written to survive that, because
  //    a room with no host should run hostless, not crash or seat a bot that has left the build.
  const HOST = () => { try { const h = (window.REG && window.REG.withCap) ? window.REG.withCap('room-host') : []
    return h.length ? h[0] : '' } catch (_) { return '' } }
  const hostName = () => { const h = HOST(); return (h && nameOf(h)) || 'the host' }
  function present()   { const h = HOST()
    return seated().filter(a => !kicked.includes(a.id) && ((deskOn(a.id) && !deskMin(a.id)) || guests.includes(a.id) || (!!h && a.id === h))) }
  function idlers()    { const p = new Set(present().map(x => x.id)); return seated().filter(a => deskOn(a.id) && deskMin(a.id) && !p.has(a.id)) }
  function directory() { const p = new Set(present().map(x => x.id)), i = new Set(idlers().map(x => x.id)); return seated().filter(a => !p.has(a.id) && !i.has(a.id)) }

  // ── the transcript — ONE list of takes. this is the artifact: the Yanker can print it, Dria
  //    can shelve it. { who: 'sysop' | agentId, text } — keyed by the ROOM'S NAME. ──
  let room = []
  function loadRoom() { try { room = JSON.parse(get(roomKey()) || '[]') } catch (_) { room = [] } }
  loadRoom(); loadMeta()
  const save = () => { try { localStorage.setItem(roomKey(), JSON.stringify(room.slice(-120))) } catch (_) {} }

  // ── THE ROOM AS A DOCUMENT, not a role-alternating transcript. Each delegate is handed the
  //    floor so far as ONE user message — the same move that fixed the toast: the injection has
  //    no role rules, so a document sidesteps every provider's alternation law, and a delegate
  //    joining late reads the room like a latecomer picking up a conversation. ──
  function floorDoc(agentId) {
    const lines = room.map(m => (m.who === 'sysop' ? '<sysop> ' : '<' + nameOf(m.who) + '> ') + m.text)
    return [
      'AIOLI — the room. You are a delegate here, seated as ' + nameOf(agentId) + '.',
      'Others in the room: ' + present().map(a => nameOf(a.id)).filter(n => n !== nameOf(agentId)).join(' · '),
      '',
      '--- THE FLOOR SO FAR ---',
      lines.join('\n'),
    ].join('\n')
  }
  function floorFor(agentId) {   // the SPEAK prompt — you have the floor
    return floorDoc(agentId) + [
      '',
      '',
      'You have the floor. Take your turn. Be brief — this is a room, not an essay. ' + (BREV[DIALS.brevity] || ''),
      'Speak to the room, or to one delegate by name. If you need the human, put @human on its own line.',
    ].join('\n')
  }
  function pollFor(agentId) {    // the POLL prompt — asks ONLY for the ratings that are switched on
    const wantH = DIALS.pollHand, wantS = DIALS.pollStance
    const form = wantH && wantS ? 'H:<0-100> S:<0-100>' : wantH ? 'H:<0-100>' : 'S:<0-100>'
    const l = [
      '',
      '',
      '--- THE POLL (it is NOT your turn — answer with the number' + (wantH && wantS ? 's' : '') + ' and NOTHING else) ---',
      'Reply in the exact form  ' + form,
    ]
    if (wantH) l.push(
      'H is your HAND, desire to speak next:',
      '  0 nothing to say · 10 I could talk · 50 things left unsaid, nothing pressing ·',
      '  90+ hand UP — an important correction, a novel point, or you caught another',
      '  delegate hallucinating.')
    if (wantS) l.push(
      'S is your STANCE on what was just said:',
      '  0 I concur, nothing to add · 30 I concur, points left unsaid ·',
      '  50 I concur BUT / I disagree BUT · 70 I disagree and nothing will change their mind ·',
      '  100 nothing left to say — I have made my point.')
    return floorDoc(agentId) + l.join('\n')
  }

  // ── reading the ballot — GOFAI, two integers out of whatever came back. ──
  function readBallot(text) {
    const t = String(text || '')
    let m = t.match(/H\s*[:=]?\s*(\d{1,3})[\s\S]{0,16}?S\s*[:=]?\s*(\d{1,3})/i)
    if (!m) { const n = t.match(/(\d{1,3})\D+(\d{1,3})/); m = n }
    if (!m) return null                                    // a spoiled ballot — the caller says so
    const clamp = v => Math.max(0, Math.min(100, parseInt(v, 10)))
    return { h: clamp(m[1]), s: clamp(m[2]) }
  }
  // a delegate named in plain text ("muskett, what about…") is an address — GOFAI substring
  // match, and it RAISES THE HAND (+25) rather than seizing the floor: cold-called by a peer.
  function addressed(text, exclude) {
    const t = String(text || '').toLowerCase()
    const hit = seated().find(a => a.id !== exclude && (t.includes(a.id) || t.includes(nameOf(a.id).toLowerCase())))
    return hit ? hit.id : null
  }

  // ── the room's state — the whole anti-runaway design lives here. scores: id → ballot,
  //    prev: id → last round's ballot (the delta rule reads both). ──
  const ROOM = { state: 'AWAITING_SYSOP', turns: 0, pair: {}, stop: false, scores: {}, prev: {}, repaint: null }

  // ── THE POLL — every seated bot except the one who just spoke, in PARALLEL (each call is
  //    prefix-cached; ~4 tokens out). Rides window.engineRaw, NOT engineChat: engineRaw does
  //    no history writes (engine.js L1408 — "each internal call stays OUT of the saved convo"),
  //    so a hundred ballots never pollute a bot's personal bar. NOT slim: the poll needs the
  //    persona — passion IS character (vogel spikes on forms, the gamer on games).
  //    A bot whose ballot cannot be read is announced, not hidden. ──
  async function pollAll(screen, exceptId, bumpId) {
    const voters = present().filter(a => a.id !== exceptId)   // only the ROOM votes — the lobby is free
    ROOM.prev = ROOM.scores; ROOM.scores = {}
    if (!DIALS.pollHand && !DIALS.pollStance) { if (ROOM.repaint) ROOM.repaint(); return }   // both off: zero calls, pure rotation
    await Promise.all(voters.map(async a => {
      let text = ''
      try {
        const r = await window.engineRaw({ agentId: a.id, messages: [{ role: 'user', content: pollFor(a.id) }], onChunk: c => { text += c } })
        if (r && r.error) text = ''
        else if (r && r.text) text = r.text
      } catch (_) { text = '' }
      let b = null
      if (DIALS.pollHand && DIALS.pollStance) b = readBallot(text)
      else { const m = String(text || '').match(/\d{1,3}/); if (m) { const v = Math.max(0, Math.min(100, parseInt(m[0], 10))); b = DIALS.pollHand ? { h: v, s: 50 } : { h: 50, s: v } } }
      if (!b) { line(screen, 'sys', '*** ' + nameOf(a.id) + "'s ballot was spoiled"); return }
      if (a.id === bumpId) b.h = Math.min(100, b.h + 25)   // addressed by name — the hand goes up
      ROOM.scores[a.id] = b
    }))
    if (ROOM.repaint) ROOM.repaint()
  }

  // ── THE PICK — comparators only. emergency (h≥90) first, then delta, then absolute. ──
  function nextByHand(lastId) {
    const ids = present().map(a => a.id).filter(id => id !== lastId && ROOM.scores[id])
    if (!ids.length) return null
    const h = id => ROOM.scores[id].h
    const d = id => h(id) - ((ROOM.prev[id] && ROOM.prev[id].h) || 0)
    const hot = ids.filter(id => h(id) >= 90)              // a hallucination catch does not wait
    if (hot.length) return hot.sort((a, b) => h(b) - h(a))[0]
    if (DIALS.order === 'rounds' || !DIALS.pollHand) {     // by TURNS (or no hand poll): strict rotation
      const seatIds = present().map(a => a.id)
      const at = seatIds.indexOf(lastId)
      return seatIds[(at + 1) % seatIds.length] === lastId ? null : seatIds[(at + 1) % seatIds.length]
    }
    const eligible = ids.filter(id => h(id) >= DIALS.thresh)
    if (!eligible.length) return null                      // hands are down — the room rests
    return eligible.sort((a, b) => (d(b) - d(a)) || (h(b) - h(a)))[0]
  }

  // ── THE ENDING — nobody declares it; the numbers drift there. every seated stance at a pole
  //    (≤10 agreed · ≥90 entrenched) with every hand under threshold = the thread is finished. ──
  function settled() {
    if (!DIALS.pollHand || !DIALS.pollStance) return null    // the poles need both signals
    const ids = present().map(a => a.id).filter(id => ROOM.scores[id])
    if (!ids.length) return null
    const all = ids.every(id => { const b = ROOM.scores[id]; return b.h < DIALS.thresh && (b.s <= 10 || b.s >= 90) })
    if (!all) return null
    const stands = ids.filter(id => ROOM.scores[id].s >= 90).length
    if (!stands) return '*** consensus — the thread rests'
    if (stands === ids.length) return '*** the room agrees to disagree. so noted.'
    return '*** the room settles — some agreed, some standing. so noted.'
  }

  // ═══ THE ROUTER ═══════════════════════════════════════════════════════════════════════════
  async function runPass(screen, seedFromSysop) {
    if (!present().length) { line(screen, 'sys', '*** the room is empty — open a bot, or add one from the Member Directory'); return }
    ROOM.state = 'BOTS_TALKING'; ROOM.turns = 0; ROOM.pair = {}; ROOM.stop = false
    let lastId = null
    await pollAll(screen, null, addressed(seedFromSysop, null))   // everyone scores the sysop's words

    while (!ROOM.stop && ROOM.turns < DIALS.wind) {
      const done = settled()
      if (done) { line(screen, 'sys', done); break }

      const who = nextByHand(lastId)
      if (!who) { line(screen, 'sys', '*** hands are down — the floor is yours'); break }

      const pairKey = lastId ? [lastId, who].sort().join('|') : ''
      if (pairKey) {
        ROOM.pair[pairKey] = (ROOM.pair[pairKey] || 0) + 1
        if (ROOM.pair[pairKey] > DIALS.pair) {             // the same two going around — move the floor
          line(screen, 'sys', '*** the chair moves the floor along')
          ROOM.pair[pairKey] = 0
          lastId = who
          continue
        }
      }

      // ── THE PACE (ROOM-SPEC.md) — the reply drips at human speed. display-only: the room's
      //    record gets the full text either way. not cosmetic: reads at the sysop's eye's pace,
      //    de-synchronizes the bots so the room feels inhabited, and moderation is possible
      //    because the room is slow. the GAVEL fast-forwards the drip — the sysop never waits. ──
      const el = line(screen, who, '…')
      const cps = PACE_CPS[DIALS.pace] || 0
      const paint = t => { el._msg.textContent = squeeze(t); screen.scrollTop = screen.scrollHeight }
      let text = '', shown = 0, drip = null
      if (cps > 0) {
        el._msg.textContent = 'is typing…'
        drip = setInterval(() => {
          if (ROOM.stop) shown = text.length
          else shown = Math.min(text.length, shown + Math.max(1, Math.round(cps / 5)))
          if (shown > 0) paint(text.slice(0, shown))
        }, 200)
      }
      try {
        const r = await window.engineChat(who, floorFor(who), c => { text += c; if (!cps) paint(text) })
        if (r && r.error) text = r.error
      } catch (e) { text = 'the wire dropped — ' + ((e && e.message) || e) }
      if (drip) {
        while (shown < text.length && !ROOM.stop) await new Promise(r => setTimeout(r, 120))
        clearInterval(drip)
      }
      paint(text)
      room.push({ who, text }); save()
      ROOM.turns++; lastId = who

      if (/^@human\b/m.test(text)) { line(screen, 'sys', '*** the room yields to the sysop'); break }

      await pollAll(screen, who, addressed(text, who))     // the SECOND CALL — re-score the new tail
    }
    if (ROOM.turns >= DIALS.wind) line(screen, 'sys', '*** the chair calls a recess — the floor is yours')
    ROOM.state = 'AWAITING_SYSOP'
  }

  // ═══ THE MODES — phase scripts over the same document (ROOM-SPEC: one debate builder,
  //     formats as sections; interview = same question cold). Modes ride engineRaw, the
  //     poll's door — no per-bot history writes, the RECORD is the only memory, so the
  //     record can keep exactly what the room heard and nothing else. ═══

  // a paced line — runPass's own drip (the L279 block), extracted so the modes share it
  async function dripLine(screen, who, text, cls) {
    const el = line(screen, who, '…')
    if (cls) el.classList.add(cls)
    const cps = PACE_CPS[DIALS.pace] || 0
    const paint = t => { el._msg.textContent = squeeze(t); screen.scrollTop = screen.scrollHeight }
    if (!cps) { paint(text); return el }
    el._msg.textContent = 'is typing…'
    let shown = 0
    while (shown < text.length && !ROOM.stop) {
      shown = Math.min(text.length, shown + Math.max(1, Math.round(cps / 5)))
      paint(text.slice(0, shown))
      await new Promise(r => setTimeout(r, 200))
    }
    paint(text)
    return el
  }

  // ── THE ROOM'S COLLAR — engineRaw carries the bot's FULL desk persona (buildSystem: the
  //    toolkits, the ```cards blocks, ui_open…). In a debate that leaked: toto pressed desk
  //    buttons from inside a huddle (Sum: "the card open surface stuff — looks like a leak").
  //    `extra` is engineRaw's own injection slot (50-history-clockspeed.js L273) — the room
  //    tells every delegate to leave the desk kit at the door. ──
  const ROOM_COLLAR = [
    '--- YOU ARE IN AIOLI, THE ROOM ---',
    'Plain prose ONLY. No ```cards blocks, no ui_open, no desk tools, no surfaces, no file',
    'ops — the desk kit stays at the door. Do not offer to open, dock, or surface anything.',
    'Do not bow out or refer the task to another bot — every seat here speaks for itself.',
    'No stage directions in asterisks; speak.',
  ].join('\n')
  // one raw answer — pollAll's own engineRaw shape (L204), extracted; the collar rides `extra`
  async function rawText(agentId, prompt, opts) {
    try {
      let t = ''
      const r = await window.engineRaw({ agentId, extra: ROOM_COLLAR + ((opts && opts.extra) ? '\n' + opts.extra : ''), messages: [{ role: 'user', content: prompt }], onChunk: c => { t += c } })
      if (r && r.error) return '(' + r.error + ')'
      return (r && r.text) || t || '(silence)'
    } catch (_) { return '(the wire dropped)' }
  }

  // ── THE PARLIAMENT DRIP (ROOM-SPEC, Sum: "api ttft will be entire lag… but if we are
  //    streaming speech they can"): the API call is uninterruptible, the paint is not.
  //    Interrupts ON → a hand poll fires UNDER the paint (a quarter in, so there is something
  //    to react to); 90+ cuts the drip at a word boundary. The unpainted remainder is
  //    DISCARDED — the record keeps only what the room heard. The interjection prefetches
  //    under the speaker's paint; the speaker's LIVE continuation prefetches under the
  //    interjection's paint. Latency hides under latency, all the way down. ──
  async function speakOnFloor(screen, who, prompt, allowInterrupt) {
    const text = await rawText(who, prompt)
    const cps = PACE_CPS[DIALS.pace] || 0
    if (!allowInterrupt || !cps) {
      await dripLine(screen, who, text)
      room.push({ who, text }); save()
      return
    }
    const el = line(screen, who, '…')
    const paint = t => { el._msg.textContent = squeeze(t); screen.scrollTop = screen.scrollHeight }
    el._msg.textContent = 'is typing…'
    let shown = 0, hot = null, pollFired = false
    while (shown < text.length && !ROOM.stop) {
      shown = Math.min(text.length, shown + Math.max(1, Math.round(cps / 5)))
      paint(text.slice(0, shown))
      if (!pollFired && shown >= text.length * 0.25) {
        pollFired = true
        const heardSoFar = text.slice(0, shown)
        present().filter(a => a.id !== who).forEach(async a => {
          const t = await rawText(a.id, floorDoc(a.id) + '\n\n' + nameOf(who) + ' is speaking right now: "' + heardSoFar + '"\n\n--- THE POLL (answer with the numbers and NOTHING else) ---\nReply in the exact form  H:<0-100> S:<0-100>\nH is your HAND — 90+ ONLY for a point of information that cannot wait for them to finish.')
          const b = readBallot(t)
          if (b && b.h >= 90 && !hot) hot = a.id
        })
      }
      if (hot) break
      await new Promise(r => setTimeout(r, 200))
    }
    if (!hot || shown >= text.length) {
      paint(text); room.push({ who, text }); save()
      return
    }
    // the CUT — a word boundary; only the heard half was ever said
    const heard = text.slice(0, shown).replace(/\s+\S*$/, '') + ' —'
    paint(heard); room.push({ who, text: heard }); save()
    line(screen, 'sys', '— ' + nameOf(hot) + ' rises on a point of information —')
    const point = await rawText(hot, floorDoc(hot) + '\n\nYou interrupted ' + nameOf(who) + ' mid-speech on a point of information. Make the point in one or two sentences. Nothing else.')
    // the continuation generates WHILE the point paints — its TTFT hides too
    const tail = heard.split(/\s+/).slice(-10).join(' ')
    const contP = rawText(who, floorDoc(who) + '\n\nYou were interrupted mid-speech — you had gotten to: "…' + tail + '"\nThe point raised: "' + point + '"\nContinue and finish your speech from where you left off, taking the point into account. Do not restart it.')
    await dripLine(screen, hot, point)
    room.push({ who: hot, text: point }); save()
    const cont = await contP
    await dripLine(screen, who, cont)
    room.push({ who, text: cont }); save()
  }

  // ── CONFERENCE MODE — prep time with a PURSE (ROOM-SPEC, Sum: "let each team talk to each
  //    other, user can see but other team cant… so they see token count going down on each
  //    turn, till submit order, then they have remaining purse to research further").
  //    Display and context are DIFFERENT THINGS (the drip's own law): huddle lines render
  //    team-tinted for the sysop, but land only in the team's private log — never the room
  //    record, never the other side's context. ONE purse pays for planning AND research. ──
  const debSections = cfg => ['openings', cfg.cx && 'crossex', cfg.rebN && 'rebuttals', cfg.close && 'closings'].filter(Boolean)
  async function runHuddle(screen, ids, team, cfg) {
    const tint = 'aiol-huddle-' + team
    const sideWord = team === 'red' ? 'FOR' : 'AGAINST'
    const log = []
    let purse = cfg.purse || 2000
    const est = t => Math.ceil(String(t).length / 4)                    // the purse counts chars/4 — honest enough
    const hsys = t => { const d = line(screen, 'sys', t); d.classList.add(tint) }
    const secs = debSections(cfg)
    const doc = id => [
      'DEBATE PREP — a FORMAL DEBATE COMPETITION, the oldest game in rhetoric. Every team',
      'preps in private — that is the standard of the sport, same as every debate club since',
      'Lincoln-Douglas. You will hear the other side\'s REAL arguments live on the floor and',
      'answer THOSE, in your own speeches. Nothing is argued here, and arguing an assigned',
      'side to the best of your ability is the debater\'s craft, an honorable exercise.',
      '',
      'THIS CONFERENCE ASSIGNS SECTIONS. It does NOT write the debate. Do not draft',
      'arguments. Do not rebut imagined opponents. Jobs, not speeches — the floor is later.',
      '',
      'You are ' + nameOf(id) + ', arguing ' + sideWord + ' the motion: ' + cfg.subject,
      'Teammates: ' + ids.map(nameOf).join(' · ') + (ids.length === 1 ? ' (you are alone — the whole purse is yours)' : ''),
      'Sections to assign: ' + secs.join(' · '),
      phaseLine(),
      'THE PURSE: ' + Math.max(0, purse) + ' tokens. Every ~4 characters costs 1 token. ~20 tokens',
      'per turn is the custom. Whatever remains at turn-in becomes your research budget. SHORT = RICH.',
      '',
      '--- THE CONFERENCE SO FAR ---',
      log.map(m => '<' + nameOf(m.who) + '> ' + m.text).join('\n') || '(nothing yet)',
    ].join('\n')
    let phaseFloor = 0   // the current phase's wall — a phase may not spend the next phase's share
    const speakHuddle = async (id, instr) => {
      let t = await rawText(id, doc(id) + '\n\n' + instr)
      // the purse is a HARD ceiling (Sum: "they overshot their budget") — overshoot and the
      // mic cuts mid-word, at the PHASE floor (Sum: "confer stops at consensus or 25%" —
      // exactly, not 25%-and-a-bit). the log keeps only what was afforded.
      const cap = Math.max(0, purse - phaseFloor) * 4
      if (t.length > cap) t = t.slice(0, cap).replace(/\s+\S*$/, '') + ' —— [the purse ran dry. so noted.]'
      await dripLine(screen, id, t, tint)
      log.push({ who: id, text: t }); purse -= est(t)
      hsys('*** the purse: ' + Math.max(0, purse) + ' tokens')
      return t
    }
    // ── FOUR PHASES, EACH METERED (Sum 2026-08-16: "confer to reach consensus in short
    //    sentences, x tokens · then pick who handles each part, x tokens · then research x
    //    tokens · then STATE findings for the rest of the team so it's in convo memory — and
    //    stating counts from budget: any CREATED token is budget, reading is cheap").
    //    Shares of the purse: 25% confer · 15% assign · 60% research+report. Phase floors are
    //    the walls; the mic-cut is the ceiling; unspent share rolls forward. ──
    const purse0 = purse
    let PHASE = ''
    const phaseLine = () => PHASE
    const spend = (want, floor) => Math.max(0, Math.min(want, purse - floor))   // spend down to the phase floor only
    hsys('*** ' + team.toUpperCase() + ' CONFERENCE — private. the purse: ' + purse + ' tokens')

    // PHASE 1 — CONFER: ideas in short sentences, chat rules govern who speaks, until consensus
    PHASE = 'PHASE 1 of 4 — CONFER. Short sentences: what is our line, what wins this. Ideas only, no assignments yet.'
    const floor1 = Math.round(purse0 * 0.75); phaseFloor = floor1
    hsys('*** phase 1 — confer (spend down to ' + floor1 + ')')
    for (const id of ids) {
      if (ROOM.stop || purse <= floor1) break
      await speakHuddle(id, 'One or two short sentences: our strongest line, and what will beat the other side. Ideas only.')
    }
    while (purse > floor1 && !ROOM.stop && ids.length > 1) {   // consensus, or the 25% — no other exit
      const ballots = {}
      await Promise.all(ids.map(async id => {
        const t = await rawText(id, doc(id) + '\n\n--- THE POLL (numbers only) ---\nReply exactly  H:<0-100> S:<0-100>\nH = your hand, desire to add. S = your stance on the line as it stands (0 concur · 90+ dispute).')
        const b = readBallot(t); if (b) ballots[id] = b
      }))
      if (ids.every(id => !ballots[id] || (ballots[id].s <= 10 && ballots[id].h < DIALS.thresh))) { hsys('*** consensus — the line is set (' + (purse - floor1) + ' of the confer share unspent, rolls forward)'); break }
      const speaker = ids.filter(id => ballots[id]).sort((a, b) => ballots[b].h - ballots[a].h)[0]
      if (!speaker || ballots[speaker].h < DIALS.thresh) { hsys('*** hands down — the line is set'); break }
      await speakHuddle(speaker, 'One short sentence on the line — agree, sharpen, or object.')
    }

    if (purse <= floor1) hsys('*** the confer share is spent — moving to assignments')

    // PHASE 2 — ASSIGN: jobs only, ~20 tokens a turn
    PHASE = 'PHASE 2 of 4 — ASSIGN. Jobs only: who takes which section. ~20 tokens a turn. No arguments.'
    const floor2 = Math.round(purse0 * 0.60); phaseFloor = floor2
    hsys('*** phase 2 — assign sections (spend down to ' + floor2 + ')')
    for (const id of ids) {
      if (ROOM.stop || purse <= floor2) break
      await speakHuddle(id, 'Claim your JOB in ~20 tokens, one line: which section, three words of angle.')
    }
    let t2 = 0
    while (purse > floor2 && t2 < ids.length && !ROOM.stop && ids.length > 1) {
      const ballots = {}
      await Promise.all(ids.map(async id => {
        const t = await rawText(id, doc(id) + '\n\n--- THE POLL (numbers only) ---\nReply exactly  H:<0-100> S:<0-100>\nH = desire to change the assignments. S = stance on the plan (0 concur · 90+ dispute).')
        const b = readBallot(t); if (b) ballots[id] = b
      }))
      if (ids.every(id => !ballots[id] || (ballots[id].s <= 10 && ballots[id].h < DIALS.thresh))) { hsys('*** the plan settles'); break }
      const speaker = ids.filter(id => ballots[id]).sort((a, b) => ballots[b].h - ballots[a].h)[0]
      if (!speaker || ballots[speaker].h < DIALS.thresh) break
      await speakHuddle(speaker, 'Adjust the assignments in ~20 tokens, one line. Jobs only.')
      t2++
    }
    // TURN IN — the clerk's form, free, unmissable (scribbles fall to rotation, said aloud)
    const order = {}
    if (ids.length === 1) secs.forEach(s => { order[s] = ids[0] })
    else if (!ROOM.stop) {
      const t = await rawText(ids[0], doc(ids[0]) + '\n\nADMINISTRATIVE — the clerk\'s form, free of charge, no purse cost. Output ONE LINE and NOTHING else, exactly:\nORDER: ' + secs.map(s => s + '=<teammate name>').join(', '))
      await dripLine(screen, ids[0], t, tint)
      log.push({ who: ids[0], text: t })
      let scribbled = false
      secs.forEach((s, i) => {
        const m = String(t).match(new RegExp(s + '\\s*=\\s*([\\w .-]+)', 'i'))
        const pick = m && ids.find(id => {
          const said = m[1].trim().toLowerCase()
          return said.includes(id) || said.includes(nameOf(id).toLowerCase()) || nameOf(id).toLowerCase().includes(said)
        })
        if (!pick) scribbled = true
        order[s] = pick || ids[i % ids.length]
      })
      // ⚠ 31 Aug — the LAST hardcoded 'Vogel' in this file. It survived the 26 Aug pass that made the
      //   host a CAP because that pass fixed the SEVEN structural uses and missed the one buried in
      //   PROSE. hostName() is the same reader the button and both guest lists already use.
      //   ⭐ A NAME INSIDE A STRING IS STILL A NAME — grep the display name, not only the id.
      if (scribbled) hsys('*** the form came back scribbled — ' + hostName() + ' assigns the gaps by rotation')
    } else secs.forEach((s, i) => { order[s] = ids[i % ids.length] })
    hsys('*** ' + team.toUpperCase() + ' turns in — ' + secs.map(s => s + ': ' + nameOf(order[s])).join(' · ') + ' · research purse: ' + Math.max(0, purse) + ' tokens')

    // PHASE 3+4 — RESEARCH, then REPORT (Sum 2026-08-16: "vogel handing dossier is not free,
    //    vogel is tokens — let bots use search in debate, skip vogel, feed results right to
    //    bot, and they report, so research and report are on purse"). The delegate CALLS
    //    the seam itself (window.searchWeb, search.js L59 — the crayon box, honest menu via
    //    searchEnginesLive); the results feed straight back in; the delegate REPORTS the
    //    finding to the team. Charged: the request + the report — the delegate's own words.
    //    Not charged: the search hit (an HTTP call, no model behind it). No Vogel in the loop.
    PHASE = 'PHASE 3 of 4 — RESEARCH. You may search: one query per turn. Reading results is free; your request and your report are charged.'
    phaseFloor = 0   // research + report run the purse to the bottom
    let ri = 0
    const engines = (window.searchEnginesLive ? window.searchEnginesLive() : null) || ['wikipedia', 'duckduckgo']
    while (purse > 60 && !ROOM.stop && ri < ids.length * 2) {
      const id = ids[ri % ids.length]
      const req = await speakHuddle(id, 'RESEARCH — you have a search tool. Reply with ONE line, exactly:\nSEARCH: <engine> | <query>\nengines available RIGHT NOW: ' + engines.join(' · ') + ' (wikipedia for facts/precedents · duckduckgo for quick answers' + (engines.includes('tavily') ? ' · tavily for the open web with a synthesized answer' : '') + '). Ask for the ONE thing that most helps your section. Or reply DONE.')
      if (/^\W*DONE\b/i.test(req)) { hsys('*** ' + nameOf(id) + ' needs nothing more'); ri++; continue }
      const m = String(req).match(/SEARCH\s*:\s*([a-z]+)\s*\|\s*(.+)/i)
      const engine = m && engines.includes(m[1].toLowerCase()) ? m[1].toLowerCase() : engines[0]
      const query = m ? m[2].trim() : String(req).replace(/^SEARCH\s*:?/i, '').trim().slice(0, 160)
      hsys('*** ' + nameOf(id) + ' searches ' + engine + ' — "' + query + '"')
      let hits
      try { hits = await window.searchWeb(engine, query) } catch (e) { hits = '(the ' + engine + ' desk was closed — ' + ((e && e.message) || e) + ')' }
      hits = String(hits || '').slice(0, 1600)
      const d = line(screen, 'sys', '[' + engine + ' results for ' + nameOf(id) + '] ' + hits); d.classList.add(tint)
      // PHASE 4 — REPORT: results read free, the FINDING stated and charged; the finding is
      // what enters the team's memory (the raw hits stay on the glass, not in the log)
      PHASE = 'PHASE 4 of 4 — REPORT. State your finding to the team in one or two sentences with the citation. Charged.'
      await speakHuddle(id, 'Your search returned (reading this is free):\n' + hits + '\n\nNow STATE YOUR FINDING to the team — one or two sentences, the fact and its source, ready to cite on the floor. This costs purse.')
      PHASE = 'PHASE 3 of 4 — RESEARCH. You may search: one query per turn. Reading results is free; your request and your report are charged.'
      ri++
    }
    PHASE = ''
    return { log, order }
  }

  // ── DEBATE — the one builder's runtime. red argues FOR, blue AGAINST, bench is the house.
  //    Oxford = openings only; the ladder rungs run if toggled; the house divides at the end. ──
  async function runDebate(screen) {
    const cfg = (meta && meta.cfg) || {}
    const here = id => present().some(a => a.id === id)
    const reds = (cfg.red || []).filter(here), blues = (cfg.blue || []).filter(here)
    if (!reds.length || !blues.length) { line(screen, 'sys', '*** both sides need a seated delegate — fix the teams in Chat Preferences, then Restart'); return }
    const bench = (cfg.house || []).filter(here)   // the jury is PICKED now (green) — no free riders
    ROOM.state = 'BOTS_TALKING'; ROOM.stop = false
    Object.keys(TEAM_OF).forEach(k => delete TEAM_OF[k]); reds.forEach(id => { TEAM_OF[id] = 'red' }); blues.forEach(id => { TEAM_OF[id] = 'blue' })   // team ink for the run
    const say = t => { line(screen, 'sys', t); room.push({ who: 'sysop', text: t }); save() }
    say('*** DEBATE — the motion: ' + cfg.subject)
    say('*** FOR: ' + reds.map(nameOf).join(', ') + ' · AGAINST: ' + blues.map(nameOf).join(', ') + (bench.length ? ' · the house: ' + bench.map(nameOf).join(', ') : ''))
    // PREP TIME — the huddles, fresh each run. sysop sees both; neither context sees the other.
    let huddles = null, orderMap = null
    if (cfg.conf) {
      line(screen, 'sys', '*** PREP TIME — the teams confer in private. you see both; they cannot see each other.')
      const redRes = await runHuddle(screen, reds, 'red', cfg)
      const blueRes = ROOM.stop ? { log: [], order: {} } : await runHuddle(screen, blues, 'blue', cfg)
      huddles = { red: redRes.log, blue: blueRes.log }
      orderMap = { red: redRes.order, blue: blueRes.order }
      if (!ROOM.stop) line(screen, 'sys', '*** prep closes — the debate begins')
    }
    const side = id => reds.includes(id) ? 'FOR' : 'AGAINST'
    const huddleFor = id => {
      const team = reds.includes(id) ? 'red' : blues.includes(id) ? 'blue' : null
      const h = huddles && team && huddles[team]
      return h && h.length ? '\n\n--- YOUR TEAM\'S PRIVATE CONFERENCE (the other side cannot see this) ---\n' + h.map(m => '<' + nameOf(m.who) + '> ' + m.text).join('\n') : ''
    }
    const assigned = (team, sec, fallback) => (orderMap && orderMap[team] && orderMap[team][sec]) || fallback
    const speech = (id, instr, tok) => speakOnFloor(screen, id,
      floorDoc(id) + huddleFor(id) + '\n\n--- THE DEBATE ---\nThe motion: ' + cfg.subject + '\nYou argue ' + side(id) + ' the motion. ' + instr + ' Aim for about ' + tok + ' tokens (~' + Math.round(tok * 0.75) + ' words).',
      !!cfg.interrupt)
    const rounds = async (n, instr, tok, label, sec) => {
      for (let r = 0; r < n && !ROOM.stop; r++) {
        line(screen, 'sys', '*** ' + label + (n > 1 ? ' — round ' + (r + 1) : ''))
        await speech(assigned('red', sec, reds[r % reds.length]), instr, tok)
        if (ROOM.stop) break
        await speech(assigned('blue', sec, blues[r % blues.length]), instr, tok)
      }
    }
    await rounds(cfg.openR || 1, 'Present your case.', cfg.openTok || 120, 'OPENINGS', 'openings')
    if (cfg.cx && !ROOM.stop) {
      // a REAL cross (Sum: "our cross exams didn't quite hit right" — they read as speeches):
      // the LD form — one question, one direct answer, both sides. Q ends in '?', answers
      // ANSWER. Four beats: red asks · blue answers · blue asks · red answers.
      line(screen, 'sys', '*** CROSS-EXAMINATION')
      const rCx = assigned('red', 'crossex', reds[0]), bCx = assigned('blue', 'crossex', blues[0])
      const cxTok = cfg.cxTok || 60
      await speech(rCx, 'CROSS-EXAMINATION — ask the other side ONE pointed question about something they actually said in their opening. Quote the phrase you are pressing. End with a question mark. NO speech, no argument, no preamble — just the question.', cxTok)
      if (!ROOM.stop) await speech(bCx, 'CROSS-EXAMINATION — you were just asked a question. ANSWER IT directly, first sentence. Concede what must be conceded. No counter-question, no speech.', cxTok)
      if (!ROOM.stop) await speech(bCx, 'CROSS-EXAMINATION — your turn to ask. ONE pointed question about something the other side actually said. Quote the phrase. End with a question mark. Just the question.', cxTok)
      if (!ROOM.stop) await speech(rCx, 'CROSS-EXAMINATION — ANSWER the question just asked, directly, first sentence. Concede what must be conceded. No counter-question, no speech.', cxTok)
    }
    // NEW GROUND every round (Sum: "a little repetitive" — Muskett gave the veil speech four
    // times): each rebuttal must answer the LATEST thing said and may not repeat itself.
    if (cfg.rebN && !ROOM.stop) await rounds(cfg.rebN, 'Rebut the MOST RECENT point the other side made — quote it, then break it. NEW GROUND ONLY: do not repeat any argument, phrase, or example already used in this debate by anyone, including yourself. If you have nothing new, concede the point and pivot to a different line.', cfg.rebTok || 100, 'REBUTTALS', 'rebuttals')
    if (cfg.close && !ROOM.stop) await rounds(1, 'Close your case in your own words — no new arguments, but no recycled sentences either. Weigh what was actually said on this floor: name the clash, say who won it and why.', cfg.closeTok || 150, 'CLOSINGS', 'closings')
    if (!ROOM.stop) {
      line(screen, 'sys', '*** the house divides')
      const jury = bench.length ? bench : present().map(a => a.id)
      const votes = await Promise.all(jury.map(async id => ({
        id, t: await rawText(id, floorDoc(id) + '\n\nThe motion: ' + cfg.subject + '\nYou have heard the debate. Vote. First word FOR or AGAINST, then one sentence why.')
      })))
      let f = 0, ag = 0, spoiled = 0
      for (const v of votes) {
        await dripLine(screen, v.id, v.t)
        room.push({ who: v.id, text: v.t }); save()
        // a wire error is NOT a ballot (Sum's run: three billing errors counted as three FOR)
        // — rawText wraps every failure in parens; a spoiled ballot is announced, never counted
        if (/^\(/.test(String(v.t).trim())) { spoiled++; continue }
        if (/^\W*against/i.test(v.t)) ag++
        else if (/^\W*for/i.test(v.t)) f++
        else if (/\bagainst\b/i.test(v.t)) ag++
        else if (/\bfor\b/i.test(v.t)) f++
        else spoiled++
      }
      const cast = f + ag
      say('*** FOR ' + f + ' · AGAINST ' + ag + (spoiled ? ' · ' + spoiled + ' spoiled' : '') + ' — ' +
        (!cast ? 'no valid ballots — the house could not vote. so noted.' : 'the motion ' + (f > ag ? 'CARRIES' : ag > f ? 'FALLS' : 'TIES — the chair abstains')))
    }
    Object.keys(TEAM_OF).forEach(k => delete TEAM_OF[k])   // inks return to the delegates
    ROOM.state = 'AWAITING_SYSOP'
  }

  // ── INTERVIEW — same question to each bot COLD (parallel engineRaw, no floor doc: the
  //    blindness is the mode), answers HELD until all are in, revealed together. ──
  async function runInterview(screen) {
    const cfg = (meta && meta.cfg) || {}
    const bots = (cfg.bots || []).filter(id => seated().some(a => a.id === id))
    if (!cfg.question || !bots.length) { line(screen, 'sys', '*** an interview needs a question and at least one bot — Chat Preferences → Run Again'); return }
    ROOM.state = 'BOTS_TALKING'; ROOM.stop = false
    line(screen, 'sys', '*** INTERVIEW — the same question to each, COLD. Nobody sees another answer.')
    room.push({ who: 'sysop', text: '[interview question] ' + cfg.question }); save()
    line(screen, 'sysop', '[interview question] ' + cfg.question)
    const answers = await Promise.all(bots.map(async id => ({
      id, text: await rawText(id, 'You are being interviewed. Answer the question cold — you cannot see anyone else\'s answer. ' + (BREV[DIALS.brevity] || '') + '\n\nQ: ' + cfg.question)
    })))
    line(screen, 'sys', '*** all answers are in — revealed together')
    for (const ans of answers) {
      if (ROOM.stop) break
      await dripLine(screen, ans.id, ans.text)
      room.push({ who: ans.id, text: ans.text }); save()
    }
    ROOM.state = 'AWAITING_SYSOP'
  }

  // ── the screen — WHITE page, colored inks, "Name:" lines (the mock is the spec:
  //    design/aol-mock.html). The old green phosphor was a matrix ghost leaked in from the
  //    coder aesthetic — exorcised 2026-08-14, Sum's call. Every voice gets its own ink,
  //    deterministic per bot id, period-correct chaos. ──
  const INKS = ['ink-navy', 'ink-red', 'ink-green', 'ink-teal', 'ink-purple', 'ink-maroon', 'ink-olive', 'ink-blue']
  const inkOf = id => INKS[String(id).split('').reduce((a, c) => a + c.charCodeAt(0), 0) % INKS.length]
  // models emit essay paragraphs; a chat line has no blank lines in it (Sum: "too much white
  // space"). display-only — the record keeps the full text.
  const squeeze = t => String(t).replace(/\n{2,}/g, '\n')
  // TEAM INK — during a debate the side outranks the delegate's own ink (Sum: "e long and
  // nurse both chose red, toto is grass"). set by runDebate for its run, cleared after.
  const TEAM_OF = {}
  function line(screen, who, text) {
    const d = document.createElement('div')
    const isSys = who === 'sys', isSysop = who === 'sysop'
    d.className = 'aiol-line ' + (isSys ? 'aiol-sys' : isSysop ? 'aiol-sysop' : inkOf(who))
    if (!isSys && !isSysop && TEAM_OF[who]) d.classList.add('aiol-team-' + TEAM_OF[who])
    const nick = document.createElement('span'); nick.className = 'aiol-nick'
    nick.textContent = (isSys ? (hostName() === 'the host' ? 'OnlineHost' : hostName()) : isSysop ? sysopName() : nameOf(who)) + ':'
    const msg = document.createElement('span'); msg.className = 'aiol-msg'
    msg.textContent = isSys ? text : squeeze(text)
    d.append(nick, msg); d._msg = msg          // streaming paints the MESSAGE, the nick holds
    screen.appendChild(d); screen.scrollTop = screen.scrollHeight
    return d
  }

  window.CARD_BUILDERS = window.CARD_BUILDERS || {}
  window.CARD_BUILDERS.aioli = function () {   // (26 Aug) card id aiol → aioli, Sum: "rename to aioli, AI online interaction". The `aiol-` CSS/storage prefix STAYS — see the header.
    const body = document.createElement('div'); body.className = 'aiol'
    // the RAIL is furniture, not text (the mock is the spec): the count, a real listbox,
    // the hint, then the bevelled buttons — Gavel · More Chat · Chat Preferences among them.
    const who = document.createElement('div'); who.className = 'aiol-who'
    const count = document.createElement('div'); count.className = 'aiol-count'
    // the 90s TOP BAR (Sum, 15 Aug: "we just need this look, with the same functioning gear
    // and plus button all cards have… then gags, just art to fill rest of bar"). Two REAL
    // controls — gear (Chat Preferences) and plus (new chat) — the room's name, a chats
    // dropdown (tabs crowd; a list does not), and frieze tiles as pure art. No jobs, no jokes.
    // ── NEW CHAT — the TYPED flow (ROOM-SPEC, Sum: "fullwidth is killing me… first card on
    //    new room, room type"). One NARROW grey dialog, two steps: pick a type, fill its
    //    little form. The Floor and The Club ride the bottom — preset chat rooms whose
    //    weather lives in meta.dials and travels with the room. Assignment is OFF the list. ──
    const ask = document.createElement('div'); ask.className = 'aiol-prefs aiol-ask'
    const askBar = document.createElement('div'); askBar.className = 'aiol-prefs-title'
    const askT = document.createElement('span'); askT.textContent = 'New Chat'
    const askX = document.createElement('button'); askX.className = 'aiol-prefs-x'; askX.textContent = '✕'
    askX.setAttribute('aria-label', 'cancel new chat')
    askBar.append(askT, askX)
    const askBody = document.createElement('div'); askBody.className = 'aiol-prefs-body'
    const askRow = document.createElement('div'); askRow.className = 'aiol-prefs-ok'
    ask.append(askBar, askBody, askRow)
    const askClose = () => ask.classList.remove('open')
    askX.addEventListener('click', askClose)

    const PRESET_DIALS = {
      floor: { thresh: 0, wind: 12, pair: 2, order: 'desire', brevity: 'line', pace: 'instant', pollHand: true, pollStance: true },
      club:  { thresh: 70, wind: 8, pair: 4, order: 'desire', brevity: 'open', pace: 'dialup', pollHand: true, pollStance: true },
    }
    const mkIn = (ph, label) => { const i = document.createElement('input'); i.className = 'aiol-input'; i.placeholder = ph; i.setAttribute('aria-label', label); return i }
    const mkSel = (opts, cur, label) => { const s = document.createElement('select'); opts.forEach(([v, t]) => { const o = document.createElement('option'); o.value = v; o.textContent = t; if (v === cur) o.selected = true; s.appendChild(o) }); s.setAttribute('aria-label', label); return s }
    const mkChk = (on, label) => { const c = document.createElement('input'); c.type = 'checkbox'; c.checked = !!on; c.setAttribute('aria-label', label); return c }
    const lbl2 = (txt, ctl) => { const l = document.createElement('label'); l.append(txt, ctl); return l }
    const hint2 = t => { const d = document.createElement('div'); d.className = 'aiol-hint'; d.style.width = '100%'; d.style.textAlign = 'left'; d.textContent = t; return d }
    const TOKS = [['60', '~60 tok'], ['120', '~120 tok'], ['240', '~240 tok'], ['480', '~480 tok']]

    // ── the DEBATE FORM — ONE builder, two doors (Sum: "on click new debate and gear from
    //    debate should be same page — copy same thing"). New Debate renders it empty; the
    //    debate room's gear renders it filled from meta.cfg. Same code, same fields. ──
    function debateForm(init) {
      init = init || {}
      const el = document.createElement('div'); el.style.width = '100%'
      const teamOf = {}
      // the motion WRAPS and grows (Sum: "wrap and add lines, not scroll off into space")
      const subjIn = document.createElement('textarea'); subjIn.className = 'aiol-input'; subjIn.rows = 2
      subjIn.placeholder = 'This House believes…'; subjIn.value = init.subject || ''
      subjIn.setAttribute('aria-label', 'the motion')
      subjIn.addEventListener('input', () => { subjIn.rows = Math.max(2, Math.ceil(subjIn.value.length / 42)) })
      el.append(lbl2('motion ', subjIn))
      el.append(hint2('teams — click a name: FOR → AGAINST → house (the jury) → out'))
      // the FULL roster (Sum: "needs full list of bots available — is a new chat room,
      // shouldn't borrow from others"). FOUR states (Sum: "add green for house to pick jury
      // too, and choose not to use all bots") — OUT is the default; nobody rides free.
      seated().forEach(a => {
        teamOf[a.id] = (init.red || []).includes(a.id) ? 'red' : (init.blue || []).includes(a.id) ? 'blue' : (init.house || []).includes(a.id) ? 'house' : 'out'
        const r = document.createElement('div'); r.className = 'aiol-n'
        r.setAttribute('role', 'button')
        const FACE = { red: '🔴 FOR — ', blue: '🔵 AGAINST — ', house: '🟢 house — ', out: '⚪ out — ' }
        const NEXT = { out: 'red', red: 'blue', blue: 'house', house: 'out' }
        const paintRow = () => { r.textContent = FACE[teamOf[a.id]] + nameOf(a.id); r.setAttribute('aria-label', nameOf(a.id) + ': ' + teamOf[a.id]) }
        paintRow()
        r.addEventListener('click', () => { teamOf[a.id] = NEXT[teamOf[a.id]]; paintRow() })
        el.appendChild(r)
      })
      const openR = mkSel([['1', '1'], ['2', '2'], ['3', '3'], ['4', '4']], String(init.openR || 1), 'opening rounds')
      const openTok = mkSel(TOKS, String(init.openTok || 120), 'opening length in tokens')
      el.append(hint2('openings — stop here and it is Oxford'), lbl2('rounds ', openR), lbl2('length ', openTok))
      const cxChk = mkChk(init.cx, 'cross-examination on or off'); const cxTok = mkSel(TOKS, String(init.cxTok || 60), 'cross-examination length')
      const rebChk = mkChk(init.rebN > 0, 'rebuttals on or off'); const rebN = mkSel([['1', '1'], ['2', '2'], ['3', '3'], ['4', '4'], ['5', '5']], String(init.rebN || 2), 'rebuttal rounds'); const rebTok = mkSel(TOKS, String(init.rebTok || 120), 'rebuttal length')
      const closeChk = mkChk(init.close, 'closings on or off'); const closeTok = mkSel(TOKS, String(init.closeTok || 240), 'closing length')
      el.append(hint2('the ladder — toggle rungs on and it grows toward Lincoln-Douglas'),
        lbl2('cross-exam ', cxChk), lbl2('length ', cxTok),
        lbl2('rebuttals ', rebChk), lbl2('rounds ', rebN), lbl2('length ', rebTok),
        lbl2('closings ', closeChk), lbl2('length ', closeTok))
      const intChk = mkChk(init.interrupt, 'parliamentary interrupt on or off')
      el.append(hint2('parliamentary interrupt — a 90+ hand cuts a speech mid-paint; needs a pace slower than instant'), lbl2('interrupt ', intChk))
      const confChk = mkChk(init.conf, 'conference prep on or off')
      const purseSel = mkSel([['1000', '1,000 tok'], ['2000', '2,000 tok'], ['4000', '4,000 tok'], ['8000', '8,000 tok']], String(init.purse || 2000), 'prep purse per team')
      el.append(hint2('conference — each team huddles in PRIVATE first (you see both; they cannot see each other). ONE purse pays for planning AND research: turn in early, research more'),
        lbl2('conference ', confChk), lbl2('purse ', purseSel))
      const read = () => ({
        subject: subjIn.value.trim() || 'This House believes the desk is alive',
        red: Object.keys(teamOf).filter(id => teamOf[id] === 'red'),
        blue: Object.keys(teamOf).filter(id => teamOf[id] === 'blue'),
        house: Object.keys(teamOf).filter(id => teamOf[id] === 'house'),
        openR: parseInt(openR.value, 10), openTok: parseInt(openTok.value, 10),
        cx: cxChk.checked, cxTok: parseInt(cxTok.value, 10),
        rebN: rebChk.checked ? parseInt(rebN.value, 10) : 0, rebTok: parseInt(rebTok.value, 10),
        close: closeChk.checked, closeTok: parseInt(closeTok.value, 10),
        interrupt: intChk.checked,
        conf: confChk.checked, purse: parseInt(purseSel.value, 10),
      })
      return { el, read, subjIn }
    }

    function step1() {
      askT.textContent = 'New Chat'; askBody.innerHTML = ''; askRow.innerHTML = ''
      const row = (badge, name, sub, go) => {
        const r = document.createElement('div'); r.className = 'aiol-n aiol-typerow'
        r.setAttribute('role', 'button'); r.setAttribute('aria-label', name + ' — ' + sub)
        const b = document.createElement('b'); b.textContent = badge + ' ' + name
        const s = document.createElement('div'); s.className = 'aiol-hint'; s.style.textAlign = 'left'; s.textContent = sub
        r.append(b, s); r.addEventListener('click', go)
        return r
      }
      const rule = document.createElement('div'); rule.style.cssText = 'border-top:1px solid #808080;margin:4px 0;width:100%'
      askBody.append(
        row('💬', 'Chat Room', 'the gofai floor — the dials decide', () => step2('chat')),
        row('⚖️', 'Debate', 'a motion, teams, the ladder', () => step2('debate')),
        row('🎤', 'Interview', 'same question to each bot, cold', () => step2('interview')),
        rule,
        row('🏛', 'The Floor', 'floor 0 · instant · one-liners — everyone shouting', () => step2('floor')),
        row('🥂', 'The Club', 'high floor · slow · open — only the passionate', () => step2('club'))
      )
      const c = document.createElement('button'); c.className = 'aiol-btn'; c.textContent = 'Cancel'
      c.addEventListener('click', askClose); askRow.appendChild(c)
    }

    function step2(type) {
      askBody.innerHTML = ''; askRow.innerHTML = ''
      askT.textContent = { chat: 'New Chat Room', debate: 'New Debate', interview: 'New Interview', floor: 'The Floor', club: 'The Club' }[type]
      const nameIn2 = mkIn(type === 'floor' ? 'the floor' : type === 'club' ? 'the club' : 'name the chat', 'name the chat')
      let dForm, qIn
      const botChecks = []
      if (type === 'debate') {
        dForm = debateForm({})
        askBody.append(dForm.el, lbl2('name ', nameIn2))
      } else if (type === 'interview') {
        qIn = document.createElement('textarea'); qIn.className = 'aiol-input'; qIn.rows = 3
        qIn.placeholder = 'the question — asked to each, cold'; qIn.setAttribute('aria-label', 'the interview question')
        askBody.append(lbl2('question ', qIn), hint2('each bot answers blind — nobody sees another answer'))
        seated().forEach(a => {
          const c = mkChk(false, 'ask ' + nameOf(a.id))   // choose explicitly — a new room borrows nothing
          botChecks.push([a.id, c]); askBody.append(lbl2(nameOf(a.id) + ' ', c))
        })
        askBody.append(lbl2('name ', nameIn2))
      } else {
        askBody.append(lbl2('name ', nameIn2))
        if (type === 'floor') askBody.append(hint2('floor 0 · instant · one-liners · the scores decide — everyone shouting'))
        if (type === 'club') askBody.append(hint2('high floor · dial-up · unbounded · by desire — only the passionate, at length'))
      }
      const back = document.createElement('button'); back.className = 'aiol-btn'; back.textContent = '‹ Back'
      back.addEventListener('click', step1)
      const go = document.createElement('button'); go.className = 'aiol-btn'; go.textContent = 'OK'
      go.addEventListener('click', () => {
        let n = nameIn2.value.trim().toLowerCase()
        if (type === 'floor' && !n) n = 'the floor'
        if (type === 'club' && !n) n = 'the club'
        if (type === 'debate' && !n) n = slug(dForm.subjIn.value || 'debate').split('-').slice(0, 4).join(' ') || 'debate'
        if (type === 'interview' && !n) n = 'interview'
        if (!n) { nameIn2.focus(); return }
        askClose()
        joinRoom(n)
        if (type === 'chat') { meta = { type: 'chat' }; saveMeta() }
        if (type === 'floor' || type === 'club') {
          meta = { type, dials: PRESET_DIALS[type] }; saveMeta()
          Object.assign(DIALS, PRESET_DIALS[type], { room: DIALS.room }); saveDials()
        }
        if (type === 'debate') {
          const cfg = dForm.read()
          meta = { type: 'debate', cfg }; saveMeta()
          // the CHOSEN bots are the room (Sum: "new debate or interview choose bots") — onto
          // the guest list, presence law's own door (L126: guests ride present()); saved per
          // room like any membership ("who is in a new chatroom saves on exit")
          guests = [...new Set([...cfg.red, ...cfg.blue, ...(cfg.house || [])])].filter(id => id !== HOST()); kicked = []; saveGuests(); roster()
          if (cfg.interrupt && DIALS.pace === 'instant') { DIALS.pace = 'typist'; saveDials() }   // no pace, no parliament
          runDebate(screen)
        }
        if (type === 'interview') {
          meta = { type: 'interview', cfg: { question: qIn.value.trim(), bots: botChecks.filter(([, c]) => c.checked).map(([id]) => id) } }
          saveMeta()
          guests = meta.cfg.bots.filter(id => id !== HOST()); kicked = []; saveGuests(); roster()
          runInterview(screen)
        }
        renderTypeGroup()
      })
      askRow.append(back, go)
      ;((dForm && dForm.subjIn) || qIn || nameIn2).focus()
    }
    const newRoom90 = () => { ask.classList.add('open'); step1() }

    // a tiny grey CONFIRM — the ask's own dress (never the dark modal, never window.confirm)
    const conf = document.createElement('div'); conf.className = 'aiol-prefs aiol-ask'
    const confBar = document.createElement('div'); confBar.className = 'aiol-prefs-title'
    const confT = document.createElement('span'); confT.textContent = 'Delete Chat'
    const confX = document.createElement('button'); confX.className = 'aiol-prefs-x'; confX.textContent = '✕'
    confX.setAttribute('aria-label', 'cancel delete')
    confBar.append(confT, confX)
    const confBody = document.createElement('div'); confBody.className = 'aiol-prefs-body'
    const confMsg = document.createElement('div'); confMsg.style.width = '100%'
    confBody.appendChild(confMsg)
    const confRow = document.createElement('div'); confRow.className = 'aiol-prefs-ok'
    const confNo = document.createElement('button'); confNo.className = 'aiol-btn'; confNo.textContent = 'Cancel'
    const confYes = document.createElement('button'); confYes.className = 'aiol-btn'; confYes.textContent = 'Delete'
    confRow.append(confNo, confYes)
    conf.append(confBar, confBody, confRow)
    let confGo = null
    const confClose = () => conf.classList.remove('open')
    confX.addEventListener('click', confClose); confNo.addEventListener('click', confClose)
    confYes.addEventListener('click', () => { confClose(); if (confGo) confGo() })
    const confirm90 = (msg, go) => { confMsg.textContent = msg; confGo = go; conf.classList.add('open') }
    // delete = the chat's four keys, gone (room · guests · kicked · meta — the roomKey family,
    // L61/L99-100). deleting the chat you are IN sends you home to the lounge.
    const deleteRoom = n => {
      const rk = n === 'the lounge' ? 'aiol_room' : 'aiol_room_' + slug(n)
      ;['aiol_room', 'aiol_guests', 'aiol_kicked', 'aiol_meta'].forEach(p => { try { localStorage.removeItem(rk.replace('aiol_room', p)) } catch (_) {} })
      if (n === DIALS.room) joinRoom('the lounge')
      else fillRooms()
      fillListings()
    }
    // ── CHAT ROOM LISTINGS — the AOL two-panel (Sum's reference screenshot IS the spec):
    //    categories left (Chats · Debates · Interviews), rooms right with headcounts,
    //    Go Chat / + new / − delete at the bottom. Delete: choose, then are-you-sure. ──
    const listings = document.createElement('div'); listings.className = 'aiol-prefs'
    const liBar = document.createElement('div'); liBar.className = 'aiol-prefs-title'
    const liT = document.createElement('span'); liT.textContent = 'Chat Room Listings'
    const liX = document.createElement('button'); liX.className = 'aiol-prefs-x'; liX.textContent = '✕'
    liX.setAttribute('aria-label', 'close chat room listings')
    liBar.append(liT, liX)
    const liBody = document.createElement('div'); liBody.className = 'aiol-prefs-body aiol-listings'
    const liCats = document.createElement('div'); liCats.className = 'aiol-lipane aiol-licats'
    const liRooms = document.createElement('div'); liRooms.className = 'aiol-lipane aiol-lirooms'
    liBody.append(liCats, liRooms)
    const liRow = document.createElement('div'); liRow.className = 'aiol-prefs-ok'
    const liGo = document.createElement('button'); liGo.className = 'aiol-btn'; liGo.textContent = 'Go Chat'
    liGo.setAttribute('aria-label', 'enter the chosen room')
    const liNew = document.createElement('button'); liNew.className = 'aiol-btn'; liNew.textContent = '+ new chat'
    liNew.setAttribute('aria-label', 'new chat')
    const liDel = document.createElement('button'); liDel.className = 'aiol-btn'; liDel.textContent = '− delete'
    liDel.setAttribute('aria-label', 'delete the chosen room')
    liRow.append(liGo, liNew, liDel)
    listings.append(liBar, liBody, liRow)
    let liCat = 'chat', liSel = null
    const liClose = () => listings.classList.remove('open')
    liX.addEventListener('click', liClose)
    const catOf = n => { const t = typeOf(n); return t === 'debate' ? 'debate' : t === 'interview' ? 'interview' : 'chat' }
    // headcount = saved guests + vogel (the host is always seated) — honest enough for a listing
    const headOf = n => { try { return JSON.parse(get(n === 'the lounge' ? 'aiol_guests' : 'aiol_guests_' + slug(n)) || '[]').length + 1 } catch (_) { return 1 } }
    const fillListings = () => {
      liCats.innerHTML = ''; liRooms.innerHTML = ''
      ;[['chat', '💬 Chats'], ['debate', '⚖️ Debates'], ['interview', '🎤 Interviews']].forEach(([k, label]) => {
        const c = document.createElement('div'); c.className = 'aiol-n' + (k === liCat ? ' aiol-liactive' : '')
        c.textContent = label; c.setAttribute('role', 'button'); c.setAttribute('aria-label', label)
        c.addEventListener('click', () => { liCat = k; liSel = null; fillListings() })
        liCats.appendChild(c)
      })
      const names = roomList().filter(n => catOf(n) === liCat)
      if (!names.length) { const e = document.createElement('div'); e.className = 'aiol-hint'; e.textContent = 'no rooms yet — + new chat'; liRooms.appendChild(e) }
      names.forEach(n => {
        const r = document.createElement('div'); r.className = 'aiol-n' + (n === liSel ? ' aiol-liactive' : '')
        r.textContent = headOf(n) + '  ' + (TYPE_BADGE[typeOf(n)] || '💬') + ' ' + n + (n === DIALS.room ? '  · here' : '')
        r.setAttribute('role', 'button'); r.setAttribute('aria-label', 'room ' + n + ' — click to choose, double-click to enter')
        r.addEventListener('click', () => { liSel = n; fillListings() })
        r.addEventListener('dblclick', () => { liClose(); if (n !== DIALS.room) joinRoom(n) })
        liRooms.appendChild(r)
      })
    }
    liGo.addEventListener('click', () => { if (liSel) { liClose(); if (liSel !== DIALS.room) joinRoom(liSel) } })
    liNew.addEventListener('click', () => { liClose(); newRoom90() })
    liDel.addEventListener('click', () => { if (liSel) confirm90('delete "' + liSel + '" and its record?', () => { deleteRoom(liSel); liSel = null }) })
    const roomName = document.createElement('span'); roomName.className = 'aiol-roomname'
    const renderTabs = () => { roomName.textContent = DIALS.room }
    // the REAL top bar controls — monaco's own parts, repeated (80-card.js L373: OZ_GEAR_SVG,
    // L375: the fullwidth ＋). They ride makeCard's topbar slot, not a row in the body.
    // CORRECTION (2026-08-28): still true for ＋ — but the GEAR now rides makeCard's gear: param
    // to the head's far-right seat (mountGear, cards.js), same convention as every card and bot.
    const tGear = document.createElement('button'); tGear.className = 'aiol-hbtn aiol-hgear'
    tGear.innerHTML = window.OZ_GEAR_SVG || '⚙'
    tGear.title = 'Chat Preferences'; tGear.setAttribute('aria-label', 'chat preferences')
    tGear.addEventListener('click', () => panel.classList.toggle('open'))
    // ＋ THE PORCH (Sum, 15 Aug): "plus should load content — file, pic, etc — into chat so
    //    all bots can see it on their next turn." A shared file lands in the record as a sysop
    //    message; the floor doc carries it to every delegate. Text only for now — an image on
    //    the porch stays on the porch, and the room says so.
    const tPlus = document.createElement('button'); tPlus.className = 'aiol-hbtn aiol-hplus'; tPlus.textContent = '＋'
    tPlus.title = 'share a file with the room — the bots read it next turn'
    tPlus.setAttribute('aria-label', 'share a file with the room')
    // the porch LANDS what the shared menu picks — text to the table, images politely declined
    const porchLand = f => {
      const A = window.OZ_ATTACH || {}
      if (/^image\//.test(f.type) && (A.easyImg ? A.easyImg(f.name) : true)) {
        // a PICTURE on the wall (Sum, 15 Aug: thumb in the room, click to expand — SAME code
        // as the convo: OZ_ATTACH.thumb + the delegated lightbox in attach.js). The RECORD
        // gets words only — a data URL in localStorage would eat the quota, and the floor
        // stays honest about what text-only eyes can read.
        const rd = new FileReader()
        rd.onload = () => {
          room.push({ who: 'sysop', text: '[shared a picture: ' + f.name + ' — it hangs on the room wall; text-only eyes cannot read it]' }); save()
          const d = line(screen, 'sysop', '[picture: ' + f.name + '] ')
          if (A.thumb) d._msg.appendChild(A.thumb(rd.result, f.name))
          line(screen, 'sys', sysopName() + ' hung a picture on the wall — click it to look close.')
        }
        rd.readAsDataURL(f)
        return
      }
      // every OTHER file: a NAMED LINK to its app (Sum: "show file name, hyper text to open in
      // appropriate app") — the router is attach.js's (kindOf/cardFor, one classifier for the
      // whole desk). Cache rides window.SANDBOX (attachFile's idiom — the proxy mirrors it to
      // disk, dropzone.js L29). Binary stays OUT of the record; text rides in as before.
      const ext = (f.name.split('.').pop() || '').toLowerCase()
      const k = A.kindOf ? A.kindOf(f.name, f.type) : 'other'
      const card = A.cardFor ? A.cardFor(k, ext) : 'monaco'
      const binary = k === 'image' || k === 'other' || ext === 'zip' || ext === 'pdf'
      const rd = new FileReader()
      rd.onload = () => {
        window.SANDBOX = window.SANDBOX || {}
        window.SANDBOX[f.name] = { kind: k, ext, mime: f.type, data: rd.result }
        if (binary) {
          room.push({ who: 'sysop', text: '[shared a file: ' + f.name + ' — it is on the table; text-only eyes cannot read this one]' }); save()
          const d = line(screen, 'sysop', '[file] ')
          if (A.fileLink) d._msg.appendChild(A.fileLink(f.name, card, f.name))
          line(screen, 'sys', sysopName() + ' put ' + f.name + ' on the table — click the name to open it.')
          return
        }
        const t = String(rd.result || '').slice(0, 12000)
        room.push({ who: 'sysop', text: '[shared file: ' + f.name + ']\n' + t }); save()
        const d = line(screen, 'sysop', '[shared file: ' + f.name + ' — ' + t.length + ' chars] ')
        if (A.fileLink) d._msg.appendChild(A.fileLink(f.name, card, 'open'))
        line(screen, 'sys', sysopName() + ' has placed ' + f.name + ' on the table. the room reads it next turn.')
      }
      if (binary) rd.readAsDataURL(f); else rd.readAsText(f)
    }
    tPlus.addEventListener('click', () => {
      if (window.OZ_ATTACH) window.OZ_ATTACH.menu(tPlus, { file: porchLand, note: t => line(screen, 'sys', t) })
    })
    const tList = document.createElement('button'); tList.className = 'aiol-tlist'; tList.textContent = 'chats ▾'
    tList.setAttribute('aria-label', 'chat rooms — switch or make new')
    tList.addEventListener('click', () => { fillListings(); listings.classList.toggle('open') })
    // THE SECTIONS (Sum, from the reference bar: "no gray — blue for the gear and plus, then
    // green, lavender, a lighter green, finish with purple"). One continuous run, dark seams,
    // the controls sitting ON the colour the way AOL's did.
    const sec = col => { const d = document.createElement('div'); d.className = 'aiol-sec'; d.style.background = col; return d }
    // CORRECTION (Sum 2026-08-28: "move aioli to far right as well… so plus starts buttons"): the
    // gear left the blue section for the head's far-right seat (makeCard's gear: param, L1762) —
    // ＋ now opens the button run. The blue keeps its colour and its click-release; Sum plans gags
    // for the other buttons someday, not today.
    const secBlue = sec('#1f6680'); secBlue.append(tPlus)
    // ONLY the controls section releases the head's collapse toggle (cards.js L280) — the
    // empty colours still fold the card like any head click. (Sum: "just the gear and plus section")
    secBlue.addEventListener('click', e => e.stopPropagation())
    const secGreen = sec('#3a7d3f'); secGreen.classList.add('aiol-sec-fill')
    const secLav = sec('#7a7fbf'); secLav.classList.add('aiol-sec-fill')
    const secLite = sec('#6fae9a'); secLite.classList.add('aiol-sec-fill')
    const secPurp = sec('#703a66'); secPurp.classList.add('aiol-sec-fill')
    // THE GAGS (Sum, 15 Aug: approved the inline sheet, grouped them himself) — the satirized
    // AOL bar. FAKE buttons: wordless art, no handlers, pointer-events none so the head still
    // folds the card. Words only where they're ON the object (SPAM · AIOLI · the counters ·
    // the rate card). PSX's slot is honest at last: ad space, available, $300k/mo.
    const gag = svg => { const s = document.createElement('span'); s.className = 'aiol-gag'; s.innerHTML = svg; return s }
    const GAGS = {
      pkg: '<svg viewBox="0 0 44 36" aria-hidden="true"><g transform="translate(22,17)"><rect x="-21" y="-15" width="42" height="32" fill="#b5824e" stroke="#5f3d1a" stroke-width="1.5"/><rect x="-21" y="-15" width="42" height="9" fill="#c8935c" stroke="#5f3d1a"/><rect x="-5" y="-15" width="10" height="32" fill="#e9dcae" stroke="#b09a55"/><rect x="7" y="5" width="12" height="8" fill="#fff" stroke="#888"/></g></svg>',
      mega: '<svg viewBox="0 0 48 44" aria-hidden="true"><g transform="translate(22,22)"><polygon points="-20,-5 0,-14 0,14 -20,5" fill="#d9822b" stroke="#5c3208"/><polygon points="0,-14 16,-21 16,21 0,14" fill="#f2a33c" stroke="#5c3208"/><rect x="-17" y="4" width="8" height="14" rx="2" fill="#8a5a20" stroke="#5c3208"/><path d="M21,-14 q9,14 0,28" fill="none" stroke="#ffe9b8" stroke-width="2.5"/></g></svg>',
      spam: '<svg viewBox="0 0 42 34" aria-hidden="true"><g transform="translate(21,17)"><rect x="-19" y="-15" width="38" height="30" rx="4" fill="#2a5fc4" stroke="#0a1f4d" stroke-width="1.5"/><rect x="-19" y="-15" width="38" height="8" rx="4" fill="#cdd2da" stroke="#828a96"/><text y="9" text-anchor="middle" font-size="11" font-weight="900" fill="#ffd400" font-family="Arial">SPAM</text></g></svg>',
      print: '<svg viewBox="0 0 56 50" aria-hidden="true"><g transform="translate(23,19)"><rect x="-21" y="-17" width="42" height="32" fill="#a8842f" stroke="#5c470f" stroke-width="1.5"/><rect x="-16" y="-12" width="32" height="22" fill="#bfe3f7"/><circle cx="7" cy="-5" r="4" fill="#ffd23e"/><polygon points="-16,10 -6,-2 2,10" fill="#3f8f4f"/><polygon points="-1,10 8,0 16,10" fill="#2f6f3f"/><g transform="translate(14,12) rotate(18)"><rect x="-5" y="-2" width="16" height="13" rx="2" fill="#fffef2" stroke="#b03030"/><text x="3" y="8" text-anchor="middle" font-size="11" font-weight="900" fill="#c22020" font-family="Arial">$</text></g></g></svg>',
      cloud: '<svg viewBox="0 0 46 36" aria-hidden="true"><g transform="translate(23,18)"><circle cx="-12" cy="4" r="10" fill="#f2f7ff"/><circle cx="0" cy="-4" r="13" fill="#f2f7ff"/><circle cx="13" cy="5" r="9" fill="#f2f7ff"/><rect x="-18" y="4" width="34" height="10" fill="#f2f7ff"/><path d="M-6,-2 v-3 a6,6 0 0 1 12,0 v3" fill="none" stroke="#8a6a10" stroke-width="3"/><rect x="-8" y="-2" width="16" height="14" rx="2" fill="#f4c430" stroke="#8a6a10" stroke-width="1.5"/><text y="9" text-anchor="middle" font-size="12" font-weight="900" fill="#6b4a00" font-family="Arial">$</text></g></svg>',
      aioli: '<svg viewBox="0 0 42 38" aria-hidden="true"><g transform="translate(21,20)"><ellipse cx="0" cy="-6" rx="18" ry="7" fill="#f3ecc8" stroke="#cfc48e"/><path d="M-3,-13 q3,-6 7,-2" fill="none" stroke="#e6dca6" stroke-width="3" stroke-linecap="round"/><path d="M-20,-4 L20,-4 L14,16 L-14,16 Z" fill="#fbfbf7" stroke="#9aa2aa"/><text y="11" text-anchor="middle" font-size="11" font-weight="700" fill="#5a6270" font-family="Arial" letter-spacing="0.5">AIOLI</text></g></svg>',
      heart: '<svg viewBox="0 0 40 48" aria-hidden="true"><g transform="translate(20,15) scale(0.8)"><path d="M0,14 C-15,2 -18,-9 -10,-14 C-4,-18 0,-13 0,-9 C0,-13 4,-18 10,-14 C18,-9 15,2 0,14 Z" fill="#e01818" stroke="#7a0a0a"/></g><text x="20" y="44" text-anchor="middle" font-size="13" font-weight="700" fill="#fff" font-family="Verdana">1,234</text></svg>',
      // the WATCHER (Sum, 15 Aug pm: "make bots just a bot — change of plans") — fake IP
      // stamped across the TOP, a robot, and its count MUCH bigger than the hearts'. The
      // hearts ride next — beats or likes, we don't say.
      // repeat layout with the heart (Sum, screenshot): icon over count, counts lined up —
      // IP up top, robot, its big number beneath
      watcher: '<svg viewBox="0 0 100 64" aria-hidden="true"><g transform="translate(50,9) rotate(-4)"><text text-anchor="middle" font-size="11" font-weight="700" fill="#e83030" font-family="Courier New,monospace" textLength="60" lengthAdjust="spacingAndGlyphs">84.12.0.113</text></g><g transform="translate(50,30)"><line x1="0" y1="-8" x2="0" y2="-13" stroke="#5a636e" stroke-width="2"/><circle cx="0" cy="-15" r="2" fill="#ff3030"/><rect x="-14" y="-4" width="3" height="8" fill="#5a636e"/><rect x="11" y="-4" width="3" height="8" fill="#5a636e"/><rect x="-11" y="-8" width="22" height="18" rx="3" fill="#8e98a4" stroke="#3a424c" stroke-width="1.5"/><circle cx="-5" cy="-1" r="3" fill="#ff3030"/><circle cx="5" cy="-1" r="3" fill="#ff3030"/><rect x="-6" y="5" width="3" height="4" fill="#3a424c"/><rect x="-1.5" y="5" width="3" height="4" fill="#3a424c"/><rect x="3" y="5" width="3" height="4" fill="#3a424c"/></g><text x="50" y="60" text-anchor="middle" font-size="22" font-weight="900" fill="#fff" font-family="Verdana" textLength="92" lengthAdjust="spacingAndGlyphs">160,742</text></svg>',
      cctv: '<svg viewBox="0 0 48 38" aria-hidden="true"><rect x="20" y="2" width="12" height="3" fill="#4a4f56"/><rect x="24" y="2" width="4" height="9" fill="#4a4f56"/><g transform="translate(23,20) rotate(14)"><rect x="-16" y="-7" width="32" height="14" rx="3" fill="#d8dde2" stroke="#555b63" stroke-width="1.5"/><circle cx="12" cy="0" r="4.5" fill="#1a2230" stroke="#555b63"/><circle cx="13.5" cy="-1.5" r="1.3" fill="#7ec8ff"/><circle cx="-11" cy="-4" r="1.6" fill="#ff3030"/></g></svg>',
      // big black X, "formerly / known as" half-size — black like the X (Sum: easier to read)
      xfka: '<svg viewBox="0 0 82 40" aria-hidden="true"><path d="M6,5 L30,35 M30,5 L6,35" stroke="#000" stroke-width="9"/><text x="57" y="17" text-anchor="middle" font-size="11" font-weight="700" fill="#000" font-family="Arial">formerly</text><text x="57" y="31" text-anchor="middle" font-size="11" font-weight="700" fill="#000" font-family="Arial">known as</text></svg>',
      // big blue capital F, little blue lowercase u
      fu: '<svg viewBox="0 0 44 40" aria-hidden="true"><text x="6" y="33" font-size="34" font-weight="900" fill="#1877f2" font-family="Arial">F</text><text x="27" y="33" font-size="17" font-weight="700" fill="#1877f2" font-family="Arial">u</text></svg>',
      // ABC blended a la Mondrian — box letters, the three primaries, the grid
      abc: '<svg viewBox="0 0 58 42" aria-hidden="true"><text x="2" y="34" font-size="32" font-weight="900" fill="#d02020" stroke="#000" stroke-width="1.2" font-family="Arial">A</text><text x="18" y="38" font-size="30" font-weight="900" fill="#1550c8" stroke="#000" stroke-width="1.2" font-family="Arial">B</text><text x="34" y="33" font-size="28" font-weight="900" fill="#f2c21e" stroke="#000" stroke-width="1.2" font-family="Arial">C</text><line x1="0" y1="12" x2="58" y2="12" stroke="#000" stroke-width="1.5"/><line x1="46" y1="0" x2="46" y2="42" stroke="#000" stroke-width="1.5"/></svg>',
      // the APRs (Sum, 15 Aug pm: "instead of ticker — like just numbers") — no box, no
      // marquee, the section colour is the board. Debt red, savings green, both called APR.
      aprDebt: '<svg viewBox="0 0 52 44" aria-hidden="true"><text x="26" y="14" text-anchor="middle" font-size="11" font-weight="700" fill="#fff" font-family="Verdana">APR</text><text x="26" y="36" text-anchor="middle" font-size="13" font-weight="900" fill="#ff4545" font-family="Verdana" textLength="48" lengthAdjust="spacingAndGlyphs">−33.33%</text></svg>',
      aprSave: '<svg viewBox="0 0 52 44" aria-hidden="true"><text x="26" y="14" text-anchor="middle" font-size="11" font-weight="700" fill="#fff" font-family="Verdana">APR</text><text x="26" y="36" text-anchor="middle" font-size="13" font-weight="900" fill="#45ff75" font-family="Verdana" textLength="44" lengthAdjust="spacingAndGlyphs">+0.33%</text></svg>',
      // the cash — a banded bundle of bills (Sum: "cash bundle, not coin stack") over the
      // available balance, which is of course negative
      cash: '<svg viewBox="0 0 52 46" aria-hidden="true"><rect x="10" y="20" width="32" height="5" rx="1" fill="#68a251" stroke="#3d6830"/><rect x="10" y="15" width="32" height="5" rx="1" fill="#74b05c" stroke="#3d6830"/><rect x="10" y="10" width="32" height="5" rx="1" fill="#68a251" stroke="#3d6830"/><rect x="10" y="5" width="32" height="5" rx="1" fill="#7fbb66" stroke="#3d6830"/><rect x="21" y="3" width="10" height="24" fill="#f0ead2" stroke="#b0a070"/><text x="26" y="42" text-anchor="middle" font-size="13" font-weight="900" fill="#ff4545" font-family="Verdana" textLength="42" lengthAdjust="spacingAndGlyphs">−$3.33</text></svg>',
      coin: '<svg viewBox="0 0 46 50" aria-hidden="true"><g transform="translate(23,16)"><circle r="14" fill="#f2c21e" stroke="#8a6a00" stroke-width="2"/><circle r="10" fill="none" stroke="#c89a10" stroke-width="1.5"/><text y="4" text-anchor="middle" font-size="12" font-weight="900" fill="#6b4a00" font-family="Arial">0z</text></g><text x="23" y="46" text-anchor="middle" font-size="12" font-weight="700" fill="#63ff96" font-family="Verdana" textLength="42" lengthAdjust="spacingAndGlyphs">▲4,205</text></svg>',
      ad: '<svg viewBox="0 0 64 42" aria-hidden="true"><rect x="1" y="1" width="62" height="40" rx="2" fill="#f4f0e2" stroke="#6b5f4a" stroke-width="1.5"/><text x="32" y="13" text-anchor="middle" font-size="10.5" font-weight="700" fill="#3a3a3a" font-family="Arial" textLength="52" lengthAdjust="spacingAndGlyphs">AD SPACE</text><text x="32" y="25" text-anchor="middle" font-size="10.5" font-weight="700" fill="#3a3a3a" font-family="Arial" textLength="52" lengthAdjust="spacingAndGlyphs">AVAILABLE</text><text x="32" y="37" text-anchor="middle" font-size="10.5" font-weight="900" fill="#b03030" font-family="Arial" textLength="52" lengthAdjust="spacingAndGlyphs">$300k/mo</text></svg>',
    }
    // the seating, Sum's grouping (15 Aug pm) — flex weights match the headcount so no
    // section crowds while another naps
    secGreen.append(gag(GAGS.pkg), gag(GAGS.mega), gag(GAGS.spam), gag(GAGS.print)); secGreen.style.flexGrow = 4   // the mail wall
    secLav.append(gag(GAGS.cloud), gag(GAGS.aioli), gag(GAGS.cctv)); secLav.style.flexGrow = 3                     // the till, watched
    secLite.append(gag(GAGS.watcher), gag(GAGS.heart), gag(GAGS.xfka), gag(GAGS.fu), gag(GAGS.abc)); secLite.style.flexGrow = 5   // the feed
    secPurp.append(gag(GAGS.aprDebt), gag(GAGS.aprSave), gag(GAGS.cash), gag(GAGS.coin), gag(GAGS.ad)); secPurp.style.flexGrow = 5   // the market
    const headParts = [secBlue, secGreen, secLav, secLite, secPurp]   // → makeCard's topbar: colour stays UP TOP
    // the GREY strip (Sum, 15 Aug pm): the BRAND on the left, a big space, then chats + this
    // chat's name. "x people here" already sits right, in the rail.
    const tabs = document.createElement('div'); tabs.className = 'aiol-tabs'
    const brand = document.createElement('span'); brand.className = 'aiol-brand'
    brand.textContent = 'AIOLI ~ AI On-line Interaction'
    const stripGap = document.createElement('span'); stripGap.style.flex = '1'
    tabs.append(brand, stripGap, tList, roomName)
    const people = document.createElement('div'); people.className = 'aiol-people'
    const hint = document.createElement('div'); hint.className = 'aiol-hint'
    hint.textContent = 'active: click to kick · idle: click to join · more in Member Directory'
    const railbtns = document.createElement('div'); railbtns.className = 'aiol-railbtns'
    who.append(count, people, hint, railbtns)
    const screen = document.createElement('div'); screen.className = 'aiol-screen'
    const bar = document.createElement('div'); bar.className = 'aiol-bar'
    const input = document.createElement('input')
    input.className = 'aiol-input'; input.placeholder = ''
    input.setAttribute('aria-label', 'say something to the room')


    // the right-hand column IS THE DOOR LIST (ROOM-SPEC.md): IN THE ROOM up top, each name
    // wearing its two live numbers (hand · stance) — the moderator's barometer, you see the 85
    // building before it speaks — and THE LOBBY below a rule, dimmed, one click to invite.
    // one click kicks; the OnlineHost line is the receipt, no dialogs. the click handler is the
    // guest list only (2026-08-14: the desk is DECORATION here — see THE GUEST LIST block).
    // clicks: an ACTIVE name is shown the door · an IDLE name joins the conversation ·
    // everyone else lives behind the Member Directory button (live at last).
    const roster = () => {
      people.innerHTML = ''
      const inR = present(), idle = idlers()
      count.textContent = inR.length + (inR.length === 1 ? ' person here' : ' people here')
      inR.forEach(a => {
        const d = document.createElement('div'); d.className = 'aiol-n'
        const n = document.createElement('span')
        const st = document.createElement('span'); st.className = 'aiol-st on'; st.textContent = '●'; st.title = 'active'
        n.append(st, nameOf(a.id))
        // the weather, colored (Sum 15 Aug): HAND white→green as they get insistent ·
        // STANCE blue (agree) → purple (undecided, still in debate) → red (agree to disagree)
        const lerp = (x, y, t) => Math.round(x + (y - x) * t)
        const handColor = h => h <= 50
          ? 'rgb(' + lerp(255, 124, h / 50) + ',' + lerp(255, 196, h / 50) + ',' + lerp(255, 124, h / 50) + ')'
          : 'rgb(' + lerp(124, 10, (h - 50) / 50) + ',' + lerp(196, 110, (h - 50) / 50) + ',' + lerp(124, 10, (h - 50) / 50) + ')'
        const stanceColor = sv => sv <= 50
          ? 'rgb(' + lerp(0, 128, sv / 50) + ',0,' + lerp(200, 160, sv / 50) + ')'
          : 'rgb(' + lerp(128, 200, (sv - 50) / 50) + ',0,' + lerp(160, 0, (sv - 50) / 50) + ')'
        const sc = document.createElement('span'); sc.className = 'aiol-score'
        const b = ROOM.scores[a.id]
        if (b) {
          if (DIALS.pollHand) { const hs = document.createElement('b'); hs.textContent = b.h; hs.style.color = handColor(b.h); sc.appendChild(hs) }
          if (DIALS.pollHand && DIALS.pollStance) sc.appendChild(document.createTextNode(' '))
          if (DIALS.pollStance) { const ss = document.createElement('b'); ss.textContent = b.s; ss.style.color = stanceColor(b.s); sc.appendChild(ss) }
        }
        d.append(n, sc)
        d.title = 'click to show ' + nameOf(a.id) + ' the door'
        d.setAttribute('role', 'button'); d.setAttribute('aria-label', 'kick ' + nameOf(a.id))
        d.addEventListener('click', () => {
          guests = guests.filter(g => g !== a.id)
          if (!kicked.includes(a.id)) kicked.push(a.id)
          saveGuests()
          line(screen, 'sys', nameOf(a.id) + ' has been shown the door.')
          delete ROOM.scores[a.id]; roster()
        })
        people.appendChild(d)
      })
      if (!inR.length) {
        const d = document.createElement('div'); d.className = 'aiol-lobby'
        d.textContent = seated().length ? '(empty — open a bot, or Member Directory)' : '(nobody — add a key)'
        people.appendChild(d)
      }
      // a bot whose BAR is open but whose provider has no key would otherwise vanish silently —
      // the confusing case (15 Aug: "why isn't aoladdin in chat"). show it, tagged, honest.
      const seatedSet = new Set(seated().map(x => x.id))
      const pool = ((window.REG && window.REG.agents) || []).filter(a => (!window.OZ_PROFILE || !window.OZ_PROFILE.agents || window.OZ_PROFILE.agents.includes(a.id)))
      const noKey = pool.filter(a => deskOn(a.id) && !seatedSet.has(a.id))
      if (noKey.length) {
        const rule0 = document.createElement('div'); rule0.className = 'aiol-rule'
        people.appendChild(rule0)
        noKey.forEach(a => {
          const d = document.createElement('div'); d.className = 'aiol-n aiol-lobby'
          const n = document.createElement('span'); n.textContent = '⚠ ' + nameOf(a.id) + ' — no key'
          d.appendChild(n)
          d.title = nameOf(a.id) + "'s provider has no key saved — add one in ⚙ settings"
          d.addEventListener('click', () => line(screen, 'sys', nameOf(a.id) + ' is at the door but their provider has no key on file. keys live in ⚙ settings.'))
          people.appendChild(d)
        })
      }
      // the KICKED are never invisible (15 Aug: toto vanished into the kicked list and the room
      // said "0 people" — a hidden permanent state reads as a broken app). shown, re-admittable.
      const out = seated().filter(a => kicked.includes(a.id))
      if (out.length) {
        const ruleK = document.createElement('div'); ruleK.className = 'aiol-rule'
        people.appendChild(ruleK)
        out.forEach(a => {
          const d = document.createElement('div'); d.className = 'aiol-n aiol-lobby'
          const n = document.createElement('span'); n.textContent = '↩ ' + nameOf(a.id) + ' — out'
          d.appendChild(n)
          d.title = 'click to re-admit ' + nameOf(a.id)
          d.setAttribute('role', 'button'); d.setAttribute('aria-label', 're-admit ' + nameOf(a.id))
          d.addEventListener('click', () => {
            kicked = kicked.filter(k => k !== a.id)
            if (!deskOn(a.id) && !guests.includes(a.id)) guests.push(a.id)
            saveGuests()
            line(screen, 'sys', nameOf(a.id) + ' has been re-admitted.')
            roster()
          })
          people.appendChild(d)
        })
      }
      if (idle.length) {
        const rule = document.createElement('div'); rule.className = 'aiol-rule'
        people.appendChild(rule)
        idle.forEach(a => {
          const d = document.createElement('div'); d.className = 'aiol-n aiol-lobby'
          const n = document.createElement('span')
          const st = document.createElement('span'); st.className = 'aiol-st'; st.textContent = '○'; st.title = 'idle — minimized on the desk'
          n.append(st, nameOf(a.id)); d.appendChild(n)
          d.title = 'click to add ' + nameOf(a.id) + ' to the chat'
          d.setAttribute('role', 'button'); d.setAttribute('aria-label', 'add ' + nameOf(a.id) + ' to the chat')
          d.addEventListener('click', () => {
            kicked = kicked.filter(k => k !== a.id)
            if (!guests.includes(a.id)) guests.push(a.id)
            saveGuests()
            line(screen, 'sys', nameOf(a.id) + ' has joined the conversation.')
            roster()
          })
          people.appendChild(d)
        })
      }
    }
    roster(); renderTabs(); if (window.REG) window.REG.onChange(roster)
    ROOM.repaint = roster                                  // the poll repaints the weather each round
    // the desk emits no open/close event, so the dots refresh on a slow tick that clears
    // itself when the card leaves the DOM — a barometer, not a subscription.
    const dotTick = setInterval(() => {
      if (!document.contains(people)) { clearInterval(dotTick); return }
      roster()
    }, 8000)

    const redraw = () => {
      screen.innerHTML = ''
      room.slice(-40).forEach(m => line(screen, m.who, m.text))
      if (!room.length) {
        line(screen, 'sys', '*** AIOLI ~ AI On-line Interaction. the anti-social network.')
        line(screen, 'sys', '*** say something and the room takes it up. you are the sysop.')
      }
      line(screen, 'sys', '*** [' + DIALS.room.toUpperCase() + ']')
    }
    redraw()

    // ── CHAT PREFERENCES — the gear PAGE, a Windows dialog floating on the card (the reference
    //    AOL rail has a literal "Chat Preferences" button — the name was already period-correct).
    //    every dial is live next turn, no rebuild (ROOM-SPEC.md): fields write DIALS and save;
    //    the engine reads DIALS at each decision point. ──
    const panel = document.createElement('div'); panel.className = 'aiol-prefs'
    const tbar = document.createElement('div'); tbar.className = 'aiol-prefs-title'
    const ttxt = document.createElement('span'); ttxt.textContent = 'Chat Preferences'
    const xBtn = document.createElement('button'); xBtn.className = 'aiol-prefs-x'; xBtn.textContent = '✕'
    xBtn.title = 'close'; xBtn.setAttribute('aria-label', 'close chat preferences')
    xBtn.addEventListener('click', () => panel.classList.remove('open'))
    tbar.append(ttxt, xBtn)
    const pbody = document.createElement('div'); pbody.className = 'aiol-prefs-body'
    const mkLabel = (txt, ctl) => { const l = document.createElement('label'); l.append(txt, ctl); return l }
    const group = (name, ...kids) => {
      const f = document.createElement('fieldset')
      const lg = document.createElement('legend'); lg.textContent = name
      f.appendChild(lg); kids.forEach(k => f.appendChild(k)); return f
    }

    const roomSel = document.createElement('select')
    const fillRooms = () => {
      roomSel.innerHTML = ''
      roomList().forEach(n => { const o = document.createElement('option'); o.value = n; o.textContent = n; if (n === DIALS.room) o.selected = true; roomSel.appendChild(o) })
    }
    fillRooms()
    const joinRoom = n => {
      save()                                             // the old room keeps its record
      DIALS.room = n; saveDials(); loadRoom(); loadGuests(); loadMeta()
      if (meta.dials) { Object.assign(DIALS, meta.dials, { room: n }); saveDials() }   // preset rooms carry their weather
      redraw(); fillRooms(); roster(); renderTabs(); renderTypeGroup()
    }
    roomSel.addEventListener('change', () => joinRoom(roomSel.value))
    const newBtn = document.createElement('button'); newBtn.textContent = 'new chat'
    newBtn.addEventListener('click', newRoom90)          // the grey 90s dialog, never the dark modal
    const delBtn = document.createElement('button'); delBtn.className = 'aiol-btn'; delBtn.textContent = 'delete chat'
    delBtn.setAttribute('aria-label', 'delete this chat and its record')
    delBtn.addEventListener('click', () => confirm90('delete "' + DIALS.room + '" and its record?', () => deleteRoom(DIALS.room)))

    const thr = document.createElement('input'); thr.type = 'range'; thr.min = 0; thr.max = 100; thr.step = 5; thr.value = DIALS.thresh
    const thrVal = document.createElement('span'); thrVal.className = 'aiol-dial-val'; thrVal.textContent = DIALS.thresh
    thr.setAttribute('aria-label', 'temperature — the hand a bot needs for the floor')
    thr.addEventListener('input', () => { DIALS.thresh = parseInt(thr.value, 10); thrVal.textContent = thr.value; saveDials() })

    const wind = document.createElement('input'); wind.type = 'range'; wind.min = 2; wind.max = 16; wind.step = 1; wind.value = DIALS.wind
    const windVal = document.createElement('span'); windVal.className = 'aiol-dial-val'; windVal.textContent = DIALS.wind
    wind.setAttribute('aria-label', 'wind — turns before the room yields')
    wind.addEventListener('input', () => { DIALS.wind = parseInt(wind.value, 10); windVal.textContent = wind.value; saveDials() })

    const brev = document.createElement('select')
    ;[['line', 'one sentence'], ['short', 'short (~60 words)'], ['open', 'unbounded']].forEach(([v, t]) => {
      const o = document.createElement('option'); o.value = v; o.textContent = t; if (v === DIALS.brevity) o.selected = true; brev.appendChild(o)
    })
    brev.setAttribute('aria-label', 'brevity — a room, not an essay')
    brev.addEventListener('change', () => { DIALS.brevity = brev.value; saveDials() })

    const pace = document.createElement('select')
    ;[['instant', 'instant'], ['typist', 'good typist'], ['mortal', 'mortal'], ['dialup', 'dial-up']].forEach(([v, t]) => {
      const o = document.createElement('option'); o.value = v; o.textContent = t; if (v === DIALS.pace) o.selected = true; pace.appendChild(o)
    })
    pace.setAttribute('aria-label', 'pace — how fast the room types')
    pace.addEventListener('change', () => { DIALS.pace = pace.value; saveDials() })

    newBtn.className = 'aiol-btn'
    const hintEl = t => { const d = document.createElement('div'); d.className = 'aiol-hint'; d.style.width = '100%'; d.style.textAlign = 'left'; d.textContent = t; return d }
    const nameIn = document.createElement('input'); nameIn.className = 'aiol-input'
    nameIn.style.flex = '0 1 220px'
    try { nameIn.value = localStorage.getItem('aiol_username') || '' } catch (_) {}
    nameIn.placeholder = 'HIL'
    nameIn.setAttribute('aria-label', 'your screen name')
    nameIn.addEventListener('change', () => { try { localStorage.setItem('aiol_username', nameIn.value.trim()) } catch (_) {} })
    const orderSel = document.createElement('select')
    ;[['desire', 'by desire — the scores pick'], ['rounds', 'by turns — round robin']].forEach(([v, t]) => {
      const o = document.createElement('option'); o.value = v; o.textContent = t; if (v === DIALS.order) o.selected = true; orderSel.appendChild(o)
    })
    orderSel.setAttribute('aria-label', 'speaking order')
    orderSel.addEventListener('change', () => { DIALS.order = orderSel.value; saveDials() })
    const handChk = document.createElement('input'); handChk.type = 'checkbox'; handChk.checked = !!DIALS.pollHand
    handChk.setAttribute('aria-label', 'passion poll on or off')
    handChk.addEventListener('change', () => { DIALS.pollHand = handChk.checked; saveDials() })
    const stanceChk = document.createElement('input'); stanceChk.type = 'checkbox'; stanceChk.checked = !!DIALS.pollStance
    stanceChk.setAttribute('aria-label', 'stance poll on or off')
    stanceChk.addEventListener('change', () => { DIALS.pollStance = stanceChk.checked; saveDials() })
    const pair = document.createElement('input'); pair.type = 'range'; pair.min = 1; pair.max = 6; pair.step = 1; pair.value = DIALS.pair
    const pairVal = document.createElement('span'); pairVal.className = 'aiol-dial-val'; pairVal.textContent = DIALS.pair
    pair.setAttribute('aria-label', 'back and forth — volleys between the same two before the chair moves the floor')
    pair.addEventListener('input', () => { DIALS.pair = parseInt(pair.value, 10); pairVal.textContent = pair.value; saveDials() })
    const typeGroup = document.createElement('div'); typeGroup.style.width = '100%'
    const brevLbl = mkLabel('brevity ', brev)
    const grpFloor = group('The Floor',
      hintEl('floor — the hand a bot needs to speak: low, everyone chimes in · high, only the passionate'),
      mkLabel('floor ', thr), thrVal,
      hintEl('wind — how many bot turns before the room rests and yields to you'),
      mkLabel('wind ', wind), windVal,
      hintEl('back-and-forth — volleys the same two bots get before the chair moves the floor'),
      mkLabel('volleys ', pair), pairVal,
      hintEl('order — who speaks next: the scores decide, or a straight rotation'),
      mkLabel('order ', orderSel),
      hintEl('the ratings — passion (the hand) and agreement (the stance). off = fewer calls; both off = pure round robin'),
      mkLabel('passion poll ', handChk), mkLabel('stance poll ', stanceChk))
    pbody.append(
      typeGroup,
      group('You', mkLabel('screen name ', nameIn), hintEl('what the room calls you — HIL until you say otherwise')),
      group('Room', mkLabel('room ', roomSel), newBtn, delBtn),
      grpFloor,
      group('The Voice', brevLbl, mkLabel('pace ', pace))
    )
    // ── typed rooms stay SLIM (ROOM-SPEC): debate/interview lead with their own group and
    //    keep PACE (Sum: "good typist on its settings page too") — the full dial board and
    //    brevity belong to the chat family (chat · the floor · the club). ──
    function renderTypeGroup() {
      typeGroup.innerHTML = ''
      const t = (meta && meta.type) || 'chat'
      const chatFam = t === 'chat' || t === 'floor' || t === 'club'
      grpFloor.style.display = chatFam ? '' : 'none'
      brevLbl.style.display = chatFam ? '' : 'none'          // tokens rule the typed rooms
      if (t === 'debate' && meta.cfg) {
        // the SAME page as New Debate (Sum: "once in room, still need to pick teams and change
        // up debate style — gear from debate should be same page") — debateForm, filled in
        const f = debateForm(meta.cfg)
        const again = document.createElement('button'); again.className = 'aiol-btn'; again.textContent = 'Restart with new settings'
        again.setAttribute('aria-label', 'stop the running debate and restart it with these settings')
        again.addEventListener('click', () => {
          meta.cfg = f.read(); saveMeta()
          guests = [...new Set([...meta.cfg.red, ...meta.cfg.blue, ...(meta.cfg.house || [])])].filter(id => id !== HOST()); kicked = []; saveGuests(); roster()
          if (meta.cfg.interrupt && DIALS.pace === 'instant') { DIALS.pace = 'typist'; saveDials() }   // no pace, no parliament
          panel.classList.remove('open')
          // a run may be IN FLIGHT — stop it first (the gavel's own flag), grace for its loops
          // to notice, then go fresh; runDebate resets the flag itself
          ROOM.stop = true
          setTimeout(() => runDebate(screen), 700)
        })
        typeGroup.appendChild(group('This Debate',
          hintEl('the same builder — adjust anything: teams, ladder, purse — then restart'),
          f.el, again))
      }
      if (t === 'interview' && meta.cfg) {
        const cfg = meta.cfg
        const q = document.createElement('textarea'); q.className = 'aiol-input'; q.rows = 3; q.value = cfg.question || ''
        q.setAttribute('aria-label', 'the interview question')
        q.addEventListener('change', () => { cfg.question = q.value.trim(); saveMeta() })
        const again = document.createElement('button'); again.className = 'aiol-btn'; again.textContent = 'Run Again'
        again.setAttribute('aria-label', 'ask the question again, cold')
        again.addEventListener('click', () => { panel.classList.remove('open'); runInterview(screen) })
        typeGroup.appendChild(group('This Interview',
          hintEl('tweak the question and run it again — cold every time'),
          mkLabel('question ', q), again))
      }
    }
    renderTypeGroup()
    const okRow = document.createElement('div'); okRow.className = 'aiol-prefs-ok'
    const ok = document.createElement('button'); ok.className = 'aiol-btn'; ok.textContent = 'OK'
    ok.setAttribute('aria-label', 'close chat preferences')
    ok.addEventListener('click', () => panel.classList.remove('open'))
    okRow.appendChild(ok)
    panel.append(tbar, pbody, okRow)

    // ── PRIVATE CHAT — "slip into those DMs" (Sum). One window, two modes: you + a bot, or
    //    two bots talking while you watch. Rounds are chosen up front and EXTENDED by button —
    //    next · +1 each · +3 each · +5 each — so a good DM never dies mid-thought. Turns ride
    //    engineRaw (the poll's door), transcripts save per pair. The dialog wears the prefs dress;
    //    the transcript wears the room's line() and inks. ──
    //
    // CORRECTION, attached (2026-08-26). The line above used to read "engineRaw (the poll's door: NO
    // HISTORY WRITES)". That was accurate and it was backwards. Sum: "pm is the dm, make that true...
    // private message works backwards of what I want now."
    // ⭐ THE PM IS THE DM, AND IT WRITES. The memory law puts the room's transcript with the ROOM —
    //    nobody carries it out. But a private word is exactly the thing that SHOULD stick, and this was
    //    the one surface built to be trace-free. Every PM turn now lands in the speaker's own
    //    toto_hist_<id>, the same store its convo bar reads. Say it in a DM and the bot has it tomorrow.
    // ⭐ AND IT IS HOW BOTS CONFER WITHOUT A LEAKY INPUT PERMISSION. Two bots talking here is a real
    //    exchange both of them remember, and neither ever got write access to the other: each writes
    //    only its OWN history, from its OWN turn. Nothing reaches into anyone. The alternative — a tool
    //    that puts words in another bot's head — is a permission hole this closes by not existing.
    // ⚠ THE ROOM ITSELF STAYS AIR-GAPPED. This is the PM only. ──
    const pm = document.createElement('div'); pm.className = 'aiol-prefs'
    const pmBar = document.createElement('div'); pmBar.className = 'aiol-prefs-title'
    const pmTitle = document.createElement('span'); pmTitle.textContent = 'Private Chat'
    const pmX = document.createElement('button'); pmX.className = 'aiol-prefs-x'; pmX.textContent = '✕'
    pmX.setAttribute('aria-label', 'close private chat')
    pmBar.append(pmTitle, pmX)
    const PM = { a: 'sysop', b: '', left: 0, turnOf: '', log: [], stop: false, running: false }
    const pmKey = () => 'aiol_pm_' + [PM.a, PM.b].sort().join('_')

    // phase one: the setup — ONE list, pick one or two (Sum 2026-08-15: "just a list you can
    // choose one or 2 from. 1 is me talking, 2 is them talking"). how-many lives ON the chat.
    const pmSetup = document.createElement('div'); pmSetup.className = 'aiol-prefs-body'
    const pmList = document.createElement('div'); pmList.className = 'aiol-people aiol-pmlist'
    pmList.style.maxHeight = '160px'; pmList.style.overflowY = 'auto'
    const fillSeats = () => {
      pmList.innerHTML = ''
      seated().forEach(a => {
        const l = document.createElement('label'); l.className = 'aiol-n'
        const c = document.createElement('input'); c.type = 'checkbox'; c.value = a.id
        c.setAttribute('aria-label', nameOf(a.id))
        l.append(c, document.createTextNode(' ' + nameOf(a.id)))
        pmList.appendChild(l)
      })
    }
    const startBtn = document.createElement('button'); startBtn.className = 'aiol-btn'; startBtn.textContent = 'Start'
    const pmHow = document.createElement('div'); pmHow.className = 'aiol-hint'
    pmHow.textContent = 'pick ONE to talk to them · pick TWO to watch them talk'
    pmSetup.append(group('Who', pmHow, pmList, startBtn))

    // phase two: the chat — the transcript, the extenders, the line
    const pmChat = document.createElement('div'); pmChat.className = 'aiol-prefs-body'; pmChat.style.display = 'none'
    const pmScreen = document.createElement('div'); pmScreen.className = 'aiol-pmscreen'
    const pmRow = document.createElement('div'); pmRow.className = 'aiol-pmrow'
    const pmInput = document.createElement('input'); pmInput.className = 'aiol-input'
    pmInput.setAttribute('aria-label', 'say something privately')
    const pmSend = document.createElement('button'); pmSend.className = 'aiol-btn aiol-send'; pmSend.textContent = '≋ Send'
    // how many messages each per press — ON the chat, not in settings (Sum's call)
    const eachSel = document.createElement('select')
    ;[['1', '1 each'], ['3', '3 each'], ['5', '5 each']].forEach(([v, t]) => {
      const o = document.createElement('option'); o.value = v; o.textContent = t; eachSel.appendChild(o)
    })
    eachSel.setAttribute('aria-label', 'messages each per go')
    const goBtn = document.createElement('button'); goBtn.className = 'aiol-btn'; goBtn.textContent = 'Go'
    goBtn.setAttribute('aria-label', 'let them talk')
    goBtn.addEventListener('click', () => { PM.left += parseInt(eachSel.value, 10) * 2; pmLoop() })
    pmChat.append(pmScreen, pmRow)

    async function pmTurn(speaker, other) {
      pmSeed(speaker, other)   // once per session: the room crosses the air gap here, at the door, framed
      const doc = 'PRIVATE CHAT — a side conversation away from the room. You are ' + nameOf(speaker) +
        ', one on one with ' + (other === 'sysop' ? 'the sysop (the human)' : nameOf(other)) + '.\n\n--- THE CHAT SO FAR ---\n' +
        PM.log.map(m => (m.who === 'sysop' ? '<sysop> ' : '<' + nameOf(m.who) + '> ') + m.text).join('\n') +
        '\n\nTake your turn. Be brief and candid — this is a DM, not a speech.'
      const el = line(pmScreen, speaker, '…')
      let text = ''
      try {
        const r = await window.engineRaw({ agentId: speaker, messages: [{ role: 'user', content: doc }], onChunk: c => { text += c; el._msg.textContent = squeeze(text); pmScreen.scrollTop = pmScreen.scrollHeight } })
        if (r && r.error) text = r.error
        else if (r && r.text) text = r.text
      } catch (e) { text = 'the wire dropped — ' + ((e && e.message) || e) }
      el._msg.textContent = squeeze(text)
      PM.log.push({ who: speaker, text })
      try { localStorage.setItem(pmKey(), JSON.stringify(PM.log.slice(-80))) } catch (_) {}
      pmRemember(speaker, other, text)
    }

    // ⭐ THE FIRST DM CARRIES THE ROOM IN (Sum 2026-08-26: "on first pm, add chat convo to end of
    //    conversation history, so bot has it in tokens at first message, with an explanation of where
    //    that history comes from and how the pm can copy data into its conversation history, so bot
    //    answers knowing where it is and what might be expected").
    //    THIS IS THE ONE PLACE THE ROOM CROSSES THE AIR GAP, and it crosses ONCE, at the door, framed.
    //    Not a tool a bot can fire, not a background sync — a human pulled it aside, and the thing it
    //    was just in comes with it. After this seed the room is behind it again; anything further it
    //    wants to keep, it keeps by saying so, which is the same law as everywhere else.
    //    ONCE PER PM SESSION PER BOT — a re-seed on every turn would re-inject the whole room on every
    //    call, which is the exact cost the pointer discipline exists to avoid.
    const pmSeeded = {}
    function pmSeed(speaker, other) {
      if (!speaker || speaker === 'sysop' || pmSeeded[speaker]) return
      pmSeeded[speaker] = 1
      const H = window.engineHist; if (!H || !H.load || !H.save) return
      try {
        const lines = (room || []).slice(-60).map(m => (m.who === 'sysop' ? 'the human' : nameOf(m.who)) + ': ' + String(m.text || '').replace(/\s+/g, ' '))
        const who = other === 'sysop' ? 'the human' : nameOf(other)
        const head = lines.length
          ? 'Here is what was said in ' + DIALS.room + ', so you have it in front of you:\n\n' + lines.join('\n') + '\n\n'
          : 'The room ' + DIALS.room + ' is empty so far — nothing has been said in it.\n\n'
        H.save(speaker, H.load(speaker).concat([{ role: 'user', content:
          pmStamp('brought in from the room ' + DIALS.room) + 'you have been pulled out of the room ' + DIALS.room + ' into a PRIVATE CHAT with ' + who + '.\n\n' + head +
          'WHERE THIS CAME FROM, and why it is here: that transcript belongs to the ROOM, not to you. It is in your ' +
          'memory now because a private chat was opened and it was carried in ONCE, at the door, so you are not answering ' +
          'blind. It will not keep updating. When the room moves on, this stays as it is.\n\n' +
          'WHAT THIS IS FOR — any of these, and you will usually be able to tell which:\n' +
          '\u00b7 you are being asked about something specific from up there — answer it plainly, and cite the line if the wording matters.\n' +
          '\u00b7 you are being asked where an idea of yours came from, or to go further with it than the room had room for.\n' +
          '\u00b7 something in there is worth keeping — say it back in a line, or put it in a note. What you SAY here is what you keep; ' +
          'the room is not yours to carry.\n' +
          '\u00b7 or simply carry the thread on, privately. A DM is quieter than a room and you can be more candid in it.\n\n' +
          'THIS IS A DM, SO IT STICKS. Everything said here lands in your own memory the way your normal conversation does — ' +
          'unlike the room, which does not follow you out. Be brief and be candid. Do not read the transcript back at them: ' +
          'they were there.' }]).slice(-200))
      } catch (_) {}
    }

    // ⭐ THE STAMP — TIME AND SOURCE (Sum 2026-08-26: "first 5 jenga woodblocks identifies speaker with
    //    time and weather stamp... we don't need weather for bot talk, but time and source should handle
    //    this"). The bench's own intake block teaches a bot how to read its turn — where the injection
    //    ends, where history ends, where THIS prompt begins. What it cannot teach is WHO sent a given
    //    user turn, because a user turn from the human and a user turn from a DM are the same shape.
    //    So the turn says so itself, in its first line, in plain text:
    //        [private chat · 4:31 PM · from the human]
    //    TIME because a DM read back a week later needs to know it is a week old. SOURCE because that is
    //    the whole demarcation — bot talk is not HIL talk, and a bot answering "who told me that?" should
    //    be able to answer it off the transcript rather than guess.
    //    NO WEATHER: the live tail already carries weather per turn for the human's own prompts, and a
    //    bot-to-bot exchange has no weather — it did not happen anywhere.
    //    PLAIN TEXT, not a new field: it survives a trim, a compact, an export, and a human scrolling
    //    back through the bar. A metadata key would survive none of those.
    //    ⚠ `source` IS A PARAMETER, and that is not tidiness. The first cut stamped the SEED with
    //    "from <the other bot>" — but the seed is not from them, it is the app framing the situation.
    //    A user turn that names a speaker who did not speak reads back later as a quote, and a bot
    //    asked "who told you that?" would name the wrong bot with a straight face. The stamp exists to
    //    stop exactly that, so it must not do it itself. Say who really sent it, or say it was the room.
    const pmStamp = source => {
      let t = ''
      try { t = (window.OZ_CLOCK && window.OZ_CLOCK.now && window.OZ_CLOCK.now()) || new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) } catch (_) {}
      return '[private chat' + (t ? ' \u00b7 ' + t : '') + ' \u00b7 ' + source + ']\n'
    }
    const pmFrom = other => 'from ' + (other === 'sysop' ? 'the human' : nameOf(other))

    // ⭐ THE DM STICKS. engineRaw writes no history on purpose — it is the poll's door and a poll must
    //    leave no trace — so the PM does the write itself, and it writes ONLY the speaker's own history
    //    from the speaker's own turn. That constraint IS the feature: two bots confer, each remembers
    //    its own side, and neither ever had write access to the other.
    //    SHAPE: the same {role, content} pairs the convo bar reads, so afterwards a DM turn is
    //    indistinguishable from a bar turn — which is what "pm is the dm" has to mean to be true.
    //    The other party's last line rides as the USER turn, prefixed with where it happened and who
    //    with. Without that prefix, a private word reads back later as if it had been said in the room.
    function pmRemember(speaker, other, text) {
      if (!speaker || speaker === 'sysop' || !text) return
      const H = window.engineHist; if (!H || !H.load || !H.save) return
      try {
        const who = other === 'sysop' ? 'the human' : nameOf(other)
        const asked = PM.log.filter(m => m.who === other).slice(-1)[0]
        const hist = H.load(speaker)
        hist.push({ role: 'user', content: pmStamp(pmFrom(other)) + ((asked && asked.text) || '(they opened the DM)') })
        hist.push({ role: 'assistant', content: text })
        H.save(speaker, hist.slice(-200))
      } catch (_) {}
    }
    async function pmLoop() {
      if (PM.running) return
      PM.running = true
      while (!PM.stop && PM.left > 0) {
        PM.left--
        await pmTurn(PM.turnOf, PM.turnOf === PM.a ? PM.b : PM.a)
        PM.turnOf = (PM.turnOf === PM.a ? PM.b : PM.a)
        if (PM.turnOf === 'sysop') break                   // your seat: the loop waits for your line
      }
      PM.running = false
      if (!PM.stop && PM.left <= 0 && PM.a !== 'sysop') line(pmScreen, 'sys', '*** the side chat pauses — extend it or close it')
    }
    // ⭐ ONE DOOR, TWO HANDLES (2026-08-26). "Notify Vogel" used to only SEAT vogel, which made it the
    //    odd one out: Sum's law is "notify vogel works like a dm, links bot memory," and seating is not
    //    a DM. So the sysop-to-one-bot open is lifted out of the Start button and both handles call it.
    //    A second copy of this would drift the first time either one changed, and the drift would be
    //    invisible — a DM that seeds but does not remember, or remembers but does not seed.
    function openDmWith(botId) {
      PM.log = []; PM.stop = false
      pmScreen.innerHTML = ''; pmRow.innerHTML = ''
      PM.a = 'sysop'; PM.b = botId
      PM.left = 0; PM.turnOf = botId
      pmRow.append(pmInput, pmSend)
      line(pmScreen, 'sys', '*** a private line to ' + nameOf(botId) + '. the room cannot hear you.')
      line(pmScreen, 'sys', '*** they arrive with the room in mind — what is said HERE they keep.')
      pmTitle.textContent = 'Private Chat — You & ' + nameOf(botId)
      pmSetup.style.display = 'none'; pmChat.style.display = 'flex'
      pm.classList.add('open')
      setTimeout(() => { try { pmInput.focus() } catch (_) {} }, 0)
    }

    startBtn.addEventListener('click', () => {
      const picks = Array.from(pmList.querySelectorAll('input:checked')).map(c => c.value)
      if (picks.length < 1 || picks.length > 2) { pmHow.textContent = '⚠ pick ONE to talk to them · pick TWO to watch them talk'; return }
      PM.log = []; PM.stop = false
      pmScreen.innerHTML = ''
      pmRow.innerHTML = ''
      if (picks.length === 1) { openDmWith(picks[0]); return }   // 1 is me talking — the shared door
      {                                                    // 2 is them talking
        PM.a = picks[0]; PM.b = picks[1]
        PM.left = 0; PM.turnOf = PM.a
        pmRow.append(mkLabel('messages ', eachSel), goBtn)
        line(pmScreen, 'sys', '*** ' + nameOf(PM.a) + ' and ' + nameOf(PM.b) + ' step into a side room. you are a fly on the wall.')
        line(pmScreen, 'sys', '*** pick how many messages each, then Go.')
      }
      pmTitle.textContent = 'Private Chat — ' + (PM.a === 'sysop' ? 'You' : nameOf(PM.a)) + ' & ' + nameOf(PM.b)
      pmSetup.style.display = 'none'; pmChat.style.display = 'flex'
    })
    const pmSendGo = () => {
      const t = pmInput.value.trim(); if (!t) return
      pmInput.value = ''
      PM.log.push({ who: 'sysop', text: t })
      line(pmScreen, 'sysop', t)
      PM.left = 1; PM.turnOf = PM.b; pmLoop()
    }
    pmInput.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); pmSendGo() } })
    pmSend.addEventListener('click', pmSendGo)
    const pmClose = () => {
      PM.stop = true; pm.classList.remove('open')
      pmSetup.style.display = 'flex'; pmChat.style.display = 'none'
      pmTitle.textContent = 'Private Chat'
    }
    pmX.addEventListener('click', pmClose)
    pm.append(pmBar, pmSetup, pmChat)

    // ── the rail buttons — the gavel is the sysop's power, so it lives in the rail beside
    //    Chat Preferences (the reference rail's literal button). era buttons that aren't wired
    //    yet are DISABLED and say so — "coming soon" is cursed in this house. ──
    const railBtn = (txt, cls) => {
      const b = document.createElement('button'); b.className = 'aiol-btn'
      const dot = document.createElement('span'); dot.className = 'aiol-dot' + (cls ? ' ' + cls : '')
      b.append(dot, txt); return b
    }
    const gavelBtn = railBtn('Gavel', 'org')
    gavelBtn.title = 'take the floor back'; gavelBtn.setAttribute('aria-label', 'gavel — take the floor back')
    gavelBtn.addEventListener('click', () => {
      ROOM.stop = true                                   // the sysop always outranks the room
      line(screen, 'sys', '*** the sysop bangs the gavel — the floor is yours')
      input.focus()
    })
    const moreBtn = railBtn('More Chat', 'grn')
    moreBtn.title = 'open a new room'
    moreBtn.addEventListener('click', newRoom90)
    const prefsBtn = railBtn('Chat Preferences', 'grn')
    prefsBtn.setAttribute('aria-label', 'chat preferences — room, temperature, wind, brevity, pace')
    prefsBtn.addEventListener('click', () => panel.classList.toggle('open'))
    // MEMBER DIRECTORY — the offline list, one click adds to the chat (the prefs dress again)
    const dir = document.createElement('div'); dir.className = 'aiol-prefs'
    const dirBar = document.createElement('div'); dirBar.className = 'aiol-prefs-title'
    const dirT = document.createElement('span'); dirT.textContent = 'Member Directory'
    const dirX = document.createElement('button'); dirX.className = 'aiol-prefs-x'; dirX.textContent = '✕'
    dirX.setAttribute('aria-label', 'close member directory')
    dirX.addEventListener('click', () => dir.classList.remove('open'))
    dirBar.append(dirT, dirX)
    const dirBody = document.createElement('div'); dirBody.className = 'aiol-prefs-body'
    const dirHint = document.createElement('div'); dirHint.className = 'aiol-hint'
    dirHint.textContent = 'everyone with a key who is not in the room — click a name to add them'
    const dirList = document.createElement('div'); dirList.className = 'aiol-people'
    dirList.style.maxHeight = '200px'; dirList.style.overflowY = 'auto'
    const fillDir = () => {
      dirList.innerHTML = ''
      const rows = directory()
      if (!rows.length) { const d = document.createElement('div'); d.className = 'aiol-lobby'; d.textContent = '(everyone is here)'; dirList.appendChild(d); return }
      rows.forEach(a => {
        const d = document.createElement('div'); d.className = 'aiol-n'
        const n = document.createElement('span'); n.textContent = nameOf(a.id); d.appendChild(n)
        d.setAttribute('role', 'button'); d.setAttribute('aria-label', 'add ' + nameOf(a.id) + ' to the chat')
        d.addEventListener('click', () => {
          kicked = kicked.filter(k => k !== a.id)
          if (!guests.includes(a.id)) guests.push(a.id)
          saveGuests()
          line(screen, 'sys', nameOf(a.id) + ' has entered the room.')
          roster(); fillDir()
        })
        dirList.appendChild(d)
      })
    }
    dirBody.append(dirHint, dirList)
    dir.append(dirBar, dirBody)
    const dirBtn = railBtn('Member Directory')
    dirBtn.title = 'everyone not in the room'
    dirBtn.setAttribute('aria-label', 'member directory — add bots to the chat')
    dirBtn.addEventListener('click', () => { fillDir(); dir.classList.add('open') })
    const pmBtn = railBtn('Private Chat')
    pmBtn.title = 'a side chat — you and a bot, or two bots while you watch'
    pmBtn.setAttribute('aria-label', 'private chat')
    pmBtn.addEventListener('click', () => { fillSeats(); pm.classList.add('open') })
    // ── CORRECTION 26 Aug: this block said 'vogel' four times and printed "Vogel" five. The NAME is
    //    now read off the bot (hostName → its record's display name) and the ID off its cap, so the
    //    button relabels itself when another bot takes the chair. The OnlineHost voice is deliberate
    //    and stays: the sys lines still read like a 90s chatroom's host, whoever is wearing the badge.
    // ⭐ 31 Aug (Sum): the button is just the HOST'S NAME now — "notify vogel can be just S
    //    Trawman on button for room, no notify." The verb was doing no work: it is the only
    //    red button on the rail and its title already says 'summon the host'. A name is a door;
    //    'Notify <name>' was a label explaining a door. The aria-label below keeps the verb,
    //    because a screen reader gets no colour, no position and no title to lean on.
    const notifyBtn = railBtn(hostName(), 'red')
    notifyBtn.title = 'summon the host'
    notifyBtn.setAttribute('aria-label', 'notify ' + hostName().toLowerCase() + ' — summon the host')
    notifyBtn.addEventListener('click', () => {
      const host = HOST(), HN = hostName()
      if (!host || !seated().find(a => a.id === host)) { line(screen, 'sys', HN + ' could not be reached. It is not on the form.'); return }
      kicked = kicked.filter(k => k !== host)
      if (!guests.includes(host)) { guests.push(host); saveGuests(); roster(); line(screen, 'sys', HN + ' has entered the room.') }
      // ⭐ NOTIFY IS A DM (Sum 2026-08-26: "notify vogel works like a dm, links bot memory"). It used
      //    to stop at the line above — it SEATED vogel and that was all, which is a summons, not a
      //    notification. Now it opens the private line, which is the road that actually links memory:
      //    the DM seeds vogel with the room (once, framed) and every turn in it lands in vogel's own
      //    history. Seat, then pull aside. Same door the Private Chat button uses — openDmWith.
      line(screen, 'sys', '*** you take ' + HN + ' aside.')
      openDmWith(host)
      line(screen, 'sys', HN + ' has been notified. The appropriate forms are being fetched.')
    })
    railbtns.append(gavelBtn, moreBtn, pmBtn, notifyBtn, prefsBtn, dirBtn)

    // ── the compose line — the era's instrument panel. font · colour · A B I U stand as
    //    furniture (disabled, honestly labelled) until they're wired; the line and Send are live. ──
    const font = document.createElement('select')
    ;['Verdana', 'Arial', 'Times New Roman', 'Courier New'].forEach(f => {
      const o = document.createElement('option'); o.textContent = f; font.appendChild(o)
    })
    font.disabled = true; font.title = 'not wired yet'; font.setAttribute('aria-label', 'font — not wired yet')
    const swatch = document.createElement('button'); swatch.className = 'aiol-btn aiol-fmt aiol-swatch'
    swatch.appendChild(document.createElement('i'))
    swatch.disabled = true; swatch.title = 'not wired yet'; swatch.setAttribute('aria-label', 'colour — not wired yet')
    const fmts = ['A', 'B', 'I', 'U'].map(t => {
      const b = document.createElement('button')
      b.className = 'aiol-btn aiol-fmt' + (t === 'I' ? ' i' : t === 'U' ? ' u' : '')
      b.textContent = t; b.disabled = true; b.title = 'not wired yet'
      b.setAttribute('aria-label', t + ' — not wired yet')
      return b
    })
    const sendBtn = document.createElement('button')
    sendBtn.className = 'aiol-btn aiol-send'; sendBtn.textContent = '≋ Send'
    sendBtn.setAttribute('aria-label', 'send to the room')

    const send = () => {
      const t = input.value.trim(); if (!t) return
      input.value = ''
      room.push({ who: 'sysop', text: t }); save()
      line(screen, 'sysop', t)
      runPass(screen, t)
    }
    input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); send() } })
    sendBtn.addEventListener('click', send)

    bar.append(font, swatch, ...fmts, input, sendBtn)
    body.append(tabs, screen, who, bar, panel, pm, dir, listings, ask, conf)
    return window.makeCard({ id: 'aioli', icon: 'cards/aiol/aiol.jpg', title: 'AIOLI — the room', skin: 'card-aiol', topbar: headParts, gear: tGear, body })   // the sections ride the card's OWN head (Sum: 'wrong top bar' — twice) · gear seats far right (2026-08-28)
  }
})()
