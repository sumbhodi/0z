// black-box.js — the FLIGHT RECORDER. bleep's law: believe the disk, not the narration.
// Written 2026-08-14, the night two renders failed and every diagnosis was a guess from a
// screenshot. This captures what actually happened at boot and writes it to disk, where an
// outside agent (or a human) can read it: ~/totoII/sandbox/port/boot-report.json
//
// WHAT IT RECORDS: every uncaught error + unhandled rejection (with file:line), and a census
// of the load-bearing globals — OZ_PROFILE, REG.agents, CARD_BUILDERS, AGENT_DATA, TOOL_USE.
// WHEN: at window load, and again 3s later (after every deferred wire-up has run).
// THE WRITE: the sandbox_write receipt idiom from links.js L126, verbatim — same invoke, same
// guard shape. Loopback-only trust holds: this file writes one JSON to the sandbox, nothing else.
// MUST LOAD FIRST among the shell scripts — an error listener only hears what fires after it.
;(function () {
  const errs = []
  window.addEventListener('error', e => errs.push({
    msg: String(e.message).slice(0, 300),
    src: String(e.filename || '').split('/').slice(-2).join('/'),
    line: e.lineno || 0,
  }))
  window.addEventListener('unhandledrejection', e => errs.push({
    msg: 'unhandledrejection: ' + String((e.reason && e.reason.message) || e.reason).slice(0, 300),
  }))

  function census (label) {
    const P = window.OZ_PROFILE
    return {
      label, at: Date.now(), errors: errs.slice(),
      OZ_PROFILE: P ? { name: P.name, suites: P.suites || null, greenroom: !!P.greenroom, drawer: !!P.drawer } : String(P),
      REG_agents: (window.REG && window.REG.agents) ? window.REG.agents.map(a => a.id) : 'MISSING',
      CARD_BUILDERS: window.CARD_BUILDERS ? Object.keys(window.CARD_BUILDERS).sort() : 'MISSING',
      AGENT_DATA: window.AGENT_DATA ? Object.keys(window.AGENT_DATA).length : 'MISSING',
      AGENT_BARS_has_vogel: !!(window.AGENT_BARS && window.AGENT_BARS.vogel),
      // (16 Aug) THE THIRD ORGAN — every roster bot must have a bar seed, or its tile opens 'coming soon'
      // (vogel 15 Aug, alpha 16 Aug — same disease). names any roster id with no seed. empty = healthy.
      AGENT_BARS_missing: ((window.REG && window.REG.agents) || []).map(a => a.id).filter(id => !(window.AGENT_BARS && window.AGENT_BARS[id])),
      TOOL_USE: window.TOOL_USE ? Object.keys(window.TOOL_USE).length : 'MISSING',
      // the real bean ids — agents/build.js lints against THIS, because many tools are registered in a
      // loop (cal_in_*, email_in_*, sleep_in_*) and no regex over the source can ever see them.
      // both halves of OZ_LANE must survive the load order — the maze used to delete the wall
      OZ_LANE_wall: !!(window.OZ_LANE && window.OZ_LANE.canWrite && window.OZ_LANE.canRead),
      OZ_LANE_maze: !!(window.OZ_LANE && window.OZ_LANE.offTrack && window.OZ_LANE.pick),
      // ⭐ 2026-09-01 — THE NEXT LINK. The boot report is the one file an outside agent (or a human, or
      //    me next week) reliably opens. It listed what EXISTS and never said where to READ. So it now
      //    names the index, and the index names every recorder. One read, nothing to remember.
      WHERE_TO_LOOK: 'port/where-to-look.md',
      RECORDERS: ['port/last-que.txt (the que\'s raw reply + the menu it was handed)', 'port/last-reply.txt (the chat phase\'s raw reply)', 'port/boot-report.json (this file)'],
      // the goalies that are actually ON the lane object at runtime. The WIRING counts (which one is
      // pointed at how many lanes) are a source fact, so they live in where-to-look.md, generated.
      GOALIES: ['sniff', 'kickJson', 'lintJson', 'lintCli', 'lintReads', 'offTrack'].filter(function (g) { return !!(window.OZ_LANE && window.OZ_LANE[g]) }),
      TOOL_IDS: window.TOOL_USE ? Object.keys(window.TOOL_USE).sort() : [],
      // ⭐ THE STANDARD'S DEBT, counted every launch (Sum 2026-08-25). It goes HERE because this file is
      //    already written on every boot and nobody has to remember to run it — which is the whole lesson:
      //    the make-tool standard was a memo for two days and scored 6 of 159. A number in a place he
      //    already looks is the difference between a standard and a suggestion. Should read 0 / 0.
      TOOL_DEBT: (function () {
        var d = window.OZ_TOOL_DEBT || { klass: [], readback: [], broken: [] }
        var n = window.TOOL_USE ? Object.keys(window.TOOL_USE).length : 0
        return { of: n, no_klass: d.klass.length, no_readback: d.readback.length, refused: d.broken,
                 worst: d.klass.filter(function (t) { return /delete|remove|push|deploy|send|save|write|move/.test(t) }) }
      })(),
      // ⭐ THE MMMM ORGANS (Sum 2026-08-29, "go" — after a day of whack-a-mole the debt counter could
      //    not see: an arcade with zero beans, a chart that missed every nav-card bean, personas naming
      //    dead tools). Same law as TOOL_DEBT above: put the number where the app already looks.
      //    All three read the live registries — census, not comprehension. Empty = healthy.
      // 1 — THE EMPTY-CARD ORGAN: a card in a bot's nav with ZERO registered beans. That bot's whole
      //     job has no tool, and no debt counter can count beans that don't exist (the arcade, today).
      // 4 — THE PROOF-OF-READ ORGAN (2026-08-30, Sum: "cant we make this a gofai check — did you
      //     read on 0z, not you?"). The write half has had a wall since makeTool's readback: a bean
      //     must prove its act landed off the surface. This is the READ half. After every chat turn
      //     the goalie (OZ_LANE.lintReads) checks every path the bot named against everything 0z can
      //     vouch for handing it in the last 10 turns — injection, convo, tool results. A path that
      //     never entered its world through 0z came from the weights.
      //     ⚠ THE WINDOW IS THE POINT (his): "10 turns, but then even best bot has drifted." Older
      //     evidence is not evidence — trimHist has already cut it out of what the model can see, so
      //     a path from back there is being REMEMBERED, which is the failure being caught.
      //     COUNTS ONLY, like OZ_TOOL_DEBT did before its refusal went live. Empty = healthy.
      MMMM_unbacked_paths: (function () {
        try {
          var log = JSON.parse(localStorage.getItem('toto_unbacked') || '[]') || []
          if (!log.length) return []
          return log.slice(-6).map(function (e) { return e.bot + ': ' + (e.paths || []).join(' \u00b7 ') })
        } catch (e) { return 'organ failed: ' + e.message }
      })(),
      MMMM_empty_cards: (function () {
        try {
          var tk = (window.TOOLKITS && window.TOOLKITS.tools) || {}, out = []
          var counts = {}
          Object.keys(tk).forEach(function (t) { var c = tk[t] && tk[t].card; if (c) counts[c] = (counts[c] || 0) + 1 })
          Object.keys(window.AGENT_DATA || {}).forEach(function (id) {
            var nav = (window.AGENT_DATA[id].nav) || []
            nav.forEach(function (c) { if (!counts[c]) out.push(id + ':' + c) })
          })
          return out
        } catch (e) { return 'organ failed: ' + e.message }
      })(),
      // 2 — THE DRIFT ORGAN: what the CHART promises (compileChart's YOUR TOOLS) vs what the QUE MENU
      //     offers (OZ_TOOL_MENU, conductor.js) over the bot's own cards. One law, two homes — they
      //     drifted once and haiku web-searched for a game it held the bean for. Names each side's
      //     orphans; empty = the homes agree.
      MMMM_drift: (function () {
        try {
          if (!(window.compileChart && window.OZ_TOOL_MENU && window.AGENT_DATA)) return 'not loaded yet'
          var out = []
          Object.keys(window.AGENT_DATA).forEach(function (id) {
            var nav = window.AGENT_DATA[id].nav || []
            if (!nav.length) return
            var chart = window.compileChart(id) || ''
            var sect = chart.split('─── YOUR TOOLS ───')[1] || ''
            var chartIds = {}
            sect.split('\n').forEach(function (l) { var m = l.match(/^- (?:[a-z0-9-]+ )?([a-z][a-z0-9_]+) — /); if (m && m[1] !== 'attach') chartIds[m[1]] = 1 })
            var menuIds = {}
            window.OZ_TOOL_MENU(id, nav).forEach(function (l) { var m = l.match(/^\S+ (\S+) — /); if (m) menuIds[m[1]] = 1 })
            Object.keys(menuIds).forEach(function (t) { if (!chartIds[t]) out.push(id + ': menu has ' + t + ', chart does not') })
          })
          return out
        } catch (e) { return 'organ failed: ' + e.message }
      })(),
      // 3 — THE STALE-PROSE ORGAN: tool-shaped words (snake_case) in a bot's persona/backstory/baked
      //     that name NO registered tool — the bot is being taught verbs that do not exist ("its tools
      //     are all stale"). localStorage keys (toto_*) and lane words are allowlisted.
      MMMM_stale_prose: (function () {
        try {
          var use = window.TOOL_USE || {}, out = []
          var SKIP = /^(toto_|oz_|snek_|bbm_|web_search$|image_generate$)/
          Object.keys(window.AGENT_DATA || {}).forEach(function (id) {
            var a = window.AGENT_DATA[id]
            ;['persona', 'backstory', 'baked', 'role'].forEach(function (f) {
              var txt = typeof a[f] === 'string' ? a[f] : ''
              var m = txt.match(/\b[a-z]+_[a-z0-9_]+\b/g) || []
              m.forEach(function (t) { if (!use[t] && !SKIP.test(t) && out.indexOf(id + ':' + t) < 0) out.push(id + ':' + t) })
            })
          })
          return out.slice(0, 30)
        } catch (e) { return 'organ failed: ' + e.message }
      })(),
      OZ_PORT_IN: typeof window.OZ_PORT_IN,
      HIL_pending: (() => { try { const j = JSON.parse(localStorage.getItem('toto_hil_pending') || '{}'); return Object.keys(j).map(b => b + ':' + j[b].length + ' — ' + (j[b][0] && j[b][0].label || '')) } catch (_) { return 'unreadable' } })(),   // (16 Aug) the green button's queue — a hand asking for a one-time OK shows HERE
      AIOL_seating: ((window.REG && window.REG.agents) || []).map(a => { let k = false; try { k = !!(window.pickProvider && window.pickProvider(a.id)) } catch (_) {} return a.id + (k ? ':key' : ':NOKEY') + ((window.agentIsOpen && window.agentIsOpen(a.id)) ? '+open' : '') }),
      // 15 Aug pm: .aiol-pic died in the UI rounds — the probe now watches what exists: the
      // head GAGS (fake AOL buttons; a 0x0 here means the satire bar shipped invisible again).
      DOM_aiol_gags: Array.from(document.querySelectorAll('.aiol-gag svg')).map(p => { const r = p.getBoundingClientRect(); return Math.round(r.width) + 'x' + Math.round(r.height) }),
      // 16 Aug: the drag-to-desk VANISH — every bar's box + where it sits, so a 0-tall bar in the stack says so on disk
      // (16 Aug) the BLANK-PANE probe — a mounted Binary Complex whose pane has no columns/tiles is the
      // re-open bug (module-scope HOME vs per-instance chain). 'mounted-empty' on disk = it shipped blank.
      DOM_bars: Array.from(document.querySelectorAll('.agent-bar')).map(b => { const r = b.getBoundingClientRect(); const h = b.querySelector('.ab-head'); const hr = h ? h.getBoundingClientRect() : { width: 0, height: 0 }; return (b.dataset.agent || '?') + '@' + (b.dataset.edge || '?') + (b.classList.contains('collapsed') ? '/coll' : '/open') + ' bar=' + Math.round(r.width) + 'x' + Math.round(r.height) + ' head=' + Math.round(hr.width) + 'x' + Math.round(hr.height) + ' orient=' + (b.dataset.orient || '?') }),
    }
  }
  function write (label) {
    try {
      const c = window.__TAURI__ && (window.__TAURI__.core || window.__TAURI__)
      c && c.invoke && c.invoke('sandbox_write', { name: 'port/boot-report.json', content: JSON.stringify(census(label), null, 1) })
      // ⭐ 2026-09-01 — THE INDEX, next to the things it indexes (Sum: "cheapest version of that is a
      //    port/where-to-look.md written at boot"). The recorders were never the problem; NAMING them was.
      //    port/last-que.txt held the exact answer to "why did the tool not fire" for weeks and nothing
      //    anywhere pointed at it, so it was read for the first time on the day it was needed most.
      //    Generated (agents/where-to-look.js), never hand-edited, so the counts cannot go stale the way
      //    "3 goalies" did. Same doctrine as `next` on a tool: hand the reader the next link, do not ask
      //    them to hold the map.
      if (window.OZ_WHERE) c && c.invoke && c.invoke('sandbox_write', { name: 'port/where-to-look.md', content: window.OZ_WHERE })
    } catch (_) {}
  }
  window.addEventListener('load', () => { write('load'); setTimeout(() => write('load+3s'), 3000) })
  // 16 Aug: an EVENT tap — a seam (toDesk, a drop, a mount) can ask for a census at the moment it fires,
  // so a render bug is on disk at the instant, not three seconds after boot. same write, a named label.
  window.OZ_BLACKBOX_WRITE = label => { try { setTimeout(() => write(String(label || 'event')), 60) } catch (_) {} }   // 60ms: let the paint land first
})()
