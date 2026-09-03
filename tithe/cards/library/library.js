// library.js — the red lamp library's engine: the rooms, the drawer, the stamps, and THE ELEVATOR.
// Split out of library.html 2026-08-24 (IC line ceiling: the card was past 500). Markup and dress
// stay in the html; everything that moves lives here.
// ── THE ROOMS: open/closed remembered, height remembered per room. The house rule: any number may be
  //    open at once — if they want something to scroll, let them have it. (Sum 2026-08-24)
  var ROOMS = ['r-water','r-search','r-mine','r-stacks']
  function loadState() { try { return JSON.parse(localStorage.getItem('redlamp-rooms') || 'null') || { 'r-water': 1 } } catch (e) { return { 'r-water': 1 } } }
  function saveState(s) { try { localStorage.setItem('redlamp-rooms', JSON.stringify(s)) } catch (e) {} }
  var state = loadState()
  ROOMS.forEach(function (id) {
    var room = document.getElementById(id); if (!room) return
    room.classList.toggle('open', !!state[id])
    // ⭐ THE GRABBER IS GONE (Sum 2026-08-25) — rooms take the room they need; the card scrolls. The old
    //    per-room drag also wrote an INLINE height, which would now beat the stylesheet forever on any desk
    //    that ever used it, so clear it on the way past. One pass and the saved key is dead weight.
    var body = room.querySelector('.scrollin')
    if (body) body.style.height = ''
    try { localStorage.removeItem('redlamp-h-' + id) } catch (e) {}
    room.querySelector('.roomhead').addEventListener('click', function () {
      var open = !room.classList.contains('open')
      room.classList.toggle('open', open); state[id] = open ? 1 : 0; saveState(state)
    })
  })

  // ── THE STACKS: title · author · theme — the three sorts your collection uses too.
  var WORKS = [
    ['Meditations','Marcus Aurelius','the stoa','stoicism philosophy death duty self discipline nature'],
    ['Enchiridion','Epictetus','the stoa','stoicism philosophy freedom control adversity'],
    ['The Bhagavad Gita','vyasa','scripture','duty war devotion dharma soul india'],
    ['The King James Bible','translators','scripture','law prophecy parable creation covenant'],
    ['The Qur’an','Rodwell tr.','scripture','prophecy law mercy judgement'],
    ['Tao Te Ching','Laozi','scripture','taoism paradox water softness nonaction'],
    ['Meditations on First Philosophy','Descartes','the theatre of the mind','doubt certainty dualism modality substance mind god'],
    ['Ethics','Spinoza','the theatre of the mind','substance god nature determinism dualism modality'],
    ['Groundwork','Kant','the theatre of the mind','duty morality reason imperative modality'],
    ['Thus Spoke Zarathustra','Nietzsche','the hammer','nihilism will power god is dead eternal return'],
    ['Essays','Emerson','america thinking','self reliance nature transcendentalism friendship'],
    ['Walden','Thoreau','america thinking','solitude nature simplicity economy civil disobedience'],
    ['Autobiography','Franklin','america thinking','industry virtue invention humor wit self improvement'],
    ['Narrative','Frederick Douglass','america thinking','slavery freedom literacy abolition'],
    ['Leaves of Grass','Whitman','the poets','poetry body democracy america grass death'],
    ['Poems','Dickinson','the poets','poetry death immortality solitude hope'],
    ['The Devil’s Dictionary','Bierce','the satirists','satire humor comedy wit cynicism definitions irony'],
    ['A Modest Proposal','Swift','the satirists','satire humor comedy irony poverty ireland outrage'],
    ['Following the Equator','Twain','the satirists','satire humor comedy wit travel empire race twain'],
    ['The Importance of Being Earnest','Wilde','the satirists','satire humor comedy wit farce marriage manners'],
    ['Relativity','Einstein','science','physics time space light gravity'],
    ['Beyond Lies the Wub','Philip K. Dick','the pulp','science fiction empathy machines appetite'],
    ['Second Variety','Philip K. Dick','the pulp','science fiction war machines paranoia'],
    ['The Variable Man','Philip K. Dick','the pulp','science fiction war time repair'],
    ['2BR02B','Vonnegut','the pulp','science fiction death population satire humor bureaucracy']
  ]
  function last(n) { var p = n.split(' '); return p[p.length - 1].toLowerCase() }
  function paint(sort) {
    var rows = WORKS.slice()
    if (sort === 'author') rows.sort(function (a, b) { return last(a[1]) < last(b[1]) ? -1 : 1 })
    else if (sort === 'theme') rows.sort(function (a, b) { return (a[2] + a[0]) < (b[2] + b[0]) ? -1 : 1 })
    else rows.sort(function (a, b) { return a[0].replace(/^The /, '') < b[0].replace(/^The /, '') ? -1 : 1 })
    var html = '', seen = ''
    rows.forEach(function (r) {
      if (sort === 'theme' && r[2] !== seen) { seen = r[2]; html += '<div style="color:#c9a227;margin-top:7px">' + r[2] + '</div>' }
      html += '<div><a href="#" data-open="' + r[0] + '">' + r[0] + '</a>' +
        '<span style="opacity:.5;font-size:.88em"> ' + r[1] + '</span></div>'
    })
    document.getElementById('shelf').innerHTML = html
  }
  paint('title')
  document.querySelectorAll('.sortbar').forEach(function (bar) {
    bar.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-sort]'); if (!b) return
      bar.querySelectorAll('button').forEach(function (x) { x.classList.remove('on') })
      b.classList.add('on')
      if (bar.dataset.for === 'stacks') paint(b.dataset.sort)
    })
  })


  // ══ THE READER ═════════════════════════════════════════════════════════════════════════════════
  // The blank spread is the bed; the text lies on the pages. Real text only — window.LAMP_TEXT is
  // generated off the shelves (canon verbatim, and the ziggurat's alcoves with their teaching where
  // the ox has filed them). Your spot is remembered per work. Nothing here is typed from memory.

  // ONE SOURCE: inside the app the shell holds the index (so Dria's beans and this card cannot drift);
  // standing alone in a browser the card's own copy answers. Same file either way.
  var P = (function () { try { return window.parent !== window ? window.parent : null } catch (e) { return null } })()
  var TEXT = (P && P.LAMP_TEXT) || window.LAMP_TEXT || {}
  var ZIG  = (P && P.ZIG) || window.ZIG || { title:{}, alcoves:{}, threads:{}, named:{}, toc:{} }
  var readRoom = document.getElementById('r-read')
  var leaf = document.getElementById('leaf')
  // ⭐ THE COUNT IS A PROPERTY OF THE TEXT, NOT OF THE RENDER (Sum 2026-08-25: "we measure by tokens,
  //    word count, or kb, not pages ... on screen count, 122t-355t"). A page number changes when the card
  //    resizes, when the font moves, when the ox re-teaches an alcove. A word offset does not. TOKENS are
  //    deliberately NOT offered: every model tokenizes differently, so "355t" is only true for one of them,
  //    and a number that is only true somewhere is a bad thing to print on a page.
  var UNITS = ['words', 'pages', 'tokens']
  var unit = 0; try { var u = UNITS.indexOf(localStorage.getItem('redlamp-unit')); if (u > -1) unit = u } catch (e) {}
  var showFolio = false; try { showFolio = localStorage.getItem('redlamp-folio') === '1' } catch (e) {}
  var spread = 0, spreads = 1
  // both nav bars wear the same classes — set every face, bind by class. one behaviour, two places.
  var pgnums = document.querySelectorAll('.js-pgnum'), readnm = document.getElementById('readnm')
  function setPgnum(t) { for (var i = 0; i < pgnums.length; i++) pgnums[i].textContent = t }
  var readaddr = document.getElementById('readaddr')
  var open_work = null, open_page = 0, open_thread = null

  // ══ THE ELEVATOR ═══════════════════════════════════════════════════════════════════════════════
  // The ziggurat is a building; this is the lift. You always stand at ONE ADDRESS. The rung changes
  // the ALTITUDE you see it from — never your place. Ride up when you do not get it, ride back down
  // to read it raw, or keep going up to find the same idea in another book. (Sum 2026-08-24.)
  //
  //   0 RAW       the alcove, verbatim. never edited. what the author wrote.
  //   1 TEACHING  the same alcove, expanded — the bulge. every line of the raw still in it.
  //   2 THE WORK  where this alcove sits in the whole book: the first TOC, your spot marked.
  //   3 POINTERS  what is at this address without opening it: keywords + signal. each is a door up.
  //   4 THREADS   the same idea in other books. computed from the ox's filing — never invented.
  // ⭐⭐ THE DEFAULT IS THE ARTIFACT; THE LAYERS ARE THE DETOURS (Sum 2026-08-26: "books were opening
  //    in 1 too — we need to make 0 layer easier to access in general").
  //    Rung 0 is the RAW TEXT: the actual thing on the shelf. Rung 1 is the teaching layer — derived,
  //    genuinely useful, and a LENS rather than the book. Every door in here opened onto the commentary.
  //    And it is backwards for a second reason that matters more: rung 0 is THE ONLY RUNG YOU MAY QUOTE
  //    FROM. lamp_read's own clue says "quote from this, never from memory". So the one rung that is safe
  //    to cite was the one hardest to reach, and every default handed a reader the paraphrase instead.
  //    A library opens to the book. You climb to a lens on purpose; you never land on one by default.
  //    FOUR doors used to hard-code 1 separately (this, openWork's caller, OZ_LAMP.go, and the bean).
  //    One constant now — a default in four places is four defaults, and they drift.
  var RUNG_DEFAULT = 0
  var ALT = RUNG_DEFAULT
  var RUNGS = [
    ['0', 'raw',      'the alcove, verbatim'],
    ['1', 'teaching', 'the same passage, expanded'],
    ['2', 'the work', 'where it sits in the whole book'],
    ['3', 'pointers', 'what is here, without opening it'],
    ['4', 'threads',  'the same idea in other books'],
  ]
  function buildLadder() {
    var host = document.getElementById('ladder'); if (!host) return
    host.innerHTML = RUNGS.map(function (r) {
      return '<button type="button" class="rung" data-alt="' + r[0] + '" title="' + r[2] + '" ' +
             'aria-label="altitude ' + r[0] + ' — ' + r[1] + ': ' + r[2] + '"><b>' + r[0] + '</b> ' + r[1] + '</button>'
    }).join('')
    host.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-alt]'); if (!b) return
      ALT = +b.dataset.alt; open_thread = null; paintPages()
    })
  }
  function markLadder() {
    document.querySelectorAll('#ladder .rung').forEach(function (b) {
      b.setAttribute('aria-pressed', (+b.dataset.alt === ALT) ? 'true' : 'false')
    })
  }
  function spotKey(t) { return 'redlamp-spot-' + t }
  function esc2(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') }
  // ONE ADDRESS SPACE: everything inside the reader speaks SLUGS (aurelius:p30). Titles are display.
  function slugOf(t) {
    if (TEXT[t]) return t
    for (var k in ZIG.title) if (ZIG.title[k] === t) return k
    return String(t || '').toLowerCase().replace(/[^a-z]+/g, '').slice(0, 12)
  }
  function titleOf(slug) { return ZIG.title[slug] || slug }
  function workSlug(x) { return slugOf(x) }

  // ── each altitude renders onto the same paper. the book never changes; the height does.
  function pagesOf(slug) { return TEXT[slugOf(slug)] || [] }
  function currentAlcove() {
    var pg = pagesOf(open_work)[open_page]
    return pg ? pg.n : null
  }
  function renderRaw(i)   { var p = pagesOf(open_work)[i]; return p ? esc2(p.raw) : '' }
  function renderTeach(i) {
    var p = pagesOf(open_work)[i]; if (!p) return ''
    if (!p.teach) return esc2(p.raw) + '\n\n' + '— the ox has not taught this alcove yet. rung 0 is the whole truth here.'
    return esc2(p.teach)
  }
  function renderWork() {
    var slug = workSlug(open_work), toc = ZIG.toc[slug]
    var here = currentAlcove()
    var head = '<b>' + esc2(titleOf(open_work)) + '</b>' + (here ? '  ·  you are at <b>' + esc2(slug + ':' + here) + '</b>' : '') + '\n\n'
    if (!toc) return head + 'the first TOC for this work has not been written yet — the ox files it after the alcoves.'
    return head + esc2(toc)
  }
  function renderPointers() {
    var slug = workSlug(open_work), here = currentAlcove()
    var rec = ((ZIG.alcoves[slug] || {})[here]) || null
    if (!rec) return 'no pointer filed for ' + esc2(slug + ':' + here) + ' yet.'
    var kws = (rec.kw || []).map(function (k) {
      var wide = !!ZIG.threads[k]
      return '<button type="button" class="kw' + (wide ? ' wide' : '') + '" data-thread="' + esc2(k) + '" ' +
             'aria-label="' + esc2(k) + (wide ? ' — a thread across books' : ' — only in this book') + '">' +
             esc2(k) + (wide ? ' &#8599;' : '') + '</button>'
    }).join(' ')
    return '<b>' + esc2(slug + ':' + here) + '</b>  ·  ' + esc2(rec.sig || 'passage') +
      '\n\nwhat is at this address, without opening it:\n\n<span class="kws">' + kws + '</span>' +
      '\n\nthe lit ones carry &#8599; — they run through other books. press one to ride up.'
  }
  function renderThreads() {
    var slug = workSlug(open_work), here = currentAlcove()
    if (open_thread) {
      var st = ZIG.threads[open_thread] || []
      var rows = st.map(function (s) {
        var t = titleOf(s[0])
        return '<button type="button" class="station" data-goto="' + esc2(s[0] + ':' + s[1]) + '" ' +
               'aria-label="go to ' + esc2(t + ' ' + s[1]) + '"><b>' + esc2(t) + '</b> · ' + esc2(s[0] + ':' + s[1]) + '</button>'
      }).join('')
      var works = {}; st.forEach(function (s) { works[s[0]] = 1 })
      return '<button type="button" class="kw" data-thread="">&#8592; all threads</button>\n\n' +
        '<b>' + esc2(open_thread) + '</b> — ' + st.length + ' stations across ' + Object.keys(works).length + ' books.\n\n' +
        '<span class="stations">' + rows + '</span>\n\n' +
        'the library only claims a connection it can point at: every station above is an address the ox filed.'
    }
    var rec = ((ZIG.alcoves[slug] || {})[here]) || { kw: [] }
    var mine = (rec.kw || []).filter(function (k) { return ZIG.threads[k] })
    var all = Object.keys(ZIG.threads)
    var btn = function (k) {
      var n = ZIG.threads[k].length, w = {}; ZIG.threads[k].forEach(function (s) { w[s[0]] = 1 })
      return '<button type="button" class="kw wide" data-thread="' + esc2(k) + '" aria-label="' + esc2(k) +
        ' — ' + n + ' stations in ' + Object.keys(w).length + ' books">' + esc2(k) +
        ' <span class="ct">' + Object.keys(w).length + '</span></button>'
    }
    var named = (ZIG.named[slug] || []).map(function (s) { return '· ' + esc2(s) }).join('\n')
    return (mine.length ? '<b>this passage runs through:</b>\n\n<span class="kws">' + mine.map(btn).join(' ') + '</span>\n\n' : '') +
      (named ? '<b>' + esc2(titleOf(open_work)) + ' — what it is about:</b>\n' + named + '\n\n' : '') +
      '<b>every thread in the stacks:</b>\n\n<span class="kws">' + all.map(btn).join(' ') + '</span>' +
      '\n\nthe number is how many books it runs through.'
  }

  function paintPages() {
    markLadder()
    var pages = pagesOf(open_work)
    open_page = Math.max(0, Math.min(open_page, Math.max(0, pages.length - 1)))
    var one = window.matchMedia('(max-width:700px)').matches
    var slug = workSlug(open_work)
    if (ALT <= 1) {
      var R = (ALT === 0) ? renderRaw : renderTeach
      leaf.innerHTML = pages.length ? R(open_page)
        : 'this work is on the shelf, but its text is not in the app yet — the ox is still filing. ring the bell and she will read it to you.'
    } else {
      leaf.innerHTML = ALT === 2 ? renderWork() : ALT === 3 ? renderPointers() : renderThreads()
    }
    document.querySelector('.readpaper').classList.toggle('wide', ALT > 1)
    spread = 0
    relayout()
    readaddr.textContent = slug + (currentAlcove() ? ':' + currentAlcove() : '') +
      (pages.length ? '  \u00b7  alcove ' + (open_page + 1) + ' of ' + pages.length : '')
    try { localStorage.setItem(spotKey(open_work), String(open_page)) } catch (e) {}
  }

  // ── THE PAGINATION. Columns overflow to the right; .leafwrap clips them; one spread = one container
  //    width. Count the spreads by how far the content actually runs — no line measuring, no guessing,
  //    and it recomputes on resize because the columns do.
  function relayout() {
    // ⭐ THE SHIFT MUST STEP OVER THE GUTTER (Sum 2026-08-25: "is bleeding"). Columns sit at
    //    0, c+G, 2(c+G)… so with two per spread the NEXT spread begins at width + G, not at width.
    //    Translating by a flat 100% left every page one gutter short and showed a slice of the
    //    column you had just read down the outside edge. One term, and the pages sit flush.
    leaf.style.transform = 'translateX(0)'
    var G = parseFloat(getComputedStyle(leaf).columnGap) || 0
    var w = leaf.clientWidth || 1
    spreads = Math.max(1, Math.ceil((leaf.scrollWidth + G) / (w + G)))
    if (spread > spreads - 1) spread = spreads - 1
    if (spread < 0) spread = 0
    leaf.style.transform = spread ? 'translateX(calc(' + (-spread) + ' * (100% + ' + G + 'px)))' : 'translateX(0)'
    paintCount()
  }
  function paintCount() {
    var txt = leaf.textContent || ''
    var u = UNITS[unit], out
    if (u === 'pages') {
      // the ONLY unit that is a property of the render — offered because it is the one people ask for,
      // and it is honest here because these pages are ours, not an edition's.
      out = 'page ' + (spread + 1) + ' of ' + spreads
    } else {
      var total = u === 'words' ? (txt.trim() ? txt.trim().split(/\s+/).length : 0)
                                : Math.round(txt.length / 4)   // ~chars/4. every model tokenizes differently,
      var a = Math.round(total * spread / spreads)             // so this is an ESTIMATE and says so in the label.
      var b = Math.round(total * (spread + 1) / spreads)
      out = (u === 'tokens' ? '~' : '') + a.toLocaleString() + '\u2013' + b.toLocaleString() +
            ' ' + u + ' of ' + (u === 'tokens' ? '~' : '') + total.toLocaleString()
    }
    setPgnum(out)
  }
  // walk: through the spreads of THIS alcove first, then to the next alcove. One button, one direction.
  window.readerStep = function (dir) {
    var next = spread + dir
    if (next >= 0 && next < spreads) { spread = next; relayout(); return true }
    return false
  }
  var _rt = null
  window.addEventListener('resize', function () { clearTimeout(_rt); _rt = setTimeout(relayout, 120) })
  // ⭐ THE COUNT IS THE CONTROL (Sum 2026-08-25: "count should be clickable not buttons up top. click on
  //    word count to switch to pages, click again for tokens, click again words"). Two chrome buttons that
  //    only ever changed one readout were two buttons too many — the readout can change itself.
  document.addEventListener('click', function (e) {
    if (!e.target.closest('.js-pgnum')) return
    unit = (unit + 1) % UNITS.length
    try { localStorage.setItem('redlamp-unit', UNITS[unit]) } catch (err) {}
    paintCount()
  })

  // a keyword or a thread rides you up; a station carries you sideways and sets you down at TEACHING
  document.addEventListener('click', function (e) {
    var k = e.target.closest('[data-thread]')
    if (k) { open_thread = k.dataset.thread || null; ALT = 4; paintPages(); return }
    var g = e.target.closest('[data-goto]')
    if (g) {
      var parts = g.dataset.goto.split(':')
      var pages = pagesOf(parts[0]), idx = 0
      for (var i = 0; i < pages.length; i++) if (pages[i].n === parts[1]) idx = i
      openWork(parts[0], idx, RUNG_DEFAULT)
    }
  })

  function openWork(which, page, alt) {
    open_work = slugOf(which); open_thread = null
    var title = titleOf(open_work)
    var spot = 0
    try { spot = parseInt(localStorage.getItem(spotKey(open_work)) || '0', 10) || 0 } catch (e) {}
    open_page = (typeof page === 'number') ? page : spot
    if (typeof alt === 'number') ALT = alt
    readnm.textContent = title
    readRoom.hidden = false; readRoom.classList.add('open')
    state['r-read'] = 1; saveState(state)
    paintPages()
    stamp('opened', title, open_work, false)
    readRoom.scrollIntoView({ block: 'start', behavior: 'smooth' })
  }
  buildLadder()
  // back/on walk the SPREADS of this alcove first and only then cross into the next alcove — one button,
  //    one direction, no second control to learn. It used to jump two alcoves a press and skip whatever
  //    did not fit on screen, which is how a reader loses its place in a long passage.
  document.addEventListener('click', function (e) {
    if (e.target.closest('.js-prev')) {
      if (ALT > 1) return
      if (window.readerStep(-1)) return
      if (open_page > 0) { open_page -= 1; paintPages(); spread = spreads - 1; relayout() }
    } else if (e.target.closest('.js-next')) {
      if (ALT > 1) return
      if (window.readerStep(1)) return
      if (open_page < pagesOf(open_work).length - 1) { open_page += 1; paintPages() }
    }
  })
  function shelve() {
    readRoom.classList.remove('open'); readRoom.hidden = true; state['r-read'] = 0; saveState(state)
    try { localStorage.setItem(spotKey(open_work), String(open_page)) } catch (e) {}
  }
  // both close-doors do the same thing: put it back on the shelf with your place kept.
  // check it out ASKS first, then offers the three grains (Sum 2026-08-25: "make options second step")
  var coBtn = document.getElementById('checkout'), coOpts = document.getElementById('coopts')
  if (coBtn) coBtn.addEventListener('click', function () {
    var on = coBtn.getAttribute('aria-expanded') !== 'true'
    coBtn.setAttribute('aria-expanded', on ? 'true' : 'false')
    coOpts.hidden = !on
  })
  var cb = document.getElementById('closebook')
  if (cb) cb.addEventListener('click', function () { shelve() })
  document.getElementById('closeread').addEventListener('click', function () {
    shelve()
  })

  // ══ THE STAMPS ═════════════════════════════════════════════════════════════════════════════════
  // A stamp is a date and an address. It stays LOCAL — that is the satire and the promise both.
  // kinds: opened · line · page · work. The card shows the count; the collection lists them.
  function loadStamps() { try { return JSON.parse(localStorage.getItem('redlamp-reads') || '[]') } catch (e) { return [] } }
  function saveStamps(a) { try { localStorage.setItem('redlamp-reads', JSON.stringify(a.slice(-400))) } catch (e) {} }
  function stamp(kind, title, addr, announce) {
    var all = loadStamps()
    var rec = { k: kind, t: title, a: addr, d: new Date().toISOString().slice(0, 10) }
    if (kind === 'opened') {
      var lastOpen = all.filter(function (x) { return x.k === 'opened' && x.t === title }).pop()
      if (lastOpen && lastOpen.d === rec.d) return
    }
    all.push(rec); saveStamps(all); paintCard(); paintMine()
    if (announce !== false) {
      var h = document.getElementById('cohint')
      if (h) h.textContent = 'stamped — ' + kind + ' · ' + title + ' · ' + rec.d
    }
  }
  document.querySelectorAll('.co').forEach(function (b) {
    b.addEventListener('click', function () {
      if (!open_work) return
      var pg = pagesOf(open_work)[open_page] || {}
      stamp(b.dataset.co, titleOf(open_work), open_work + (b.dataset.co === 'work' ? ':*' : ':' + (pg.n || '?')))
      shelve()   // checking out closes it too, and keeps your place — same as shelving (Sum 2026-08-25)
    })
  })

  // ══ THE CARD + THE COLLECTION ══════════════════════════════════════════════════════════════════
  function paintCard() {
    var all = loadStamps(), el = document.getElementById('reads')
    if (!el) return
    if (!all.length) { el.textContent = 'no stamps yet — a clean card.'; return }
    var titles = all.map(function (x) { return x.t })
    el.innerHTML = 'first read: ' + esc2(titles[0]) + '<br>last: ' +
      titles.slice(-3).map(esc2).join(' &middot; ') +
      '<br><span class="stamp">' + all.length + ' stamp' + (all.length === 1 ? '' : 's') + '</span>'
  }
  var mineSort = 'title'
  function paintMine() {
    var el = document.getElementById('mylist'); if (!el) return
    var all = loadStamps().filter(function (x) { return x.k !== 'opened' })
    if (!all.length) {
      el.innerHTML = '<span class="note">nothing checked out yet. open a work from the stacks and check out ' +
        'a line, a passage, or the whole thing — each one gets a stamp.</span>'
      return
    }
    var byTheme = {}
    WORKS.forEach(function (w) { byTheme[w[0]] = { author: w[1], theme: w[2] } })
    var rows = all.slice().reverse()
    if (mineSort === 'author') rows.sort(function (a, b) { return last((byTheme[a.t] || {}).author || 'zz') < last((byTheme[b.t] || {}).author || 'zz') ? -1 : 1 })
    else if (mineSort === 'theme') rows.sort(function (a, b) { return ((byTheme[a.t] || {}).theme || 'zz') < ((byTheme[b.t] || {}).theme || 'zz') ? -1 : 1 })
    else if (mineSort === 'title') rows.sort(function (a, b) { return a.t < b.t ? -1 : 1 })
    var KIND = { line: 'a line', page: 'a passage', work: 'the whole work' }
    el.innerHTML = '<div class="mine-list">' + rows.map(function (r) {
      return '<div class="row"><span class="kind">' + (KIND[r.k] || r.k) + '</span>' +
             '<span class="ttl"><a href="#" data-open="' + esc2(r.t) + '">' + esc2(r.t) + '</a>' +
             (r.a ? ' <span style="color:#a99a7c;font-family:\'Courier New\',monospace">' + esc2(r.a) + '</span>' : '') +
             '</span><span class="when">' + esc2(r.d) + '</span></div>'
    }).join('') + '</div>'
  }
  document.querySelector('.sortbar[data-for="mine"]').addEventListener('click', function (e) {
    var b = e.target.closest('button[data-sort]'); if (!b) return
    mineSort = b.dataset.sort; paintMine()
  })
  // a work opens from anywhere it is named: the shelf, the drawer, your own collection
  document.addEventListener('click', function (e) {
    var a = e.target.closest('[data-open]'); if (!a) return
    e.preventDefault(); openWork(a.dataset.open)
  })
  paintCard(); paintMine()

  // ── LINKS OUT go through the app's own opener (a bare target=_blank dies inside the desktop frame).
  //    Split-screen if the shell offers it, a plain open if not, and the href still works in a browser.
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="http"]'); if (!a) return
    var P = window.parent
    var open_ = (P && (P.OZ_SPLIT || P.OZ_OPEN)) || null
    if (open_) { e.preventDefault(); try { open_(a.href) } catch (err) { window.open(a.href, '_blank') } }
  })

  // ── THE DRAWER: the cheap deterministic gate (GLDFSC's G and L, made physical). It really searches what
  //    the front of house HAS — author · work · theme over the shelved 25 — and says plainly what it cannot
  //    reach yet: topic and quote need the ziggurat's L3 pointers, still being filed. An honest empty
  //    drawer beats a guessed one. THEN, and only then, the bell: the expensive road, taken on purpose.
  var drawer = document.getElementById('drawer'), tray = document.getElementById('tray'),
      plate = document.getElementById('plate'), ringrow = document.getElementById('ringrow'),
      ringhint = document.getElementById('ringhint')
  function query() {
    var q = {}
    ;['author','work','topic','theme','quote'].forEach(function (k) {
      var v = ((document.getElementById('q-' + k) || {}).value || '').trim(); if (v) q[k] = v
    })
    q.gran = (document.querySelector('input[name=gran]:checked') || {}).value || 'passage'
    return q
  }
  function slug(t) { return t.toLowerCase().replace(/[^a-z]+/g, '').slice(0, 12) }
  function hits(q) {
    var has = function (hay, n) { return String(hay).toLowerCase().indexOf(String(n).toLowerCase().trim()) >= 0 }
    var tags = function (w) { return w[2] + ' ' + (w[3] || '') }
    return WORKS.filter(function (w) {
      if (q.author && !has(w[1], q.author)) return false
      if (q.work && !has(w[0], q.work)) return false
      if (q.theme && !has(tags(w), q.theme)) return false
      if (q.topic && !has(tags(w), q.topic)) return false
      return true
    })
  }

  // ── THE DRAWER SEARCHES THE ZIGGURAT (Sum 2026-08-24: "our layer 01234 nav is what I want search tied
  //    into"). A hit is an ADDRESS, not a book: work + alcove + which layer answered. Three readers,
  //    cheapest first — L4 threads, then L3 pointers, then the raw itself where we hold it. Every hit
  //    carries the rung it was found on, so pressing it puts you in the lift at the right altitude.
  function deepHits(q) {
    var ZIGD = window.ZIG || { threads:{}, alcoves:{}, title:{} }
    var out = [], seen = {}
    var want = [q.theme, q.topic].filter(Boolean).map(function (s) { return s.toLowerCase().trim() })
    var quote = (q.quote || '').toLowerCase().trim().replace(/^["“']|["”']$/g, '')
    var push = function (w, n, rung, why) {
      var k = w + ':' + n; if (seen[k]) return; seen[k] = 1
      out.push({ w: w, n: n, rung: rung, why: why, title: ZIGD.title[w] || w })
    }
    // L4 — a thread is the widest net: the same idea in other books
    want.forEach(function (t) {
      Object.keys(ZIGD.threads).forEach(function (k) {
        if (k.indexOf(t) < 0 && t.indexOf(k) < 0) return
        ZIGD.threads[k].forEach(function (s) { push(s[0], s[1], 4, 'thread: ' + k) })
      })
    })
    // L3 — the pointers: what is at an address without opening it
    want.forEach(function (t) {
      Object.keys(ZIGD.alcoves).forEach(function (w) {
        var A = ZIGD.alcoves[w]
        Object.keys(A).forEach(function (n) {
          if ((A[n].kw || []).some(function (k) { return k.indexOf(t) >= 0 })) push(w, n, 3, 'pointer: ' + t)
        })
      })
    })
    // L0 — the raw, where the app actually holds it. A quote is only honest against the real text.
    if (quote) {
      Object.keys(TEXT).forEach(function (slug) {
        TEXT[slug].forEach(function (pg) {
          if (String(pg.raw || '').toLowerCase().indexOf(quote) >= 0) push(slug, pg.n, 0, 'the words are here')
        })
      })
    }
    // narrow by author/work if they named one
    if (q.author || q.work) {
      var keep = {}
      hits(q).forEach(function (w) { keep[slugOf(w[0])] = 1 })
      out = out.filter(function (r) { return keep[r.w] })
    }
    return out
  }

  function labelFor(q) {
    var p = ['author','work','topic','theme','quote'].filter(function (k) { return q[k] }).map(function (k) { return q[k] })
    return p.length ? p.join(' · ') : '— the whole catalogue —'
  }
  function openDrawer(q) {
    var deep = deepHits(q), rows = hits(q), html = ''
    if (deep.length) {
      html += '<div class="none" style="margin-bottom:8px">' + deep.length +
        ' address' + (deep.length === 1 ? '' : 'es') + ' — press one and the lift takes you there.</div>'
      deep.slice(0, 14).forEach(function (r) {
        html += '<div class="idx" data-goto="' + r.w + ':' + r.n + '"><b>' + r.title + '</b>' +
          '<br><span class="addr">' + r.w + ':' + r.n + '</span> &middot; ' + r.why +
          '<br><span class="why">found on rung ' + r.rung + ' &mdash; ' + RUNGS[r.rung][1] + '</span></div>'
      })
    }
    if (!deep.length) {
      rows.slice(0, 12).forEach(function (w) {
        html += '<div class="idx" data-open="' + w[0] + '"><b>' + w[0] + '</b> &middot; ' + w[1] +
          '<br><span class="addr">' + slugOf(w[0]) + ':*</span> &middot; ' + w[2] +
          '<br><span class="why">the whole work &mdash; the ox has not filed a pointer for this yet</span></div>'
      })
    }
    if (!html) html = '<div class="none">the drawer is empty. nothing on my shelves matches that &mdash; ring, and I will tell you whose shelf it is on.</div>'
    if (q.quote && !deep.some(function (r) { return r.rung === 0 })) {
      html += '<div class="none" style="margin-top:6px">&hellip; and I searched the raw only where the app holds it. the rest of the stacks are still being filed &mdash; ring, and I will read for you.</div>'
    }
    tray.innerHTML = html; tray.hidden = false
    drawer.setAttribute('aria-expanded', 'true')
    plate.innerHTML = labelFor(q)
    ringrow.hidden = false
    ringhint.textContent = (deep.length || rows.length) ? 'not what you were after?' : 'nothing in the drawer —'
  }
  drawer.addEventListener('click', function () {
    if (drawer.getAttribute('aria-expanded') === 'true') {
      drawer.setAttribute('aria-expanded', 'false'); tray.hidden = true; ringrow.hidden = true
      plate.innerHTML = '— the whole catalogue —'
    } else openDrawer(query())
  })
  // ── THE BELL, for real: ozAskBot lives in the parent shell (workspace.js) — the frame is same-origin,
  //    so ringing OPENS her bar and sends the turn. She only listens when spoken to; this is the speaking.
  function ring(q, hintEl, fallback) {
    var said = ['author','work','topic','theme','quote'].filter(function (k) { return q && q[k] })
      .map(function (k) { return k + ': ' + q[k] }).join(' · ')
    var ask = said
      ? 'at the catalogue — ' + said + ' · ' + (q.gran || 'passage') + '. read it to me and cite the address.'
      : 'someone rang the bell at the front of house. a human, by the look of them.'
    var sent = false
    try { sent = !!(window.parent && window.parent.ozAskBot && window.parent.ozAskBot('dria', ask)) } catch (e) {}
    if (hintEl) hintEl.textContent = sent ? 'rung — she is looking up.' : fallback
    return sent
  }
  document.getElementById('ringbell').addEventListener('click', function () { ring(query(), ringhint, 'the bell rang, but her bar is not on the desk — open Dria and ring again.') })
  var wb = document.getElementById('waterbell')
  if (wb) wb.addEventListener('click', function () { ring(null, document.getElementById('waterhint'), 'the bell rang into an empty room — open Dria and ring again.') })

  // ── THE DOOR THE LIBRARIAN KNOCKS ON. lamp_open (cards/library/library-tools.js) calls this and
  //    nothing else — one entry point, so the bot can put the human on the same page it is reading.
  window.OZ_LAMP = {
    // ⚠ THIS ALWAYS RETURNED TRUE, and idx stayed 0 when the page was not found — so an address that does
    //    not exist silently opened PAGE ONE while the bot was told it had succeeded. Dria would say "it is
    //    on p30", land the reader on page 1, and the answer confirmed her. Found 26 Aug by firing
    //    aurelius:p999. Now: not found → false, and NOTHING opens. Missing loudly beats missing quietly.
    go: function (addr, rung) {
      var parts = String(addr || '').split(':')
      var pages = pagesOf(parts[0])
      if (!pages || !pages.length) return false
      var idx = -1
      for (var i = 0; i < pages.length; i++) if (pages[i].n === parts[1]) idx = i
      if (idx < 0 && parts[1]) return false          // an address was given and it is not on the shelf
      openWork(parts[0], Math.max(0, idx), Math.max(0, Math.min(4, rung == null ? RUNG_DEFAULT : rung)))
      return true
    },
    // the page NAME, not the array index. "aurelius:0" told nobody anything, and read back as an address
    // it was a DIFFERENT address from the one asked for — a read-back that quietly disagrees with itself.
    // ⭐ WHERE ON THE PAGE, not just which page (Sum 2026-08-26: "we already have pages, tokens and
    //    words — open to page I think is close enough, she can read the token count on that page and even
    //    suggest how far down page, so would have to know if in two page or one page mode and read the
    //    reader as a pass back after tool fire").
    //    That is the elegant version of pointing: the reader ALREADY measures itself — the count line is
    //    "a–b words of total", switchable to pages or tokens, and it has been there since 25 Aug. A
    //    highlight fights the pagination; DIRECTIONS ride it. "Third of the way down the left column" is
    //    something a person can act on, and it costs no DOM surgery inside a transformed column flow.
    //    Mode matters because "left column" is a lie in one-column mode — the reader drops to one column
    //    under a square aspect ratio, so it is read live, never assumed.
    where: function () {
      var pg = (pagesOf(open_work) || [])[open_page] || {}
      var cols = 1, count = ''
      try {
        var leaf = document.querySelector('.leaf')
        if (leaf) { var c = parseInt(getComputedStyle(leaf).columnCount, 10); if (c > 0) cols = c }
        var el = document.getElementById('readcount') || document.querySelector('.readcount')
        if (el) count = (el.textContent || '').trim()
      } catch (e) {}
      return { work: open_work, page: pg.n || null, idx: open_page, rung: ALT,
               columns: cols, count: count, pages: (pagesOf(open_work) || []).length }
    },

    // ⭐ THE DOOR WIDENED, 26 Aug — one entry point, three more verbs (the comment above is the law:
    //    "lamp_open calls this and nothing else"). stamp() and the collection already existed and were
    //    sealed inside this IIFE, reachable only by a human's click. A librarian who can turn the page
    //    but cannot check the book out is half a librarian, and the fix is to widen the door that is
    //    already there — never to cut a second one into the same wall.
    //
    // checkout — the same stamp the ✓ buttons write: kind is 'work' (the whole thing) · 'page' · 'line'.
    //    Stamps stay LOCAL, which is the satire and the promise both — the card fills with YOUR reading
    //    and the other Alexa never sees it.
    checkout: function (kind) {
      if (!open_work) return null
      var k = (kind === 'page' || kind === 'line') ? kind : 'work'
      var pg = pagesOf(open_work)[open_page] || {}
      var addr = open_work + (k === 'work' ? ':*' : ':' + (pg.n || '?'))
      stamp(k, titleOf(open_work), addr)
      shelve()   // checking out closes it and keeps your place — the human's own ✓ does exactly this
      return { kind: k, title: titleOf(open_work), addr: addr }
    },

    // collection — what is on their card. The bot reads the same store paintMine() renders.
    collection: function () {
      var all = loadStamps(), by = {}
      all.forEach(function (r) { (by[r.t] = by[r.t] || []).push(r) })
      return Object.keys(by).map(function (t) {
        var rows = by[t]
        return { title: t, times: rows.length, last: rows[rows.length - 1].d,
                 kinds: rows.map(function (r) { return r.k }).filter(function (v, i, a) { return a.indexOf(v) === i }) }
      })
    },

    // point — put a mark ON the passage, not just the page. Sum: "if we can she highlights the specific
    //    part or where to start reading — so open book, point." Finds the phrase in the open leaf and
    //    scrolls it into view wearing a mark; returns false if the words are not on this page, so the
    //    bot is told plainly rather than claiming to have pointed at nothing.
    point: function (phrase) {
      try {
        var leaf = document.querySelector('.leaf'); if (!leaf || !phrase) return false
        var want = String(phrase).trim(); if (!want) return false
        var walk = document.createTreeWalker(leaf, NodeFilter.SHOW_TEXT)
        var n, hit = null
        while ((n = walk.nextNode())) { var i = n.nodeValue.indexOf(want); if (i > -1) { hit = { node: n, at: i }; break } }
        if (!hit) return false
        var r = document.createRange()
        r.setStart(hit.node, hit.at); r.setEnd(hit.node, hit.at + want.length)
        var mark = document.createElement('mark'); mark.className = 'lamp-point'
        try { r.surroundContents(mark) } catch (e) { return false }
        mark.scrollIntoView({ block: 'center', behavior: 'smooth' })
        return true
      } catch (e) { return false }
    }
  }
