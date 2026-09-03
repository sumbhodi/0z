// context-bar.js — a color-coded context-window meter under each agent's input. shows how full the model's
// context is (the injection head + the chat history, ~4 chars/token, vs the model's window).
//   TRIM mode    → the full window as a green→amber→red bar; [✂️ trim now] asks WHERE (middle/beginning)
//                  and HOW MANY pairs to drop — a real edit to the SAVED history.
//   COMPACT mode → the same bar plus a marker at the compact threshold (the %); [🪗 compact now] folds the
//                  older middle into one AI summary, keeping the recent tail.
// per-agent: reads toto_inj_histmode/turns/histpct_<id> (the 💉 injection Conversation block).

;(function () {
  // rough context windows by model family (tokens). a default covers the rest.
  function ctxWindow(model) {
    const m = (model || '').toLowerCase()
    if (m.includes('gemini')) return 1000000
    if (m.startsWith('claude')) return 200000
    if (m.startsWith('o1') || m.startsWith('o3')) return 200000
    if (m.includes('gpt')) return 128000
    return 128000
  }
  const ig = (k, id) => { try { return localStorage.getItem('toto_inj_' + k + '_' + id) || '' } catch (_) { return '' } }
  // (Sum 2026-07-13) the history can come from anywhere — localStorage (0z bots) OR a caller's in-memory thread
  //   (Monaco's Teach/Fix/Squiggy). so snapshot works off a plain message array; the caller decides where it lives.
  function snapshot(hist, id) {
    const histChars = hist.reduce((a, m) => a + ('' + (m.content || '')).length, 0)
    let sysChars = 0; try { sysChars = window.compileChart ? window.compileChart(id).length : 0 } catch (_) {}
    return { tok: Math.ceil((histChars + sysChars) / 4), pairs: Math.floor(hist.length / 2) }
  }
  // the default history source — localStorage (unchanged for every 0z bot). Monaco overrides via opts.getHist/setHist.
  const lsGet = id => { try { return JSON.parse(localStorage.getItem('toto_hist_' + id) || '[]') } catch (_) { return [] } }
  const lsSet = (id, h) => { try { localStorage.setItem('toto_hist_' + id, JSON.stringify(h)) } catch (_) {} }

  // ── ROLLBACKS (Sum 2026-08-29: "each compact and trim creates a back up with that full convo…
  //    scroll back and basically undo… pin a good one to come back to… previous convo now first
  //    rollback… just rollbacks, not multi convo"). A ring of 10 per agent, localStorage only —
  //    NOTHING writes to the permanent head (his rule: notes stay the only road there). Pinned
  //    entries survive eviction; the quota guard drops oldest unpinned rather than dying silent. ──
  const RB_CAP = 10
  const rbKey = id => 'toto_rollbacks_' + id
  const rbLoad = id => { try { const a = JSON.parse(localStorage.getItem(rbKey(id)) || '[]'); return Array.isArray(a) ? a : [] } catch (_) { return [] } }
  function rbSave(id, list) {
    for (;;) {
      try { localStorage.setItem(rbKey(id), JSON.stringify(list)); return }
      catch (_) { const i = list.findIndex(r => !r.pin); if (i < 0 || !list.length) return; list.splice(i, 1) }   // quota: shed oldest unpinned until it fits
    }
  }
  function rbPush(id, hist, label, pin) {
    if (!hist || !hist.length) return
    const list = rbLoad(id)
    const last = list[list.length - 1]
    if (last && JSON.stringify(last.hist) === JSON.stringify(hist)) { if (pin) { last.pin = true; rbSave(id, list) } return }   // no duplicate neighbors
    list.push({ at: Date.now(), label: label || '', pin: !!pin, hist })
    while (list.length > RB_CAP) { const i = list.findIndex(r => !r.pin); list.splice(i < 0 ? 0 : i, 1) }   // pins outlive the ring
    rbSave(id, list)
  }
  window.OZ_ROLLBACK = { load: rbLoad, push: rbPush }   // exported so the coder strip can clean house later
  const kt = n => n >= 1000 ? (n / 1000).toFixed(n >= 10000 ? 0 : 1) + 'k' : '' + n
  const norm = msgs => {   // collapse consecutive same-role + open on a user turn (Anthropic-valid)
    const out = []
    msgs.forEach(m => { if (out.length && out[out.length - 1].role === m.role) out[out.length - 1].content += '\n\n' + m.content; else out.push({ role: m.role, content: m.content }) })
    while (out.length && out[0].role === 'assistant') out.shift()
    return out
  }

  // the meter is COMPACT by default: a tiny green→red vertical thermometer + a % + a slot the voice controls
  // (👂 ear · 🔈 speaker) live in (voice.js fills .ctx-voice). CLICK the strip → the full window bar + the ✂️
  // scissors trim/compact controls unfold. (Sum: "tiny vertical bar green→red, then a %, click → full layout.")
  window.mkContextBar = function (bar, id, opts) {
    opts = opts || {}
    const convo = opts.mount || (bar && bar.querySelector('.convo')); if (!convo) return () => {}
    const getHist = opts.getHist || (() => lsGet(id))         // where the conversation lives (localStorage · or a caller's array)
    const setHist = opts.setHist || (h => lsSet(id, h))       // how a trim/compact writes it back
    const isBot = !opts.mount   // (Sum 2026-07-13) the manual re-check fires on 0z BOT chats only — not Monaco/teach/fix (chat, not code)
    const halluIco = (window.OZ_PROFILE && window.OZ_PROFILE.plain) ? 'skin/qmark.png' : 'skin/hillicinot.png'   // oz+unicorn = pill · clin/corp = ?
    const wrap = document.createElement('div'); wrap.className = 'ctx-bar'
    wrap.innerHTML =
      '<div class="ctx-mini" role="button" tabindex="0" title="context window — click to expand · trim">' +
        (isBot ? '<button class="ctx-hallu" type="button" title="something fishy? re-check this answer — a second bot re-reads it (✓ if it confirms, else it corrects). on = also auto-checks at a pause"><img src="' + halluIco + '" alt="re-check"></button>' : '') +
        '<span class="ctx-thermo" data-level="ok"><span class="ctx-thermo-fill"></span></span>' +
        '<span class="ctx-pct">0%</span>' +
        '<span class="ctx-voice"></span>' +
      '</div>' +
      '<div class="ctx-full" hidden>' +
        '<div class="ctx-track"><div class="ctx-fill"></div><div class="ctx-mark" hidden></div></div>' +
        '<div class="ctx-row"><span class="ctx-label"></span><button class="ctx-act" type="button"></button></div>' +
        (isBot
          ? '<div class="ctx-rb-row" style="display:flex;gap:6px;align-items:center;font-size:var(--fs-ui);margin-top:4px">' +
              '<button class="ctx-rb-prev" type="button" title="older rollback — the convo as it was before a trim or compact" style="cursor:pointer;font-size:var(--fs-ui)">◀</button>' +
              '<span class="ctx-rb-at" style="min-width:3em;text-align:center">live</span>' +
              '<button class="ctx-rb-next" type="button" title="newer rollback" style="cursor:pointer;font-size:var(--fs-ui)">▶</button>' +
              '<button class="ctx-rb-pin" type="button" title="pin — a pinned rollback never falls off the ring of 10" style="cursor:pointer;font-size:var(--fs-ui);background:none;border:0">📌</button>' +
              '<span class="ctx-rb-label" style="opacity:.75"></span>' +
            '</div>'
          : '') +
      '</div>'
    convo.appendChild(wrap)   // below the input, at the bottom of the bot's convo
    // THE TRAVELER'S MAPS RIDE THIS ROW (Sum 2026-07-21: "time map and search map don't need words —
    // they need to be on the same line as the speaker and the hillicinot pill"). Icon-only, on the
    // LEFT (margin-right:auto on .ctx-maps pushes the meter cluster to the right). The clicks are
    // handled by oz-ttmaps.js's document-level delegation, so the buttons work wherever they live.
    // ── CORRECTION 26 Aug: was `id === 'timetravel'`. caps: ["travel"] on the bot; the maps row
    //    appears for whoever holds the traveller's role, not for whoever holds that one id.
    if ((window.REG && window.REG.hasCap && window.REG.hasCap(id, 'travel'))) {
      const mini = wrap.querySelector('.ctx-mini')
      const maps = document.createElement('span'); maps.className = 'ctx-maps'
      maps.innerHTML =
        '<button class="ab-map" title="the time map — your journeys"><img src="agents/timetravel/map-gen.png" alt="time map"></button>' +
        '<button class="ab-glob" title="the search map — your curiosities"><img src="agents/timetravel/globe-gen.png" alt="search map"></button>' +
        '<button class="ab-nowtrip" title="jump the clock" hidden><img src="cards/clock/clock.png" alt="now / last trip"></button>'
      mini.insertBefore(maps, mini.firstChild)
      setTimeout(() => { try { window.TT_NOWTRIP_REFRESH && window.TT_NOWTRIP_REFRESH() } catch (_) {} }, 200)
    }
    const mini = wrap.querySelector('.ctx-mini'), full = wrap.querySelector('.ctx-full')
    const thermo = wrap.querySelector('.ctx-thermo'), thermoFill = wrap.querySelector('.ctx-thermo-fill'), pctEl = wrap.querySelector('.ctx-pct')
    const fill = wrap.querySelector('.ctx-fill'), mark = wrap.querySelector('.ctx-mark')
    const label = wrap.querySelector('.ctx-label'), act = wrap.querySelector('.ctx-act')
    const hallu = wrap.querySelector('.ctx-hallu')

    function update() {
      const win = ctxWindow(localStorage.getItem('toto_bot_' + id + '_model') || '')
      const { tok, pairs } = snapshot(getHist(), id)
      const pct = Math.min(100, Math.round(tok / win * 100))
      const level = pct < 50 ? 'ok' : pct < 80 ? 'warn' : 'hot'
      thermoFill.style.height = pct + '%'                 // the vertical thermometer fills bottom→up
      thermo.dataset.level = level
      pctEl.textContent = pct + '%'
      fill.style.width = pct + '%'                        // the full horizontal bar (shown on expand)
      fill.dataset.level = level
      const compact = ig('histmode', id) === 'compact'
      const thr = Math.max(10, Math.min(95, parseInt(ig('histpct', id) || '70', 10) || 70))
      mark.hidden = !compact; if (compact) mark.style.left = thr + '%'
      label.textContent = `${kt(tok)} / ${kt(win)} · ${pct}%${compact ? ` · compacts at ${thr}%` : ''} · ${pairs} pairs`
      act.textContent = compact ? '🪗 compact now' : '✂️ trim now'
      act.dataset.mode = compact ? 'compact' : 'trim'
      // (Sum 2026-07-13) the manual re-check button is ALWAYS there (on = also auto-checks · off = manual-only); ✓ clears when the bot speaks again
      if (hallu && hallu._checkedAt != null && getHist().length !== hallu._checkedAt) { hallu.classList.remove('ok'); hallu._checkedAt = null }
      // a new pair landed while browsing a rollback → that rollback IS the live convo now ("top stop")
      if (rbView !== null && getHist().length !== rbLen) { rbView = null }
      rbRender()
    }
    // ── the rollback browser (bots only). ◀ steps into the ring — the FIRST step away from live
    //    files the live convo as "⏪ previous convo" (his rule: "previous convo now first rollback"),
    //    so typing from any rollback just makes it the top; nothing is ever lost by looking.
    //    Every step is a real setHist + repaint (ozRefreshConvo), not a preview. 📌 on live snapshots
    //    the current convo pinned; 📌 on a rollback toggles its pin. ──
    let rbView = null, rbLen = 0   // null = live; rbLen tracks convo growth to snap the pointer back
    const rbAt = wrap.querySelector('.ctx-rb-at'), rbLabel = wrap.querySelector('.ctx-rb-label'), rbPin = wrap.querySelector('.ctx-rb-pin')
    function rbRender() {
      if (!rbAt) return
      const list = rbLoad(id)
      if (rbView === null) {
        rbAt.textContent = 'live'
        rbLabel.textContent = list.length ? list.length + ' rollback' + (list.length > 1 ? 's' : '') : 'no rollbacks yet'
        rbPin.style.opacity = 1
      } else {
        const r = list[rbView]
        rbAt.textContent = (rbView + 1) + '/' + list.length
        rbLabel.textContent = r ? (r.pin ? '📌 ' : '') + (r.label || '') + ' · ' + new Date(r.at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : ''
        rbPin.style.opacity = r && r.pin ? 1 : 0.55
      }
    }
    function rbGoto(target) {
      let list = rbLoad(id)
      if (!list.length) { rbRender(); return }
      if (rbView === null) rbPush(id, getHist(), '⏪ previous convo')   // leaving live files it first (dup-guarded)
      target = Math.max(0, Math.min(list.length - 1, target))
      setHist(list[target].hist)
      rbView = target; rbLen = list[target].hist.length
      if (window.ozRefreshConvo) window.ozRefreshConvo(id)
      if (window.pulse) window.pulse('ctx')
      update(); rbRender()
    }
    if (rbAt) {
      wrap.querySelector('.ctx-rb-prev').addEventListener('click', () => rbGoto(rbView === null ? rbLoad(id).length - 1 : rbView - 1))
      wrap.querySelector('.ctx-rb-next').addEventListener('click', () => { if (rbView !== null) rbGoto(rbView + 1) })
      rbPin.addEventListener('click', () => {
        if (rbView === null) { rbPush(id, getHist(), '📌 pinned', true) }
        else { const list = rbLoad(id); if (list[rbView]) { list[rbView].pin = !list[rbView].pin; rbSave(id, list) } }
        rbRender()
      })
    }
    // click the compact strip → unfold the full layout with scissors (but NOT when clicking the voice or HILLICINOT controls)
    mini.addEventListener('click', e => { if (e.target.closest('.ctx-voice') || e.target.closest('.ctx-hallu') || e.target.closest('.ctx-maps')) return; full.hidden = !full.hidden; wrap.classList.toggle('ctx-open', !full.hidden); rbRender() })
    act.addEventListener('click', () => act.dataset.mode === 'compact' ? compactNow(bar, id, act, update, getHist, setHist) : trimNow(id, update, wrap, getHist, setHist))
    // 🩹 MANUAL re-check — user smells something fishy → a second bot re-checks the last answer (✓ = confirmed · else it corrects)
    if (hallu) hallu.addEventListener('click', async e => {
      e.stopPropagation(); if (hallu.classList.contains('busy')) return
      hallu.classList.remove('ok'); hallu.classList.add('busy')
      let res; try { res = window.engineSelfCheck ? await window.engineSelfCheck(id, getHist()) : { error: 'engine not ready' } } catch (err) { res = { error: String((err && err.message) || err) } }
      hallu.classList.remove('busy')
      if (res.error) { if (window.botSay) window.botSay(bar, '🩹 ' + res.error); return }
      if (res.agree) { hallu.classList.add('ok'); hallu._checkedAt = getHist().length; if (window.botSay) window.botSay(bar, '🩹 checked ✓ — a second read stands by it.') }
      else if (window.botSay) window.botSay(bar, '🩹 on a second read:\n' + (res.review || '').trim() + (res.correction ? '\n\n↳ corrected:\n' + res.correction.trim() : '')) })
    if (window.onPulse) window.onPulse('ctx', () => { if (document.body.contains(wrap)) update() })   // mode/turn/% change → refresh
    update()
    return update
  }

  // trim — an INLINE form (not prompt(), which returns null in the Tauri webview → the old silent no-op). pick
  // how many pairs + from where, [✂️ trim] does a real edit to the saved history, and the meter + a flash confirm.
  function trimNow(id, update, wrap, getHist, setHist) {
    getHist = getHist || (() => lsGet(id)); setHist = setHist || (h => lsSet(id, h))
    const existing = wrap.querySelector('.ctx-trim-form'); if (existing) { existing.remove(); return }   // toggle
    let h = getHist()
    const pairs = Math.floor(h.length / 2)
    const act = wrap.querySelector('.ctx-act')
    if (pairs < 2) { if (act) { const o = act.textContent; act.textContent = 'nothing to trim yet'; setTimeout(() => update(), 1500) } return }
    const form = document.createElement('div'); form.className = 'ctx-trim-form'
    form.style.cssText = 'display:flex;gap:6px;align-items:center;flex-wrap:wrap;font-size:11px;margin-top:6px'
    form.innerHTML = `drop <input class="ctx-trim-n" type="number" min="1" max="${pairs - 1}" value="${Math.min(5, pairs - 1)}" style="width:42px;font-size:11px">
      pairs from <select class="ctx-trim-where" style="font-size:11px"><option value="m">the middle</option><option value="b">the beginning</option></select>
      <button class="ctx-trim-go" type="button" style="font-size:11px;cursor:pointer">✂️ trim</button>
      <button class="ctx-trim-x" type="button" style="font-size:11px;cursor:pointer;background:none;border:0;color:inherit">✕</button>`
    ;(wrap.querySelector('.ctx-full') || wrap).appendChild(form)   // the trim form lives in the expanded section
    form.querySelector('.ctx-trim-x').onclick = () => form.remove()
    form.querySelector('.ctx-trim-go').onclick = () => {
      const n = Math.max(1, Math.min(pairs - 1, parseInt(form.querySelector('.ctx-trim-n').value, 10) || 0))
      const where = form.querySelector('.ctx-trim-where').value
      const drop = 2 * n
      let out
      if (where === 'b') out = h.slice(drop)
      else { const mid = Math.floor((h.length - drop) / 2); out = h.slice(0, mid).concat(h.slice(mid + drop)) }
      rbPush(id, h, '✂️ before trim')   // the full convo survives as a rollback — undo is a ◀ away
      setHist(norm(out))
      form.remove()
      if (window.pulse) window.pulse('ctx')
      update()   // the meter (% + pairs) drops now — the visible proof
      if (act) { act.textContent = `✂️ dropped ${n} pair${n > 1 ? 's' : ''}`; setTimeout(() => update(), 1600) }
    }
  }

  // CORRECTION 2026-08-29 (Sum: "no session memory notes — those will stack and bloat head. this all
  // needs to live in conversation history"). saveSessionMemory (the 💉-tray note writer that lived
  // here) is CUT — the fold now lands as the FIRST TURN of the compacted history itself, so nothing
  // new ever writes to the permanent head. The old writer + its call site: _recycle/compact-session-
  // memory-note.md. Still true from the old note: the bot folds with its FULL injection as context,
  // and the CHECK line (the only-we-would-know verify) survives unchanged.

  async function compactNow(bar, id, act, update, getHist, setHist) {
    getHist = getHist || (() => lsGet(id)); setHist = setHist || (h => lsSet(id, h))
    let h = getHist()
    if (h.length < 6) { ozAlert('not enough to compact yet — keep chatting.'); return }
    // the tail is a PERCENTAGE, not a fixed 4 (Sum 2026-08-29: "not last 4 turns, a percentage,
    // much more generous") — the newest ~30% rides through verbatim for smooth transitions.
    const keep = Math.max(4, 2 * Math.round(h.length * 0.3 / 2))
    const head = h.slice(0, h.length - keep), tail = h.slice(-keep)
    if (!head.length) { ozAlert('not enough to compact yet — keep chatting.'); return }
    const transcript = head.map(m => (m.role === 'user' ? 'User' : 'Assistant') + ': ' + m.content).join('\n')
    const orig = act.textContent; act.textContent = '… folding'; act.disabled = true
    let out = ''
    try {
      // NOT slim — the agent's FULL injection is the system context, so it knows what already survives + writes
      // with its OWN model. it returns the fold THEN a CHECK line: an "only-we-would-know" question/joke
      // from THIS convo so the user can verify the memory landed. (the seed of authenticated persistence —
      // the shared-secret is encryption baked into the demo, same lineage as the neurotwin.)
      // An earlier fold sits INSIDE the transcript (it was the history's first turn) — the prompt says
      // merge and re-edit it, so the story-so-far EVOLVES with later learning instead of stacking.
      const res = window.engineRaw ? await window.engineRaw({ agentId: id, nopace: true,
        extra: 'The system context above is your STANDING chart — persona, notes, files — and it SURVIVES this compaction. The conversation below is about to be REPLACED by what you write, so keep everything that matters and nothing that is already in your chart. Write a tight STORY SO FAR with:\n1) facts, decisions, names, numbers, preferences, open threads;\n2) a USER INTERACTION GUIDE — how this user likes to work, how they talk, and what they expect from you (tone, pace, format, pet peeves), updated from everything below;\nIf the conversation below already begins with an earlier "story so far", MERGE it in — edit and update it with what you have learned since, do not append a second copy.\nThen on a FINAL line beginning exactly with "CHECK:" write ONE short, playful question or inside-joke drawn from THIS conversation — something only the two of you would know — that lets the user confirm the memory landed right. One sentence. No preamble anywhere.',
        messages: [{ role: 'user', content: transcript }] }) : null
      out = (res && res.text || '').trim()
    } catch (_) {}
    act.disabled = false; act.textContent = orig
    if (!out) { ozAlert('compact failed — try again.'); return }
    // split the fold from the CHECK challenge
    const ci = out.search(/\n?\s*CHECK:/i)
    const summary = (ci >= 0 ? out.slice(0, ci) : out).trim()
    const check = ci >= 0 ? out.slice(ci).replace(/^[\s\S]*?CHECK:\s*/i, '').trim() : ''
    rbPush(id, h, '🪗 before compact')   // the full convo survives as a rollback — undo is a ◀ away
    // the fold IS the history's opening turn now — a user-role frame, so the folded history still
    // opens on a user turn (norm strips leading assistant turns; this survives it).
    const fold = { role: 'user', content: '📜 THE STORY SO FAR (folded from ' + head.length + ' earlier turns — the full text is a ⏪ rollback away):\n\n' + summary }
    const verify = '📜 I folded our earlier conversation into the story-so-far at the top of my history — the full text is one ⏪ away in the rollbacks. The recent turns stay as-is.' +
      (check ? '\n\nGut-check that I kept the right thread — ' + check : '\n\nGive it a look and tell me if I dropped anything that mattered.')
    if (window.botSay && bar) window.botSay(bar, verify)   // 0z bots say it in-chat; a Monaco helper (no bot bar) just keeps the folded tail
    setHist(norm([fold].concat(tail, { role: 'assistant', content: verify })))   // fold + generous tail + the verify (norm keeps it Anthropic-valid)
    if (window.pulse) window.pulse('ctx')   // refresh the meter (no injection write anymore — nothing to re-library)
    update()
  }
})()
