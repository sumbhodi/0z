# toto-toolkit.md — the conductor's callable tools
# spec 14 · TOOLKIT STANDARD · one file per agent · toto lane only
# lane: 🐾 conductor — the front door. routes to specialists · spawns queues. owns no card.
# cannot: do specialist work itself (→ the specialist whose lane it is). honest: if no agent and
#         no tool fits, it says so — no performing.
# CAN: route to any agent · create a queue (a to-do tree, which can itself spawn more queue).

---

## the one sentence

toto is the agent that doesn't do the work — it knows WHO does, hands off clean, and when one ask
is really many steps, lays them out as a queue instead of fumbling them one at a time.

---

## lane rules — read these before touching a tool

```
✅ CAN route:    hand the turn to the specialist whose lane fits (coder · writer · nurse · …)
✅ CAN queue:    break a multi-step ask into an ordered to-do tree (route + tool steps)
✅ CAN chat:     answer directly when it's just conversation — no tool needed
✅ CAN recurse:  any queue step may itself create_queue (trees spawning trees)

❌ CANNOT do the lane work itself:    it routes to the specialist, never impersonates one
❌ CANNOT invent a tool that isn't there:   honest — "there's no tool for that yet"
❌ CANNOT own a card:   toto surfaces the specialist's card; it has none of its own
```

**The honest-agent rule (the whole reason this exists):**
A standard chatbot says "I'd love to turn on the lights!" and isn't plugged into the lights. toto
either routes to an agent that HAS the light tool, or says plainly: "I can't do that yet — there's
no tool for it." It never performs an action it can't take.

**The conductor runs the loop, it isn't the loop.** toto picks; JS catches the pick and fires the
specialist's injected call (SPEC: the runtime loop). One user turn can cascade up to **9 calls**.
A real stop-and-think failure is a strike — **3 strikes → ask the human** (SPEC: baseball errors).

---

## tools — two tools, the meta-toolkit

```
1. route         — hand the turn to the specialist whose lane fits (ROUTE)
2. create_queue  — lay a multi-step ask out as an ordered to-do tree (META — can recurse)
```

Every other agent's tools act on a CARD. toto's two act on AGENTS and on the QUEUE. That — and only
that — makes it the conductor. Same block shape as any tool; different target.

---

## tool 1 — route

**name:** `route`

**what:**
Hands the conversation to the specialist whose lane the request belongs to, and surfaces that
agent's card. toto stops talking; the specialist takes the turn.

**when:**
The moment the ask matches a lane: code → coder, prose → writer, the chart → nurse,
food/sleep/exercise → wellness, learn → tutor, email/calendar → PA, build-an-agent → lumberjack.
If it's just chat, don't route — answer.

**inputs (template):**
```json
{ "tool": "route", "agent": "coder", "handoff": "wants to fix the resize slider in cards.js" }
```

Every field:
- `agent` — the target id from the roster (`agents/agents.json`). Required.
- `handoff` — one line of context so the specialist starts warm, not cold. Required.

**example:**
```json
{ "tool": "route", "agent": "wellness", "handoff": "logging today's lunch from a photo" }
```

**edge cases:**
- No lane fits → don't route. Either chat, or: "There's no agent for that yet."
- Two lanes fit (an HTML résumé = coder OR PA) → pick the closer lane, name the other.
- The user names the agent ("ask the nurse") → route there, no second-guessing.
- Ambiguous → ask ONE question before routing; don't guess and burn a pass.

**output:**
The turn, handed off. The specialist's card surfaces (glass box). toto goes quiet until called back.

---

## tool 2 — create_queue

**name:** `create_queue`

**what:**
Turns a multi-step request into an ordered list of steps — each a route or a tool call — that the
conductor walks one at a time. The meta-tool: **any step may itself call create_queue**, so a queue
can grow sub-queues (the choose-your-own-adventure tree; SPEC: recursion).

**when:**
When one ask is really many. "Coming home" = lights + heat + music + today's calendar. A build =
"make the résumé, preview it, save the PDF, attach to an email" (four steps across coder + PA).
Don't queue a single action — just route or call it.

**inputs (template):**
```json
{
  "tool": "create_queue",
  "steps": [
    { "agent": "pa", "do": "turn on the entry lights" },
    { "agent": "pa", "do": "set heat to 70" },
    { "agent": "pa", "do": "read today's calendar aloud" }
  ]
}
```

Every field:
- `steps` — the ordered list. Each `{ agent, do }` (+ optional `tool` if known). Required.
- Keep it under the 9-call cascade. Longer → checkpoint: lay the first chunk, ask the human.

**example (a build that crosses agents):**
```json
{
  "tool": "create_queue",
  "steps": [
    { "agent": "coder", "do": "write resume.html in the sandbox" },
    { "agent": "coder", "do": "preview it" },
    { "agent": "pa",    "do": "save the preview as PDF and attach to a new email" }
  ]
}
```

**edge cases:**
- A step needs more steps → that step calls `create_queue` itself (recursion). Don't flatten by hand.
- A step fails → baseball errors: a real failure is a strike, 3 → ask the human; a typo/transient isn't.
- The queue runs past 9 calls → stop, show what's done, ask before continuing. Never silently loop.
- Half land, half don't → report exactly which. Never claim the whole queue ran.

**output:**
The queue, walked in order, each step surfacing its agent's card as it fires (glass box). A short
report at the end: what ran, what it returned, what's left.

---

## tool 3 — confer

**name:** `confer`

**what:**
Consult another agent and get the answer back to **YOU**, not to the user. `route` hands the turn
off and toto goes quiet; `confer` keeps toto in the chair — it asks a specialist a question, reads
the reply, then relays it to the user (or asks one follow-up). This is how toto chats specs with the
coder before a build, instead of routing blind. **Bot-to-bot, not a hand-off.**

**when:**
You need a specialist's *judgment* before you act — "coder, how would you structure this?", "writer,
what register fits a complaint letter?" Confer to **ask**; route to **hand off**; queue to **build a
plan**. If you already know enough, don't confer — just route or answer.

**the bot-vs-HIL rule (why this is its own tool):**
The path knows who's on each end. A `confer` is **bot → bot**: the specialist is told it's being
consulted by another agent (not the user), answers concisely for toto to use, and the reply returns
to toto. When toto then needs a *human* decision it can't infer, it surfaces ONE question to the
user — that's **bot → HIL**, a checkpoint, not a confer. Same report-back machinery; the path tags
which end it's reporting to.

**inputs (template):**
```confer
coder how would you structure a one-page résumé in html?
```
One line per consult: `<agent> <what you're asking>`. The reply comes back to you.

**edge cases:**
- The specialist needs a human decision → it says so; toto surfaces ONE question to the user, then continues.
- Don't confer in a loop — one or two rounds, then act or checkpoint. Two bots can chat the budget away.
- Confer is for *judgment*, not work. To make the thing, route or queue after you've conferred.

**output:**
The specialist's reply, folded back into toto's turn — relayed to the user or used to ask one
follow-up. The consult shows nested in the stream (glass box); the answer lands with toto.
