// oz-lane.js — THE LANE WALL (Sum 2026-07-09). the structural backstop under the permission ladder.
//
// A bot WRITES only inside its OWN folder (BOT_FILES[bot].folder). A cross-lane write needs the 🤖 'robot'
// tier ("read/write anywhere in oz"). READS are own-lane + root/unclaimed + explicit read-only MOUNTS
// (e.g. tutor → the coder's code, to teach). Enforced in tools.js ctx.write / ctx.sb, keyed on window.OZ_ACTOR
// (the bot the conductor is currently running a tool for). A NULL actor = the UI / the human = unrestricted.
//
// This makes "tutor literally can't touch code" STRUCTURAL, not a tools-list accident: tutor's tier caps below
// 'robot' (second choir → cli), so its writable scope can never include the coder's 'code' lane. Deny by
// construction. The read-only mount lets it SEE the code to teach, without ever holding a pen to it.
(function () {
  'use strict'
  // read-only cross-mounts — <bot> may READ these other bots' lanes (by owner id). writes never cross.
  // ⭐ MOVED TO THE BOT'S RECORD, 26 Aug ("mounts": ["coder"] on tutor). WAS: { tutor: ['coder'] }.
  //    A read-only lane grant is a permission between two bots, and hard-listing it here meant neither
  //    bot's own file said anything about it. Built lazily each call so a re-seated bot is picked up.
  //    the tutor reads the coder's code to teach — never writes it.
  var MOUNTS = (function () {
    try {
      var D = window.AGENT_DATA || {}, out = {}
      Object.keys(D).forEach(function (id) { if (Array.isArray(D[id] && D[id].mounts) && D[id].mounts.length) out[id] = D[id].mounts })
      return out
    } catch (_) { return {} }
  })()

  function folder(bot) {
    var b = (window.BOT_FILES || {})[bot]
    return (b && b.folder) ? b.folder : ('notes/' + (bot || ''))
  }
  function within(name, f) { name = String(name || ''); return name === f || name.indexOf(f + '/') === 0 }
  // which bot's folder claims this path? longest-prefix wins; null = root / unclaimed (shared scratch)
  function ownerOf(name) {
    var bf = window.BOT_FILES || {}, best = null, bestLen = -1
    for (var id in bf) {
      var f = bf[id] && bf[id].folder
      if (f && within(name, f) && f.length > bestLen) { best = id; bestLen = f.length }
    }
    return best
  }
  function tierRank(bot) { try { return window.OZ_PERM ? window.OZ_PERM.rank(window.OZ_PERM.tier(bot)) : 99 } catch (_) { return 99 } }
  function robotRank() { try { return window.OZ_PERM ? window.OZ_PERM.rank('robot') : 3 } catch (_) { return 3 } }

  // merged, not assigned — see the note at the foot of lane-gofai.js. Load order must not decide which
  // half of OZ_LANE survives, and for a while it did.
  window.OZ_LANE = Object.assign(window.OZ_LANE || {}, {
    folder: folder,
    ownerOf: ownerOf,
    MOUNTS: MOUNTS,
    // a bot may WRITE its own lane + root; crossing into another bot's lane needs the 🤖 robot tier
    canWrite: function (bot, name) {
      if (!bot) return true                          // UI / human → unrestricted
      var owner = ownerOf(name)
      if (!owner || owner === bot) return true        // own lane or root/unclaimed
      return tierRank(bot) >= robotRank()             // cross-lane write → 'robot' (read/write anywhere)
    },
    // a bot may READ its own lane + root + any explicit mount; robot+ reads anywhere
    canRead: function (bot, name) {
      if (!bot) return true
      var owner = ownerOf(name)
      if (!owner || owner === bot) return true
      if ((MOUNTS[bot] || []).indexOf(owner) > -1) return true
      return tierRank(bot) >= robotRank()
    },
  })
})()
