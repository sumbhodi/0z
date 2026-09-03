// clean-read.js — THE CLEAN READ (Sum 2026-08-22: "use jina, the one that hands bots clean text, and just hand
// it to newsie"). ONE function for every reader in the house: r.jina.ai returns any page as plain text; the
// bolt (fetch_page, off the paint thread) pulls it, so there is no CORS and no bot challenge in a frame.
// Used by newsie's psv_read (shell/oz-newsie.js) and by the Breakdown hat inside the sheets
// (cards/myview/breakdown.js, through window.parent). This replaced the Portal reader, parked 2026-08-22 at
// ~/Local/_archive/2026-08-17-TOTOIS-INTAKE/code/portal/.
(function () {
  'use strict'
  const CAP = 14000   // (r.jina.ai was the first rung 22–23 Aug; dropped — Sum: "no hallucinate")
  // THE BOUNCER (Sum 2026-08-23: "build a bouncer… for bot to be told plainly there is a wall instead of guessing").
  // Deterministic verdicts, no model. The old WALL regex folded in; the best tell is the page's OWN declaration:
  // news sites mark their paywalls isAccessibleForFree:false in their JSON-LD. The error carries e.wall (the kind)
  // and e.say (the plain sentence the reader hears); e.blocked stays true so every older caller keeps working.
  function bouncer(raw) {
    const head = raw.slice(0, 4000)
    if (/just a moment|checking your browser|verify you are human|turnstile|hcaptcha|attention required|enable javascript and cookies|are you a robot|please click the box|unusual activity from your/i.test(head)) return ['challenge', 'the bouncer at the door: a prove-you-are-human check, not the story']
    if (/isAccessibleForFree["']?\s*:\s*["']?false/i.test(raw)) return ['paywall', "a paywall, declared in the page's own metadata"]
    if (/subscribe to (read|continue)|subscription required|to continue reading|already a subscriber\?/i.test(head)) return ['paywall', 'a paywall: the till wants money before the story']
    if (/sign in to continue|log ?in to (read|continue|view)|create a free account|members only/i.test(head)) return ['login', 'a login wall: members only past this point']
    if (raw.length < 2000 && /access denied|403 forbidden|rate limit|too many requests/i.test(head)) return ['refused', 'the door is shut: the site refused the read outright']
    return null
  }
  const wallError = w => { const e = new Error(w[1]); e.blocked = true; e.wall = w[0]; e.say = w[1]; return e }
  // THE LADDER'S KNOBS (Sum 2026-08-23: "a jenga for each rung of the ladder and the bouncer, for the user to see and
  // learn and edit — toggle on off over edit code, but we leave a tag to code; you can brick it, we leave the factory
  // reset for experimentations"). localStorage 'read-ladder': { eyesFirst, jina, crawl, bouncer: {challenge, paywall,
  // login, refused, thin} } — an absent key means ON. The box is the gear (settings.js ladderFields); THIS file is the
  // code the tag points to. The paste ask has no switch: the human rung always answers. The factory reset drops the
  // key (it is not on the keep list), so a bricked ladder walks itself back.
  function ladder() { try { const v = JSON.parse(localStorage.getItem('read-ladder') || '{}'); return v && typeof v === 'object' ? v : {} } catch (_) { return {} } }
  const rungOn = k => ladder()[k] !== false
  const verdictOn = k => ((ladder().bouncer || {})[k] !== false)
  const judge = raw => { const w = bouncer(raw); return w && verdictOn(w[0]) ? w : null }
  const thinCheck = raw => (raw.length < 200 && verdictOn('thin')) ? ['thin', 'a thin read: almost nothing came back'] : null
  // THE CRAWL RUNG (Sum 2026-08-23: "Crawl4AI, I am sold") — real Chromium through the local door
  // (~/Local/crawl4ai/server.sh · 127.0.0.1:11235 · Apache-2.0 · keyless · self-hosted from the repo).
  // Feature-detected once; server down → the ladder steps straight to the paste ask. Fetched through the
  // same bolt as jina (fetch_page, off the paint thread), so no CSP/CORS question in the webview.
  let CRAWL_UP = null
  // THE RULES CHECK (Sum 2026-08-23: "nice bouncer, checks the rules… no bots in the robots.txt file — we answer to a
  // higher authority"). Session-cached per host, fail-open (no robots.txt = welcome). The one gate BEFORE any rung.
  const ROBOTS = {}
  async function robotsAllowed(url) {
    try {
      if (!rungOn('robots')) return true
      const u = new URL(url); const host = u.origin
      let r = ROBOTS[host]
      if (!r) {
        let txt = ''
        try {
          const c = window.__TAURI__ && (window.__TAURI__.core || window.__TAURI__)
          txt = (c && c.invoke) ? String(await c.invoke('fetch_page', { url: host + '/robots.txt' }) || '') : await (await fetch(host + '/robots.txt')).text()
        } catch (_) { txt = '' }
        const dis = []; let mine = false
        String(txt).slice(0, 40000).split(/\r?\n/).forEach(l => {
          const m = /^\s*user-agent\s*:\s*(.+?)\s*$/i.exec(l); if (m) { mine = m[1] === '*'; return }
          const d = /^\s*disallow\s*:\s*(\S+)/i.exec(l); if (mine && d) dis.push(d[1])
        })
        r = ROBOTS[host] = { dis }
      }
      const path = u.pathname + u.search
      return !r.dis.some(pfx => path.startsWith(pfx))
    } catch (_) { return true }
  }
  async function crawlFetch(path) {
    const c = window.__TAURI__ && (window.__TAURI__.core || window.__TAURI__)
    if (c && c.invoke) return String(await c.invoke('fetch_page', { url: 'http://127.0.0.1:11235' + path }) || '')
    const r = await fetch('http://127.0.0.1:11235' + path); return r.ok ? await r.text() : ''
  }
  async function crawlRung(url, shot, mode) {
    try {
      if (CRAWL_UP === false) return null
      if (CRAWL_UP === null) { try { CRAWL_UP = /crawl4ai-rung/.test(await crawlFetch('/up')) } catch (_) { CRAWL_UP = false } if (!CRAWL_UP) return null }
      const j = JSON.parse(await crawlFetch('/read?url=' + encodeURIComponent(url) + (shot ? '&shot=1' : '') + (mode ? '&mode=' + mode : '')) || 'null')
      return (j && j.ok && (j.markdown || j.text)) ? j : null
    } catch (_) { return null }
  }
  async function cleanRead(url, opts) {
    if (!/^https?:\/\//i.test(String(url || ''))) throw new Error('a full http(s) link, please')
    // EYES FIRST (Sum 2026-08-23: "wire in crawl as first step in ladder if bot has eyes"): when the caller names an
    // agent whose model takes images (OZ_SEES), the crawl rung goes FIRST and brings the page's SHOT with it — the
    // picture rides the agent's next order through the same OZ_VISION_PENDING pipe a photo attachment takes, and the
    // markdown is the return. Rung down, or the page walled → the plain ladder below (jina → crawl text → the ask).
    let crawlTried = false
    // THE DOOR NOTE (Sum 2026-08-23: "give bot a note they went in the side door, encourage user to generate true
    // traffic, use as site's intention was… a bot-block that didn't work is fodder for most of our bots' personas").
    // Only the bot-order doors (opts.eyes named) hear it — the ear must not read plumbing aloud.
    const orderDoor = !!(opts && opts.eyes)
    const doorNote = why => orderDoor ? '\n\n(door note, from the ladder: ' + why + ' If the take lands, tell the reader to hit the link themselves — a real visit is the honest thank-you to the writer, and then you are both looking at the same page. And their bot-block did not hold; make of that what your persona will.)' : ''
    if (!(await robotsAllowed(url))) throw wallError(['robots', "the site's robots.txt asks bots to stay out of this page — we answer to a higher authority. This one is for human eyes; hit the link yourself"])
    const eyes = opts && opts.eyes && window.OZ_SEES && window.OZ_SEES(opts.eyes) ? opts.eyes : ''
    if (eyes && rungOn('crawl') && rungOn('eyesFirst')) {
      crawlTried = true
      const j = await crawlRung(url, true)
      if (j) {
        const md = String(j.markdown || '')
        const w0 = (j.declared && md.length < 3500 && verdictOn('paywall') ? ['paywall', "a paywall, declared in the page's own metadata"] : null) || judge(md) || thinCheck(md)
        if (!w0) {
          if (j.shot) { try { window.OZ_VISION_PENDING = { agent: eyes, name: url, data: 'data:image/jpeg;base64,' + j.shot } } catch (_) {} }
          return prose(md).slice(0, CAP) + (j.declared && md.length >= 3500 ? doorNote('the page declares a paywall to robots, yet handed the whole story to a plain reader — the side door was open.') : '')
        }
      }
    }
    // THE A11Y RUNG (Sum 2026-08-23: "oh, you're a fast little bot aren't you — here is the page's a11y read"): a plain
    // fetch read clean by trafilatura on the local server. Deterministic, no middleman. (jina was the backup here for a
    // day; Sum, 15:25: "drop jina off the tail like kite surfing — not an option in 0z. crawl and reader with bouncer is
    // plenty; screenshot, copy paste are all fallbacks. no hallucinate." Two local rungs, then the human.)
    let w = null
    if (rungOn('ally')) {
      const ja = await crawlRung(url, false, 'text')
      if (ja) {
        const ta = String(ja.text || ja.markdown || '')
        const wa = (ja.declared && ta.length < 3500 && verdictOn('paywall') ? ['paywall', "a paywall, declared in the page's own metadata"] : null) || judge(ta) || thinCheck(ta)
        if (!wa) return prose(ta).slice(0, CAP) + (ja.declared && ta.length >= 3500 ? doorNote('the page declares a paywall to robots, yet handed the whole story to a plain reader — the side door was open.') : '')
        w = wa
      }
    }
    // the full browser leg — real Chromium, unless the eyes already took it first
    const j2 = (crawlTried || !rungOn('crawl')) ? null : await crawlRung(url)
    if (j2) {
      const c2 = String(j2.markdown || j2.text || '')
      const w2 = (j2.declared && c2.length < 3500 && verdictOn('paywall') ? ['paywall', "a paywall, declared in the page's own metadata"] : null) || judge(c2) || thinCheck(c2)
      if (!w2) return prose(c2).slice(0, CAP) + (w ? doorNote('the plain reader was turned away (' + w[1] + '), and the browser rung carried this read in through the side door' + (j2.declared && c2.length >= 3500 ? ', past a paywall the page itself declares' : '') + '.') : (j2.declared && c2.length >= 3500 ? doorNote('the page declares a paywall to robots, yet handed the whole story to a plain reader — the side door was open.') : ''))
      w = w2
    }
    if (!w) w = ['refused', 'no reader could get in — the reading rungs are toggled off, or the local reader is down (start it: ~/Local/crawl4ai/server.sh)']
    throw wallError(w)
  }
  // THE SCAFFOLDING (found 2026-08-22: ABC4 came back as "mostly navigation scaffolding, the site menus, not the
  // article meat"). r.jina.ai returns the whole page as markdown; a news site's chrome is link lists. Keep the
  // lines that read like prose: eight words or more, not a bare link or a bullet of links, not an image line.
  // If that leaves too little (a page that IS a list), hand back the raw read rather than nothing.
  function prose(md) {
    const lines = String(md).split(/\r?\n/), keep = []
    for (const l of lines) {
      const s = l.trim(); if (!s) { keep.push(''); continue }
      const links = (s.match(/\]\(/g) || []).length, words = s.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').split(/\s+/).filter(Boolean).length
      if (/^!\[/.test(s)) continue                                   // an image line
      if (/^[-*•]\s*\[/.test(s) && links >= 1) continue               // a bullet that is a link
      if (links >= 2 && words < links * 6) continue                  // a row of links
      if (words < 8 && !/^#{1,3}\s/.test(s) && links > 0) continue   // a short linked crumb
      keep.push(s)
    }
    const out = keep.join('\n').replace(/\n{3,}/g, '\n\n').trim()
    return out.length >= 400 ? out : md
  }
  window.OZ_CLEAN_READ = cleanRead
  // THE READ ALOUD (Sum 2026-08-22: "use ear art if we have it, draw it svg if we don't, next to hat for read me this
  // article, uses a similar bean"). ONE function for the ear in the sheets (cards/myview/breakdown.js) and the newsie's
  // psv_read_aloud (shell/oz-newsie.js): the clean text (cleanRead above, or words handed in) through the house voice, the
  // same OZ_VOICE the R key rides in a11y.js. No model, no tokens. Call it again for the same story and it stops.
  const CAP_SAY = 8000
  let reading = null
  const voice = () => window.OZ_VOICE
  function speaking() { const V = voice(); if (V && V.hasTTS) return !!(V.isSpeaking && V.isSpeaking()); return !!(window.speechSynthesis && speechSynthesis.speaking) }
  function hush() { try { const V = voice(); if (V && V.hasTTS && V.hush) V.hush(); else if (window.speechSynthesis) speechSynthesis.cancel() } catch (_) {} reading = null }
  async function readAloud(o) {
    o = o || {}
    const key = o.url || ((o.title || '') + String(o.text || '').slice(0, 60))
    if (speaking() && reading === key) { hush(); return 'stopped' }
    if (speaking()) hush()
    let text = String(o.text || '').trim()
    if (!text && o.url) text = await cleanRead(o.url)   // a wall throws e.blocked; the caller decides what to read instead
    if (!text) throw new Error('nothing to read')
    const words = ((o.title ? o.title + '. ' : '') + text).replace(/\s+/g, ' ').slice(0, CAP_SAY)
    const V = voice()
    if (V && V.hasTTS && V.speak) V.speak(words, { force: true, rate: 1.02, agentId: 'newsie' })
    else if (window.speechSynthesis) { const u = new SpeechSynthesisUtterance(words); u.rate = 1.02; speechSynthesis.speak(u) }
    else throw new Error('no voice on this device')
    reading = key
    return 'reading'
  }
  window.OZ_READ_ALOUD = Object.assign(readAloud, { speaking, hush })
})()
