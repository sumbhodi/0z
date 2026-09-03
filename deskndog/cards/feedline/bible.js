// bible.js — THE BIBLE AS THE NEWSIE READS IT, one text (Sum 2026-08-22: "is newsie's copy in 3 files? just make it one
// box… just the bible newsie sees, let user see and edit"). ONE generator for the sheet (the order slip) and the gear
// (the box): feedline/bible.json keeps `text`, the bible as prose; the newsie's cuts APPEND to it (themes, a rule); the
// reader edits it freely in the gear. Underneath, the ledger (wires it picked, sources kept/offered) is counted by the
// cuts and never edited; it rides the slip as one computed line. Loaded by the shell (settings.js) and by the sheet.
(function () {
  'use strict'
  const top = (o, f) => Object.entries(o || {}).sort((x, y) => f(y[1]) - f(x[1])).slice(0, 6)
  function ledger(b, names) {
    const N = id => (names && names[id]) || id
    const w = top(b.wires, v => v).map(([id, n]) => `${N(id)} ×${n}`).join(', ')
    const s = top(b.sources, v => v.kept || 0).map(([id, v]) => `${N(id)} ${v.kept}/${v.offered}`).join(', ')
    return b.editions ? `The ledger after ${b.editions} cut${b.editions === 1 ? '' : 's'}: wires you leaned on: ${w || 'none'}. Sources kept/offered: ${s || 'none'}.` : ''
  }
  // the text: what the reader sees and edits. Built once from the parts a bible already has; kept as prose after that.
  function text(b) {
    if (b.text) return b.text
    if (b.desks && !b.editions) return Object.entries(b.desks).map(([k, v]) => `${k} — ${v}`).join('\n') + '\n\nKeep what earns its keep; try one new wire each cut.'
    const lines = []
    if ((b.themes || []).length) lines.push('Themes: ' + b.themes.join(', '))
    if ((b.rules || []).length) lines.push('Rules:\n' + b.rules.map(r => '- ' + r).join('\n'))
    if ((b.notes || []).length) lines.push('Notes:\n' + b.notes.map(n => '- ' + n).join('\n'))
    return lines.join('\n\n')
  }
  // a cut adds its day to the text: the themes it saw and the rule it set, one line each
  function append(b, themes, rule) {
    const day = new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    const add = []
    if (themes && themes.length) add.push(`${day} themes: ${themes.join(', ')}`)
    if (rule) add.push(`${day} rule: ${rule}`)
    if (!add.length) return b
    b.text = (text(b) + '\n\n' + add.join('\n')).trim()
    return b
  }
  window.BIBLE = { text, ledger, append }
})()
