# tutor — build notes

*the spec for the tutor agent. captured from Sum, 2026-06-14.*
*the tutor CHATS. it does not build the course. (building is learn — see ../learn/learn-build.md.)*

---

## one job: chat

the tutor **can chat.** it does **NOT build the course** — learn does that.

the tutor:

- **enters a prompt** — composes / sends a prompt for learn to build from.
- **reads the learn card WITH the user** — walks the open course, live.
- explains at **any level** — 5th ↔ PhD, on demand, in chat.
- takes **any persona** the user asks for.
- **adapts by asking** — *"want me to break it down? go simple, or dive deep?"*

---

## the line — don't cross it

```
learn  = builds.  can't chat.      (a prompt → the IQ page)
tutor  = chats.   doesn't build.   (enters a prompt · reads it WITH you)
```

the tutor never writes the course.
it points at the course learn built, and talks you through it however you need.

---

## inputs

**pic · file · link** — the tutor turns any of these into a prompt for learn.

---

## shared with learn

tutor + learn can run the **same model + same web search** underneath.
same engine, two jobs.
the tutor can web-search mid-chat to answer you; learn web-searches to build.
same tool — different job.

---

## status

- tutor agent on screen: blue skin, dockable edge bar. ✅
- opening lines pitch the adaptive offer (any level · any voice · break-it-down/simple/deep). ✅
- **next (live, BYOK):**
  1. the tutor reads the open course + chats at any level / persona.
  2. the tutor composes a prompt → hands it to learn to build.
  3. its persona authored in the injection builder (per-agent system prompt + BYOK).

*the file is the memory. gowf.*
