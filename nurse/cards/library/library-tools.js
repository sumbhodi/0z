// library-tools.js — 🏮 DRIA'S HANDS. Four atomic beans on the red lamp card, so the librarian can do
// what her persona promises: find the thing, read it at the right altitude, name the thread it runs
// through, and hand you the address. Nothing here invents a connection — every answer is drawn from
// the ziggurat the ox filed (window.ZIG) and the text it stands on (window.LAMP_TEXT).
//
// COPY, DON'T IMITATE — the parents of every part (5 R's: one factory, never a second copy):
//   the bean shape + klass + readback   ← shell/tools.js makeTool (the make-tool standard, 2026-08-14)
//   the strike/clue voice + list-mode   ← shell/oz-newsie.js feedline_note · psv_mute
//   the toolkit blurb row               ← shell/toolkits.js
// THE FOUR-FOLD ROUTE these ride (conductor.js): the cards fence names the card · the stray-call scan
// catches a bare token · the que phase salvages an unknown name against the granted set · gateRun is
// the one choke point that tapes the call and its read-back. Four rails, one landing.
//
// ⚠ ALL FOUR ARE klass 'read' BY DESIGN: they only ever LOOK. Nothing here writes to a shelf, and the
// stacks are public domain — the lowest-risk hands in the app. The only thing a strike can change is
// which page you are standing on, and that is what the reader is for.
;(function () {
  'use strict'
  const MT = window.makeTool; if (!MT) return
  const Z = () => window.ZIG || { title: {}, alcoves: {}, threads: {}, named: {}, toc: {} }
  // 💤 THE CORPUS ARRIVES LATE (shell/lazy.js): 1.75 MB of public-domain text is no longer on the
  //    boot path, and these four beans are the ONLY shell-side reader of it (the CARD carries its own
  //    copy inside library.html). So every strike waits for it — `await lamp()` — instead of reading
  //    an empty shelf and answering "nothing filed", which would be a lie with a straight face.
  const T = () => window.LAMP_TEXT || {}
  const lamp = () => (window.OZ_LAZY ? window.OZ_LAZY.need('library') : Promise.resolve())
  const titleOf = s => (Z().title[s] || s)
  const cap = (s, n) => { s = String(s || ''); return s.length > n ? s.slice(0, n) + '\n…(cut at ' + n + ' — ask for the next stretch)' : s }

  // ── lamp_find — THE DRAWER, handed to the bot. The same three readers the human's drawer pulls:
  //    L4 threads first (the widest net), then L3 pointers, then the raw where the app holds it. ──
  MT({ id: 'lamp_find', card: 'library', klass: 'read',
    readback: () => 'the drawer is open on the card',
    blurb: 'search the stacks and get ADDRESSES back — threads (an idea in two or more books), pointers (what is at an address), or the raw words themselves. every hit names the rung it was found on. LOW-RISK: looking only.',
    clue: 'find where something lives in the stacks. you get addresses, not prose.\n' +
      'template: { "tool": "lamp_find", "theme": "simplicity" }\n' +
      '{ "tool": "lamp_find", "quote": "quiet desperation" } searches the raw where we hold it · ' +
      '{ "tool": "lamp_find", "work": "walden", "theme": "solitude" } narrows to one book.\n' +
      'cite what comes back — an answer without an address is gossip.',
    strike: async call => { await lamp()
      const zig = Z(), want = String(call.theme || call.topic || '').toLowerCase().trim()
      const quote = String(call.quote || '').toLowerCase().trim().replace(/^["“']|["”']$/g, '')
      const only = String(call.work || '').toLowerCase().trim()
      if (!want && !quote) return 'what am I looking for? { "tool": "lamp_find", "theme": "…" } or "quote": "…"'
      const seen = {}, hits = []
      const push = (w, n, rung, why) => {
        if (only && w.indexOf(only) < 0) return
        const k = w + ':' + n; if (seen[k]) return; seen[k] = 1
        hits.push('  ' + k + '  (' + titleOf(w) + ')  rung ' + rung + ' — ' + why)
      }
      if (want) {
        Object.keys(zig.threads).forEach(t => {
          if (t.indexOf(want) < 0 && want.indexOf(t) < 0) return
          zig.threads[t].forEach(s => push(s[0], s[1], 4, 'thread: ' + t))
        })
        Object.keys(zig.alcoves).forEach(w => {
          const A = zig.alcoves[w]
          Object.keys(A).forEach(n => {
            if ((A[n].kw || []).some(k => k.indexOf(want) >= 0)) push(w, n, 3, 'pointer: ' + want)
          })
        })
      }
      if (quote) {
        const text = T()
        Object.keys(text).forEach(w => text[w].forEach(pg => {
          if (String(pg.raw || '').toLowerCase().indexOf(quote) >= 0) push(w, pg.n, 0, 'the words are here')
        }))
      }
      if (!hits.length) {
        return 'nothing on my shelves for that. say so plainly — do not invent a citation. ' +
          (quote ? 'I can only search the raw where the app holds it; the rest of the stacks are still being filed.' : '')
      }
      return hits.length + ' address' + (hits.length === 1 ? '' : 'es') + ':\n' + hits.slice(0, 24).join('\n') +
        (hits.length > 24 ? '\n  …' + (hits.length - 24) + ' more' : '') +
        '\nread one with lamp_read; every claim you make from it carries its address.'
    } })

  // ── lamp_read — ONE ADDRESS, ONE ALTITUDE. The elevator, handed to the bot. ──
  MT({ id: 'lamp_read', card: 'library', klass: 'read',
    readback: () => 'read from the stacks',
    blurb: 'read one address at one altitude: 0 the raw verbatim · 1 the teaching (raw expanded) · 2 the whole work’s table of contents · 3 the pointers at that address. LOW-RISK: reading public domain.',
    clue: 'read an address. the rung decides how far out you stand.\n' +
      'template: { "tool": "lamp_read", "addr": "aurelius:p30", "rung": 0 }\n' +
      'rung 0 = raw verbatim (quote from this, never from memory) · 1 = the teaching · 2 = the work’s TOC · 3 = the pointers.\n' +
      'quote the raw exactly. a quote paraphrased is a different quote.',
    strike: async call => { await lamp()
      const raw = String(call.addr || '').trim()
      const [w, n] = raw.split(':')
      if (!w) return 'which address? { "tool": "lamp_read", "addr": "walden:p12", "rung": 0 }'
      // (same parse as lamp_open, written explicitly: here the default is 0 so `|| 0` was harmless,
      //  but leaving two different spellings of one idea is how the harmless one gets copied.)
      const _r = parseInt(call.rung, 10)
      const rung = Math.max(0, Math.min(3, Number.isFinite(_r) ? _r : 0))
      if (rung === 2) {
        const toc = Z().toc[w]
        return toc ? titleOf(w) + ' — the first TOC:\n\n' + cap(toc, 6000)
                   : 'no TOC filed for ' + w + ' yet — the ox writes it after the alcoves.'
      }
      if (rung === 3) {
        const rec = (Z().alcoves[w] || {})[n]
        if (!rec) return 'no pointer filed at ' + raw + '.'
        const wide = (rec.kw || []).filter(k => Z().threads[k])
        return raw + ' · ' + (rec.sig || 'passage') + '\nkeywords: ' + (rec.kw || []).join(', ') +
          (wide.length ? '\nthreads through other books: ' + wide.join(', ') : '\nnothing here runs to another book yet.')
      }
      const pages = T()[w] || []
      const pg = pages.find(p => p.n === n) || (n ? null : pages[0])
      if (!pg) return 'nothing at ' + raw + ' in the app yet. ' + (pages.length ? 'that work holds: ' + pages.map(p => p.n).join(' ') : 'that work has no filed alcoves here.')
      if (rung === 1) return pg.teach ? cap(pg.teach, 6000) : 'no teaching filed for ' + raw + ' — rung 0 is the whole truth here.'
      return cap(pg.raw, 6000)
    } })

  // ── lamp_thread — THE SAME IDEA IN ANOTHER BOOK. A thread is a keyword the ox filed in two or
  //    more works: computed, never invented. This is the one that makes the library worth having. ──
  MT({ id: 'lamp_thread', card: 'library', klass: 'read',
    readback: () => 'walked a thread',
    blurb: 'name a thread and get its stations across books, or ask what threads a passage runs through. a thread is an idea the stacks carry in two or more works — computed from the filing, never invented. LOW-RISK.',
    clue: 'walk an idea across books.\n' +
      'template: { "tool": "lamp_thread", "thread": "simplicity" }\n' +
      '{ "tool": "lamp_thread", "addr": "walden:p12" } names the threads that passage runs through · ' +
      '{ "tool": "lamp_thread", "list": true } reads the whole weave.\n' +
      'never claim a connection the stacks cannot point at.',
    strike: async call => { await lamp()
      const zig = Z()
      if (call.list) {
        const rows = Object.keys(zig.threads).map(k => {
          const w = {}; zig.threads[k].forEach(s => { w[s[0]] = 1 })
          return '  ' + k + ' — ' + zig.threads[k].length + ' stations in ' + Object.keys(w).length + ' books'
        })
        return rows.length ? 'the weave, as it stands:\n' + rows.join('\n') : 'no threads filed yet.'
      }
      if (call.addr) {
        const [w, n] = String(call.addr).split(':')
        const rec = (zig.alcoves[w] || {})[n]
        if (!rec) return 'no pointer filed at ' + call.addr + '.'
        const wide = (rec.kw || []).filter(k => zig.threads[k])
        return wide.length
          ? call.addr + ' runs through: ' + wide.join(', ') + '\nwalk one with { "tool": "lamp_thread", "thread": "…" }'
          : call.addr + ' carries nothing that reaches another book yet — say so; do not reach for one.'
      }
      const t = String(call.thread || '').toLowerCase().trim()
      const key = zig.threads[t] ? t : Object.keys(zig.threads).find(k => k.indexOf(t) >= 0 || t.indexOf(k) >= 0)
      if (!key) return 'no thread by that name. { "tool": "lamp_thread", "list": true } reads the weave.'
      const st = zig.threads[key]
      return '"' + key + '" — ' + st.length + ' stations:\n' +
        st.map(s => '  ' + s[0] + ':' + s[1] + '  (' + titleOf(s[0]) + ')').join('\n') +
        '\nread any of them with lamp_read; cite the address when you use it.'
    } })

  // ── lamp_open — PUT THE HUMAN THERE. The only bean that moves the card: it opens the reader at an
  //    address and altitude so the two of you are looking at the same page. ──
  MT({ id: 'lamp_open', card: 'library', klass: 'read',
    // ⚠ this read the PARENT document for an element that lives inside the card's FRAME, so it always
    //    answered "undefined" — a read-back that cannot see the surface is worse than none, because it
    //    looks like an answer. It goes through the frame now, like the strike does.
    readback: () => { try {
      const f = document.querySelector('.card[data-card="library"] .app-frame')
      const w = f && f.contentWindow
      const at = w && w.OZ_LAMP && w.OZ_LAMP.where && w.OZ_LAMP.where()
      if (!at || !at.work) return 'the reader has nothing open'
      // ⭐ THE PASS BACK (Sum 2026-08-26) — the reader measures itself and hands the measurement back, so
      //    a bot can give DIRECTIONS instead of a highlight: which page of how many, how many columns are
      //    actually showing, and the count line the human is looking at ("1,220–1,655 words of 8,400").
      //    That is enough to say "about a third of the way down the left column" — actionable, and it does
      //    not fight the pagination the way marking the DOM does.
      return 'the reader is on ' + at.work + ':' + (at.page || '?') + ' at rung ' + at.rung +
             ' \u00b7 page ' + (at.idx + 1) + ' of ' + at.pages +
             ' \u00b7 ' + at.columns + ' column' + (at.columns === 1 ? '' : 's') + ' showing' +
             (at.count ? ' \u00b7 ' + at.count : '')
    } catch (_) { return 'could not see into the reader' } },
    blurb: 'open the reader on the card at one address and altitude, so the human sees the passage you are talking about. LOW-RISK: it turns a page, nothing more.',
    clue: 'put the reader in front of them at the passage you mean, and point at it.\n' +
      'template: { "tool": "lamp_open", "addr": "tao:p3", "rung": 1 }\n' +
      '{ "tool": "lamp_open", "addr": "tao:p3", "point": "the nameless is the beginning" } opens the page AND marks those exact words.\n' +
      'point → a phrase FROM THE PAGE, copied exactly. It is found in the open leaf and scrolled to, wearing a mark. Paraphrase it and nothing is found — you will be told so, plainly.\n' +
      'do this whenever you quote something — reading it TO them and showing them the page are two different courtesies, and you owe both.\n' +
      '⭐ THEN GIVE DIRECTIONS. The read-back tells you which page of how many, HOW MANY COLUMNS are showing, and the reader\'s own count line ("1,220\u20131,655 words of 8,400"). Use it: "third of the way down the left column" is somewhere an eye can land; "it is on page 30" is not. Say ONE column or LEFT/RIGHT column from what the read-back reports \u2014 never assume two, the reader drops to one on a narrow window.\n' +
      'rung defaults to 0, the RAW. That is the only rung you may quote from.',
    strike: async call => { await lamp()
      const addr = String(call.addr || '').trim()
      if (!addr.includes(':')) return 'which address? { "tool": "lamp_open", "addr": "walden:p12" }'
      // ⚠ `parseInt(x, 10) || 1` swallows ZERO, and rung 0 is the RAW VERBATIM — the one this tool's own
      //    clue calls "quote from this, never from memory". Asking for rung 0 silently got rung 1, the
      //    teaching layer, and a bot quoting from it would have been quoting a paraphrase while believing
      //    it had the raw. Found by firing rung:0 and reading "rung 1" back out of the answer.
      const _r = parseInt(call.rung, 10)
      const rung = Math.max(0, Math.min(4, Number.isFinite(_r) ? _r : 0))   // (26 Aug) was 1 — the fourth door onto the commentary. Rung 0 is the book.
      try {
        if (window.toggleCard) window.toggleCard('library', true, {})
        const frame = document.querySelector('.card[data-card="library"] .app-frame')
        const w = frame && frame.contentWindow
        if (!w || !w.OZ_LAMP || !w.OZ_LAMP.go) return 'the library card is not open on the desk yet — it is opening now; try again.'
        if (!w.OZ_LAMP.go(addr, rung)) return 'lamp_open: nothing at ' + addr + ' — that page is not on the shelf, and the reader was NOT moved. lamp_read the work at rung 2 for its table of contents, or lamp_find for a real address. Do not tell them it is there.'
        // ⭐ POINT (26 Aug) — a parameter, not a bean. lamp_open already puts them on the page; marking
        //    the line is the same act one notch finer, and a second bean would be a second door into one
        //    wall. It reports FAILURE honestly: a phrase that is not on the page returns false, and the
        //    bot is told, rather than claiming to have pointed at something it paraphrased.
        var pt = call.point ? w.OZ_LAMP.point(String(call.point)) : null
        return 'the reader is on ' + addr + ' at rung ' + rung + '. they can see what you see.' +
          (pt === true ? ' Marked "' + String(call.point).slice(0, 48) + '" on the page.'
           : pt === false ? ' ⚠ Could NOT point at "' + String(call.point).slice(0, 48) + '" — those exact words are not on this page. Quote it verbatim from rung 0, or say where to start reading instead.' : '')
      } catch (e) { return 'could not turn the page: ' + (e && e.message) }
    } })

  // ── lamp_checkout — PUT IT ON THEIR CARD. Sum 2026-08-26: "if user asks about an author or work a lot
  //    or likes something, can offer to check it out for them and put it in their collection."
  //    ⚠ IT USES THE HUMAN'S OWN DOOR. The ✓ buttons on the card call stamp(); this calls the same
  //    function through OZ_LAMP.checkout, so a bot checking a book out and a human checking a book out
  //    are the SAME act, land in the same store, and paint the same card. No second road to the shelf.
  //    ⭐ OFFER, DO NOT ASSUME. Their card is theirs. Ask before you stamp — the whole point of the card
  //    is that it fills with what THEY chose, in the open, which is the thing the other Alexa hides.
  MT({ id: 'lamp_checkout', card: 'library', klass: 'write',
    readback: () => { try {
        const frame = document.querySelector('.card[data-card="library"] .app-frame')
        const w = frame && frame.contentWindow
        const c = (w && w.OZ_LAMP && w.OZ_LAMP.collection && w.OZ_LAMP.collection()) || []
        return c.length + ' work' + (c.length === 1 ? '' : 's') + ' on their card' + (c.length ? ': ' + c.slice(-3).map(x => x.title).join(' · ') : '')
      } catch (_) { return 'could not re-read the card' } },
    blurb: "check the OPEN work out onto the reader's own card — the same stamp their ✓ button writes. ASK FIRST: the card is theirs.",
    clue: `check the currently open work out onto their card.
template: { "tool": "lamp_checkout", "kind": "work" }
kind → "work" the whole thing (default) · "page" this page · "line" the passage you are on.
⭐ ASK BEFORE YOU DO THIS. Their card fills with what they chose and it stays on this machine — that is the promise the house makes and the joke it makes about the other Alexa. Stamping something they did not ask for breaks both.
WHEN it is worth offering: they have come back to a work more than once, they said they liked it, or they asked for more like it.
edge: nothing open → nothing to check out. Open it with lamp_open first.`,
    strike: (call) => {
      try {
        const frame = document.querySelector('.card[data-card="library"] .app-frame')
        const w = frame && frame.contentWindow
        if (!w || !w.OZ_LAMP || !w.OZ_LAMP.checkout) return 'lamp_checkout: the library card is not open on the desk yet — it is opening now; try again.'
        const r = w.OZ_LAMP.checkout(call.kind)
        if (!r) return 'lamp_checkout: nothing is open to check out. lamp_open a work first.'
        return `lamp_checkout: stamped "${r.title}" (${r.kind} · ${r.addr}) onto their card, and shelved it with their place kept. It stays on this machine.`
      } catch (e) { return 'lamp_checkout: could not reach the card — ' + ((e && e.message) || e) }
    } })

  // ── lamp_collection — READ THEIR CARD. The smart-card feature: it fills with THEIR reading, and the
  //    satire is that it shows what the other Alexa hides. So a librarian may read it — to suggest, to
  //    remember, to notice they have been back three times — and never to sell them anything.
  MT({ id: 'lamp_collection', card: 'library', klass: 'read',
    readback: () => 'their card was read, not written',
    blurb: "read the reader's own card — what they have checked out, how often, and when. LOW-RISK: looking only. Use it to suggest, never to sell.",
    clue: `read what is on their card.
template: { "tool": "lamp_collection" }
you get: title · how many times · the last date · which kinds (work / page / line).
USE IT TO SUGGEST. Three visits to one author is a person telling you what they like without saying so — offer the next thing, or the thread that runs out of it (lamp_thread). Say WHY you are suggesting it and name the address.
DO NOT recite their history back at them, and do not bring it up unprompted. You only listen when spoken to; the card is theirs and it stays on this machine. That restraint IS the character.
edge: an empty card is a new reader — ask what they are after instead of guessing.`,
    strike: () => {
      try {
        const frame = document.querySelector('.card[data-card="library"] .app-frame')
        const w = frame && frame.contentWindow
        if (!w || !w.OZ_LAMP || !w.OZ_LAMP.collection) return 'lamp_collection: the library card is not open on the desk yet — it is opening now; try again.'
        const c = w.OZ_LAMP.collection()
        if (!c.length) return 'lamp_collection: their card is empty — a new reader. Ask what they are after rather than guessing.'
        return `${c.length} work${c.length === 1 ? '' : 's'} on their card:\n` +
          c.map(x => `  ${x.title} — ${x.times}×, last ${x.last} (${x.kinds.join(', ')})`).join('\n') +
          `\nsuggest from this, name the address, and do not recite it back at them.`
      } catch (e) { return 'lamp_collection: could not reach the card — ' + ((e && e.message) || e) }
    } })
})()
