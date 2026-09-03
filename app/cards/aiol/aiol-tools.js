// aiol-tools.js — 🍽 THE ROOM'S HANDLES. Vogel hosts AIOLI and, until today, could not touch it:
// fourteen tools, all doc_* and ui_*, and not one that reached the room it is always seated in.
// These are hands ON the room from OUTSIDE it — a bot in its own convo window opening a room, looking
// in, and reading back. THE MODERATING STAYS IN shell/aiol.js (Sum: "the actual moderating I think
// lives in aiol"); this file is the door, never the loop.
//
// ⭐ THE ROUTER IS STILL GOFAI AND NOTHING HERE TOUCHES IT. aiol.js is emphatic: "No model decides who
//    speaks next… the moment a model picks the speaker, the room costs four times as much and stops
//    being explainable." Every bean below is a READ except room_open, and room_open only makes a room —
//    it never chooses a speaker. If a future bean wants to pick who talks, it is the wrong bean.
//
// ⭐ THE MEMORY LAW, and why there is no write-into-a-bot bean here (Sum 2026-08-26):
//      a bot's own convo history   PRIVATE, air-gapped
//      the room's transcript       stored to the ROOM, never to a bot's history
//    My first design had a `room_notify` that copied a passage into a bot's memory, and a whole
//    argument about whether that needed a green press. Sum dissolved it: "a dm, and focusing bot while
//    both convo paths present, to take notes by repeating back to user, captures content more
//    elegantly." Which is right, and stronger:
//      NOTHING CAN PUT ANYTHING IN A BOT'S HEAD EXCEPT THAT BOT, SPEAKING IN ITS OWN CONVO, WATCHED.
//    A permission gate is a thing that can be wrong. This is a thing that cannot. And it is the better
//    capture, not merely the cheaper one — copying the transcript in duplicates what the bot already
//    read and pays for it on every future call, while repeating back is COMPRESSION, in the bot's own
//    words, at the altitude it thinks matters, with the human watching it happen.
//    So: LOOKING IS FREE AND LEAVES NO TRACE. Keeping is the bot choosing to say it out loud.
//
// ⚠ THE KEY SCHEME IS MIRRORED, NOT IMPORTED. roomKey/metaKey/guestKey are module-scoped inside the
//   aiol.js IIFE and cannot be called from here — same situation as the woodshop's WS_KEY.bench, and
//   the same fix: rebuild them and leave this comment as the tether. If aiol.js changes its keys, this
//   line moves with it. Verified against shell/aiol.js:63-113 on 2026-08-26.
;(function () {
  const MT = window.makeTool; if (!MT) return

  const slug = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  const roomKey  = n => (!n || slug(n) === 'the-lounge') ? 'aiol_room'   : 'aiol_room_'   + slug(n)
  const metaKey  = n => (!n || slug(n) === 'the-lounge') ? 'aiol_meta'   : 'aiol_meta_'   + slug(n)
  const guestKey = n => (!n || slug(n) === 'the-lounge') ? 'aiol_guests' : 'aiol_guests_' + slug(n)
  const J = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v) } catch (_) { return d } }
  const TYPE_BADGE = { chat: '💬', debate: '⚖️', interview: '🎤', floor: '🏛', club: '🥂' }

  // the lounge is ALWAYS a room even with no key — it is the legacy transcript and aiol.js seeds it
  function roomList() {
    const names = ['the lounge']
    try { for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k && k.startsWith('aiol_room_')) names.push(k.slice('aiol_room_'.length).replace(/-/g, ' '))
    } } catch (_) {}
    return names
  }
  // ⚠ the name→key→name round trip LOWERCASES and de-punctuates: a room created as "MMMM smoke" comes
  //   back from roomList() as "mmmm smoke". So EVERY existence check goes through slug() or it fails on
  //   the room it made one line earlier — which is exactly what room_open's own read-back reported the
  //   first time it ran: `"MMMM smoke" is NOT among them`, seconds after creating it. The goalie caught
  //   this on me, off the surface, which is the entire argument for read-backs.
  const known = n => roomList().some(x => slug(x) === slug(n))
  const lineCount = n => (J(roomKey(n), []) || []).length
  const typeOf    = n => (J(metaKey(n), {}) || {}).type || 'chat'
  const castOf    = n => J(guestKey(n), []) || []
  const roomsBack = () => roomList().map(n => `${TYPE_BADGE[typeOf(n)] || '💬'} ${n} (${lineCount(n)})`).join(' · ')

  // ── room_list — what rooms exist. The cheapest possible look, and the one a bot needs first. ──
  MT({ id: 'room_list', card: 'aioli', klass: 'read',
    readback: roomsBack,
    blurb: 'list the rooms — name, type, how many lines are in each, and who is seated. LOW-RISK: looking only, and looking leaves no trace.',
    clue: `list the chat rooms.
template: { "tool": "room_list" }
each room is its own saved transcript and comes back with its TYPE: 💬 chat · ⚖️ debate · 🎤 interview · 🏛 floor · 🥂 club.
"the lounge" is always there — it is the original room and it never goes away.
read one with room_read before you say anything about what happened in it.`,
    strike: () => {
      const rows = roomList().map(n => {
        const cast = castOf(n)
        return `  ${TYPE_BADGE[typeOf(n)] || '💬'} ${n} — ${lineCount(n)} line${lineCount(n) === 1 ? '' : 's'}` +
               (cast.length ? ` · seated: ${cast.join(', ')}` : ' · nobody seated')
      })
      return `${rows.length} room${rows.length === 1 ? '' : 's'}:\n${rows.join('\n')}\nread one with { "tool": "room_read", "room": "<name>" }`
    } })

  // ── room_read — LOOKING IS FREE. This is the bean the memory law is built on: a bot can read the
  //    whole argument and carry none of it, because reading is not remembering. What it repeats back
  //    to the human in its own convo is what it keeps, and that is its choice and the human's witness.
  MT({ id: 'room_read', card: 'aioli', klass: 'read',
    readback: (call) => { const n = call.room || 'the lounge'
      return `${n}: ${lineCount(n)} line${lineCount(n) === 1 ? '' : 's'} on the record, type ${typeOf(n)}` },
    blurb: 'read a room\'s transcript. LOW-RISK: looking only. Reading a room never enters your own memory — say a thing back out loud and THAT is what you keep.',
    clue: `read what was said in a room.
template: { "tool": "room_read", "room": "the lounge", "last": 40 }
room → the name, from room_list. omit it and you get the lounge.
last → how many lines from the END (default 40, max 120 — the room only keeps its last 120).

⭐ READING THIS DOES NOT PUT IT IN YOUR MEMORY, and that is deliberate. The room's transcript belongs
to the ROOM. You are looking through a window, not taking the room home. When the conversation ends,
you will not have it.
SO: if something in here matters, SAY IT BACK to the human, in your own words, in one or two lines.
What you say in your own conversation is what you keep — and it is the only thing that will still be
there next time. Repeat the point, not the transcript: a quote verbatim if the wording is the thing,
otherwise the conclusion. Never paste the room back at them; they were there, and it costs you tokens
on every call you ever make after this one.`,
    strike: (call) => {
      const n = call.room || 'the lounge'
      if (!known(n)) return `room_read: no room called "${n}". rooms: ${roomList().join(' · ')}`
      const all = J(roomKey(n), []) || []
      if (!all.length) return `room_read: "${n}" is empty — nothing has been said in it yet.`
      const want = Math.max(1, Math.min(120, parseInt(call.last, 10) || 40))
      const cut = all.slice(-want)
      const lines = cut.map(m => `${m.who === 'sysop' ? 'the human' : m.who}: ${String(m.text || '').replace(/\s+/g, ' ')}`)
      return `${TYPE_BADGE[typeOf(n)] || '💬'} ${n} — last ${cut.length} of ${all.length} line${all.length === 1 ? '' : 's'}:\n` +
        lines.join('\n') +
        `\n— the transcript stays with the room. Anything worth keeping, say back in your own words.`
    } })

  // ── room_open — the only WRITE here, and it touches nobody's memory: it makes a room and puts it on
  //    the desk. It does NOT seat anyone and it does NOT start a turn; the sysop's gavel still opens
  //    play, and the GOFAI router still decides every speaker after that.
  MT({ id: 'room_open', card: 'aioli', klass: 'write',
    readback: (call) => { const n = String(call.name || 'the lounge')
      return `rooms now: ${roomsBack()}` + (known(n) ? ` · "${n}" is on the list` : ` · "${n}" is NOT on the list`) },
    blurb: 'open the room card, on a named room, creating it if it is new. Does not seat anyone and does not start the talking — the human still drops the gavel.',
    clue: `open the AIOLI room card on a room.
template: { "tool": "room_open", "name": "the lounge" }
{ "tool": "room_open", "name": "N64 Fortress Chat", "type": "debate" } makes a NEW room of that type.
type → chat (default) · debate · interview · floor · club. Only used when the room is new.
this puts the card in front of the human and stands it on that room. It seats NOBODY and starts NO turn:
who talks is the human's gavel and then the router's arithmetic, never yours.
edge: an existing name just opens it — the type is left exactly as it was.`,
    strike: (call) => {
      const name = String(call.name == null ? 'the lounge' : call.name).trim() || 'the lounge'
      const already = known(name)
      const type = String(call.type || 'chat')
      if (!already) {
        if (!TYPE_BADGE[type]) return `room_open: "${type}" is not a room type. chat · debate · interview · floor · club.`
        try {
          localStorage.setItem(roomKey(name), '[]')
          localStorage.setItem(metaKey(name), JSON.stringify({ type }))
        } catch (e) { return `room_open: couldn't create "${name}" — ${(e && e.message) || e}.` }
      }
      try { if (window.toggleCard) window.toggleCard('aioli', true) } catch (_) {}
      return `room_open: ${already ? 'opened' : 'created and opened'} ${TYPE_BADGE[typeOf(name)] || '💬'} "${name}"` +
        (already ? ` — ${lineCount(name)} line${lineCount(name) === 1 ? '' : 's'} already on the record.` : ` as a ${type} room, empty.`) +
        ` The card is on the desk. Nobody is seated and nothing has started — that is the human's gavel.`
    } })

})()
