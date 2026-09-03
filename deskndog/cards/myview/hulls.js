// hulls.js — THE HULLS, copied from the live paper (the inline "THE HULLS" script press.js stamps into page-one,
// Sum 2026-08-06): 3 columns = CATAMARAN, 1 column = MONOHULL. The monohull reads ACROSS the catamaran's rows, same
// order, one hull, never column-after-column: every story keeps its own look (a rail story stays a compact card, a
// centre story keeps its picture), only the hull changes. The red hull glyph sits bottom-right on the sheet, as on
// the paper. Two changes for the app: the choice is the reader's (localStorage paper-columns, default ONE — Sum
// 2026-08-22 "make default mono", the paper's orientation law stays on the web), and a sheet may hold several
// .page grids (The Feedline's four lines), so each is folded on its own. Sheets call HULLS.apply() after they draw.
(function () {
  'use strict'
  const KEY = 'paper-columns'
  const want = () => { try { return localStorage.getItem(KEY) === 'three' ? 'three' : 'one' } catch (_) { return 'one' } }
  const saved = new Map()   // page → the columns' children as they were, for the way back
  const cols = page => Array.prototype.slice.call(page.children).filter(c => c.classList.contains('col'))
  const movable = el => !(el.tagName === 'H2' || el.classList.contains('colhead'))   // the rail headings stay with their rail
  function mono(page) {
    if (saved.has(page)) return
    const cs = cols(page); if (cs.length < 3) return
    saved.set(page, cs.map(c => Array.prototype.slice.call(c.children)))
    const all = []
    cs.forEach((c, ci) => Array.prototype.slice.call(c.children).forEach(el => {
      if (!movable(el)) return
      const top = el.getBoundingClientRect().top + window.scrollY
      all.push({ el, key: Math.round(top / 64) * 1000 + ci })
    }))
    all.sort((a, b) => a.key - b.key)
    all.forEach(x => cs[1].appendChild(x.el))
    page.classList.add('sf-onecol')
  }
  function cata(page) {
    const kids = saved.get(page); if (!kids) return
    const cs = cols(page)
    kids.forEach((list, i) => list.forEach(el => cs[i].appendChild(el)))
    saved.delete(page); page.classList.remove('sf-onecol')
  }
  const pages = () => Array.prototype.slice.call(document.querySelectorAll('.page'))
  function paint() {
    const one = want() === 'one', btn = document.getElementById('hull'); if (!btn) return
    btn.innerHTML = '<svg id="hull-ic" width="27" viewBox="0 0 100 140" fill="currentColor" aria-hidden="true"><use href="#hull-' + (one ? 'cat' : 'mono') + '"/></svg>'
    btn.setAttribute('aria-label', one ? 'Reading one column, the monohull. Press for three columns, the catamaran.' : 'Reading three columns, the catamaran. Press for one column, the monohull.')
  }
  function apply() { const one = want() === 'one'; pages().forEach(p => { if (one) mono(p); else cata(p) }); paint() }
  function toggle() { try { localStorage.setItem(KEY, want() === 'one' ? 'three' : 'one') } catch (_) {} apply() }
  // the glyphs and the button, verbatim from the pressed page
  const defs = document.createElement('div'); defs.innerHTML = '<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs><g id="hull-cat"><rect x="24" y="44" width="52" height="6" rx="1"></rect><rect x="24" y="86" width="52" height="6" rx="1"></rect><path d="M26 8 C34 34 35 74 32 118 L20 118 C17 74 18 34 26 8 Z"></path><rect x="23" y="118" width="6" height="13" rx="1.5"></rect><path d="M74 8 C82 34 83 74 80 118 L68 118 C65 74 66 34 74 8 Z"></path><rect x="71" y="118" width="6" height="13" rx="1.5"></rect></g><g id="hull-mono"><path d="M50 6 C68 32 74 74 68 120 L32 120 C26 74 32 32 50 6 Z"></path><rect x="45.5" y="52" width="9" height="46" rx="2" fill="var(--sf-bg,#faf6ec)"></rect><rect x="47" y="54" width="6" height="42" rx="1.5"></rect><rect x="47" y="120" width="6" height="14" rx="1.5"></rect></g></defs></svg>'; document.body.appendChild(defs.firstElementChild)
  const btn = document.createElement('button'); btn.id = 'hull'; btn.type = 'button'
  btn.setAttribute('style', 'position:fixed;bottom:14px;right:14px;z-index:90;background:none;border:0;padding:0;line-height:0;color:var(--red,#8b2e1f);cursor:pointer;display:inline-flex')
  btn.addEventListener('click', e => { e.stopPropagation(); toggle() })
  document.body.appendChild(btn); paint()
  // the storage bus (the live paper's own convention for the radio): a hull pressed on ANY paper folds every paper
  window.addEventListener('storage', e => { if (e.key === KEY) apply() })
  // a redraw (FILL, a cut) rebuilds the columns: the sheet calls apply() after it draws; a fold in flight is forgotten with its page
  window.HULLS = { apply, toggle, want, forget: page => saved.delete(page) }
})()
