// vault-tools.js — 🔐 THE VAULT'S HANDLES. Vogel's kit, manicured through makeTool (MMMM).
//
// ⭐⭐ THE ONE RULE THIS FILE IS BUILT AROUND: THE BOT NEVER TOUCHES THE PASSPHRASE.
// safe.js encrypts client-side (PBKDF2 → AES-GCM) and the passphrase never rides with the file.
// A bean that took a passphrase as an argument would put it in the model's context, in the convo
// history, and in the flight recorder — three places it must never be. So the out-bound beans below
// STAGE the act and OPEN the card; the human types the passphrase and presses. That is not a
// limitation worked around, it is the design: **the bot prepares, the human commits.**
//
// THE LANES, his spec 31 Aug: "can sync in and upload from sandbox in pancake, from anywhere if in
// telescope, download raw, syncs out and save outside sandbox are gated by green button."
//   🔭 telescope  — reading outside oz
//   🥞 pancake    — the bot runs its own tools (klass 'write' auto-runs at pancakes+, conductor L983)
//   🟢 green      — irreversible, EVERY tier, no exceptions (needsOK L984: `if (irrev) return true`)
//
// ⚠ HOW A BEAN EARNS THE GREEN BUTTON — two independent roads, and these use BOTH on purpose:
//   1. THE NAME. conductor.js TOOL_IRREVERSIBLE tests the tool id against
//      /(delete|destroy|remove|drop|push|deploy|publish|save.?out|export|send|trash)/i
//   2. THE DECLARATION. `klass: 'sharp'` is read as no-undo at the same line.
//   Belt AND braces: a rename cannot silently un-gate a bean, and a klass edit cannot either,
//   because the other one still says no. Two sources that agree can only drift by being noticed.
//
// ⚠ makeTool REFUSES a bean with no klass or no readback (tools.js — live since 30 Aug, debt zero).
//   Every bean here declares both. There is no half-built option.

