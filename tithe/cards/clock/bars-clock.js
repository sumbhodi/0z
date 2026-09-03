/* bars-clock.js
 * ─────────────────────────────────────────────────────────────
 * Widget visibility toggles — the settings page's ONE remaining job
 * besides location. Key: clock-widgets (localStorage).
 * The drag-item/stash/saveOrder paths are inert since 2026-07-15 —
 * ordering moved ON THE FACE (clock-arrange.js); cs-arrange atticed.
 * All those calls are typeof/null-guarded, so they simply no-op here.
 * ─────────────────────────────────────────────────────────────
 */
;(function() {

  const KEY = 'clock-widgets'

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY) || '{}') } catch { return {} }
  }

  function save() {
    const state = {}
    document.querySelectorAll('.wg-toggle').forEach(cb => { state[cb.dataset.widget] = cb.checked })
    localStorage.setItem(KEY, JSON.stringify(state))
    if (typeof window.refreshPreview === 'function') window.refreshPreview()
    if (typeof window.saveOrder      === 'function') window.saveOrder()
  }

  // restore on load — order first (cs-arrange), then visibility
  const allItems = {}
  document.querySelectorAll('.drag-item').forEach(i => { allItems[i.dataset.widget] = i })
  if (typeof window.csRestoreOrder === 'function') window.csRestoreOrder(allItems)

  const stashed = {}
  const state   = load()

  document.querySelectorAll('.wg-toggle').forEach(cb => {
    const id = cb.dataset.widget
    if (state[id] === false) {
      cb.checked = false
      const item = document.querySelector(`.drag-item[data-widget="${id}"]`)
      if (item) { stashed[id] = { item, parentId: item.parentElement.id }; item.remove() }
    }

    cb.addEventListener('change', () => {
      const id   = cb.dataset.widget
      const item = document.querySelector(`.drag-item[data-widget="${id}"]`)
      if (!cb.checked) {
        if (item) {
          stashed[id] = { item, parentId: item.parentElement.id }
          item.style.transition = 'opacity 0.2s'
          item.style.opacity = '0'
          setTimeout(() => item.remove(), 200)
        }
      } else {
        if (stashed[id]) {
          const { item: el, parentId } = stashed[id]
          const list = document.getElementById(parentId)
          if (list) { el.style.opacity = '0'; list.appendChild(el); setTimeout(() => { el.style.opacity = '1' }, 20) }
          delete stashed[id]
        }
      }
      save()
    })
  })

})()
