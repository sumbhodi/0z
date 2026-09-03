// chip-groups.js — THE CHIP-GATES-A-GROUP BEAN (Sum 2026-07-20: "you've hand-rolled that
//   feature like 5 times now — is there a reason it's not a bean yet?"). No more.
// FOR HUMANS: a row of chips; each chip owns a group of rows below it. Toggle a chip ON (raised
//   tan, the house law) and its group shows; toggle OFF and the group leaves the page — live.
//   The on/off set persists. This is the pattern under authors · spirituality · move · learn · time.
// FOR AI: csChipGroups({ host, chips:[{id,label}], key, def, draw(id)->Node|null, onToggle? }).
//   returns { redraw }. `key` = localStorage on-set (JSON array of ids). `draw` builds a group's
//   DOM (or null to skip). raised-tan chip = on, navy = off — never a checkmark (Sum's UI law).

;(function () {
  const J = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); if (v != null) return v } catch (_) {}
                        try { return typeof d === 'string' ? JSON.parse(d) : d } catch (_) { return d } }   // accepts a STRING default ('[]') or a VALUE default ([]) — never throws
  const S = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)) } catch (_) {} }

  window.csChipGroups = function (opts) {
    const { host, chips, key, def, draw, onToggle, extra } = opts   // `extra`: a node parked on the chip row (the time-tools cycle picker)
    const dflt = JSON.stringify(def || chips.map(c => c.id))
    const chipRow = document.createElement('div'); chipRow.className = 'lane-chips'
    const groups = document.createElement('div')
    host.appendChild(chipRow); host.appendChild(groups)

    const isOn = id => new Set(J(key, dflt)).has(id)
    const redraw = () => {
      groups.innerHTML = ''
      chips.forEach(c => { if (isOn(c.id)) { const g = draw(c.id); if (g) groups.appendChild(g) } })
    }
    chips.forEach(c => {
      const b = document.createElement('button')
      const dress = on => { b.className = 'lane-chip' + (on ? ' on' : ''); b.textContent = c.label }
      dress(isOn(c.id))
      b.addEventListener('click', () => {
        const now = new Set(J(key, dflt)); now.has(c.id) ? now.delete(c.id) : now.add(c.id)
        S(key, [...now]); dress(now.has(c.id)); redraw(); if (onToggle) onToggle(c.id, now.has(c.id))
      })
      chipRow.appendChild(b)
    })
    if (extra) chipRow.appendChild(extra)
    redraw()
    return { redraw }
  }
})()
