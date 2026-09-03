// breakdown.js — THE BREAKDOWN (the newsie's own name for the hat button, 2026-08-22). ONE factory for
// every paper: a small newsie cap at the end of each headline; press it and the order goes to the newsie
// AS THE READER (parent.conduct, src 'human'): "your take on this one". The answer lands in a slot under
// the headline. If the page blocks the bot, the slot offers the paste box (open the link, select all,
// copy, paste) and the same order goes again with the text. The newsie keeps the article in its stream,
// so the reader can keep asking it there; it decides how to answer (Sum: "newsie can decide how to respond").
// Also the tell for cookies and milk: a press on a headline link posts { paper, left: {...} } to the card
// (app-card.js papers), which is how the card knows which story the reader left through.
// Loaded by cards/myview/myview.html and cards/feedline/feedline.html after their own script; each calls
// BREAKDOWN.dress(root) after it draws. Nothing here is carved twice.
(function () {
  'use strict'
  const P = window.parent
  const PAPER = document.body.dataset.paper || 'paper'
  // the cap, resolved from THIS script's URL, not the document's base: in the ported copy the base is the live host
  const CAP = (() => { try { return new URL('../../agents/newsie/newsie-cap.svg', (document.currentScript && document.currentScript.src) || location.href).href } catch (_) { return '../../agents/newsie/newsie-cap.svg' } })()
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]))
  // THE BEACON: a sheet runs blind inside the app (no console to read from outside), so every step and every
  // error lands in the parent's sandbox as port/sheet-log.json (last 60 lines) — readable off disk.
  const beacon = (what, extra) => { try { console.log('[breakdown]', what, extra || ''); const sb = P && P.SANDBOX; if (!sb) return; let log = []; try { log = JSON.parse((sb['port/sheet-log.json'] || {}).data || '[]') } catch (_) {} log.push({ at: Date.now(), paper: PAPER, what, extra: extra == null ? '' : String(extra).slice(0, 300) }); sb['port/sheet-log.json'] = { kind: 'code', ext: 'json', mime: '', data: JSON.stringify(log.slice(-60)) } } catch (_) {} }
  window.addEventListener('error', e => beacon('error', (e.message || '') + ' @' + (e.filename || '').split('/').pop() + ':' + e.lineno))
  window.addEventListener('unhandledrejection', e => beacon('rejection', e.reason && (e.reason.message || e.reason)))

  // THE COUNTER ROAD, once, for every sheet (Sum 2026-08-22: "just a short blurb, the paper, and follow up… apply the same
  // filter to summary as well, don't need same text twice"). The order goes in AS THE READER (parent.conduct, src human),
  // wrapped in one fence so the stream's history painter folds it; every live turn of the work folds too (the wrapper
  // fences whole turns); afterwards one short line to the reader stands in the clear. The Feedline uses this same road.
  function rawUI() {
    try { const bar = P.document.querySelector('.agent-bar[data-agent="newsie"]'); if (bar && P.chatUI) return P.chatUI(bar.querySelector('.convo-screen'), bar.querySelector('.msg-stream'), 'user') } catch (_) {}
    return P.consoleUI ? P.consoleUI() : null
  }
  function foldUI() {
    const raw = rawUI(); if (!raw || !raw.turn) return raw
    return Object.assign({}, raw, { turn(role) {
      const b = raw.turn(role); let buf = ''
      return { push(c) { buf += c }, seal(meta) { const t = buf.replace(/```/g, "\u0027\u0027\u0027").trim(); b.push(t ? '```cut\n' + t + '\n```' : ''); b.seal(meta) } }
    } })
  }
  async function order(text) { beacon('order', text.slice(0, 80)); if (!P.conduct) throw new Error('no conductor'); const r = await P.conduct('newsie', '```order slip\n' + text + '\n```', foldUI(), null, 'human'); beacon('order:reply', r && (r.error || (r.text || '').slice(0, 80))); if (r && r.error) throw new Error(r.error); return (r && r.text) || '' }
  function say(lines) { try { const raw = rawUI(); if (!raw || !raw.turn) return; const b = raw.turn('bot'); b.push([].concat(lines).filter(Boolean).join('\n\n')); b.seal('done') } catch (_) {} }
  window.COUNTER = { order, say, ui: foldUI, rawUI }
  let queue = Promise.resolve()
  const serial = fn => (queue = queue.then(fn, fn))   // one order at a time into the newsie's stream

  // THE READ (Sum 2026-08-22: "don't make it websearch and read, use jina, the one that hands bots clean text, and just
  // hand it to newsie"). The newsie receives the TEXT and answers. No tool calls on its side.
  // the clean read lives in the shell (shell/clean-read.js), one function for every reader; reached through the parent
  async function cleanText(url) { if (!P.OZ_CLEAN_READ) throw new Error('no clean read in the shell'); return P.OZ_CLEAN_READ(url, { eyes: 'newsie' }) }   // eyes: the shot rides the same order when the newsie's model can see
  const slipTake = (hed, source, text, how) => `Order at the counter: your take on this one, please. ${how} Fill the box: what happened, who says so, and what it means, in one short plain paragraph; then one line of your own, what you'd want to know next, what it connects to, or a question back to me. Plain text, no headings.\nHEADLINE: ${hed}${source ? '\nSOURCE: ' + source : ''}\nTEXT:\n${text}`
  const HOW_URL = 'Here is the article, handed to you as clean text.', HOW_CARD = 'There is no link on this one; here is the card itself, as printed.', HOW_PASTE = "Here is the article, pasted by hand because the site blocked the read.", HOW_OWN = "This one is the paper's own piece, ours, as printed; the source it riffed from is named at the end for reference. Give your take on our piece first; reach for the source only if the reader asks."
  // the source line: My View's .meta ('NPR · Aug 22') or the print's .sf-kick ('toto · 3 min read · abc4 utah', the source last).
  // ⚠ This function was cut by accident on 2026-08-22 when the read section was rewritten; every press then died on
  //   "Can't find variable: sourceOf" — no link-out, no breakdown. The beacon found it. Keep it above its callers.
  function sourceOf(article) { const m = article.querySelector('.meta'); if (m) return (m.textContent || '').split('·')[0].trim(); const k = article.querySelector('.sf-kick'); if (k) { const parts = (k.textContent || '').split('·').map(x => x.trim()).filter(Boolean); return parts[parts.length - 1] || '' } return '' }
  function slot(article) {
    let s = article.querySelector(':scope > .breakdown')
    if (!s) { s = document.createElement('div'); s.className = 'breakdown'; const h3 = article.querySelector('h3, h2'); if (h3 && h3.nextSibling) article.insertBefore(s, h3.nextSibling); else article.appendChild(s) }
    return s
  }
  const render = (s, html) => { s.innerHTML = html; s.hidden = false }
  const answer = r => `<div class="bd-head">the breakdown <small>keep asking the newsie in its stream; it has the article now</small></div><div class="bd-text"><p>${esc(r.trim()).replace(/\n{2,}/g, '</p><p>').replace(/\n/g, '<br>')}</p></div>`
  function cardText(article) { const c = article.cloneNode(true); c.querySelectorAll('.breakdown, .hat, script, style').forEach(x => x.remove()); return (c.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 6000) }
  // the hat ASKS first (Sum 2026-08-22: "leave hat as only target for summary in box after are you sure"): a
  // consult spends tokens, so the slot shows the question and two buttons before anything is fetched or sent.
  function askFirst(article, hat) {
    const s = slot(article); hat.setAttribute('aria-expanded', 'true')
    render(s, `<div class="bd-head">the breakdown</div><div class="bd-text">Ask the newsie for its take on this one? It reads the story itself, not the web, and spends tokens doing it. Walled? A paste box opens.</div>` +
      `<div class="bd-row"><button type="button" class="bd-go">ask the newsie</button><button type="button" class="bd-no">not now</button></div>`)
    s.querySelector('.bd-go').addEventListener('click', e => { e.stopPropagation(); breakdown(article, hat) })
    s.querySelector('.bd-no').addEventListener('click', e => { e.stopPropagation(); s.remove(); hat.setAttribute('aria-expanded', 'false') })
  }
  async function breakdown(article, hat) {
    const h = article.querySelector('h3, h2'), a = h && h.querySelector('a')
    const hed = ((a || h) && (a || h).textContent || '').trim(), link = a && /^https?:/i.test(a.href) ? a.href : (h && h.dataset && /^https?:/i.test(h.dataset.link || '') ? h.dataset.link : ''), source = sourceOf(article)   // the ported copy carries the link as data-link on the title (its own card owns the press)
    const s = slot(article); hat.setAttribute('aria-expanded', 'true'); hat.disabled = true
    beacon('breakdown', ((h && h.dataset && h.dataset.text) ? 'own piece' : (link || 'no link')) + ' · ' + hed.slice(0, 60))
    render(s, `<div class="bd-wait">${(h && h.dataset && h.dataset.text) ? 'handing the newsie our own piece…' : link ? 'fetching it clean for the newsie…' : 'handing the newsie the card…'}</div>`)
    try {
      let text, how
      const own = h && h.dataset && h.dataset.text   // the ported copy: the paper's OWN piece rides the title (port.js); our IP goes first, the source is a reference
      if (own) { text = own + (link ? '\n\nSOURCE (the article the piece riffed from, for reference): ' + link : ''); how = HOW_OWN }
      else if (link) { try { text = await cleanText(link); how = HOW_URL } catch (e) { paste(s, hed, 'The site did not hand over the text' + ((e && e.say) ? ' — ' + e.say + '.' : (e && (e.blocked || e.message === 'blocked')) ? ' (a wall or a bouncer).' : ' (' + (e && e.message || e) + ').')); return } }
      else { text = cardText(article); how = HOW_CARD }
      render(s, `<div class="bd-wait">the newsie is reading it…</div>`)
      render(s, answer(await serial(() => order(slipTake(hed, source, text, how)))))
      say(`🎩 The breakdown on "${hed.slice(0, 90)}" is on the paper. Ask me more about it here.`)   // once, short: the take itself is on the page
    } catch (e) { render(s, `<div class="bd-wait">the breakdown failed: ${esc(e && e.message || e)}</div>`) }
    finally { hat.disabled = false }
  }
  function paste(s, hed, why) {
    render(s, `<div class="bd-head">the newsie couldn't get in</div><div class="bd-text">${esc(why)}</div>` +
      `<div class="bd-tip">Open the link, select all (⌘A), copy (⌘C), and paste it here (⌘V). The newsie reads what you hand it.</div>` +
      `<textarea class="bd-paste" rows="6" aria-label="paste the article here"></textarea><button type="button" class="bd-go">hand it over</button>`)
    s.querySelector('.bd-go').addEventListener('click', async () => {
      const t = s.querySelector('.bd-paste').value.trim(); if (!t) return
      render(s, `<div class="bd-wait">the newsie is reading what you pasted…</div>`)
      try { render(s, answer(await serial(() => order(slipTake(hed, '', t.slice(0, 14000), HOW_PASTE))))) } catch (e) { render(s, `<div class="bd-wait">${esc(e && e.message || e)}</div>`) }
    })
  }
  // THE EAR — read me this story (Sum 2026-08-22: "use ear art if we have it, draw it svg if we don't, next to hat for read
  // me this article, uses a similar bean"). No ear on disk (only the hear-no-evil monkey), so it is drawn. The same
  // three-way read as breakdown(): the paper's own piece, the clean text of the link, or the card as printed; then the
  // shell's OZ_READ_ALOUD (shell/clean-read.js), the road the newsie's psv_read_aloud takes too. No model, no tokens, so
  // nothing to ask first. Press again to stop. Pressed = contrast flipped (ink plate, paper line), not a colour.
  const EAR = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6.5 9.5a5.5 5.5 0 1 1 11 0c0 2.2-1 3.6-2.2 4.9-1 1.1-1.8 2-1.8 3.6a2.5 2.5 0 0 1-5 0"/><path d="M9.8 9.5a2.2 2.2 0 0 1 4.4 0c0 1.4-1.6 1.8-1.6 3.2"/></svg>'
  async function listen(article, ear) {
    const R = P.OZ_READ_ALOUD; if (!R) { beacon('ear', 'no reader in the shell'); return }
    const unpress = () => ear.setAttribute('aria-pressed', 'false')
    if (ear.getAttribute('aria-pressed') === 'true') { R.hush(); unpress(); return }
    const h = article.querySelector('h3, h2'), a = h && h.querySelector('a')
    const hed = ((a || h) && (a || h).textContent || '').trim(), link = a && /^https?:/i.test(a.href) ? a.href : (h && h.dataset && /^https?:/i.test(h.dataset.link || '') ? h.dataset.link : '')
    const own = h && h.dataset && h.dataset.text
    ear.setAttribute('aria-pressed', 'true'); ear.disabled = true
    beacon('ear', (own ? 'own piece' : (link || 'card')) + ' · ' + hed.slice(0, 60))
    try {
      try { await R({ title: hed, url: own ? '' : link, text: own || (link ? '' : cardText(article)) }) }
      catch (e) { if (!link) throw e; beacon('ear:fallback', e && e.message); await R({ title: hed, text: cardText(article) }) }   // a wall: the card as printed
      ear.disabled = false
      setTimeout(() => { const tick = setInterval(() => { if (!R.speaking()) { clearInterval(tick); unpress() } }, 600) }, 1500)   // the voice takes a beat to start
    } catch (e) { ear.disabled = false; unpress(); beacon('ear:error', e && e.message) }
  }
  // the hat: one per headline, named, big enough to hit
  function dress(root) {
    ;(root || document).querySelectorAll('article h3, article h2').forEach(h3 => {
      if (h3.querySelector('.hat') || !(h3.textContent || '').trim()) return   // every story gets the hat, link or not; an empty heading does not
      const b = document.createElement('button'); b.type = 'button'; b.className = 'hat'
      b.title = 'the breakdown — ask the newsie about this story'; b.setAttribute('aria-label', 'the breakdown: ask the newsie about this story'); b.setAttribute('aria-expanded', 'false')
      b.innerHTML = `<img src="${CAP}" alt="">`
      b.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); askFirst(h3.closest('article'), b) })
      h3.appendChild(b)
      const ear = document.createElement('button'); ear.type = 'button'; ear.className = 'hat ear'
      ear.title = 'read me this story'; ear.setAttribute('aria-label', 'read me this story out loud; press again to stop'); ear.setAttribute('aria-pressed', 'false')
      ear.innerHTML = EAR
      ear.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); listen(h3.closest('article'), ear) })
      h3.appendChild(ear)
    })
  }
  // the tell AND the road out. THE WHOLE STORY IS THE TARGET (Sum 2026-08-22: "make pic and summary also
  // targets, not just headline for link out"): a press anywhere on the story — picture, headline, summary —
  // goes out through the story's link; the hat and the breakdown box are the two things that do not. The top
  // window's link router (shell/links.js) never sees a click inside this frame, so the sheet routes the link
  // out itself through the card's OZ_SPLIT/OZ_OPEN, then tells the card which story it left through.
  function storyLink(art) { const a = art.querySelector('h3 a, h2 a'); return a && /^https?:/i.test(a.href) ? a : null }
  document.addEventListener('click', e => {
    if (e.button !== 0 || !e.target.closest) return
    if (e.target.closest('.hat, .breakdown, .sf-watch, button, input, textarea, select')) return
    const art = e.target.closest('article'); if (!art) return
    const other = e.target.closest('a'); const a = storyLink(art); if (!a) return
    if (other && other !== a) return   // some other link inside the story (a source line, a credit) keeps its own road
    const left = { title: a.textContent.trim(), link: a.href, source: sourceOf(art), text: ((art.dataset.t || art.textContent) || '').slice(0, 600), at: Date.now() }
    // side by side when the bolt can (links.js OZ_SPLIT: 0z snaps left, Chrome opens right); a plain open otherwise
    try { const go = P.OZ_SPLIT || P.OZ_OPEN; const ok = go && go(a.href); beacon('link-out', (go === P.OZ_SPLIT ? 'split' : go ? 'open' : 'NO ROAD') + ' → ' + ok + ' · ' + a.href.slice(0, 80)); if (ok) e.preventDefault() } catch (err) { beacon('link-out:error', err && err.message) }
    try { P.postMessage({ paper: PAPER, left }, '*') } catch (_) {}
  }, true)
  // the frame's own blur/focus: when the click was in here, the OS focus change lands here, not on the top window
  window.addEventListener('blur', () => { try { P.postMessage({ paper: PAPER, gone: true }, '*') } catch (_) {} })
  window.addEventListener('focus', () => { try { P.postMessage({ paper: PAPER, back: true }, '*') } catch (_) {} })
  const css = document.createElement('style'); css.textContent = `
  .hat { display:inline-flex; align-items:center; vertical-align:middle; margin-left:6px; border:0; background:none; padding:3px; cursor:pointer; border-radius:6px }
  .hat img { width:22px; height:auto; display:block; -webkit-user-drag:none }
  .hat:focus-visible { outline:3px solid var(--red,#8e1f12); outline-offset:2px }
  .hat[aria-expanded="true"] img { filter:drop-shadow(0 0 2px var(--red,#8e1f12)) }
  .hat[disabled] { opacity:.6; cursor:progress }
  .ear { margin-left:2px; color:var(--ink,#14140f) }
  .ear svg { width:22px; height:22px; display:block; fill:none; stroke:currentColor; stroke-width:2; stroke-linecap:round; stroke-linejoin:round }
  .ear[aria-pressed="true"] { background:var(--ink,#14140f); color:var(--paper,#f4efe1) }
  .breakdown { margin:6px 0 8px; padding:10px 12px; border-left:3px solid var(--ink,#14140f); background:rgba(20,20,15,.045); font-size:14px; line-height:1.45; font-weight:400 }
  .bd-head { font-size:11px; letter-spacing:.22em; text-transform:uppercase; color:var(--dim,#6b6558); margin-bottom:6px }
  .bd-head small { display:block; letter-spacing:.04em; text-transform:none; font-size:12px; margin-top:2px }
  .bd-text p { margin:0 0 8px } .bd-text p:last-child { margin:0 }
  .bd-wait { font-style:italic; color:var(--dim,#6b6558) }
  .bd-tip { margin:8px 0 4px; color:var(--dim,#6b6558) }
  .bd-paste { width:100%; font:inherit; font-size:13px; padding:8px; border:1.5px solid var(--ink,#14140f); background:#fff; margin:4px 0 8px }
  .bd-row { display:flex; gap:10px; margin-top:8px }
  .bd-go { font:inherit; font-size:13px; padding:7px 14px; border:1.5px solid var(--ink,#14140f); background:var(--ink,#14140f); color:var(--paper,#f4efe1); cursor:pointer }
  .bd-no { font:inherit; font-size:13px; padding:7px 14px; border:1.5px solid var(--ink,#14140f); background:transparent; color:var(--ink,#14140f); cursor:pointer }
  article:has(h3 a, h2 a) { cursor:pointer }`
  document.head.appendChild(css)
  // a sheet that drew itself BEFORE this file loaded (My View restoring its last fill) gets its hats now
  try { dress(document) } catch (_) {}
  window.BREAKDOWN = { dress }
})()
