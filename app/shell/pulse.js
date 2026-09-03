// pulse.js — the global PULSE bus. a save sends a pulse on a channel; subscribers refresh. reactive,
// no polling, no version-bumps. one line to emit (window.pulse('library')), one to subscribe
// (window.onPulse('library', fn)). this is how a saved course in 📝 learn shows up in the 💉 injection
// the instant you save it: the save pulses 'library' → the injection re-projects + re-renders.
window.PULSE = window.PULSE || {}
window.onPulse = function (ch, fn) { (window.PULSE[ch] = window.PULSE[ch] || []).push(fn) }
window.pulse   = function (ch) { (window.PULSE[ch] || []).forEach(fn => { try { fn() } catch (_) {} }) }
