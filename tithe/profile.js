// profile.js — THE TITHE  (30 Aug 2026) — three characters, one build.
//
// ⚠⚠ CORRECTION, same day — I called this "the first Voltron" and Sum retired the frame while it
// was still wet: "we are moving away from voltron to sticky traps, so the comment is stale."
//
// VOLTRON was assembly — buy pieces, click them together, the bundle is the deal. STICKY TRAP is
// the opposite motion: the free build is complete and honest, and it shows you the edge of itself.
// The nurse here keeps her TOOLS and loses her CARDS, so she reaches for a food bean and finds no
// card behind it. That stumble is not a rough edge to sand off — it is the whole mechanism. You do
// not assemble your way up; you meet a wall while something useful is already in your hands.
//
// It changes what "free" is for. Under Voltron the free build was a starter kit. Under sticky
// traps it is the advertisement, and it has to be genuinely good or the trap is just a tease.
//
// Sum, 123go: "toto nurse and tutor · your welcome · tithing · for the poor · for the hungry."
//
// ⚠ THE NAME IS A PLACEHOLDER AND IT IS HIS TO SET. "tithe" is his word from the message that
// ordered this, not one I invented — but he named desk n dog on purpose and has not named this.
// Rename the folder and the three build refs; nothing else keys off it.
//
// ⭐ WHY THIS ONE IS DIFFERENT FROM deskndog. desk n dog is ONE character and rides the STANDALONE
// road (no `suites` key, topbar.js:857). Three characters with three toolkits want the SUITES
// road: the storefront trigger, and each character behind its own door. So `suites` is PRESENT
// here and ABSENT there, and that is the whole structural difference between the two builds.
//
// THE THREE, and what each carries (read off the registry, not guessed):
//   toto   · the desk. 💉 injection — the chart a bot wakes up reading (topbar.js:112)
//   nurse  · 📋 clipboard ONLY — the wellness cards are the $9 suite. See the correction below.
//            (was: "and the wellness cards") The registry's live nurse suite is
//            nurse+clipboard (topbar.js:188) with Vita owning exercise/food/sleep separately —
//            but the COMMENTED-OUT line above it (:180) is the original: "nurse — the suite
//            wellness lives in: Vita · exercise · food · sleep · 📋 chart". His framing here is
//            "for the hungry", so the food/sleep/exercise cards come along under the nurse.
//            ⚠ Vita herself does NOT — he said three characters. If the cards feel orphaned
//            without her, that is the thing to look at, and it is his call not mine.
//   tutor  · 📝 learn (the study suite, topbar.js:166)
  // ⭐ THE BAR ORDER IS HIS, 2026-08-30, verbatim: "brain toto suites drawer deck bots".
  //    `bar` names the tiles in the order they mount. `cardIcons` puts the brain face on the
  //    injection card, which is what "lose injection icon" meant — the 💉 syringe goes, the CARD
  //    stays and wears the brain. (topbar.js honors both keys on the standalone AND suites roads.)
window.OZ_PROFILE = {
  name: 'the tithe',
  // ⚠⚠ CORRECTION 2026-08-30, late — SUITES AND DRAWER PULLED. Sum: "at this level of complexity
  //    we do not need drawer yet, or suites, just cards and bots still. is just extra confusion.
  //    once we have 29 bots and cards we need them."
  //
  //    STILL TRUE in the long note above: `suites` present vs absent really is the road switch
  //    (topbar.js:907), and three characters really do have three toolkits. What was wrong was
  //    reading "three characters" as needing a storefront. A storefront earns its keep by HIDING
  //    things, and with six tiles there is nothing worth hiding — the door costs a click and buys
  //    nothing. The tithe still teaches the OS; it just teaches the level of it that is there.
  //
  //    The line as it stood:
  // suites: ['nurse', 'study'],                   // the street: two shops + the house bot
  agents: ['toto', 'nurse', 'tutor'],
  // ⚠⚠ CORRECTION 2026-08-30, same day — the wellness CARDS came back out. Sum: "free nurse just
  // has clipboard, not wellness. lets not bother stripping her tools, just the cards. if she
  // stumbles its a free add for the first 9 buck suite."
  //
  // STILL TRUE in the note above: the commented-out registry line at topbar.js:180 really was the
  // original nurse suite, and it really did carry exercise/food/sleep. What I got WRONG was
  // reading "for the hungry" as a spec instead of a framing, and shipping the paid suite's cards
  // in the free build.
  //
  // ⭐ AND THE PART THAT IS DESIGN, NOT SUBTRACTION: her TOOLS stay. The nurse can still reach for
  // a food or sleep bean and find no card behind it. That is not a bug to strip out — it is the
  // ad. She reaches, she stumbles, and the person watching learns there is a wellness suite. A
  // capability she can name but not reach is worth more than a capability she never mentions.
  cards:  ['injection', 'clipboard', 'learn'],
  cardIcons: { injection: 'agents/brain/brain.png' },
  // ⭐ THE WHOLE BAR, his words 2026-08-30: "brain, toto, cards bots, eye gear" — and the eye and
  //    gear are shell chrome that always ride the right, so this list is the left half entire.
  //    "all cards in cards, all bots in bots. toto redundant in top bar and bots, brain redundant
  //    in top bar and cards" — the two duplicates are DELIBERATE. The house bot and the brain are
  //    the two tiles that must be reachable without opening anything, and they also belong to the
  //    collections. Being in both places is the point, not an oversight to dedupe.
  bar:    ['injection', 'toto', 'deck', 'bots'],
  deck:   true,           // 🗂 STAYS — "just cards and bots still". the brain sits in it now.
  greenroom: true,        // 🎭 the bots bar — every profile agent, toto included
  subbar: false,          // the second row is gone with the suites: it only restated the first
  // (was: `free: true` — a flag I added to gate the ferryman note on the gear's API tab. It came
  //  out the same day: the note gates on `!window.__TAURI__` now, because the FULL SUITE in a
  //  browser is free too and has no such flag. A profile describes a build; only the shell knows
  //  where it is running. cards/settings/settings.js carries the whole correction.)
  houseBot: 'toto',
  open: [],                                        // land blank — toto and the bone
  drawer: false,          // ← pulled with the suites, same call
  // ⚠ was `greenroom: false` here — and it sat BELOW the `greenroom: true` added above, so the
  //    later key silently won and the bots bar never mounted. Duplicate keys in an object literal
  //    do not throw; the last one just quietly decides. Caught by reading the grep, not the code.
}
