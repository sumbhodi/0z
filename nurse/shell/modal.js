// modal.js — 🪟 the in-app dialog bean.
//   FOR HUMANS: WKWebView (Tauri AND the wry bolt) SILENTLY swallows the
//     native prompt()/confirm()/alert() — they return null / do nothing, so
//     every button that reached for one quietly failed. this is the one fix:
//     window.ozPrompt / ozConfirm / ozAlert — same shape, but a real in-app
//     modal. load early, before any card or agent asks a question.
//       ozPrompt(msg, default) → the typed string, or null on Cancel.
//       ozConfirm(msg)         → true / false.
//       ozAlert(msg)           → resolves when dismissed.
//   FOR AI:
//     1. all three return a PROMISE. a caller that reads prompt/confirm must
//        `await` it (and become `async`); alert can be fire-and-forget.
//     2. Enter = OK · Escape = Cancel · click the veil = Cancel. one overlay,
//        built lazily, removed on close. do not add a second modal system.
//   RESOURCES: this is the fix for the dossier's L1-L7 "spine wound".

;(function () {
  function css() {
    if (document.getElementById('oz-modal-css')) return
    const s = document.createElement('style'); s.id = 'oz-modal-css'
    s.textContent = `
      .ozm-veil{position:fixed;inset:0;z-index:100000;display:flex;align-items:center;
        justify-content:center;background:rgba(6,4,12,.6);backdrop-filter:blur(2px)}
      .ozm-box{width:min(440px,90vw);background:var(--panel,#16131f);color:var(--text,#ece9f4);
        border:1px solid var(--edge,#2a2438);border-radius:14px;padding:18px;font:inherit;
        box-shadow:0 18px 60px rgba(0,0,0,.5)}
      .ozm-msg{white-space:pre-wrap;line-height:1.45;margin-bottom:12px}
      .ozm-in{width:100%;box-sizing:border-box;background:var(--bg,#0d0b14);color:var(--text,#ece9f4);
        border:1px solid var(--edge,#2a2438);border-radius:10px;padding:10px 12px;font:inherit;margin-bottom:14px}
      .ozm-in:focus{outline:none;border-color:var(--lav,#c9b3ff)}
      .ozm-row{display:flex;gap:8px;justify-content:flex-end}
      .ozm-btn{border:1px solid var(--edge,#2a2438);border-radius:10px;padding:8px 16px;cursor:pointer;
        font:inherit;background:var(--bg,#0d0b14);color:var(--text,#ece9f4)}
      .ozm-btn.ok{background:var(--lav,#c9b3ff);color:#191225;border-color:transparent;font-weight:700}
      .ozm-btn:active{transform:translateY(1px)}
    `
    document.head.appendChild(s)
  }

  // one modal. kind: 'prompt' | 'confirm' | 'alert'. resolves on a button or a key.
  function open(kind, message, def) {
    css()
    return new Promise(resolve => {
      const veil = document.createElement('div'); veil.className = 'ozm-veil'
      const val = String(def == null ? '' : def).replace(/"/g, '&quot;')
      const field = kind === 'prompt' ? `<input class="ozm-in" type="text" value="${val}">` : ''
      const btns = kind === 'alert'
        ? `<button class="ozm-btn ok" data-ok>OK</button>`
        : `<button class="ozm-btn" data-cancel>Cancel</button><button class="ozm-btn ok" data-ok>OK</button>`
      veil.innerHTML = `<div class="ozm-box" role="${kind === 'alert' ? 'alertdialog' : 'dialog'}" aria-modal="true" aria-describedby=""><div class="ozm-msg"></div>${field}<div class="ozm-row">${btns}</div></div>`   // ♿ AT announces the dialog + its message (a11y pass 2)
      veil.querySelector('.ozm-msg').textContent = String(message == null ? '' : message)
      { const box = veil.querySelector('.ozm-box'), msg = veil.querySelector('.ozm-msg'); msg.id = msg.id || ('ozm-msg-' + Date.now().toString(36)); box.setAttribute('aria-describedby', msg.id); box.setAttribute('aria-label', kind) }   // ♿ name + describe the dialog
      document.body.appendChild(veil)

      const input = veil.querySelector('.ozm-in')
      const close = out => { veil.remove(); document.removeEventListener('keydown', onKey, true); resolve(out) }
      const ok = () => close(kind === 'prompt' ? (input ? input.value : '') : kind === 'confirm' ? true : undefined)
      const cancel = () => close(kind === 'prompt' ? null : kind === 'confirm' ? false : undefined)
      function onKey(e) {
        if (e.key === 'Enter') { e.preventDefault(); ok() }
        else if (e.key === 'Escape') { e.preventDefault(); cancel() }
      }
      document.addEventListener('keydown', onKey, true)
      veil.addEventListener('mousedown', e => { if (e.target === veil) cancel() })
      const okBtn = veil.querySelector('[data-ok]'); okBtn && okBtn.addEventListener('click', ok)
      const cancelBtn = veil.querySelector('[data-cancel]'); cancelBtn && cancelBtn.addEventListener('click', cancel)
      if (input) { input.focus(); input.select() } else if (okBtn) okBtn.focus()
    })
  }

  window.ozPrompt = (message, def) => open('prompt', message, def)
  window.ozConfirm = message => open('confirm', message)
  window.ozAlert = message => open('alert', message)
})()
