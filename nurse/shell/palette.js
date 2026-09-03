// palette.js — OZ_PALETTE, the TYPO-FREE tool (the ⌘K the wishlist begged for). ONE fuzzy surface: commands,
// files, actions — all in one list. FORGIVING subsequence match (a dyslexic typo still lands the target —
// "fle" → "file", "fx" → "fix"), and you never HAVE to type: arrow ↑↓ + Enter, or just click. Shared bean:
// Monaco opens it with [actions · open-a-file · language], the CLI with [commands · recent history].
;(function () {
  var el = null, items = [], filtered = [], sel = 0
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;') }

  // forgiving subsequence score: every query char must appear in order; adjacency + word-start score higher.
  function fuzzy(q, s) {
    if (!q) return 0
    q = q.toLowerCase(); s = String(s || '').toLowerCase()
    var qi = 0, score = 0, last = -2
    for (var si = 0; si < s.length && qi < q.length; si++) {
      if (s[si] === q[qi]) {
        score += (si === last + 1 ? 4 : 1) + (si === 0 || /[\s._\-\/]/.test(s[si - 1]) ? 3 : 0)
        last = si; qi++
      }
    }
    return qi === q.length ? score : -1
  }

  function refilter(q) {
    filtered = items.map(function (it) {
      var sc = q ? Math.max(fuzzy(q, it.label), fuzzy(q, it.hint || '') - 2, fuzzy(q, it.group || '') - 4) : 0
      return { it: it, sc: sc }
    }).filter(function (x) { return x.sc >= 0 })
      .sort(function (a, b) { return b.sc - a.sc }).map(function (x) { return x.it })
    sel = 0; paint()
  }

  function paint() {
    if (!el) return
    var list = el._list, lastG = null, html = ''
    filtered.forEach(function (it, i) {
      if (it.group && it.group !== lastG) { html += '<div class="oz-pal-grp">' + esc(it.group) + '</div>'; lastG = it.group }
      html += '<button class="oz-pal-item' + (i === sel ? ' on' : '') + '" data-i="' + i + '">' +
        '<span class="oz-pal-lbl">' + esc(it.label) + '</span>' + (it.hint ? '<span class="oz-pal-hint">' + esc(it.hint) + '</span>' : '') + '</button>'
    })
    list.innerHTML = html || '<div class="oz-pal-empty">no match — try fewer letters</div>'
    var on = list.querySelector('.on'); if (on && on.scrollIntoView) on.scrollIntoView({ block: 'nearest' })
  }

  function pick(it) { if (!it) return; close(); try { it.run && it.run() } catch (_) {} }
  function close() { if (el) { el.remove(); el = null } }

  function build() {
    el = document.createElement('div'); el.className = 'oz-pal'
    el.innerHTML = '<div class="oz-pal-box"><input class="oz-pal-in" placeholder="type a few letters — or just arrow ↑ ↓, then Enter · Esc to close" spellcheck="false" autocomplete="off"><div class="oz-pal-list"></div></div>'
    document.body.appendChild(el)
    el._input = el.querySelector('.oz-pal-in'); el._list = el.querySelector('.oz-pal-list')
    el._input.addEventListener('input', function () { refilter(el._input.value) })
    el._input.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { sel = Math.min(filtered.length - 1, sel + 1); paint(); e.preventDefault() }
      else if (e.key === 'ArrowUp') { sel = Math.max(0, sel - 1); paint(); e.preventDefault() }
      else if (e.key === 'Enter') { pick(filtered[sel]); e.preventDefault() }
      else if (e.key === 'Escape') { close(); e.preventDefault() }
    })
    el._list.addEventListener('click', function (e) { var b = e.target.closest('[data-i]'); if (b) pick(filtered[+b.dataset.i]) })
    el.addEventListener('mousedown', function (e) { if (e.target === el) close() })   // click the dim backdrop → close
  }

  // OZ_PALETTE.open(items) — items: [{ label, hint?, group?, run }]. fuzzy, arrow/click, forgiving.
  window.OZ_PALETTE = {
    open: function (itms) {
      close(); items = itms || []; build(); refilter('')
      setTimeout(function () { try { el._input.focus() } catch (_) {} }, 20)
    },
    close: close,
  }
})()
