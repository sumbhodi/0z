// profile.js — the 0z DESKTOP lion (overwrites the full-app null; Sum's Voltron mechanism, 2026-06-29).
// THE BOLT RULE: sync.sh holds this file out of every rsync — edit it HERE, never in source.
//
// 2026-08-10: the CODER SUITE lands (Sum: "lets just finish the coder suite") — T. Woodsman joins
// ¢|@∪0Ɛ, the full coder stack (monaco · webview · cli), and drawer:true opens the character
// drawer (the master roster) from the top bar.
// 2026-08-12: THE PAPER CREW lands — newsie · yanker · dria join the roster, with the library +
// clock cards to pair them (TNG-7: a bot without a card is a talking head; pair-or-pointless).
//
// ⚠⚠ 2026-08-14 — THIS FILE WAS A SYNTAX ERROR AND NEVER EXECUTED.
// The whole object sat on ONE line with a `// dria waits …` comment in the middle of it. Everything
// after that comment — cards, suites, houseBot, open, drawer, greenroom, plain, AND the closing
// brace — was commented out, so the file failed to parse and window.OZ_PROFILE was never set.
// applyProfile() bails on `if (!P) return`, which is why the top bar rendered EVERY card and suite
// in the registry instead of this build's slice.
// ⭐ THE RULE: one key per line. A `//` runs to end of LINE, so a one-line object literal is one
// stray comment away from deleting itself. Never put this object back on a single line.
//
// 2026-08-14: trimmed to the ship set (Sum) — "just news time games chat and coder. coder is the
// suite, the rest is just plain os every system ships." Removed: pa · nurse · yanker/editor ·
// wellness · study(learn) · brain. Their cards and agents stay on disk, just unlisted here.

