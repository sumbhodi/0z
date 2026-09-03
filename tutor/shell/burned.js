// burned.js — window.WS_BURNED · THE KILL SWITCH. the woodshop's "burn" writes here; the runtime READS here.
// before this, burning a block in the bench was theatre: the tree redrew, but the conductor still read the
// grant off the bean, so the tool kept firing. this closes the loop — burn marks the tool burned (per agent),
// and the conductor (toolLines), the climate log, and web-search all check before they fire. a burned tool
// actually goes dark. PER AGENT: burn web_search on toto, it's gone for toto, still live for the nurse.
//
// shared localStorage at file:// — the woodshop IFRAME writes this key, the SHELL reads it (same origin, same
// key, no cross-window calls). the key lives under toto2-ws-* so the woodshop's "↺ factory reset" already
// un-burns everything (that's the "reset if you break it" net — no extra wiring).
(function () {
  if (window.WS_BURNED) return
  const KEY = 'toto2-ws-burned'   // { [agentId]: [toolId, ...] } — toto2-ws-* → swept by factory reset
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY) || '{}') } catch (_) { return {} } }
  const save = m => { try { localStorage.setItem(KEY, JSON.stringify(m)) } catch (_) {} }
  window.WS_BURNED = {
    is(agentId, id)     { const m = load(); return !!(agentId && id && m[agentId] && m[agentId].includes(id)) },
    burn(agentId, id)   { if (!agentId || !id) return; const m = load(); const s = new Set(m[agentId] || []); s.add(id); m[agentId] = [...s]; save(m) },
    unburn(agentId, id) { if (!agentId || !id) return; const m = load(); if (!m[agentId]) return; m[agentId] = m[agentId].filter(x => x !== id); if (!m[agentId].length) delete m[agentId]; save(m) },
    list(agentId)       { return (load()[agentId]) || [] },
    reset()             { save({}) },   // factory: un-burn every tool on every agent (the ↺ button also clears the key)
  }
})()
