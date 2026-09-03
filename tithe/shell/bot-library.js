// bot-library.js — THE BOT-LIBRARY BEAN. a bot's "notes" in the 💉 injection config are a PROJECTION of
// its HOME surface: nurse ← the 📋 clipboard chart · tutor ← the 📝 learn card · writer ← its gear (works +
// voices). the injection card is a pointer-index over them: toggle one into the chart, ✕ drop it, click to
// open it where it lives + edits. three of these earned the abstraction (Sum: "third time's the bean").
//
// each home registers ONCE:  registerBotLibrary(owner, { project: () => note[],  open: (note) => reveal })
//   project() → note objects { folder, name, display, body, on, owner, source }  (a SNAPSHOT; re-seeds on bump)
//   open(note) → reveal the note's home surface (a card, or the agent's bar)
// the injection card consumes the registry — no per-bot hardcoding anymore.

window.BOT_LIBRARY = window.BOT_LIBRARY || {}

window.registerBotLibrary = function (owner, spec) { window.BOT_LIBRARY[owner] = spec || {} }

// every registered owner's projection, flattened — the LIVE seed source for the injection's notes.
// each carries lib:true so the injection knows it's projected (re-derive it; never a stale snapshot).
window.botLibrarySeed = function () {
  return Object.values(window.BOT_LIBRARY).reduce((acc, s) => {
    try { return acc.concat((s.project ? s.project() || [] : []).map(n => Object.assign({ lib: true }, n))) } catch (_) { return acc }
  }, [])
}

// open a note where it lives (its registered home). returns true if a home handled it.
window.botLibraryOpen = function (note) {
  const s = window.BOT_LIBRARY[(note && note.owner) || '']
  if (s && s.open) { try { s.open(note); return true } catch (_) {} }
  return false
}

// delete a projected note AT ITS HOME (so it doesn't just re-project back). returns true if handled.
window.botLibraryRemove = function (note) {
  const s = window.BOT_LIBRARY[(note && note.owner) || '']
  if (s && s.remove) { try { s.remove(note); return true } catch (_) {} }
  return false
}
