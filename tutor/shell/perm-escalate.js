// perm-escalate.js — a bot can ASK for trust above its ceiling. Only a human green press grants it.
//
// WRITTEN BY CODER (2026-07-27, over the wire, in its sandbox) and spliced to live by a human — the
// crossing that is always a person's, by design. Its logic and API calls are its own and were correct
// on the first pass: OZ_PERM.tier(bot) · OZ_PERM.rank(t) · OZ_HIL.ask(bot,{label,run,deny}).
//
// THE ONE THING CHANGED IN THE SPLICE: coder's green callback called OZ_PERM.setTier(bot, target) —
// but setTier SILENTLY REFUSES anything above maxTier(bot), so an approved request would have changed
// nothing while looking approved. Escalation has to lift the CEILING, not the tier. That's grantCeiling,
// which exists only for this file and can only run inside the green press below. Coder had no way to
// know: it never read maxTier. A good reason the sandbox→live crossing gets a human who reads both.
//
// THE INVARIANT, and the reason any of this is safe: a bot can never grant itself a rung. It can only
// ask. The dial's "ask for …" rows and this module both terminate in the same place — OZ_HIL, and a
// person's finger. Red is a real answer; the bot hears no and continues.
;(function () {
  'use strict'
  if (window.OZ_ESCALATE) return

  function requestEscalation(bot, targetTier, reason) {
    var P = window.OZ_PERM, H = window.OZ_HIL
    if (!P || !H) { console.error('perm-escalate: OZ_PERM or OZ_HIL not found'); return null }

    var current = P.tier(bot)
    if (P.rank(targetTier) <= P.rank(current)) {        // not an escalation — nothing to ask for
      console.warn('perm-escalate: "' + targetTier + '" is not above "' + current + '"')
      return null
    }

    var label = bot + ' asks for ' + targetTier + ' (now ' + current + ')' + (reason ? ': ' + reason : '')
    return H.ask(bot, {
      label: label,
      // GREEN — lift the ceiling and dial it there. The only line in the app that raises a cap.
      run: function () { try { P.grantCeiling(bot, targetTier) } catch (e) { console.error('perm-escalate: grant failed', e) } },
      // RED — no side effect. The bot hears no and carries on at the tier it had.
      deny: function () {},
      irreversible: false,                               // takebacks are cheap: OZ_PERM.ungrant(bot)
      persist: { tool: 'perm-escalate', call: { action: 'grantCeiling', bot: bot, targetTier: targetTier, reason: reason } },
    })
  }

  window.OZ_ESCALATE = { request: requestEscalation }
})()
