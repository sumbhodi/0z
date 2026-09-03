// scroll-card.js — THE CONTENT CARD (Sum 2026-07-22). Everything reads IN a card —
// the read-in-card convention holds for ART too. Click a comic → the full strip
// opens here; click a hand-roll (koan · quote · wei · a long passage) → the full
// text opens here. A reader-style bar up top: hand-to-a-bot, and — for comics —
// "support the artist ↗" as a CHOICE (a human visit through the front door), never
// the forced default. News keeps reading in the Portal (OZ_READER, a real fetch).
;(function () {
  'use strict'
  const esc = s => { const d = document.createElement('div'); d.textContent = String(s == null ? '' : s); return d.innerHTML }
  const safeHref = u => { const v = String(u == null ? '' : u).trim(); return /^https?:\/\//i.test(v) ? esc(v) : '' }
  // images may also be LOCAL paintings (the app studio's painted funnies, shipped as card-relative
  // files — funny-metaverse.jpg): a bare safe filename passes; anything with a scheme or a path walk doesn't.
  const imgSrc = u => { const v = String(u == null ? '' : u).trim(); return /^https?:\/\//i.test(v) || /^(?:art\/)?[\w.-]+\.(?:png|jpe?g|webp|gif)$/i.test(v) ? esc(v) : '' }
  let ov = null
  function onEsc(e) { if (e.key === 'Escape') close() }
  function close() { if (ov) { ov.remove(); ov = null } document.removeEventListener('keydown', onEsc) }

  // no model key saved → ALL roads lead to the key door (Sum 2026-07-24: "hand-to-a-bot should point to the
  // api key since I have none on web yet"). don't fire a dead toto call keyless; open the door instead.
  const sfNoKey = () => { try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if ((window.REG && window.REG.providers
                ? new RegExp('^toto_(' + window.REG.providers.map(function (p) { return p.id }).join('|') + ')_key$')
                : /^toto_[a-z]+_key$/).test(k) && localStorage.getItem(k)) return false } return true } catch (_) { return true } }
  function handToBot(it) {
    if (sfNoKey()) { try { if (window.parent && window.parent.OZ_SETTINGS) window.parent.OZ_SETTINGS.open() } catch (_) {} close(); return }
    const bits = [it.title, it.body || it.desc, it.link ? '(' + it.link + ')' : ''].filter(Boolean).join('\n\n')
    const txt = `Here's something from ${it.src || 'the Port Side View'} I'm reading — tell me more about it:\n\n${bits}`
    try { if (window.parent && window.parent.ozAskBot) { window.parent.ozAskBot('newsie', txt); close() } } catch (_) {}   // the paper's OWN bot is the newsie — toto is 0z, not the PSV (Sum 2026-07-24: "strip more 0z from psv")
  }

  // SURF THIS TOPIC (Sum 2026-07-27) — the KEYLESS door out. no LLM: GOFAI just cleans the headline into a
  // good web query ("best guess SEO for more on this subject") and opens it in the Surf portal. keyed OR
  // keyless — surfing needs no model, only a query + the Port.
  function seoQuery(it) {
    let q = String(it.title || it.body || it.desc || '').replace(/\s+/g, ' ').trim()
    q = q.replace(/^["'“”‘’([]+/, '').replace(/["'“”‘’)\].…]+$/, '').trim()   // strip wrapping quotes / brackets / trailing ellipsis
    const who = String(it.by || '').trim()
    if (who && q.toLowerCase().indexOf(who.toLowerCase()) === -1) q = q + ' ' + who   // anchor the query on the named voice when it isn't already in the line
    if (q.length > 120) q = q.slice(0, 120).replace(/\s+\S*$/, '')
    return q || String(it.src || 'the port side view')
  }
  function surfTopic(it) {
    const term = seoQuery(it)
    close()
    try { if (window.SF_SEARCH) { window.SF_SEARCH(term, true); return } } catch (_) {}   // drive the masthead's surf box (results open clean through the Portal)
    const url = 'https://html.duckduckgo.com/html/?q=' + encodeURIComponent(term)   // fallback: straight out if the search box isn't mounted
    try { const R = (window.parent && window.parent.OZ_READER) || window.OZ_READER; if (R && R.read) { R.read(url); return } } catch (_) {}
    window.open(url, '_blank', 'noopener')
  }

  // YOUTUBE INLINE (proven 2026-07-24, "Me at the zoo" on extra2.pages.dev/_yt-test): a real http(s)
  // origin embeds fine — error 153 was the oz:// origin's missing ID, not YouTube policy. So ON THE WEB
  // a video piece plays right in the card; in the APP (oz://) the link keeps the route-out door.
  const ytId = u => { const m = /(?:youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{6,20})/.exec(String(u || '')); return m ? m[1] : '' }
  const webOrigin = /^https?:$/.test(location.protocol)

  function open(it) {
    close()
    const img = imgSrc(it.img), link = safeHref(it.link)
    const isComic = it.kind === 'comic'   // only real comic strips get "support the artist" (weird now reads in the Portal)
    const keyed = !sfNoKey()   // hand-to-a-bot needs a BYOK LLM (Sum 2026-07-27: "hide it keyless: bot / no bot = byok for llm"); surf works either way
    const isArt = it.section === 'art' || it.lane === 'art'   // ALL art, not just paintings (Sum 2026-07-27) — art images zoom via the loupe
    const vid = webOrigin ? ytId(link) : ''
    const kick = it.kickOverride ? esc(it.kickOverride) : [esc(it.src || ''), it.section ? esc(it.section) : ''].filter(Boolean).join(' · ')
    ov = document.createElement('div'); ov.className = 'sf-cardov'
    ov.innerHTML = `
      <div class="sf-cardpaper" role="dialog" aria-modal="true">
        <div class="sf-cardbar">
          <span class="sf-cardsrc">${esc(it.src || 'the paper')}</span>
          <button class="sf-cardbtn surf" type="button">↪ surf this topic</button>
          ${keyed ? `<button class="sf-cardbtn hand" type="button">↪ hand to a bot</button>` : ''}
          ${link ? `<a class="sf-cardbtn" href="${link}" target="_blank" rel="noopener">${isComic ? 'support the artist ↗' : 'original ↗'}</a>` : ''}
          <button class="sf-cardbtn x" type="button" aria-label="close">✕</button>
        </div>
        <div class="sf-cardbody">
          ${kick ? `<div class="sf-cardkick">${kick}</div>` : ''}
          <h1 class="sf-cardtitle">${esc(it.title || '')}</h1>
          ${vid ? `<iframe class="sf-cardyt" src="https://www.youtube-nocookie.com/embed/${vid}" title="video" allow="encrypted-media; picture-in-picture" allowfullscreen></iframe>` : ''}
          ${img && !vid ? `<img class="sf-cardimg${isArt ? ' zoomable' : ''}" src="${img}" alt="" onerror="this.remove()">` : ''}
          ${img && !vid && isArt ? `<button class="sf-cardzoom" type="button" aria-label="zoom the artwork full size">zoom ⌕</button>` : ''}
          ${(it.body || it.desc) ? `<div class="sf-cardtext">${esc(it.body || it.desc)}</div>` : ''}
          ${isComic && link ? `<div class="sf-cardnote">liked it? <a href="${link}" target="_blank" rel="noopener">visit ${esc(it.src || 'the artist')} ↗</a> — a real human hit through their front door.</div>` : ''}
        </div>
      </div>`
    document.body.appendChild(ov)
    ov.addEventListener('mousedown', e => { if (e.target === ov) close() })
    ov.querySelector('.x').addEventListener('click', close)
    ov.querySelector('.surf').addEventListener('click', () => surfTopic(it))
    const handBtn = ov.querySelector('.hand'); if (handBtn) handBtn.addEventListener('click', () => handToBot(it))   // .hand only exists when keyed
    const zoom = () => { try { if (window.SF_LOUPE) window.SF_LOUPE(it) } catch (_) {} }   // the feed's loupe: full museum glass, scroll-to-zoom, drag-to-pan — for ALL art
    const zb = ov.querySelector('.sf-cardzoom'); if (zb) zb.addEventListener('click', zoom)
    const zi = ov.querySelector('.sf-cardimg.zoomable'); if (zi) zi.addEventListener('click', zoom)
    document.addEventListener('keydown', onEsc)
  }

  window.SF_CARD = { open, close }
})()
