// milk.js — COOKIES AND MILK (Sum 2026-08-22). The reader leaves through a headline (the sheet says so,
// breakdown.js → app-card.js → OZ_MILK.left). When the window comes back, the strip rises over that paper:
// the pup with the thumb up, the unimpressed cat, the sad pup; the SVG beside each is the tell. A press
// writes ONE THIN LINE to the reading log in the sandbox (reads/log.json): when · paper · source · category
// · keywords · angle · rating. Never the headline as a string, never the link. No press, nothing written.
// "A log of use on disk in personal storage isn't even a cookie" — it stays on this machine; the server
// never sees it; the newsie asks before any of it rides an order slip (cards/feedline, the consent box).
//
// THE THREE TIERS, all GOFAI, no model (Sum: "one more granularity of detail"):
//   category  = the act or beat it lands in — the lexicon is the doomscroll README (8 acts · 10 beats)
//   keywords  = the nouns that survive a stopword strip, five or six, title first
//   angle     = what would be lost: kin words, ages, body verbs — "father · son · clings"
(function () {
  'use strict'
  const ART = 'cards/scroll/art/milk/', LOG = 'reads/log.json', WINDOW_MS = 45 * 60 * 1000
  const ACTS = {   // doomscroll/README.md — THE 8 ACTS (who) and THE 10 BEATS (when). Each is a name and a handful of words.
    'the goat': ['president', 'trump', 'white house', 'reality tv', 'celebrity of the year', 'executive order', 'oval office'],
    'the lever': ['musk', 'billionaire', 'richest', 'tesla', 'spacex', 'x.com', 'doge', 'bezos', 'zuckerberg'],
    'the big box': ['merger', 'acquisition', 'consolidat', 'walmart', 'amazon', 'blackrock', 'vanguard', 'private equity', 'buyout', 'monopol', 'antitrust'],
    'hid': ['artificial intelligence', ' ai ', 'chatbot', 'openai', 'anthropic', 'gemini', 'model', 'singularity', 'agi', 'llm', 'robot'],
    'peripherals': ['app', 'platform', 'subscription', 'software', 'update', 'iphone', 'android', 'startup', 'enshittif', 'outage', 'tech'],
    'migratory patterns': ['immigra', 'ice ', 'border', 'deport', 'asylum', 'visa', 'migrant', 'refugee', 'citizenship', 'raid'],
    'the front': ['war', 'troops', 'missile', 'strike', 'ceasefire', 'invasion', 'military', 'ukraine', 'gaza', 'israel', 'drone', 'nato'],
    'the scapegoats': ['blame', 'trans ', 'dei', 'woke', 'crime wave', 'homeless', 'illegal', 'gang', 'welfare'],
    'drought': ['drought', 'water', 'reservoir', 'lake', 'aquifer', 'river', 'snowpack'],
    'the heat': ['heat wave', 'heatwave', 'record high', 'temperature', 'scorch', 'hottest'],
    'the schools': ['school', 'teacher', 'student', 'classroom', 'district', 'university', 'campus'],
    'the data centre': ['data center', 'data centre', 'server farm', 'compute', 'power grid', 'megawatt', 'gigawatt', 'substation'],
    'the shooting': ['shooting', 'gunman', 'shot ', 'gunfire', 'firearm', 'mass shooting'],
    'the pump': ['gas price', 'gasoline', 'oil price', 'fuel', 'opec', 'barrel'],
    'the race': ['election', 'poll', 'candidate', 'ballot', 'vote', 'campaign', 'primary', 'senate', 'governor', 'midterm'],
    'fire': ['wildfire', 'blaze', 'evacuat', 'acres', 'firefighter', 'burn'],
    'the meeting': ['council', 'commission', 'zoning', 'hearing', 'planning', 'ordinance', 'board vote', 'public comment'],
    'the rent': ['rent', 'housing', 'eviction', 'landlord', 'mortgage', 'affordab', 'homeowner', 'apartment'],
  }
  const STOP = new Set('they them their theirs he she his hers him her it its we our ours you your yours i me my mine a an the and or but if then than that this these those there here with without from into onto over under about after before during while for nor not only own same so too very can will just also again once all any both each few more most other some such what which who whom whose when where why how are was were been being have has had does did doing would could should might must shall may says said say told tells according report reports reported news video live update updates watch photos new first last next year years week weeks day days today tonight yesterday tomorrow amid among against between because still already later early ago since until till'.split(' '))
  const KIN = /\b(father|mother|dad|mom|son|daughter|boy|girl|child|children|kid|kids|family|families|parent|parents|wife|husband|brother|sister|baby|grandmother|grandfather|grandma|grandpa|widow|orphan|couple|twins|toddler|teen|teenager|newborn|infant)\b/gi
  const AGE = /\b(\d{1,3}|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)[- ]year[- ]old\b/gi
  const BODY = /\b(cling|clings|clung|cries|cried|crying|weeps|hug|hugs|hugged|flee|fled|flees|dies|died|dying|killed|injured|wounded|collapsed|rescued|missing|found|starv\w*|hungry|homeless|evicted|arrested|detained|deported|separated|reunited)\b/gi

  function category(text) {
    const t = ' ' + String(text || '').toLowerCase() + ' '; let best = '', n = 0
    Object.entries(ACTS).forEach(([name, words]) => { const hits = words.reduce((a, w) => a + (t.includes(w) ? 1 : 0), 0); if (hits > n) { n = hits; best = name } })
    return best || 'the rest'
  }
  function keywords(title, text) {
    const freq = new Map(), order = []
    const take = (s, w) => String(s || '').replace(/[^A-Za-z0-9' -]/g, ' ').split(/\s+/).forEach(raw => {
      const k = raw.replace(/^'+|'+$/g, ''); if (k.length < 4 || STOP.has(k.toLowerCase()) || /^\d+$/.test(k)) return
      const key = k.toLowerCase(); if (!freq.has(key)) { freq.set(key, 0); order.push(key) }; freq.set(key, freq.get(key) + w)
    })
    take(title, 3); take(text, 1)
    return order.sort((a, b) => freq.get(b) - freq.get(a)).slice(0, 6)
  }
  function angle(text) {
    const t = String(text || ''), out = []
    const add = m => { if (m) m.forEach(x => { const k = x.toLowerCase(); if (!out.includes(k) && out.length < 5) out.push(k) }) }
    add(t.match(AGE)); add(t.match(KIN)); add(t.match(BODY))
    return out
  }
  const read = () => { try { const f = window.SANDBOX && window.SANDBOX[LOG]; const v = f ? JSON.parse(f.data || '[]') : []; return Array.isArray(v) ? v : [] } catch (_) { return [] } }
  function write(line) { try { const log = read(); log.push(line); window.SANDBOX[LOG] = { kind: 'code', ext: 'json', mime: '', data: JSON.stringify(log) } } catch (e) { console.warn('[milk] write failed', e) } }

  // ── the tell, then the return
  let pending = null, open = null
  function left(card, paper, l) { pending = { card, paper, left: l, at: Date.now(), blurred: 0 } }
  // the blur lands on whichever window HAD focus: the top window, or the sheet's frame the click happened in.
  // So both tell us: the top window by its own events, the frame by a { paper, back } message (breakdown.js).
  const gone = () => { if (pending) pending.blurred = pending.blurred || Date.now() }
  const back = () => { if (pending && pending.blurred && Date.now() - pending.at < WINDOW_MS) { const p = pending; pending = null; show(p) } }
  window.addEventListener('blur', gone); window.addEventListener('focus', back)
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') back(); else gone() })
  window.addEventListener('message', e => { const d = e.data; if (d && typeof d === 'object' && d.paper && d.back === true) back(); if (d && d.paper && d.gone === true) gone() })

  function show(p) {
    close()
    const body = p.card.querySelector('.card-body') || p.card; const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]))
    const el = document.createElement('div'); el.className = 'milk'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'you came back. how was it?')
    el.innerHTML = `<button class="milk-x" type="button" aria-label="close, rate nothing">✕</button><div class="milk-q">you came back. how was it?</div><div class="milk-hed">${esc(p.left.title || '')}</div>` +
      `<div class="milk-row">` +
      `<button class="milk-b" type="button" data-r="1" aria-label="liked it"><img src="${ART}pup-up.png" alt=""><img class="milk-svg" src="${ART}thumb-up.svg" alt=""></button>` +
      `<button class="milk-b" type="button" data-r="0" aria-label="meh"><img src="${ART}cat-meh.png" alt=""><img class="milk-svg" src="${ART}meh-cat.svg" alt=""></button>` +
      `<button class="milk-b" type="button" data-r="-1" aria-label="did not like it"><img src="${ART}pup-down.png" alt=""><img class="milk-svg" src="${ART}thumb-down.svg" alt=""></button>` +
      `</div><div class="milk-note">a press writes one line to your reading log on this machine: source · category · keywords · rating. never the headline, never the link. no press, nothing written.</div>`
    el.querySelectorAll('.milk-b').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); rate(p, +b.dataset.r); close() }))
    el.querySelector('.milk-x').addEventListener('click', e => { e.stopPropagation(); close() })
    el.addEventListener('mousedown', e => e.stopPropagation())
    body.appendChild(el); open = { el, card: p.card }
    setTimeout(() => { const b = el.querySelector('.milk-b'); if (b) b.focus() }, 50)
  }
  function close() { if (open) { open.el.remove(); open = null } }
  document.addEventListener('mousedown', e => { if (open && !open.card.contains(e.target)) close() }, true)   // click anywhere outside the card
  document.addEventListener('keydown', e => { if (open && e.key === 'Escape') close() })
  function rate(p, r) {
    const text = ((p.left.title || '') + ' ' + (p.left.text || '')).replace(/https?:\/\/\S+/g, ' ').replace(/\S+\.(jpe?g|png|webp|gif)\b/gi, ' ')   // My View's story text carries the picture's URL; a URL is not a keyword
    write({ at: Date.now(), paper: p.paper, source: p.left.source || '', category: category(text), keywords: keywords(p.left.title, p.left.text), angle: angle(text), rating: r })
  }
  window.OZ_MILK = { left, read, category, keywords, angle }
})()
