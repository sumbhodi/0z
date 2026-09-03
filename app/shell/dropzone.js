// dropzone.js — drag a file (or a link) onto a bot's bar and it rides the ＋ protocol.
// CORRECTION 2026-08-29 (the Electron swap): the old body here is in _recycle/dropzone-tauri-paths.js.
// It was DEAD TWICE — gated on Tauri's event API (never shimmed) AND calling an `import_paths`
// command that never existed in this shell's main.rs — which is why drag-and-drop "never worked":
// it didn't, anywhere in the native fork. What is STILL TRUE from the old note: route by type,
// land in the sandbox, open the home card — but all of that already lives in ONE place now,
// attachFile (shell/attach.js L436, the ＋ protocol: kind() classifies image/code/doc/html/etc,
// caches to the sandbox, routes to the bot). So this file is just the DOOR: catch the drop, find
// the bar, hand over. (Sum 2026-08-29: "drag a file to trigger plus button protocol — is image,
// is url, is txt, is code, is html etc.")
// A dropped LINK rides the ＋ link door's own logic — the youtube sniff tee + the clean read —
// copied from attach.js's 🔗 handler (L345-364), same markers, same walled-site fallback.
// ⚠ the window-wide preventDefault is ALSO the guard rail: in Chromium a stray file drop would
// otherwise NAVIGATE the window to file:// and blow away the desk. WKWebView just ignored it.

;(function () {
  const editable = el => !!(el && el.closest && el.closest('textarea, input, [contenteditable="true"], .monaco-editor, .ProseMirror'))
  const dragHasPayload = e => {
    const t = (e.dataTransfer && e.dataTransfer.types) || []
    return Array.prototype.includes.call(t, 'Files') || Array.prototype.includes.call(t, 'text/uri-list')
  }
  // which bot gets it: the bar under the pointer, else the only open bar, else ask
  function targetBar(e) {
    const under = e.target && e.target.closest && e.target.closest('.agent-bar')
    if (under) return under
    const bars = document.querySelectorAll('.agent-bar')
    return bars.length === 1 ? bars[0] : null
  }

  // a dropped URL — the ＋ link door's body (attach.js L345-364), with the drop's own sink.
  // No ozPrompt for the url (we already have it); the walled-site paste fallback stays.
  async function dropUrl(bar, url) {
    const sink = { file: f => window.attachFile(bar, f), note: t => window.botSay && window.botSay(bar, t) }
    const sn0 = window.OZ_LANE && window.OZ_LANE.sniff ? window.OZ_LANE.sniff(url) : { kind: 'url' }
    if (sn0.kind === 'youtube') {
      sink.file(new File(['FROM: ' + url + '\n\nA YOUTUBE VIDEO (id ' + sn0.id + '), not a page — the clean-read ladder was skipped on purpose.\nTHE PRIMED MOVE: yt_transcript saves its transcript to the library (lessons/transcripts/). ASK THE HUMAN FIRST — "want the transcript saved?" — then fire it on a yes and digest what comes back.'], 'link-youtube-' + sn0.id + '.txt', { type: 'text/plain' }))
      return
    }
    let text = ''
    try { text = await (window.OZ_CLEAN_READ ? window.OZ_CLEAN_READ(url) : Promise.reject(new Error('no clean read'))) } catch (e) {
      const why = (e && e.say) || ((e && e.blocked) ? 'a wall or a bouncer' : ((e && e.message) || 'no read'))
      const pasted = window.ozPrompt ? await window.ozPrompt('the site did not hand over the text (' + why + '). open it yourself, copy the pertinent part, paste it here:', '') : null
      if (!pasted || !pasted.trim()) { if (sink.note) sink.note('the read was walled and nothing was pasted — nothing attached.'); return }
      text = pasted.trim()
    }
    let host = 'page'; try { host = new URL(url).hostname.replace(/^www\./, '') } catch (_) {}
    const name = 'link-' + host.replace(/[^a-z0-9.-]/gi, '') + '.txt'
    sink.file(new File(['FROM: ' + url + '\n\n' + text], name, { type: 'text/plain' }))
  }

  window.addEventListener('dragover', e => { if (dragHasPayload(e)) e.preventDefault() })
  window.addEventListener('drop', e => {
    if (!dragHasPayload(e)) return
    const files = Array.from((e.dataTransfer && e.dataTransfer.files) || [])
    const uri = !files.length && e.dataTransfer ? (e.dataTransfer.getData('text/uri-list') || '').split('\n').map(s => s.trim()).filter(s => s && !s.startsWith('#'))[0] : ''
    // a link dragged onto a text field keeps the browser's own paste-as-text; files never navigate
    if (!files.length && uri && editable(e.target)) return
    e.preventDefault()
    const bar = targetBar(e)
    if (!bar) { if (window.ozAlert) window.ozAlert('drop it on a bot\'s bar — the drop rides that bot\'s ＋.'); return }
    if (files.length) files.forEach(f => window.attachFile && window.attachFile(bar, f))
    else if (/^https?:\/\//i.test(uri)) dropUrl(bar, uri)
  })
})()
