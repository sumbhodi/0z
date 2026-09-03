// profile.js — HELLO NURSE  (30 Aug 2026) — one character, one card.
//
// The free nurse: the 📋 clipboard and nothing else. Her TOOLS stay whole — she can still reach
// for a food or a sleep bean and find no card behind it. That stumble is not a rough edge to sand
// off; it is the honest edge of a free build, and the wellness suite is what is on the other side.
//
// ⚠ NO `suites` KEY. Absence picks the STANDALONE road (topbar.js:857), which is what puts her and
// her card straight on the bar instead of behind a storefront. Present — even as [] — would send
// this down the suites road. See the correction in 0zcom/../deskndog/profile.js.
  // ⭐ THE BAR ORDER IS HIS, 2026-08-30, verbatim: "brain toto nurse clipboard".
  //    `bar` names the tiles in the order they mount. `cardIcons` puts the brain face on the
  //    injection card, which is what "lose injection icon" meant — the 💉 syringe goes, the CARD
  //    stays and wears the brain. (topbar.js honors both keys on the standalone AND suites roads.)
window.OZ_PROFILE = {
  name: 'hello nurse',
  // (was: free: true — a flag gating the ferryman note on the gear's API tab. Removed the same
  //  day: the note gates on !window.__TAURI__ now, because the FULL SUITE in a browser is free too
  //  and carries no such flag. A profile describes a BUILD; only the shell knows where it is
  //  RUNNING. cards/settings/settings.js holds the whole correction.)
  agents: ['toto', 'nurse'],
  cards:  ['injection', 'clipboard'],
  cardIcons: { injection: 'agents/brain/brain.png' },
  bar:    ['injection', 'toto', 'nurse', 'clipboard'],   // card · bot · bot · card
  houseBot: 'nurse',
  // ⭐ subbar: false — Sum 2026-08-30: "nurse and tutor have same open drawer bug." Same call as
  //    the tithe an hour earlier. The subbar groups OPEN cards into a second row, which on a
  //    standalone with a `bar` only ever restates the row above it. The bar IS the nav here.
  subbar: false,
  open: [],
  drawer: false,
  greenroom: false
}