;(function () {
  'use strict'
  var MT = window.makeTool
  if (!MT) return

  var SAFE = function () { return window.OZ_SAFE || null }
  var boxIds = function () { var s = SAFE(); return s && s.BOXES ? s.BOXES.map(function (b) { return b.id }) : [] }

  // the read-back reads the SURFACE, never the strike's own claim — that is the whole point of a
  // read-back (tools.js: "the surface itself, not my claim").
  var backCount = function () {
    var s = SAFE(); if (!s) return 'the safe is not loaded'
    return s.BOXES.length + ' boxes on the card'
  }

  // ── 🔭 READ ────────────────────────────────────────────────────────────────────────────────
  MT({ id: 'vault_list', card: 'vault', klass: 'read',
    readback: backCount,
    blurb: 'list the vault boxes and what each one would pack right now. LOW-RISK: counting only, nothing leaves.',
    clue: 'list the vault boxes.\ntemplate: { "tool": "vault_list" }\nsix boxes: diary · keys · album · codex · lessons · journal.\nthe KEY RING is never included in "sync all" — say so if it comes up.',
    strike: function () {
      var s = SAFE(); if (!s) return 'the vault card has not loaded yet — open it once, then ask again.'
      var rows = s.BOXES.map(function (b) {
        var c; try { c = s.collect(b.id) } catch (_) { c = { ls: {}, sandbox: {} } }
        var ls = Object.keys(c.ls || {}).length, sb = Object.keys(c.sandbox || {}).length
        return '  ' + (b.icon || '•') + ' ' + b.id + ' — ' + ls + ' saved setting' + (ls === 1 ? '' : 's') +
               ' · ' + sb + ' file' + (sb === 1 ? '' : 's')
      })
      return 'the vault holds ' + s.BOXES.length + ' boxes:\n' + rows.join('\n') +
             '\nthe key ring is excluded from "sync all" by design.'
    } })

  MT({ id: 'vault_peek', card: 'vault', klass: 'read',
    readback: function (call) { var s = SAFE(); return s && boxIds().indexOf(call && call.box) > -1 ? 'box "' + call.box + '" exists on the card' : 'unknown box' },
    blurb: 'peek at ONE box — how many settings and files it would pack, and their names. Names only, never contents.',
    clue: 'peek in one vault box.\ntemplate: { "tool": "vault_peek", "box": "diary" }\nbox is one of: diary · keys · album · codex · lessons · journal.\nyou get NAMES and COUNTS, never contents — the contents are the human\'s.',
    strike: function (call) {
      var s = SAFE(); if (!s) return 'the vault card has not loaded yet — open it once, then ask again.'
      var box = String((call && call.box) || '').trim()
      if (boxIds().indexOf(box) < 0) return 'no box called "' + box + '". the six are: ' + boxIds().join(' · ')
      var c; try { c = s.collect(box) } catch (e) { return 'could not read that box — ' + ((e && e.message) || e) }
      var ls = Object.keys(c.ls || {}), sb = Object.keys(c.sandbox || {})
      return box + ': ' + ls.length + ' setting(s), ' + sb.length + ' file(s)\n' +
             (sb.length ? '  files: ' + sb.slice(0, 40).join(', ') + (sb.length > 40 ? ' …' : '') : '  no files') +
             '\ncontents are not shown and cannot be — this bean reads names and counts only.'
    } })

  // ── 🟢 GREEN — IRREVERSIBLE. Named to trip TOOL_IRREVERSIBLE **and** declared sharp. ─────────
  // ⚠ THESE DO NOT ENCRYPT AND DO NOT SEND. They open the card with the box in hand and hand the
  //   human the pen. Two human touches guard every export: the green press to allow the ask, then
  //   the passphrase to actually seal it. Sum's rule for the browser half, same rule here:
  //   "tell it what to click and which box to highlight … ask human to confirm and hit save or send."
  MT({ id: 'vault_save_out', card: 'vault', klass: 'sharp',
    readback: function () { return 'the vault card is open — the human has the passphrase field' },
    blurb: 'stage a box to leave this device — opens the vault so the human can type the passphrase and press save. NEEDS THEIR OK: nothing leaves without it.',
    clue: 'stage one box to be saved OUT of the sandbox.\ntemplate: { "tool": "vault_save_out", "box": "diary" }\n⚠ you CANNOT complete this. It opens the card; the human types the passphrase and presses save.\nSay that plainly when you use it — do not imply the file has left.',
    strike: function (call) {
      var box = String((call && call.box) || '').trim()
      if (boxIds().length && boxIds().indexOf(box) < 0) return 'no box called "' + box + '". the six are: ' + boxIds().join(' · ')
      try { if (window.toggleCard) window.toggleCard('vault', true) } catch (_) {}
      return 'the vault is open with "' + box + '" in hand. I cannot seal it — the passphrase is yours and never reaches me. ' +
             'Type it and press save; the file that leaves is encrypted and the passphrase does not ride with it.'
    } })

  MT({ id: 'vault_export_raw', card: 'vault', klass: 'sharp',
    readback: function () { return 'the vault card is open — the human has the download control' },
    blurb: 'stage a RAW, UNENCRYPTED download — opens the vault and says so out loud. NEEDS THEIR OK, and it should: raw means readable by anyone who gets the file.',
    clue: 'stage a raw unencrypted export.\ntemplate: { "tool": "vault_export_raw", "box": "album" }\n⚠ RAW means NOT encrypted. Say that to the human in your own words before they press, every time — never let this one pass as routine.\nyou cannot complete it; they press.',
    strike: function (call) {
      var box = String((call && call.box) || '').trim()
      try { if (window.toggleCard) window.toggleCard('vault', true) } catch (_) {}
      return 'the vault is open for a RAW export of "' + box + '". ⚠ raw is not encrypted — anyone who gets that file can read it. ' +
             'I have not exported anything and cannot; the press is theirs.'
    } })
})()
