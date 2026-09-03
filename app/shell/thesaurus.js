// thesaurus.js — OZ_THESAURUS, the SOFT TRIGGER (Sum 2 Sep 2026: "start a list of gofai triggers — look up,
// search, web search, internet, website — that can ask the bot (or the HIL, make it clickable) if they would
// like the websearch tool. then a list for most tools like this… bots can update through use and the HIL can
// edit somewhere. on hil input, on bot output, and on clone run goalies — add a thesaurus, and a soft trigger.")
//
// WHAT IT IS — a hand-listed map: plain phrases → the tool they usually mean. GOFAI: substring match, no model.
// It never fires a tool. It APPENDS A TELL, the house idiom the sniff goalie already uses at the convo door
// ("the desk's goalie sniffed this message: …"), so the bot is ASKED, and the human can read why.
//   ① HIL input  — conductor.js, right after sniff: "(the thesaurus heard 'look it up' → web look_up is on your
//                  menu; use it or say why not)". Only for tools THIS bot can reach.
//   ② bot output — conductor.js, the "nothing fired — trying once" push: a reply that speaks a trigger word for
//                  a tool it holds and fires nothing gets the same one nudge an announced act gets.
//   ③ clone run  — quePhase's tap-in: a que line whose tool token is a PHRASE ("google", "lookup") resolves
//                  through here before the near-miss matcher gives up.
//
// WHERE THE LIST LIVES — two layers, merged: the DEFAULTS below (shipped), then `thesaurus.json` in the
// sandbox root (the human's, editable in monaco like any file; a bean can append to it later). The sandbox
// file WINS on a key it names and ADDS keys it invents. `{ "look_up": ["…"], "yt_transcript": ["…"] }`.
// ⚠ The precedent for trusting this shape is totois/jack-rabbit.md: "hand-listed phrases only — the trigger set
//    is a written list, never a guess." Same law here. Do not let a model grow this list unwatched.
//
// SOFT, on purpose. A tell costs a line of prompt; a wrong tell costs one sentence from the bot ("no, they
// meant the vault card"). A hard trigger that fired the wrong tool would cost a turn and a lie.
;(function () {
  const DEFAULTS = {
    // the web line (conductor.js WEB_LINE) — every bot's que menu ends with it
    look_up:            ['look up', 'look it up', 'look that up', 'web search', 'search the web', 'google', 'internet', 'website', 'online', 'latest news on', 'current price', 'who won', 'what year did', 'is it true that'],
    // learn
    yt_transcript:      ['youtube', 'youtu.be', 'transcript', 'lecture video', 'watch this'],
    learn_write_snippet:['sheet', 'cheat sheet', 'study sheet', 'key sheet', 'next quiz is', 'quiz tomorrow', 'make me the sheet'],
    class_file_write:   ['syllabus', 'file this under', 'assignment page', 'rubric'],
    // nurse · clipboard
    prep_header:        ['prep sheet', 'seeing my therapist', 'appointment tomorrow', 'doctor tomorrow', 'start a prep'],
    prep_add_topic:     ['add to the prep', 'bring up at the appointment', 'ask the doctor about'],
    // wellness
    food_save:          ['i ate', 'i just had', 'log it', 'log my', 'calories', 'for breakfast', 'for lunch', 'for dinner'],
    sleep_read:         ['my sleep', 'slept', 'sleep has been', 'how did i sleep'],
    exercise_save:      ['i ran', 'i lifted', 'workout', 'i walked', 'i biked'],
    // the clock
    tt_jump:            ['take me to', 'time travel', 'jump to', 'go back to the year', 'flip the clock'],
    alarm_draft:        ['set an alarm', 'wake me', 'alarm for'],
    timer_draft:        ['set a timer', 'timer for'],
    // the desk
    write_file:         ['make me a page', 'build a page', 'write a file', 'make a file', 'create a page'],
    preview:            ['show me the page', 'preview it', 'open it in the preview', 'let me see it'],
    ui_open:            ['open the', 'pull up the', 'show me the card', 'bring up the'],
    // the vault — the SAFE (encrypted boxes), Vogel at the counter. save_out = a box LEAVES this device, so the phrases are about carrying
    vault_list:         ['what is in the safe', 'what is in the vault', 'what would the vault pack', 'what is backed up'],
    vault_peek:         ['peek in the safe', 'what is in that box', 'what is in the box'],
    vault_save_out:     ['back up my settings', 'take my settings with me', 'export my settings', 'move my settings', 'put this in the safe', 'lock this away'],
    // the paper
    psv_read:           ['read this article', 'read this for me', 'what does this say', 'summarize this link'],
    feed_read:          ['what is in the paper', 'headlines', 'what is flowing', 'the wires'],
  }
  // 2 Sep 16:30 — punctuation is a word boundary too. "peep that: who won" never matched 'peep that' because the colon sat
  //    against it and the match wants a space on both sides; the learned phrase lost to the shorter default. Pad the marks.
  const norm = s => ' ' + String(s == null ? '' : s).toLowerCase().replace(/[’']/g, "'").replace(/[.,:;!?()\[\]"“”—–]+/g, ' ').replace(/\s+/g, ' ') + ' '
  let cache = null, cacheAt = 0
  function table() {
    // merge once per second — the sandbox file may change under us (monaco edit, a bean append)
    if (cache && Date.now() - cacheAt < 1000) return cache
    const out = {}
    Object.keys(DEFAULTS).forEach(k => { out[k] = DEFAULTS[k].slice() })
    try {
      const f = window.SANDBOX && window.SANDBOX['thesaurus.json']
      if (f && typeof f.data === 'string' && f.data.trim()) {
        const j = JSON.parse(f.data)
        Object.keys(j || {}).forEach(k => { if (Array.isArray(j[k])) out[k] = j[k].map(String) })
      }
    } catch (_) {}
    cache = out; cacheAt = Date.now(); return out
  }
  // which tools does this phrase point at? longest phrase wins per tool; returns [{ tool, phrase }] in text order
  function hits(text, opts) {
    const t = norm(text), tb = table(), out = []
    Object.keys(tb).forEach(tool => {
      let best = null, at = -1
      tb[tool].forEach(p => { const i = t.indexOf(norm(p).trim().length ? ' ' + norm(p).trim() + ' ' : '§'); if (i > -1 && (!best || p.length > best.length)) { best = p; at = i } })
      if (best) out.push({ tool, phrase: best, at })
    })
    out.sort((a, b) => a.at - b.at)
    return out
  }
  // only the tools THIS bot can actually reach: granted, or the web line (every bot has it when the desks are up)
  function reachable(agentId, tool) {
    if (tool === 'look_up') return !!window.searchWeb
    const a = (window.AGENT_DATA && window.AGENT_DATA[agentId]) || {}
    const granted = a.tools || []
    if (granted.includes(tool)) return true
    // a card the bot owns grants that card's tools (THE CARD IS THE GRANT — conductor.js)
    const u = window.TOOL_USE && window.TOOL_USE[tool], tk = window.TOOLKITS && window.TOOLKITS.tools && window.TOOLKITS.tools[tool]
    const card = (tk && tk.card) || (u && u.card)
    const own = [...(a.nav || []), ...(Array.isArray(a.also) ? a.also : [])]
    return !!(card && (a.also === 'all' || own.includes(card)))
  }
  // ① the tell for a human message — one parenthetical, at most two tools, never for an empty message
  function tell(agentId, text) {
    const h = hits(text).filter(x => reachable(agentId, x.tool)).slice(0, 2)
    if (!h.length) return ''
    const line = h.map(x => `'${x.phrase}' → ${x.tool === 'look_up' ? 'web look_up' : x.tool}`).join(' · ')
    // 2 Sep 2026 17:50 — "use it, or say in one line why not" read, on gemini-flash, as an invitation to ask the human back:
    //    the planner answered 'Want the transcript saved?' three runs straight with the tool on its menu. The request is the
    //    permission. Still soft — the bot may decline with a reason — but it is told not to ask whether.
    return `(the thesaurus heard ${line} — on your menu. the human asking IS the go-ahead: if that is the act, plan it this turn; do not ask whether to. say why not only if you will not)`
  }
  // ② for the bot's own reply: did it SPEAK a trigger for a tool it holds? (the caller decides whether anything fired)
  function spoke(agentId, text) { return hits(text).filter(x => reachable(agentId, x.tool)) }
  // ③ for the que tap-in: a single token or short phrase → a tool id, or ''
  function tool(phrase, agentId) {
    const h = hits(' ' + phrase + ' ').filter(x => !agentId || reachable(agentId, x.tool))
    return h.length === 1 ? h[0].tool : ''
  }
  window.OZ_THESAURUS = { hits, tell, spoke, tool, table, DEFAULTS }
  // ── thesaurus_add — the append bean (Sum: "bots can update through use"). Writes sandbox/thesaurus.json, the
  //    human's layer, so the growth is a file he can read and prune. Manicured: klass · readback · a refusal for a
  //    tool that is not registered. Never rewrites the whole list — one phrase, one tool, appended.
  try {
    if (window.makeTool) window.makeTool({ id: 'thesaurus_add', card: null, klass: 'write',
      readback: call => { try { const t = table(); const k = String((call && (call['for'] || call.target)) || '')   // CORRECTION 2 Sep 16:20: keyed off call.tool ('thesaurus_add') — the table has no such key, so the readback said
        // 'nothing on file' after a strike that LANDED, and the check retried three times (toto, 'peep that'). The key is the tool the phrase is FOR.
        return k && t[k] ? k + ' now answers to ' + t[k].length + ' phrase(s): ' + t[k].slice(-4).join(' · ') : 'nothing on file for that tool' } catch (_) { return 'could not re-read the thesaurus' } },
      blurb: 'teach the thesaurus one phrase → one tool, after a use the human confirmed. it appends to sandbox/thesaurus.json; the human can prune it.',
      clue: 'add a trigger phrase for a tool.\ntemplate: { "tool": "thesaurus_add", "for": "look_up", "phrase": "what is the latest on" }\n- only after the human used those words and the tool was the right answer. never guess a phrase.',
      strike: call => {
        const k = String((call && (call['for'] || call.target)) || '').trim(), ph = String((call && call.phrase) || '').trim().toLowerCase()
        if (!k || !ph) return 'thesaurus_add: pass "for" (the tool) and "phrase".'
        if (k !== 'look_up' && !(window.TOOL_USE && window.TOOL_USE[k])) return 'thesaurus_add: "' + k + '" is not a registered tool — nothing added.'
        let j = {}; try { const f = window.SANDBOX && window.SANDBOX['thesaurus.json']; if (f && typeof f.data === 'string' && f.data.trim()) j = JSON.parse(f.data) } catch (_) { j = {} }
        const cur = Array.isArray(j[k]) ? j[k] : (DEFAULTS[k] || []).slice()
        if (cur.map(x => String(x).toLowerCase()).includes(ph)) return 'thesaurus_add: "' + ph + '" already points at ' + k + '.'
        cur.push(ph); j[k] = cur
        if (window.SANDBOX) window.SANDBOX['thesaurus.json'] = { kind: 'doc', ext: 'json', mime: '', data: JSON.stringify(j, null, 2) + '\n' }
        cache = null
        return 'thesaurus_add: "' + ph + '" → ' + k + ' (sandbox/thesaurus.json, ' + cur.length + ' phrases for it now).'
      } })
  } catch (_) {}
})()
