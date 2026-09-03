// search.js — the web-search crayon box. ONE seam: searchWeb(engine, query) → clean text the model can read.
// the model picks the crayon that fits the task (the 2x4 lists when to use each). engines verified browser-direct
// via live Origin:null probes: tavily (CORS *), jina (null-echo), duckduckgo (*), wikipedia (*). this is the
// Layer-2 engine room — the conductor's search fence (next) calls it; native Anthropic/OpenRouter search is separate.
// CORRECTION (Sum 2026-08-28: "it hallucinates too easily, cut that code out completely"): JINA IS CUT —
// engine, key row, every menu that offered it. The probes note above is history; three engines remain.
//
// keys live in ⚙️ settings (BYOK, localStorage) — tavily + jina need a free key; duckduckgo + wikipedia are keyless,
// so search NEVER hard-fails even with nothing configured. on Tauri the SAME call routes through Rust (no CORS) → any engine.

;(function () {
  const key = k => { try { return localStorage.getItem(k) || '' } catch (_) { return '' } }
  const enc = encodeURIComponent
  const strip = s => String(s || '').replace(/<[^>]+>/g, '').trim()

  // TAVILY — best general web for a non-native model. LLM-native; optional one-shot synthesized answer.
  async function tavily(q) {
    const k = key('toto_tavily_key'); if (!k) throw new Error('no Tavily key — add one in ⚙️ settings (free at tavily.com).')
    const r = await fetch('https://api.tavily.com/search', {
      method: 'POST', headers: { 'Authorization': 'Bearer ' + k, 'content-type': 'application/json' },
      body: JSON.stringify({ query: q, max_results: 5, include_answer: true }),
    })
    if (!r.ok) throw new Error('Tavily ' + r.status + ' — ' + (await r.text()).slice(0, 120))
    const j = await r.json()
    const lines = (j.results || []).map(x => `• ${x.title} — ${x.url}\n  ${strip(x.content).slice(0, 300)}`)
    return (j.answer ? `answer: ${j.answer}\n\n` : '') + (lines.length ? 'sources:\n' + lines.join('\n') : 'no results.')
  }

  // JINA — CUT (Sum 2026-08-28: "it hallucinates too easily, cut that code out completely, no need to
  // save anywhere"). The engine, its key row (settings.js), and every menu that offered it are gone.
  // It was the "cleanest markdown" desk 16–28 Aug; clean-read.js had already dropped r.jina.ai from the
  // read ladder on 23 Aug for the same reason.

  // DUCKDUCKGO — privacy-first, no profiling, no result-filtering. instant answers only (not a deep SERP) — well-known topics shine.
  async function duckduckgo(q) {
    const r = await fetch('https://api.duckduckgo.com/?q=' + enc(q) + '&format=json&no_html=1&skip_disambig=1')
    if (!r.ok) throw new Error('DuckDuckGo ' + r.status)
    const j = await r.json(); const out = []
    if (j.AbstractText) out.push(j.AbstractText + (j.AbstractURL ? ' (' + j.AbstractURL + ')' : ''))
    ;(j.RelatedTopics || []).slice(0, 6).forEach(t => { if (t.Text) out.push('• ' + t.Text + (t.FirstURL ? ' — ' + t.FirstURL : '')) })
    return out.length ? out.join('\n') : 'DuckDuckGo had no instant answer (it only covers well-known topics — try wikipedia or tavily for a full search).'
  }

  // WIKIPEDIA — the gold encyclopedic source. facts, history, definitions. keyless, neutral, citeable.
  async function wikipedia(q) {
    const r = await fetch('https://en.wikipedia.org/w/rest.php/v1/search/page?q=' + enc(q) + '&limit=5')
    if (!r.ok) throw new Error('Wikipedia ' + r.status)
    const j = await r.json(); const pages = j.pages || []
    if (!pages.length) return 'Wikipedia: no matching articles.'
    return pages.map(p => `• ${p.title} — https://en.wikipedia.org/wiki/${enc(p.key || p.title)}\n  ${strip(p.excerpt)}`).join('\n')
  }

  const ENGINES = { tavily, duckduckgo, wikipedia }   // jina cut 2026-08-28

  // the one seam. on Tauri the same call goes through Rust (no browser CORS) → any engine works there too.
  window.searchWeb = async function (engine, query, agentId) {
    if (!query) throw new Error('searchWeb: pass a query.')
    // A PASTED LINK IS A READ, NOT A SEARCH (Sum 2026-08-23: "if user pastes url into chat, can bot fire the ladder?").
    // Every bot holds the search fence, so every bot now holds the ladder: the bouncer's verdict or the door note rides
    // back as the "result", and the eyes (the shot pipe) go along when this bot's model can see.
    const bare = String(query).trim()
    if (/^https?:\/\/\S+$/i.test(bare) && window.OZ_CLEAN_READ) {
      try { return await window.OZ_CLEAN_READ(bare, { eyes: agentId || '' }) }
      catch (e) { return '(the door answered: ' + ((e && e.say) || (e && e.message) || 'no read') + ')' }
    }
    if (window.__TAURI__ && window.__TAURI__.invoke) { try { return await window.__TAURI__.invoke('web_search', { engine, query }) } catch (_) {} }
    const fn = ENGINES[String(engine || 'wikipedia').toLowerCase()]
    if (!fn) throw new Error('searchWeb: unknown engine "' + engine + '" — use tavily · duckduckgo · wikipedia.')
    return fn(query)
  }
  window.SEARCH_ENGINES = Object.keys(ENGINES)
  // the HONEST menu (Sum 2026-08-16: "don't offer tools that don't work") — only the engines
  // that will answer RIGHT NOW: keyless ones always, keyed ones only when the key is in.
  window.searchEnginesLive = () => Object.keys(ENGINES).filter(e => e === 'duckduckgo' || e === 'wikipedia' || (e === 'tavily' && key('toto_tavily_key')))   // (jina row cut 2026-08-28)

  // EVERY BOT SEARCHES (Sum 2026-08-16: "all bots get websearch always, it is talk and read — as safe as web
  // search gets"). Two roads, both talk-tier: (1) NATIVE — wantsSearch (engine.js) fires provider search when the
  // kit lists web_search; grant it to the whole roster at boot (agents.gen.js loads first, index.html L142/L154).
  // (2) THE FENCE — ```search in the conductor rides this file's searchWeb for every other provider.
  // ⚠ EXCEPT the ones with NO WEB (Sum 2026-08-16: "take websearch away from sphinx — it is not up to date, been
  //    meditating for millennia, just knows what is written in the binary complex… make it INVISIBLE, not 'don't
  //    look here'"). This boot grant was silently re-adding web_search to sysisphinx every launch and undoing the
  //    removal in its kit — native Anthropic search then fired every turn and ate the file hands. The web does not
  //    exist for these bots: no tool, no clue, no fence line.
  //
  // ⭐⭐ THE NEWSIE EXCEPTION IS GONE, AND SO IS THE MECHANISM (Sum 2026-08-26). It read
  //     NO_WEB = ['newsie'] since 22 Aug, on the reasoning "don't make it websearch and read — it sells
  //     the clean read, not the search engine." Sum, today, overturning it:
  //       "remove this exception. newsie needs to search the web. It just can't publish its newspaper
  //        TO the web — would pass it through yanker into tois to do so. But its full pancake should
  //        include web IN, not out. I don't think we need an exception; nurse, wellness and other bots
  //        have this same permission."
  //     ⭐ THE DISTINCTION THAT DISSOLVES IT: web IN and web OUT are two different permissions, and
  //     this list was withholding the first to control the second. Reading the web is pancake — the
  //     floor every bot stands on. PUBLISHING out is the scarce one, and it is governed where it
  //     belongs, on the perm ladder (only toto and coder reach past the dial). Withholding a read to
  //     approximate a write-fence is a fence in the wrong place, and it cost the newsie the open web.
  //     So there is no NO_WEB list any more. Not "empty" — GONE. An empty exception list is an invitation
  //     to put a name back in it, and the next name would be wrong for the same reason this one was.
  // ⚠ CORRECTION 2 Sep 2026 — THE PUSH BELOW IS RETIRED, AND THE 26 AUG LAW ABOVE STILL HOLDS. "Reading the
  //    web is pancake — the floor every bot stands on" — yes. But this line granted every bot the PAID,
  //    server-side `web_search` bean (Anthropic's tool, max_uses 5, the MODEL decides when), and on the
  //    1 Sep smoke test vogel googled "open the vault", nurse googled "start a prep", every reply grew a
  //    "— sources:" tail. Sum: "sounds like you gave every bot anthropic's web search — that is a problem;
  //    need duck and wiki if not anthropic's bot; plus anthropic's costs tokens, the others are free."
  //    So web IN stays universal and FREE: every bot's que menu now ends with the web line (conductor.js
  //    toolLines → WEB_LINE: wiki · duck · tavily-if-keyed), last on the list, a step not a reflex. The paid
  //    native bean is a GRANT again — only the records that list `web_search` carry it (tutor · coder ·
  //    bleep · alpha today). No NO_WEB list came back; nothing is withheld, only priced right.
  // try { Object.entries(window.AGENT_DATA || {}).forEach(([id, a]) => {
  //   if (!a || !Array.isArray(a.tools)) return
  //   if (!a.tools.includes('web_search')) a.tools.push('web_search')
  // }) } catch (_) {}
})()