window.OZ_PROFILE = {
  name: '0z desktop',

  // ⭐ FULL DESKTOP — every suite, named explicitly.
  //
  // ⚠ `suites` MUST BE PRESENT even when nothing is being filtered out. topbar.js gates the
  // suites subbar on `(!window.OZ_PROFILE || window.OZ_PROFILE.suites)` (L315, and the
  // house-bot pill again at L377). A profile that EXISTS but names no suites reads as a
  // standalone build, so the subbar never renders and the bar comes up empty. Absent is not
  // the same as "all" here — list them.
  //
  // agents and cards are omitted on purpose: for those two, `!P.agents` / `!P.cards` really
  // do mean "no filter" (applyProfile L195-196).
  // THE PARK, 2026-08-29 (Sum: "park writer and tiptap, pa email and calendar, next to sphinx and
  // yanker, and woodshop — what is left is basically a working product"). 'pa' and 'editor' left
  // this list ('editor' had no SUITES entry anymore — a door with no room); 'study' lives on as
  // tutor+learn; 'brain' lives on minus the jenga card. Everything parked sits whole in
  // _bench-for-totois/ — folders, chairs, skins — for the better versions that come back later.
  // THE SHIP LIST, reordered 2026-08-29 to read like the bar. CORRECTION, same hour: this list is
  // ship ONLY — the SEAT order lives in topbar.js TOPROW (its header always said so; a sort keyed
  // off this list lived one build and was pulled as tape). Reorder the bar → TOPROW.
  // ⚠ 'complex' (Binary Complex + Sysisphinx) left the list here — his order named eleven seats
  // and complex was not one; sphinx is on the bench anyway. One id back in this list re-seats it.
  suites: [
    // ⚠ 'brain' PULLED 2026-08-30 (Sum: "pull brain out of suites, and put at start of top bar").
    //    It is the tile that explains what totoII is — the one thing that must not sit behind a
    //    door. It mounts from `bar` below instead, first, ahead of the house collar.
    'nurse', 'wellness', 'study', 'time',   // ⚠ suite ids stay 'room'/'complex'-style, never a card's id: a suite sharing a card's id shadows the card (topbar.js data-card keyspace)
    'psv', 'lamp', 'arcade', 'room', 'coder',
    'counter',   // ⭐ 31 Aug — Vogel's suite: the vault card + its keeper. ⚠ 'counter', never 'vault' — see the warning two lines up: a suite id that matches a card id shadows that card.
  ],
  //
  // The trim lives in 0z-bots, not here. When it is time to strip this one too, the lists
  // that were tested and worked on 14 Aug were:
  //   cards:  aiol · monaco · webview · cli · scroll · library · clock · games
  //   suites: coder · psv · time · arcade
  // Paste those three keys back in to re-strip. Nothing was deleted from the registry.

  // ⚠ agents MUST BE LISTED even on the full desktop — third instance of the same law tonight.
  // applyProfile treats a missing agents key as "no filter" (topbar.js L195), BUT the green room
  // cast is built from `(P.agents || [])` directly (topbar.js L704) — omit the key and the cast
  // is EMPTY. Every profile key has per-consumer semantics; absence is never neutral. The cast
  // shown = this list minus suite bots minus HOUSE_FURNITURE (characters only, his 2026-08-10 rule).
  agents: [
    // 2026-08-29: 'writer' and 'pa' left this line for the bench (their own lines below would have
    // been safer to remove — but they were mid-line; edited in place, characters counted: 2 ids out)
    'toto', 'coder', 'bleep', 'nurse', 'wellness', 'tutor', 'learner',   // (17 Aug) learner seated — it never chats, but it needs the BOT tab: model picker + the three tone slots. settings.js L249 filters BOTS against THIS list, so a registry line alone is invisible.
    'timetravel', 'newsie', 'dria', 'gamer', 'alpha', 'aoladdin', 'muskett', 'vogel',
    // ⭐ 2026-08-31 — UNI corn seated, ON ITS OWN LINE per the lesson three comments down.
    //    Sum's gate, verbatim: "in full suite only, is perk for paying customers, enlightened
    //    audiences only, never free, might be a buck and a game to get one day."
    //    ⚠ THE GATE NEEDS NO CODE. `agents` is an ALLOW-LIST, so UNI is absent from all 47 other
    //    profiles — every strip, every _public-free copy, 0zcom/app (0zhub.com, public) — by
    //    OMISSION. Nothing was edited to keep it out and nothing must be. Adding 'uni' to a free
    //    profile is the only way to leak it; there is no switch to forget to flip.
    //    It takes the house chair only under the unicorn skin (registry.js:230, skin/unicorn.css,
    //    houseFor() reading "house":"unicorn" in uni.json). Under any other skin toto keeps it and
    //    UNI is simply a character in the green room. Both keep their seats — they are peers here.
    'uni',
    // ⭐ 31 Aug — S. Trawman, on his own line (the lesson four comments up). Takes THE ROOM from
    //    Vogel; the 'aioli' nav grant moved between their records and nothing else did.
    'trawman',
    // (26 Aug) 'lumberjack' sat here for four hours and is gone again — un-shipped on Sum's word, parked
    //   in _bench-for-totois/. Kept as a comment because the PLACEMENT is the lesson: its own line, never
    //   appended to a line that carries ids. An hour earlier a regex ate exactly such a line and eight
    //   bots left this file silently. Add nothing to the id lines above; give a new bot its own.
    // ⚠ RESTORED 26 Aug, an hour after I deleted this line by accident. I ran a blunt regex to scrub a
    //   retired bot's name out of comments — and this line carried that name in a TRAILING COMMENT, so
    //   the whole line went with it and eight bots silently left the app. Nothing threw; the drawers just
    //   came up short and I only caught it counting them. A line-deleting regex has a blast radius the
    //   size of the line, and a comment can share a line with live code.
  ],

  // houseBot is LEGACY and unread — topbar.js renderSubbarSuites calls houseBotFor(), which returns
  //   'toto' while THEME_HOUSE is false. Left as a record of the orange theme's intent; the four labs
  //   taking toto's chair per theme is the HOUSE_BOTS map in topbar.js, parked for later.
  // ⭐ the brain, first on the bar. `bar` = the tiles you place, in order, at the HEAD (topbar.js).
  //    ⚠ DO NOT add a `cards` key here to go with it — `cards` is a FILTER, and naming one card
  //    would prune every other card out of the full app. `bar` resolves ids against CARDS,
  //    DANGEROUS and NAV directly, so it reaches 💉 injection without any pruning.
  bar:       ['injection'],
  cardIcons: { injection: 'agents/brain/brain.png' },   // the brain face on the injection card
  houseBot: 'toto',
  // open: [] was the 2026-08-14 law ("nothing opens uninvited" — bleep had auto-opened the first
  // night this file parsed). 2026-08-23: Sum INVITED toto — "this is what I want out of the box,"
  // the goal pic: toto's bar OPEN in the left wing, the bone, nothing else. One bot, by name, his
  // word. Everything else still never opens uninvited.
  open: ['toto'],
  drawer: true,
  greenroom: true,
  plain: true,
}
