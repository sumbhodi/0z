// safe.js — 🔒 THE SAFE (Sum, 29 Aug 2026: "two files, two separate HIL buttons and functions…"
// grown the same night: "diary, key ring, add photo album, codex for monaco coder files… lessons
// too, journal wellness clipboard, any you think can live as stand alones, keep diary injections
// and convo"). Six boxes, each its own save/import pair, EVERY file passphrase-encrypted
// client-side (AES-GCM over PBKDF2) — the file is safe to email/Drive; the passphrase never rides
// with it. Nothing ever touches a server: save = a file leaves the browser, import = a file
// picker (the bridge every browser permits — the FILE crosses origins, not a request).
//
// COPY, DON'T IMITATE — the parents of every part:
//   pack → share-first/download · unpack → FileReader → PREVIEW → write → reload  ← shell/suitcase.js
//   the journal box's store list                                  ← suitcase.js CARD_GROUPS (his 23 Aug map)
//   what counts as a KEY (peekKeys / KEYPAT)                      ← shell/factory.js — one authority, never disagree
//   renderInto-on-tab-open mount                                  ← window.ozEngines (cards/setup), the yocal seat
//   sandbox slices by kind (img · code · doc)                     ← shell/fs.js hydrate stamps
//   native save panel                                             ← OZ_FS.exportCopy
//   the modal dress (zsc-*)                                       ← suitcase.js injectCss (loaded on boot)
//
// ⚠ IMPORT WRITES THROUGH THE FLOOR (OZ_FS.restore), not the SANDBOX proxy — the proxy's
//   mirrorable() refuses data: URIs by design, so an album restored through the proxy would live
//   only until the reload. The floor write is the same road the drag-drop binaries ride.
;(function () {
  'use strict'

  // ── the six boxes. `ls(k)` says "this localStorage key rides in this box"; `sb(name, entry)`
  //    says the same for a sandbox file. DIARY IS THE CATCH-ALL — anything no other box claims
  //    (convos toto_hist_* · injections toto_inj_* · HIL toto_user* · bot configs · the papers ·
  //    sandbox docs) rides the diary, so the union of the six is everything and nothing is
  //    orphaned. "keep diary injections and convo" — they stay right here.
  var isImg  = function (e) { return e && (e.kind === 'img' || e.kind === 'image' || /^data:image/.test(e.data || '')) }
  var isCode = function (e) { return e && e.kind === 'code' }
  var JOURNAL_LS = /^toto_(prep|prep_sessions|sleep_|food_|ex_|exercise_|wellness_|chart_|notes$|notes_v$)/
  var LESSON_LS  = /^(toto_learn_|clock-learn-)/
  // ⚠ FAILS CLOSED, and this is the whole reason it is written this way (caught in the red-flag
  //    sweep, 29 Aug): factory.js's peekKeys is the ONE authority on what a key is (KEYPAT there,
  //    so the wipe button and this box can never disagree). It loads first in index.html — but if
  //    it ever does not, a `|| []` fallback would quietly file EVERY API KEY INTO THE DIARY, and
  //    the diary is the box that gets emailed, crosses the LAN, and (the portal vision) goes to a
  //    provider. So: no authority → hasKeyAuthority() is false → the save REFUSES rather than
  //    guessing, and no second copy of KEYPAT is born to drift out of sync with his.
  var hasKeyAuthority = function () { return !!(window.OZ_FACTORY && window.OZ_FACTORY.peekKeys) }
  var keyNames = function () { return hasKeyAuthority() ? window.OZ_FACTORY.peekKeys() : [] }

  var BOXES = [
    { id: 'diary',   icon: '📔', label: 'the diary',
      blurb: 'the catch-all: every conversation, your injections and HIL, bot personas, the papers, notes and docs — everything no other box claims.' },
    { id: 'keys',    icon: '🔑', label: 'the key ring',
      blurb: 'your API and search keys, and only those. the one box you never email unencrypted — which is why none of these ever are.' },
    { id: 'album',   icon: '📷', label: 'the photo album',
      blurb: 'every picture in the sandbox — snaps, drops, the studio’s output.' },
    { id: 'codex',   icon: '📜', label: 'the codex',
      blurb: 'the monaco / coder files — every code file in the sandbox.' },
    { id: 'lessons', icon: '🎓', label: 'the lessons',
      blurb: 'the learn suite: courses, skills, styles, and every class’s lessons/ folder.' },
    { id: 'journal', icon: '🩺', label: 'the journal',
      blurb: 'wellness + the chart: sleep, food, exercise, mood, prep sheets and sessions. the health box.' },
  ]

  // which box claims a localStorage key / a sandbox file. order matters only for diary-the-rest.
  function lsBox(k) {
    if (keyNames().indexOf(k) >= 0) return 'keys'
    if (JOURNAL_LS.test(k)) return 'journal'
    if (LESSON_LS.test(k)) return 'lessons'
    return 'diary'
  }
  function sbBox(name, e) {
    if (name.indexOf('lessons/') === 0) return 'lessons'
    if (isImg(e)) return 'album'
    if (isCode(e)) return 'codex'
    return 'diary'
  }

  // box 'all' = EVERY box except the key ring (Sum 2026-08-29: "a sync all button — again, leave
  // keys safe till we build really good encrypt for that; i can use a new key on web easily").
  // One payload, so sync-all is ONE knock and ONE green press, not five of each. The key ring is
  // excluded by the same lsBox() that files it, so "all" can never quietly include it.
  function collect(box) {
    var out = { ls: {}, sandbox: {} }, i, k
    var wants = function (b) { return box === 'all' ? b !== 'keys' : b === box }
    for (i = 0; i < localStorage.length; i++) {
      k = localStorage.key(i)
      if (k && wants(lsBox(k))) { try { out.ls[k] = localStorage.getItem(k) } catch (_) {} }
    }
    var sb = window.SANDBOX || {}
    Object.keys(sb).forEach(function (name) {
      var e = sb[name]; if (!e || typeof e.data !== 'string') return
      if (wants(sbBox(name, e))) out.sandbox[name] = e.data   // no sandbox file is ever a key box, so 'all' takes them all
    })
    return out
  }
  function count(box) {
    var c = collect(box)
    return { ls: Object.keys(c.ls).length, files: Object.keys(c.sandbox).length }
  }

  // ── the lock — PBKDF2 (310k, SHA-256) → AES-GCM 256. salt + iv ride the file; the pass never does. ──
  function b64(u8) { var s = '', i; for (i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(s) }
  function unb64(s) { var bin = atob(s), u8 = new Uint8Array(bin.length), i; for (i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i); return u8 }
  function derive(pass, salt) {
    var enc = new TextEncoder()
    return crypto.subtle.importKey('raw', enc.encode(pass), 'PBKDF2', false, ['deriveKey']).then(function (km) {
      return crypto.subtle.deriveKey({ name: 'PBKDF2', salt: salt, iterations: 310000, hash: 'SHA-256' }, km, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt'])
    })
  }
  function seal(pass, obj) {
    var salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12))
    return derive(pass, salt).then(function (key) {
      return crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv }, key, new TextEncoder().encode(JSON.stringify(obj)))
    }).then(function (ct) { return { salt: b64(salt), iv: b64(iv), data: b64(new Uint8Array(ct)) } })
  }
  function open(pass, body) {
    return derive(pass, unb64(body.salt)).then(function (key) {
      return crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(body.iv) }, key, unb64(body.data))
    }).then(function (pt) { return JSON.parse(new TextDecoder().decode(pt)) })
  }

  // ── save — seal, then out the door: native save panel (exportCopy) or the suitcase's blob road. ──
  function stamp() { var d = new Date(), p = function (n) { return (n < 10 ? '0' : '') + n }; return '' + d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + '-' + p(d.getHours()) + p(d.getMinutes()) }
  function download(blob, name) {   // ← suitcase.js, verbatim
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name
    document.body.appendChild(a); a.click()
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove() }, 800)
  }
  // ── ⭐ THE RAW ROAD (Sum 2026-08-30: "download raw options, on all but keys").
  //    The same collect() as save(), written out UNSEALED. This is the anti-moat and it is the
  //    whole point: "point any ai app at that codex and it knows you and has your files and pics."
  //
  //    ⚠ WHY IT IS NOT A HOLE. A moat made of file format is lock-in wearing a security costume —
  //    his own ethics framework files that under "create dependency (switching costs)", on the
  //    optimization side of the line he drew for himself. The sealed road stays for anything that
  //    crosses a wire; this one exists so a person can walk out with their own history and open it
  //    in a program that has not been written yet.
  //
  //    ⚠ THE KEY RING CANNOT TAKE THIS ROAD, and the refusal lives HERE rather than only in the
  //    markup. A hidden button is a preference; a refusal in the function is a guarantee. Same
  //    reasoning as the sync button that box does not get.
  function saveRaw(box) {
    if (box === 'keys') return Promise.resolve({ n: 0, refused: true })
    if (!hasKeyAuthority()) return Promise.resolve({ n: 0, blocked: true })
    var payload = collect(box)
    var n = Object.keys(payload.ls).length + Object.keys(payload.sandbox).length
    if (!n) return Promise.resolve({ n: 0 })
    var body = { oz: 'safe-raw', v: 1, box: box, at: new Date().toISOString(),
                 from: (window.OZ_PROFILE && window.OZ_PROFILE.name) || 'totoII',
                 note: 'PLAINTEXT ON PURPOSE — your data, portable by design. Not encrypted. Do not email it.',
                 ls: payload.ls, sandbox: payload.sandbox }
    var name = 'oz-' + box + '-RAW-' + stamp() + '.json', text = JSON.stringify(body, null, 2)
    var out = (window.OZ_FS && window.OZ_FS.native && window.OZ_FS.exportCopy)
      ? window.OZ_FS.exportCopy(name, text)
      : Promise.resolve(download(new Blob([text], { type: 'application/json' }), name))
    return out.then(function () { return { n: n, name: name, raw: true } })
  }

  function save(box, pass) {
    // the fail-closed gate (see hasKeyAuthority above): without factory.js there is no honest way
    // to tell a key from a note, and the diary must never carry keys by accident.
    if (!hasKeyAuthority()) return Promise.resolve({ n: 0, blocked: true })
    var payload = collect(box)
    var n = Object.keys(payload.ls).length + Object.keys(payload.sandbox).length
    if (!n) return Promise.resolve({ n: 0 })
    return seal(pass, payload).then(function (sealed) {
      var body = { oz: 'safe', v: 1, box: box, at: new Date().toISOString(), from: (window.OZ_PROFILE && window.OZ_PROFILE.name) || 'totoII', salt: sealed.salt, iv: sealed.iv, data: sealed.data }
      var name = 'safe-' + box + '-' + stamp() + '.json', text = JSON.stringify(body)
      var out = (window.OZ_FS && window.OZ_FS.native && window.OZ_FS.exportCopy)
        ? window.OZ_FS.exportCopy(name, text)
        : Promise.resolve(download(new Blob([text], { type: 'application/json' }), name))
      return out.then(function () { return { n: n, name: name } })
    })
  }

  // ── ⭐ THE FOLD (Sum 2026-08-29, "start with elegant fold… 123 go") — two devices drift, then
  //    sync. Histories are APPEND-ONLY logs sharing a common prefix (everything up to the last
  //    sync — the seeds are identical on both installs by construction, workspace.js seedHist).
  //    So: find the longest common prefix per bot, keep it once, then both tails. One side empty-
  //    tailed = a plain fast-forward (the usual case: sync when you switch devices, and the KV
  //    head survives whole — the toll is paid once per sync). Both tails live = real drift: turns
  //    stamped `at` (50-history-clockspeed.js, same day) interleave time-true; unstamped ride in
  //    blocks, local first. Nothing is ever lost.
  function foldHist(mine, theirs) {
      // ⚠ \u0000 IS WRITTEN AS AN ESCAPE HERE, NEVER AS A LITERAL NUL BYTE, and that matters more
      //   than it looks. A real NUL makes grep treat this ENTIRE FILE as binary and return SILENCE
      //   rather than an error — so on 2026-08-30 a search for 'crypto.subtle' came back empty and
      //   this card's very real PBKDF2 → AES-GCM got reported as missing, and nearly rewritten out
      //   of the header. Same string at runtime, same collision-proof separator, and the file stays
      //   readable to every tool we own: build.sh's orphan check, strip/prune.sh's ghost check, and
      //   anyone grepping to find out what this app actually does.
      var key = function (t) { return t.role + '\u0000' + t.content }
    var p = 0
    while (p < mine.length && p < theirs.length && key(mine[p]) === key(theirs[p])) p++
    var mineTail = mine.slice(p), theirsTail = theirs.slice(p)
    if (!mineTail.length) return theirs            // they are strictly ahead — fast-forward
    if (!theirsTail.length) return mine            // we are strictly ahead — keep ours
    var merged = mineTail.concat(theirsTail)
    if (merged.every(function (t) { return t.at })) merged.sort(function (a, b) { return a.at - b.at })
    return mine.slice(0, p).concat(merged)
  }
  var HIST = /^toto_hist_/
  // a colliding sandbox file never clobbers: LOCAL WINS, the visitor lands beside it with .fold
  // spliced in before the extension (notes.md → notes.fold.md, so hydrate still kinds it right).
  function foldName(name) { return /\.[^.\/]+$/.test(name) ? name.replace(/(\.[^.\/]+)$/, '.fold$1') : name + '.fold' }

  // ── import — parse → unlock → PREVIEW (look before it writes — the suitcase's contract) → write → reload. ──
  //    Convos FOLD (above) · other stores replace (the file's copy wins) · new files copy in ·
  //    colliding files land beside as .fold copies.
  // opts.replaceHist (the gate's RETURN leg only): the folded diary coming back from the Mac
  // already CONTAINS this device's turns — folding it against them again would duplicate every
  // drifted turn (prefix stops at the first divergence, both tails re-append). Replace is the
  // converging move on that leg; every other road folds.
  function commit(payload, opts) {
    var wrote = 0
    Object.keys(payload.ls || {}).forEach(function (k) {
      try {
        if (HIST.test(k) && !(opts && opts.replaceHist)) {
          var mine = [], theirs = []
          try { mine = JSON.parse(localStorage.getItem(k) || '[]') || [] } catch (_) {}
          try { theirs = JSON.parse(payload.ls[k]) || [] } catch (_) {}
          localStorage.setItem(k, JSON.stringify(foldHist(mine, theirs)))
        } else localStorage.setItem(k, payload.ls[k])
        wrote++
      } catch (_) {}
    })
    var sb = payload.sandbox || {}, live = window.SANDBOX || {}
    var writes = Object.keys(sb).map(function (name) {
      wrote++
      var mine = live[name]
      var dest = (mine && typeof mine.data === 'string' && mine.data !== sb[name]) ? foldName(name) : name
      return window.OZ_FS && window.OZ_FS.restore ? window.OZ_FS.restore(dest, sb[name]).catch(function () {}) : Promise.resolve()
    })
    return Promise.all(writes).then(function () { return wrote })
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] }) }
  function preview(boxMeta, body, payload, host) {
    if (document.querySelector('.zsc-prev')) return
    var ls = payload.ls || {}, sb = payload.sandbox || {}, live = window.SANDBOX || {}
    var folds = 0, plains = 0, news = 0, beside = 0
    Object.keys(ls).forEach(function (k) { HIST.test(k) ? folds++ : plains++ })
    Object.keys(sb).forEach(function (n) { var m = live[n]; (m && typeof m.data === 'string' && m.data !== sb[n]) ? beside++ : news++ })
    var w = document.createElement('div'); w.className = 'zsc-wrap zsc-prev'
    w.setAttribute('role', 'dialog'); w.setAttribute('aria-label', 'unlock ' + boxMeta.label)
    w.innerHTML = '<div class="zsc-panel"><h3>' + boxMeta.icon + ' unlock ' + esc(boxMeta.label) + ' — look before it writes</h3>' +
      '<p class="zsc-sub">sealed ' + esc((body.at || '').slice(0, 16).replace('T', ' · ')) + ' from ' + esc(body.from || '?') +
      '. convos FOLD (both sides kept, nothing lost) · other stores take the file’s copy · a colliding file lands BESIDE yours as a .fold copy.</p>' +
      '<table class="zsc-tbl">' +
      (folds ? '<tr><td>convos to fold</td><td>' + folds + '</td></tr>' : '') +
      (plains ? '<tr><td>stores</td><td>' + plains + '</td></tr>' : '') +
      (news ? '<tr><td>files</td><td>' + news + '</td></tr>' : '') +
      (beside ? '<tr><td>files landing beside yours (.fold)</td><td>' + beside + '</td></tr>' : '') +
      '</table>' +
      '<div class="zsc-row"><button type="button" class="zsc-go">✓ write it</button><button type="button" class="zsc-no">✕ leave it</button></div></div>'
    document.body.appendChild(w)
    w.querySelector('.zsc-no').onclick = function () { w.remove() }
    w.querySelector('.zsc-go').onclick = function () {
      commit(payload).then(function (n) {
        w.remove(); note(host, '✓ ' + n + ' restored — reopening on the new data')
        setTimeout(function () { location.reload() }, 1200)
      })
    }
    w.querySelector('.zsc-go').focus()
  }
  function importFile(boxMeta, pass, file, host) {
    var rd = new FileReader()
    rd.onload = function () {
      var body = null; try { body = JSON.parse(rd.result) } catch (_) {}
      if (!body || body.oz !== 'safe') { note(host, 'not a safe file — save one with 🔒 first'); return }
      if (body.box !== boxMeta.id) { note(host, 'that file is ' + body.box + ' — this button is ' + boxMeta.id) ; return }
      open(pass, body).then(function (payload) { preview(boxMeta, body, payload, host) })
        .catch(function () { note(host, 'wrong passphrase — the file did not open') })
    }
    rd.readAsText(file)
  }

  function note(host, text) {
    var el = host && host.querySelector('.sg-safe-note')
    if (el) { el.textContent = text; clearTimeout(el._t); el._t = setTimeout(function () { el.textContent = '' }, 5000) }
  }

  // ── 🏡 THE PORTAL (Sum 2026-08-29: "build portal on both sides, then I can test from phone in
  //    morning") — one button per shell, same fold, no email. NATIVE: open the gate (the LAN
  //    listener in electron/main.js — gate_open/gate_close — shows the address to type on the
  //    phone). WEB: sync home (window.open the gate page + postMessage the diary across — the
  //    only crossings the mixed-content law allows; see main.js's gate comment for the whole
  //    dance). The diary box excludes the key ring by construction, so keys never ride the LAN.
  var inv = function (cmd) { return window.__TAURI__ && window.__TAURI__.core && window.__TAURI__.core.invoke ? window.__TAURI__.core.invoke(cmd) : Promise.reject(new Error('no shell')) }
  // ── 🟢 ●▲■ 🔴 THE GATE BAR (Sum 2026-08-29: "add the buttons to the bar, always visible — green
  //    button to open gate, red button to close, second green button press at knock from phone").
  //    ONE PAIR, FOUR STATES, so the same green does both jobs and the bar never changes shape:
  //      closed    — 🟢 "open the gate" · jewels dark · 🔴 idle
  //      open      — 🟢 waiting (disabled) · ▲ amber lit · 🔴 "close the gate"
  //      knocking  — 🟢 "LET IT IN" armed · ▲ amber BREATHING · 🔴 "no"   ← the second green press
  //      busy      — 🟢 ● green lit while the fold moves (his "jewels so you can see if transfer
  //                  is happening")
  //    The buttons live in the row markup (renderInto) and are always visible; this only paints.
  //    Jewels + red are HIS classes (.card-jewels/.cj-*/.card-stop, desk.css) — no new lights.
  var gateUI = null   // { state, paint(), answer } — knock() reaches in to arm the same buttons
  function wireGateNative(el) {
    var green = el.querySelector('.sg-gate-go'), red = el.querySelector('.sg-gate-no')
    var out = el.querySelector('.sg-gate-addr'), jewels = el.querySelector('.sg-gate-row .card-jewels')
    if (!green) return
    var st = { state: 'closed', gate: null, answer: null }
    var jewel = function (which, breathe) {
      if (!jewels) return
      Array.prototype.forEach.call(jewels.querySelectorAll('.cj'), function (j) { j.classList.remove('lit', 'blink') })
      var p = which && jewels.querySelector(which); if (p) { p.classList.add('lit'); if (breathe) p.classList.add('blink') }
    }
    var paint = function () {
      var g = st.gate, open = !!(g && g.open !== false && g.token)
      if (st.state === 'knocking') {
        green.disabled = false; green.textContent = '🟢 LET IT IN'; green.classList.add('armed')
        red.disabled = false; red.textContent = 'no'
        jewel('.cj-a', true)
        return
      }
      green.classList.remove('armed')
      if (st.state === 'busy') { green.disabled = true; green.textContent = '🟢 syncing…'; red.disabled = true; jewel('.cj-g'); return }
      green.disabled = open; green.textContent = open ? '🟢 the gate is open' : '🟢 open the gate'
      red.disabled = !open; red.textContent = open ? 'close' : 'closed'
      jewel(open ? '.cj-a' : null)
      out.innerHTML = open
        ? 'the gate is OPEN as <b>' + esc(g.hosts[0]) + '</b>. on the phone, press <b>sync home</b> and type: <b>' +
          esc(g.hosts[0] + ':' + g.port + '/g/' + g.token) + '</b>' +
          (g.hosts[1] ? ' <span class="sg-dim">(or ' + esc(g.hosts[1] + ':' + g.port + '/g/' + g.token) + ')</span>' : '')
        : ''
    }
    // paint from the SHELL's truth, never from what a button remembers — a fold reloads the app and
    // would otherwise leave "open the gate" over a gate that is still open (why gate_status exists).
    inv('gate_status').then(function (g) { st.gate = g; st.state = (g && g.open) ? 'open' : 'closed'; paint() }).catch(function () {})
    green.addEventListener('click', function () {
      if (st.state === 'knocking') { var a = st.answer; st.answer = null; st.state = 'busy'; paint(); if (a) a('yes'); return }
      if (st.state !== 'closed') return
      inv('gate_open').then(function (g) { st.gate = g; st.state = 'open'; paint() })
        .catch(function () { note(el, 'the gate needs the desktop shell — this build has no LAN hands') })
    })
    red.addEventListener('click', function () {
      if (st.state === 'knocking') { var a = st.answer; st.answer = null; st.state = 'open'; paint(); if (a) a('no'); return }
      inv('gate_close').then(function () { st.gate = null; st.state = 'closed'; paint(); note(el, 'the gate is closed — nothing is listening on the wifi now') })
    })
    gateUI = { arm: function (info, answer) { st.answer = answer; st.state = 'knocking'; paint() },
               done: function () { st.state = st.gate ? 'open' : 'closed'; paint() } }
  }
  // ── 🟢🔴 THE KNOCK, ON THE GATE BAR (Sum 2026-08-29: "green and red buttons next to gate should
  //    do it, and even jewels so you can see if transfer is happening… will fit right on open the
  //    gate bar I think too"). COPY, DON'T IMITATE: the jewels are HIS (.card-jewels/.cj-g/.cj-a/
  //    .cj-r + .lit/.blink, desk.css) and the red is HIS (.card-stop) — same classes the bot bars
  //    wear, so this row breathes and glows exactly like the rest of the house with no new CSS.
  //    It ALSO posts window.OZ_HIL.ask (shell/bar-buttons.js) so toto's own green button lights on
  //    the bar — one knock, two places to answer it, whichever hand gets there first. Called from
  //    electron/main.js's /fold before a single byte is written or sent.
  function knock(info) {
    return new Promise(function (done) {
      var answered = false
      var finish = function (v) { if (answered) return; answered = true; if (gateUI) gateUI.done(); done(v) }
      // the systemic half: his green button on toto's bar (glows, queues, survives a reopen)
      var hil = null
      try {
        if (window.OZ_HIL && window.OZ_HIL.ask) hil = window.OZ_HIL.ask('toto', {
          label: '🏡 a phone wants to sync — ' + info.stores + ' stores and ' + info.files + " files in, this desk's diary back out. nothing moves until you press.",
          run: function () { finish('yes') }, deny: function () { finish('no') }
        })
      } catch (_) {}
      var bar = document.querySelector('.agent-bar[data-agent="toto"]') || document.querySelector('.agent-bar')
      if (window.setJewel && bar) window.setJewel(bar, 'waiting')   // ▲ amber on the bar: someone is at the gate
      // the gate bar's OWN buttons take the knock — no second row is built (his "second green
      // button press at knock from phone"). Gear closed → the bar's green is the whole surface.
      var line = document.querySelector('.sg-gate-knockline')
      if (line) line.innerHTML = '🏡 <b>' + esc(info.who || 'a phone') + ' is knocking</b> — ' + info.stores + ' stores and ' +
        info.files + ' files of <b>' + esc(info.box || 'diary') + "</b> in, this desk's " + esc(info.box || 'diary') + ' back out.'
      if (gateUI) gateUI.arm(info, function (v) {
        if (line) line.innerHTML = ''
        if (v === 'no' && window.setJewel && bar) window.setJewel(bar, 'off')
        if (hil) { try { v === 'yes' ? hil.resolve() : hil.cancel(); if (v === 'yes') return } catch (_) {} }
        finish(v)
      })
    })
  }

  // box (Sum 2026-08-29: "each thing — diary, maybe not keys, and journal, codex photos lessons")
  // — every box syncs on its own now, not just the diary. The KEY RING is the one box with no 🏡
  // button, by his call ("keys I can get from web on phone pretty easy, so not needed on portal"),
  // which is also what keeps the LAN payload provably key-free.
  function syncHome(el, box) {
    box = box || 'diary'
    if (box === 'keys') { note(el, 'the key ring never crosses the wifi — get a key from the provider on the phone instead'); return }
    // same fail-closed gate as save(): a box crosses the LAN as PLAIN JSON (one button was
    // the requirement — see electron/main.js's gate note), so it must be provably key-free.
    if (!hasKeyAuthority()) { note(el, 'sync is off right now — factory.js did not load, so nothing can tell a key from a note. reload and try again.'); return }
    var addr = ''
    try { addr = localStorage.getItem('oz_gate_addr') || '' } catch (_) {}
    addr = prompt('the gate address — exactly what the Mac shows under 🏡 open the gate', addr)
    if (!addr) return
    try { localStorage.setItem('oz_gate_addr', addr) } catch (_) {}
    if (!/^https?:\/\//.test(addr)) addr = 'http://' + addr
    var gateOrigin; try { gateOrigin = new URL(addr).origin } catch (_) { note(el, 'that address did not parse — copy it exactly from the Mac'); return }
    // the features string matters: without it some browsers NAVIGATE THIS TAB instead of opening
    // a window — the app page dies and the gate waits forever for a knock that can never come
    // (caught in the pane before any phone saw it). 'popup' keeps the opener alive everywhere.
    var child = window.open(addr, 'oz-gate', 'popup,width=440,height=380')
    if (!child) { note(el, 'the browser blocked the window — allow popups for this site and press again') ; return }
    note(el, '🏡 knocking with the ' + box + ' — press 🟢 on the other device…')
    var onMsg = function (e) {
      if (e.origin !== gateOrigin || e.source !== child) return
      var d = e.data || {}
      if (d.oz === 'gate-ready') {
        var p = collect(box); p.box = box                       // the box rides WITH the payload
        p.who = (function () { try { return localStorage.getItem('oz_device_name') || 'a phone' } catch (_) { return 'a phone' } })()
        child.postMessage({ oz: 'gate-diary', payload: p }, gateOrigin)
        note(el, '🏡 the ' + box + ' is crossing — waiting for the green press…')
      } else if (d.oz === 'gate-refused') {
        window.removeEventListener('message', onMsg)
        note(el, '🔴 the other device said no — nothing was written or sent.')
      } else if (d.oz === 'gate-folded') {
        window.removeEventListener('message', onMsg)
        commit(d.payload, { replaceHist: true }).then(function (n) {   // the RETURN leg replaces — see commit
          // name the device we actually synced with (his: "sync to name of device we knocked on")
          var who = (d.payload && d.payload.from) || 'the Mac'
          try { localStorage.setItem('oz_synced_with', who); localStorage.setItem('oz_synced_at', String(Date.now())) } catch (_) {}
          note(el, '✓ ' + box + ' folded with ' + who + ' — ' + n + ' stores, reopening…')
          setTimeout(function () { location.reload() }, 1500)
        })
      }
    }
    window.addEventListener('message', onMsg)
  }

  // ── the panel — mounted when the gear's safe tab opens (the yocal renderInto seat). ──
  function renderInto(el) {
    var rows = BOXES.map(function (b) {
      var c = count(b.id)
      var what = (c.ls ? c.ls + ' store' + (c.ls === 1 ? '' : 's') : '') + (c.ls && c.files ? ' · ' : '') + (c.files ? c.files + ' file' + (c.files === 1 ? '' : 's') : '') || 'empty'
      return '<div class="sg-factory sg-safe-row" data-box="' + b.id + '">' +
        '<div class="sg-sec-hint">' + b.icon + ' <b>' + esc(b.label) + '</b> — ' + esc(b.blurb) + ' <b>here now: ' + what + '.</b></div>' +
        '<div class="sg-safe-btns">' +
        '<button type="button" class="sg-safe-save" aria-label="save ' + esc(b.label) + '">🔒 save</button>' +
        '<button type="button" class="sg-safe-import" aria-label="import ' + esc(b.label) + '">📥 import</button>' +
        // 🏡 per box (his: "each thing — diary, maybe not keys, and journal, codex photos lessons").
        // The key ring gets NO sync button — that omission is the guarantee, not a preference.
        (b.id === 'keys' ? '' : '<button type="button" class="sg-safe-sync" aria-label="sync ' + esc(b.label) + ' with another device">🏡 sync</button>') +
          // 📄 raw — plaintext, no passphrase, readable anywhere. Never on the key ring: that box
          // gets no sync button and no raw button, and saveRaw() refuses it again in code.
          (b.id === 'keys' ? '' : '<button type="button" class="sg-safe-raw" aria-label="download ' + esc(b.label) + ' as plain readable JSON, not encrypted">📄 raw</button>') +
        '</div></div>'
    }).join('')
    el.innerHTML =
      '<p class="sg-sec-hint">🔒 <b>the safe</b> — six boxes, each saved to ONE encrypted file on this device and imported back the same way. ' +
      'the passphrase below locks and unlocks; it never rides with the file, so the file itself is safe to email or Drive. nothing ever touches a server of ours.</p>' +
      '<div class="sg-factory sg-gate-row">' +
      (window.OZ_FS && window.OZ_FS.native
        ? '<div class="sg-sec-hint">🏡 <b>the gate</b> — open it, and a phone on this wifi can sync a box with this Mac. LAN only, random address, open only while you sync. <b>Nothing crosses without your green press.</b></div>' +
          '<div class="sg-sec-hint sg-gate-knockline" aria-live="polite"></div>' +
          // the permanent pair (his: "add the buttons to the bar, always visible") — green opens
          // AND answers a knock; red closes AND denies. jewels between them, his own classes.
          '<div class="sg-knock-row">' +
          '<button type="button" class="sg-gate-go sg-knock-yes">🟢 open the gate</button>' +
          '<span class="card-jewels"><span class="cj cj-g"></span><span class="cj cj-a"></span><span class="cj cj-r"></span></span>' +
          '<button type="button" class="card-stop sg-gate-no" disabled>closed</button></div>' +
          '<div class="sg-safe-note sg-gate-addr" aria-live="polite"></div>'
        : '<div class="sg-sec-hint">🏡 <b>sync home</b> — on the Mac, open the app’s gear → safe → <b>open the gate</b>. Then press 🏡 on any box below and type the address it shows. Both sides fold — nothing lost either side, no email, nothing leaves the house.</div>' +
          // 🏪 the ONE ad in the app, and it sits exactly where the free build runs out (Sum
          //    2026-08-30: "next to portal add link to buy the app"). The portal is the honest
          //    place for it — a browser cannot listen on the LAN, cannot reach a disk, cannot
          //    spawn a local engine. Everything else on this desk works free and always will.
          //    WEB BUILD ONLY: the app never advertises itself to someone who already has it.
          '<div class="sg-sec-hint sg-buy-note">the gate needs the app — a browser cannot listen on your wifi, ' +
          'reach a disk, or run a local engine. <b>Everything else here is free and stays free.</b></div>' +
          '<div class="sg-safe-btns"><a class="sg-buy" href="https://ozhunga.com/join/" target="_blank" rel="noopener">🏠 get the app — own it, offline, forever</a></div>' +
          '<div class="sg-safe-note sg-gate-addr" aria-live="polite"></div>') +
      '</div>' +
      '<label class="sg-safe-passrow">passphrase <input type="password" class="sg-safe-pass" autocomplete="off" placeholder="locks the save · unlocks the import">' +
      // the eye (Sum, from the live test: "give me option to see pass phrase") — flips the field
      // between hidden and shown; a typo in an invisible passphrase seals a box nothing can open.
      '<button type="button" class="sg-safe-eye" aria-pressed="false" aria-label="show the passphrase" title="show / hide the passphrase">👁</button></label>' +
      '<div class="sg-safe-note" role="status" aria-live="polite"></div>' +
      // 🏡 SYNC ALL — one payload, one knock, one green press. Everything but the key ring.
      '<div class="sg-factory"><div class="sg-sec-hint">🏡 <b>sync everything</b> — every box below except the key ring, in one press. ' +
      'the keys stay home until the encryption for them is worth the name.</div>' +
      '<div class="sg-safe-btns"><button type="button" class="sg-safe-sync sg-sync-all">🏡 sync all (not keys)</button></div></div>' +
      rows
    wireGateNative(el)   // 🏡 native only — the button no-ops into a note on shells without LAN hands
    el.addEventListener('click', function (e) {
      var gs = e.target.closest('.sg-safe-sync')   // 🏡 on a box row syncs THAT box; sync-all sends 'all'
      if (gs) { var r = gs.closest('.sg-safe-row'); syncHome(el, gs.classList.contains('sg-sync-all') ? 'all' : (r && r.dataset.box)); return }

        // 📄 RAW — plaintext out, and no passphrase is asked for because there is nothing to unlock.
        // Checked BEFORE the save handler further down, so a raw press can never fall through to the
        // sealed road and silently demand a phrase for a file that will not carry one.
        var rw = e.target.closest('.sg-safe-raw')
        if (rw) {
          var rr = rw.closest('.sg-safe-row'), rbox = rr && rr.dataset.box
          saveRaw(rbox).then(function (res) {
            if (res.refused) return note(el, 'the key ring has no raw road — that box only ever leaves sealed')
            if (res.blocked) return note(el, 'cannot tell a key from a note right now — refusing rather than guessing')
            if (!res.n) return note(el, 'nothing in that box yet')
            note(el, '📄 ' + res.n + ' item' + (res.n === 1 ? '' : 's') + ' → ' + res.name + ' — PLAINTEXT, readable by anything. yours to carry.')
          })
          return
        }
      var eye = e.target.closest('.sg-safe-eye')
      if (eye) {
        var p = el.querySelector('.sg-safe-pass'), show = p.type === 'password'
        p.type = show ? 'text' : 'password'
        eye.setAttribute('aria-pressed', show ? 'true' : 'false')
        eye.setAttribute('aria-label', show ? 'hide the passphrase' : 'show the passphrase')
        eye.classList.toggle('on', show)
        return
      }
      var b = e.target.closest('.sg-safe-save, .sg-safe-import'); if (!b) return
      var row = b.closest('.sg-safe-row'), boxMeta = BOXES.filter(function (x) { return x.id === row.dataset.box })[0]
      var pass = (el.querySelector('.sg-safe-pass').value || '').trim()
      if (!pass) { note(el, 'the safe needs a passphrase — type one above first'); el.querySelector('.sg-safe-pass').focus(); return }
      if (b.classList.contains('sg-safe-save')) {
        b.disabled = true
        save(boxMeta.id, pass).then(function (r) {
          b.disabled = false
          note(el, r.blocked ? 'the safe will not save right now — factory.js did not load, so nothing can tell a key from a note. reload and try again.'
            : r.n ? '🔒 ' + boxMeta.label + ' sealed — ' + r.n + ' item' + (r.n === 1 ? '' : 's') + ' in ' + r.name : boxMeta.label + ' is empty — nothing to save')
        })
      } else {
        var inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.json,application/json'; inp.style.display = 'none'
        document.body.appendChild(inp)
        inp.onchange = function () { var f = inp.files && inp.files[0]; inp.remove(); if (f) importFile(boxMeta, pass, f, el) }
        inp.click()
      }
    })
  }

  window.OZ_SAFE = { renderInto: renderInto, collect: collect, seal: seal, open: open, fold: foldHist, commit: commit, knock: knock, BOXES: BOXES }   // fold + commit + knock exported: the LAN gate calls the same roads (one home)
})()
