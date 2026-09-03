// sys.js — THE READ STATE (window.OZ_SYS). the machine's live vitals: RAM total/free, sandbox size on disk.
// the warm head (engine.compileChart) folds the TOTALS in (stable, doesn't churn the KV cache); the tail
// (engine.liveLayer) folds the LIVE numbers in with the weather — so every bot knows, each turn, whether it's
// local or cloud, what room it has, and that headroom settles after the warm-up pass. native only: the web
// demo is air-gapped (no system read) and falls back to the old substrate text, unchanged.
//
// the stats are CACHED and read synchronously (compileChart/liveLayer can't await) — same trick OZ_CLOCK uses
// for weather. refreshed on boot, on an interval, and right before each turn (so the read is live on send).

;(function () {
  function inv(cmd) {
    const c = window.__TAURI__ && (window.__TAURI__.core || window.__TAURI__)
    return (c && c.invoke) ? c.invoke(cmd) : Promise.reject(new Error('not in tauri'))
  }
  const NATIVE = !!(window.__TAURI__ && (window.__TAURI__.core || window.__TAURI__.invoke))
  let cache = null

  async function refresh() {
    if (!NATIVE) return null
    try { cache = await inv('sys_stats'); return cache } catch (_) { return null }
  }

  // a LOCAL model sleeps until it's hit — wake it so its RAM footprint is real before the user's first message
  // (the read state lies if the model isn't loaded yet). harmless no-op if no local server is running.
  function pingLocal() {
    try { fetch('http://127.0.0.1:8080/v1/models', { method: 'GET' }).then(() => refresh()).catch(() => {}) } catch (_) {}
  }
  // ping ONLY when the agent actually runs local (its model resolves to yocal) — pointless for a cloud bot.
  function wakeFor(agentId) {
    if (!NATIVE) return
    const model = (function () { try { return localStorage.getItem('toto_bot_' + agentId + '_model') || '' } catch (_) { return '' } })()
    if (/^(gemma|qwen|phi|mlx|local|yocal)/i.test(model)) pingLocal()
  }

  window.OZ_SYS = {
    native: NATIVE,
    refresh,
    stats: () => cache,
    pingLocal,
    wakeFor,
    gb: b => (b || 0) / 1073741824,
  }

  if (NATIVE) { refresh(); setInterval(refresh, 20000) }   // keep the cache warm; sysctl/vm_stat is cheap
})()
