// suitcase.js — 🧳 THE SUITCASE v2 (Sum, 2026-08-23): "default is all txt no pics. pics is option, but
// opens a selector. expand collapse by bot and card and convo. all on / all off buttons up top. or just
// sync one bot, and one suite of cards." pack this selection into ONE travel file, carry it on foot
// (AirDrop / Files), unpack it into any other 0z — Mac ⇄ phone, native ⇄ web demo. canon lives on the
// Mac; the phone is a window. UNPACK IS HIL: a preview names every store before one byte writes.
//
// COPY, DON'T IMITATE — the parents of every part:
//   self-mount observer + toast + esc + modal idempotence  ← cards/dashboards/wellness-import.js
//   the card stores                                         ← clip-health-report.js readers + WELLNESS-NOTES.md
//   the convo store (toto_hist_<id>)                        ← shell/engine-parts/50-history-clockspeed.js loadHist/saveHist
//   photo resize policy (≤1200 long edge, JPEG q0.8)        ← ~/Local/crawl4ai/server.py (the rung's Pillow line)
//   share-first, download-fallback                           ← navigator.share carries AirDrop on iOS
// WHAT NEVER RIDES: machinery + secrets (toto_esp_* · toto_calls_* · toto_skin · toto_pair* · api keys).
;(function () {
  'use strict'

  // ── the card-store map — each row is one checkbox in the tree. only rows with data show. ──
  var CARD_GROUPS = [
    { id: 'chart',    label: '📋 chart — prep sheet + sessions', keys: ['toto_prep', 'toto_prep_sessions'] },
    { id: 'sleep',    label: '🛏️ sleep — nights + dreams',       keys: ['toto_sleep_nights', 'toto_sleep_dream'] },
    { id: 'food',     label: '🍎 food — plan · pantry · log',    keys: ['toto_food_plan'], sandbox: ['food-plan.json'] },
    { id: 'exercise', label: '🏃 exercise — log · notes · presets', keys: ['toto_exercise_log', 'toto_ex_notes', 'toto_ex_presets'] },
    { id: 'mood',     label: '🧠 mood — the wetware check-ins',  keys: ['toto_wellness_mood'] },
    { id: 'notes',    label: '📝 notes',                          keys: ['toto_notes'] }
  ]
  var HIST = /^toto_hist_(.+)$/
  var SAFE = /^toto_(prep|sleep_|ex_|exercise_|food_|wellness_|notes$|hist_)/   // the unpack gate — data stores only

  function ls(k) { var v = null; try { v = localStorage.getItem(k) } catch (_) {} return v }
  function gather() {
    var g = { cards: [], bots: [], pics: [] }
    CARD_GROUPS.forEach(function (c) {
      var has = c.keys.some(function (k) { return ls(k) != null })
      if (!has && c.sandbox) has = c.sandbox.some(function (k) { return (window.SANDBOX || {})[k] })
      if (has) g.cards.push(c)
    })
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i), m = k && k.match(HIST)
      if (!m) continue
      var turns = 0; try { turns = (JSON.parse(ls(k)) || []).length } catch (_) {}
      if (turns) g.bots.push({ id: m[1], key: k, label: '🤖 ' + m[1] + ' — the convo, ' + turns + ' turn' + (turns === 1 ? '' : 's') })
    }
    g.bots.sort(function (a, b) { return a.id < b.id ? -1 : 1 })
    var sb = window.SANDBOX || {}
    Object.keys(sb).forEach(function (k) {
      var e = sb[k]; if (!e || typeof e.data !== 'string') return
      if (e.kind === 'image' || /^data:image/.test(e.data)) g.pics.push({ key: k, label: '📷 ' + k, kb: Math.round(e.data.length / 1366) })
    })
    return g
  }

  // ── PACK — from the checked selection. share-first (iOS share sheet = AirDrop right there). ──
  function stamp() { var d = new Date(), p = function (n) { return (n < 10 ? '0' : '') + n }; return '' + d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + '-' + p(d.getHours()) + p(d.getMinutes()) }
  function pack(sel) {
    var keys = {}, sandbox = {}, sb = window.SANDBOX || {}
    sel.cards.forEach(function (c) {
      c.keys.forEach(function (k) { var v = ls(k); if (v != null) keys[k] = v })
      ;(c.sandbox || []).forEach(function (k) { var e = sb[k]; if (e) sandbox[k] = { kind: e.kind, ext: e.ext, mime: e.mime, data: e.data } })
    })
    sel.bots.forEach(function (b) { var v = ls(b.key); if (v != null) keys[b.key] = v })
    sel.pics.forEach(function (p) { var e = sb[p.key]; if (e) sandbox[p.key] = { kind: e.kind, ext: e.ext, mime: e.mime, data: e.data } })
    var body = { oz: 'suitcase', v: 2, at: new Date().toISOString(), from: (window.OZ_PROFILE && window.OZ_PROFILE.name) || 'totoII', keys: keys, sandbox: sandbox }
    var name = 'travel-' + stamp() + '.json'
    var blob = new Blob([JSON.stringify(body)], { type: 'application/json' })
    var file; try { file = new File([blob], name, { type: 'application/json' }) } catch (_) { file = null }
    if (file && navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      navigator.share({ files: [file], title: name }).catch(function () { download(blob, name) })
    } else download(blob, name)
    return name
  }
  function download(blob, name) {
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name
    document.body.appendChild(a); a.click()
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove() }, 800)
  }

  // ── UNPACK — parse → PREVIEW → the human presses WRITE → reload. the SAFE gate holds even on a crafted file. ──
  function summarize(body) {
    var rows = [], keys = body.keys || {}, sb = body.sandbox || {}
    function J(k) { try { return JSON.parse(keys[k]) } catch (_) { return null } }
    if (keys.toto_prep) rows.push(['📋 prep sheet (the appointment notes)', keys.toto_prep.length + ' chars'])
    if (keys.toto_sleep_nights) { var n = J('toto_sleep_nights'); rows.push(['🛏️ sleep nights', (Array.isArray(n) ? n.length : '?') + '']) }
    if (keys.toto_exercise_log) { var x = J('toto_exercise_log'); rows.push(['🏃 exercise sessions', (Array.isArray(x) ? x.length : '?') + '']) }
    if (keys.toto_food_plan) { var f = J('toto_food_plan') || {}; rows.push(['🍎 food plan', ((f.meals || []).length) + ' meals · ' + ((f.pantry || []).length) + ' pantry']) }
    if (keys.toto_wellness_mood) { var m = J('toto_wellness_mood') || {}; rows.push(['🧠 mood check-ins', Object.keys(m).length + ' days']) }
    Object.keys(keys).forEach(function (k) {
      var m = k.match(HIST)
      if (m) { var t = 0; try { t = (JSON.parse(keys[k]) || []).length } catch (_) {}; rows.push(['🤖 ' + m[1] + ' — the convo', t + ' turns']) }
      else if (SAFE.test(k) && ['toto_prep', 'toto_sleep_nights', 'toto_exercise_log', 'toto_food_plan', 'toto_wellness_mood'].indexOf(k) < 0) rows.push(['· ' + k.replace('toto_', ''), keys[k].length + ' chars'])
    })
    var pics = Object.keys(sb).filter(function (k) { return sb[k] && (sb[k].kind === 'image' || /^data:image/.test(sb[k].data || '')) })
    if (sb['food-plan.json']) rows.push(['🍎 food doc (for the bots)', '1 file'])
    if (pics.length) rows.push(['📷 photos', pics.length + ''])
    return rows
  }
  function commit(body) {
    var keys = body.keys || {}, sb = body.sandbox || {}, wrote = 0
    Object.keys(keys).forEach(function (k) { if (!SAFE.test(k)) return; try { localStorage.setItem(k, keys[k]); wrote++ } catch (_) {} })
    window.SANDBOX = window.SANDBOX || {}
    Object.keys(sb).forEach(function (k) {
      var e = sb[k]; if (!e || typeof e.data !== 'string') return
      if (k !== 'food-plan.json' && k.indexOf('phone/') !== 0 && e.kind !== 'image') return
      window.SANDBOX[k] = { kind: e.kind || 'doc', ext: e.ext || 'txt', mime: e.mime || 'text/plain', data: e.data }; wrote++
    })
    return wrote
  }
  function unpack(file, host) {
    var rd = new FileReader()
    rd.onload = function () {
      var body = null; try { body = JSON.parse(rd.result) } catch (_) {}
      if (!body || body.oz !== 'suitcase') { toast(host, 'not a suitcase — pack one with 🧳 first'); return }
      previewModal(body, host)
    }
    rd.readAsText(file)
  }
  function previewModal(body, host) {
    if (document.querySelector('.zsc-prev')) return
    var rows = summarize(body)
    var w = el('div', 'zsc-wrap zsc-prev'); w.setAttribute('role', 'dialog'); w.setAttribute('aria-label', 'unpack the suitcase')
    w.innerHTML = '<div class="zsc-panel"><h3>🧳 unpack — look before it writes</h3>' +
      '<p class="zsc-sub">packed ' + esc((body.at || '').slice(0, 16).replace('T', ' · ')) + ' from ' + esc(body.from || '?') + '. this REPLACES the same stores here.</p>' +
      '<table class="zsc-tbl">' + rows.map(function (r) { return '<tr><td>' + esc(r[0]) + '</td><td>' + esc(r[1]) + '</td></tr>' }).join('') + '</table>' +
      '<div class="zsc-row"><button type="button" class="zsc-go">✓ write it</button><button type="button" class="zsc-no">✕ leave it</button></div></div>'
    document.body.appendChild(w)
    w.querySelector('.zsc-no').onclick = function () { w.remove() }
    w.querySelector('.zsc-go').onclick = function () {
      var n = commit(body); w.remove()
      toast(host, n + ' stores unpacked — reopening on the new data')
      setTimeout(function () { location.reload() }, 1200)
    }
    w.querySelector('.zsc-go').focus()
  }

  // ── 📷 SNAP — camera to the bag (≤1200 long edge, JPEG q0.8 — the rung server's own policy). lands in
  //    SANDBOX['phone/…'] so the floor persists it; it appears in the PICS tree and rides when checked. ──
  function snap(host) {
    var inp = el('input'); inp.type = 'file'; inp.accept = 'image/*'; inp.setAttribute('capture', 'environment')
    inp.style.display = 'none'; document.body.appendChild(inp)
    inp.onchange = function () {
      var f = inp.files && inp.files[0]; inp.remove(); if (!f) return
      var img = new Image(), url = URL.createObjectURL(f)
      img.onload = function () {
        var w = img.naturalWidth, h = img.naturalHeight, sc = Math.min(1, 1200 / Math.max(w, h))
        var cv = document.createElement('canvas'); cv.width = Math.round(w * sc); cv.height = Math.round(h * sc)
        cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height); URL.revokeObjectURL(url)
        window.SANDBOX = window.SANDBOX || {}
        window.SANDBOX['phone/pic-' + Date.now() + '.jpg'] = { kind: 'image', ext: 'jpg', mime: 'image/jpeg', data: cv.toDataURL('image/jpeg', 0.8) }
        toast(host, 'in the bag — it is in the 📷 pics tree now (pics ride only when checked)')
        var p = document.querySelector('.zsc-main'); if (p) { p.remove(); openPanel(host) }   // repaint the tree
      }
      img.src = url
    }
    inp.click()
  }

  // ── THE TREE PANEL — all on / all off up top · cards · bots · pics (off till its master toggle). ──
  function section(title, rows, open, cls) {
    return '<details class="zsc-sec ' + (cls || '') + '"' + (open ? ' open' : '') + '><summary>' + title + '</summary>' +
      rows.map(function (r) {
        return '<label class="zsc-item"><input type="checkbox" data-sec="' + r.sec + '" data-i="' + r.i + '"' + (r.on ? ' checked' : '') + (r.dis ? ' disabled' : '') + '> ' + esc(r.label) + (r.sub ? '<span>' + esc(r.sub) + '</span>' : '') + '</label>'
      }).join('') + (rows.length ? '' : '<p class="zsc-sub">nothing here yet</p>') + '</details>'
  }
  function openPanel(host) {
    if (document.querySelector('.zsc-main')) return
    var g = gather()
    var rows = { cards: g.cards.map(function (c, i) { return { sec: 'cards', i: i, label: c.label, on: true } }),
                 bots:  g.bots.map(function (b, i) { return { sec: 'bots', i: i, label: b.label, on: true } }),
                 pics:  g.pics.map(function (p, i) { return { sec: 'pics', i: i, label: p.label, sub: p.kb + ' KB', on: false, dis: true } }) }
    var w = el('div', 'zsc-wrap zsc-main'); w.setAttribute('role', 'dialog'); w.setAttribute('aria-label', 'the suitcase')
    w.innerHTML = '<div class="zsc-panel"><h3>🧳 the suitcase</h3>' +
      '<p class="zsc-sub">default: ALL TEXT, no pics. untick to travel lighter — one bot, one suite. canon lives on the Mac; the pack is a plain file you can read.</p>' +
      '<div class="zsc-row zsc-top"><button type="button" class="zsc-allon">☑ all on</button><button type="button" class="zsc-alloff">☐ all off</button>' +
      '<label class="zsc-picmaster"><input type="checkbox" class="zsc-picflag"> 📷 pics ride too</label></div>' +
      section('🗂 cards — ' + rows.cards.length, rows.cards, true) +
      section('🤖 bots — the convos — ' + rows.bots.length, rows.bots, false) +
      section('📷 pics — ' + rows.pics.length + ' (off by default)', rows.pics, false, 'zsc-picsec') +
      '<div class="zsc-row"><button type="button" class="zsc-snapb">📷 snap</button><button type="button" class="zsc-unpack">⤵ unpack</button><button type="button" class="zsc-go zsc-packb">🧳 pack it</button><button type="button" class="zsc-no">✕</button></div></div>'
    document.body.appendChild(w)
    var boxes = function (sec) { return Array.prototype.slice.call(w.querySelectorAll('input[data-sec="' + sec + '"]')) }
    w.querySelector('.zsc-allon').onclick = function () { boxes('cards').concat(boxes('bots')).forEach(function (b) { b.checked = true }) }
    w.querySelector('.zsc-alloff').onclick = function () { boxes('cards').concat(boxes('bots')).concat(boxes('pics')).forEach(function (b) { b.checked = false }) }
    w.querySelector('.zsc-picflag').onchange = function () {
      var on = this.checked, sec = w.querySelector('.zsc-picsec')
      boxes('pics').forEach(function (b) { b.disabled = !on; b.checked = on })
      if (on && sec) sec.open = true   // the master toggle OPENS the selector (Sum: "pics is option, but opens a selector")
    }
    w.querySelector('.zsc-no').onclick = function () { w.remove() }
    w.querySelector('.zsc-snapb').onclick = function () { snap(host) }
    w.querySelector('.zsc-unpack').onclick = function () {
      var inp = el('input'); inp.type = 'file'; inp.accept = '.json,application/json'; inp.style.display = 'none'
      document.body.appendChild(inp)
      inp.onchange = function () { var f = inp.files && inp.files[0]; inp.remove(); w.remove(); if (f) unpack(f, host) }
      inp.click()
    }
    w.querySelector('.zsc-packb').onclick = function () {
      var sel = { cards: [], bots: [], pics: [] }
      boxes('cards').forEach(function (b) { if (b.checked) sel.cards.push(g.cards[+b.dataset.i]) })
      boxes('bots').forEach(function (b) { if (b.checked) sel.bots.push(g.bots[+b.dataset.i]) })
      boxes('pics').forEach(function (b) { if (b.checked) sel.pics.push(g.pics[+b.dataset.i]) })
      if (!sel.cards.length && !sel.bots.length && !sel.pics.length) { toast(host, 'nothing ticked — the suitcase would be empty'); return }
      var n = pack(sel); toast(host, 'packed ' + n + ' — AirDrop it, or find it in downloads')
    }
    w.querySelector('.zsc-packb').focus()
  }

  // ── SELF-MOUNT — a 🧳 chip on the 📋 clipboard's controls and the 🧘 spa's topctrls (the importer's
  //    exact observer shape). one flag per card so re-scans don't double-add. ──
  function wire(card, slotSel, chipClass) {
    if (!card || card._zscWired) return
    var slot = card.querySelector(slotSel); if (!slot) return
    card._zscWired = true
    var btn = el('button', chipClass + ' zsc-open'); btn.type = 'button'
    btn.title = 'the suitcase — pack / unpack a selection (travel between Mac and phone)'
    btn.setAttribute('aria-label', 'the suitcase: pack or unpack a selection')
    btn.textContent = '🧳 travel'
    btn.addEventListener('click', function (e) { e.stopPropagation(); openPanel(card) })
    slot.insertBefore(btn, slot.firstChild)
  }
  function scan() {
    document.querySelectorAll('.card').forEach(function (c) {
      var cls = c.className || ''
      if (/card-clipboard/.test(cls)) wire(c, '.card-ctrls', 'zsc-chip')
      if (/p-wellness/.test(cls)) wire(c, '.well-topctrls', 'well-daychip')
    })
  }
  // ── ⚠ CORRECTION 2026-08-30 (Sum: "i do not like suitcase button in card top bar").
  //    The 🧳 travel chip is NO LONGER MOUNTED. scan()/wire() above are kept and still correct —
  //    the door is closed, the room is not demolished. Re-open it by calling scan() here again.
  //    The suitcase itself is fully alive: window.OZ_SUITCASE.open(card) still works, and its
  //    pack/unpack road is what the safe was built from.
  //    ⚠ injectCss() MUST STAY on boot — cards/settings/safe.js wears the .zsc-* dress this
  //    injects (see its header, "the modal dress (zsc-*) ← suitcase.js injectCss"). Killing
  //    boot() outright would strip the safe's modal, which is NOT what was asked for.
  function boot() {
    injectCss()
  }

  function injectCss() {
    if (document.getElementById('zsc-css')) return
    var s = document.createElement('style'); s.id = 'zsc-css'
    s.textContent =
      '.zsc-chip{font:inherit;padding:2px 10px;border:1px solid currentColor;border-radius:9px;background:transparent;color:inherit;cursor:pointer}' +
      '.zsc-wrap{position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:9500;display:flex;align-items:center;justify-content:center;padding:14px}' +
      '.zsc-panel{background:var(--card-bg,#181818);color:var(--fg,#eee);border:1px solid #555;border-radius:14px;max-width:560px;width:100%;max-height:88vh;overflow:auto;padding:18px 16px}' +
      '.zsc-panel h3{margin:0 0 6px;font-size:1.25em}' +
      '.zsc-sub{opacity:.75;margin:0 0 10px;font-size:.95em}' +
      '.zsc-sec{border:1px solid #444;border-radius:10px;margin:8px 0;padding:4px 10px}' +
      '.zsc-sec summary{cursor:pointer;font-size:1.05em;padding:8px 2px}' +
      '.zsc-item{display:flex;align-items:center;gap:10px;padding:9px 4px;font-size:1.02em;border-top:1px solid #333;cursor:pointer}' +
      '.zsc-item input{width:20px;height:20px}' +
      '.zsc-item span{opacity:.6;font-size:.85em;margin-left:auto}' +
      '.zsc-top{justify-content:flex-start;align-items:center;gap:10px;flex-wrap:wrap}' +
      '.zsc-picmaster{margin-left:auto;display:flex;align-items:center;gap:6px}' +
      '.zsc-picmaster input{width:20px;height:20px}' +
      '.zsc-tbl{width:100%;border-collapse:collapse;margin:6px 0 12px}' +
      '.zsc-tbl td{padding:6px 8px;border-bottom:1px solid #444}' +
      '.zsc-tbl td:last-child{text-align:right;opacity:.8}' +
      '.zsc-row{display:flex;gap:10px;justify-content:flex-end;margin-top:10px;flex-wrap:wrap}' +
      '.zsc-row button,.zsc-allon,.zsc-alloff{font:inherit;font-size:1.02em;padding:10px 14px;border-radius:10px;border:1px solid #666;background:transparent;color:inherit;cursor:pointer}' +
      '.zsc-go{border-color:#4a4}' +
      '.zsc-open:focus,.zsc-panel button:focus,.zsc-item input:focus{outline:2px solid #8bf;outline-offset:2px}'
    document.head.appendChild(s)
  }

  function toast(near, text) {
    var t = el('div', 'wimp-toast'); t.textContent = '✓ ' + text
    ;(near || document.body).appendChild(t)
    setTimeout(function () { t.classList.add('go') }, 10); setTimeout(function () { t.remove() }, 3200)
  }
  function el(tag, cls) { var n = document.createElement(tag); if (cls) n.className = cls; return n }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] }) }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot()

  window.OZ_SUITCASE = { pack: pack, unpack: unpack, commit: commit, summarize: summarize, gather: gather, open: openPanel }
})()
