// profile.js — THE TUTOR  (30 Aug 2026) — one character, one card.
//
// 📝 learn and the tutor who asks before it answers. For anyone who was told once that they were
// not a maths person.
//
// ⚠ NO `suites` KEY — the standalone road. See hello nurse and desk n dog for why absence is the
// switch and an empty array is not.
  // ⭐ THE BAR ORDER IS HIS, 2026-08-30, verbatim: "brain toto tutor learn".
  //    `bar` names the tiles in the order they mount. `cardIcons` puts the brain face on the
  //    injection card, which is what "lose injection icon" meant — the 💉 syringe goes, the CARD
  //    stays and wears the brain. (topbar.js honors both keys on the standalone AND suites roads.)
window.OZ_PROFILE = {
  name: 'the tutor',
  // (was: free: true — a flag gating the ferryman note on the gear's API tab. Removed the same
  //  day: the note gates on !window.__TAURI__ now, because the FULL SUITE in a browser is free too
  //  and carries no such flag. A profile describes a BUILD; only the shell knows where it is
  //  RUNNING. cards/settings/settings.js holds the whole correction.)
  agents: ['toto', 'tutor'],
  cards:  ['injection', 'learn'],
  cardIcons: { injection: 'agents/brain/brain.png' },
  bar:    ['injection', 'toto', 'tutor', 'learn'],   // card · bot · bot · card
  houseBot: 'tutor',
  // ⭐ subbar: false — Sum 2026-08-30: "nurse and tutor have same open drawer bug." Same call as
  //    the tithe an hour earlier. The subbar groups OPEN cards into a second row, which on a
  //    standalone with a `bar` only ever restates the row above it. The bar IS the nav here.
  subbar: false,
  open: [],
  drawer: false,
  greenroom: false
}
