// profile.js — DESK N DOG  (30 Aug 2026)
// Sum: "keep gear and eye as is, keep toto as is, keep brain icon, instead of a suite, brain on
// top bar, just injection card, no nurse."
//
// ⚠ NO `lean` KEY. Lean is dead (his call, 30 Aug) — it was carved for EXTRA² in July and had
// drifted five weeks behind the bar. This rides the SAME road as the full desktop.
// ⚠ NO `suites` KEY either — absence picks the standalone road (topbar.js:857), which is what
// puts the cards and bots straight on the top bar instead of behind a storefront.
  // ⭐ THE BAR ORDER IS HIS, 2026-08-30, verbatim: "brain toto".
  //    `bar` names the tiles in the order they mount. `cardIcons` puts the brain face on the
  //    injection card, which is what "lose injection icon" meant — the 💉 syringe goes, the CARD
  //    stays and wears the brain. (topbar.js honors both keys on the standalone AND suites roads.)
window.OZ_PROFILE = {
  name: 'DESK N DOG',
  agents: ['toto'],
  cards:  ['injection'],
  cardIcons: { injection: 'agents/brain/brain.png' },   // brain face, injection card
  bar:    ['injection', 'toto'],   // was implicit (cards-then-bots); now stated
  // (was: `free: true` — a flag I added to gate the ferryman note on the gear's API tab. It came
  //  out the same day: the note gates on `!window.__TAURI__` now, because the FULL SUITE in a
  //  browser is free too and has no such flag. A profile describes a build; only the shell knows
  //  where it is running. cards/settings/settings.js carries the whole correction.)
  houseBot: 'toto',
  open: [],
  drawer: false,
  greenroom: false
}
