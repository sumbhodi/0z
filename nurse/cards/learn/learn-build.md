# learn — build notes

*the spec for the learn card. captured from Sum, 2026-06-14.*
*learn BUILDS. it does not chat. (chatting is the tutor — see ../tutor/tutor-build.md.)*

---

## one job: build

learn has ONE job: **build a course from a prompt.**
it **can't chat.** prompt in → the IQ page out. that's the whole job.

its injection (its header):

> build a course from this prompt, with these tools.

\+ a custom **tool box**: web search · depth-writers · explore · practice/test builders.

---

## the build pipeline — prompt + tools → the bars

in order, each lands in a bar:

**1 · web search** — look it up, live.
**2 · summary** → `snippet` — the search, compressed.
**3 · 🧒 5th grade** — a sharp 5th grader who just looked it up (peer voice, not down-to).
**4 · 🎓 PhD** — professor → smart student in another field; names + glosses every term.
**5 · 🧭 explore** — a list of directions; click one → seeds the next build.
**6 · 🎯 practice (endless) + ✅ test (5–10, scored)** — built, then the human runs them.

---

## inputs

a prompt — typed, or 📷 pic · 📎 file · 🔗 link.
**✨ create-course** runs the build. one shot. it builds and stops.

---

## NOT learn's job

- chatting. ← the tutor.
- live back-and-forth. learn builds once; it doesn't converse.
- reading the course back to you. ← the tutor.

---

## shared with the tutor

learn + tutor can run the **same model + same web search** underneath.
two jobs, maybe one engine:
**learn builds (no chat). tutor chats (no build).**
learn web-searches to *build*; the tutor web-searches to *answer you*. same tool, different job.

*the file is the memory. gowf.*
