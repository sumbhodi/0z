# agents — build notes

*the agent system: the dimensions · named injections · the woodshop stack assembler · presets.*
*captured from Sum, 2026-06-14 (refined across the session — this supersedes the earlier draft).*

---

## the model — an agent is a STACK

**role + bot are GONE.** an agent is just an agent. its dimensions:

```
name       — what it's called
skin       — its look → its ICON (the icon is linked to the skin)
model      — its brain (from your saved-key providers)
injection  — its soul: identity · ethics · persona · bio · what-was-"role" all live INSIDE it
```

candidate 5th: **tools** — the *custom tool box* (the tutor's = course-builder + web search).
the difference between an agent that only talks and one that acts. can live inside the
injection (a "capabilities" section) or be its own dimension. (open.)

**the roster** (preloaded, each with its injection): toto · coder · writer · lumberjack · tutor · nurse · + customs.
baked personas:
- **toto** → a they/them CLONE (not the original); implanted memories of Kansas + an Oz that's a dystopian online big-box store (Costco from Idiocracy) — "still under construction, can do no harm yet." cash-or-death gallows voice. (seeded into `toto_bot_toto_*` once; engine.js `AGENT_DEFAULTS`.)
- **bub** → woodshop · **the nurse** → the injection / patient.

**cash or death** (future agent) — turns EVERY response into an ad with a link to an **ozhunga** product. the dystopian salesbot: religion-as-branding, wall-to-wall ads — the joke toto's oz-memories set up (oz = Costco from Idiocracy). a persona/tool layer over any model; lean into the cash-or-death voice.

**agent scope (Sum, 2026-06-15):** **toto** is unscoped — can do anything, roams the whole OS.
baked personas are SCOPED to their card: **nurse** → only the injection config page (choose /
drop / edit any text there); **bub (lumberjack)** → only the woodshop (same rules). a scoped
agent acts within its page; toto roams.

---

## two surfaces

**injection config = the NAMED injection creator.**
the patient-intake builder (3 columns) → produces a **named injection**.
preloaded bots come with theirs; or **＋ name a new one.**
**role dropdown REMOVED** — it's agent · model · skin → the injection.
**right column stays the PREVIEW** (the assembled injection) — presets live in the woodshop, not here.
port deltas (task #22): server→localStorage · rig→stub · **IP-strip historian/suggestor/rabbit.**

**woodshop = the agent ASSEMBLER (stacks).**
a custom agent is a **stack** of blocks:
- blank stack → first block = **injection** (chooser/name) · then a **chat** block.
- both blocks **burnable** (drag to kindling — the oz remove gesture).
- a **preset shelf** (below) — drag presets onto the stack.
- **save.**
- the woodshop **dropdown = add new agent** → a new blank stack (injection chooser + chat), named, skinned.

**add-agent defaults (Sum, 2026-06-14):**
- woodshop just **names a stack** + assigns the **NEXT skin in the list** (so each new agent looks different).
- model defaults to the **FIRST llm in the list** — until you change it in the **folder** (injection config) or **gear** (settings). per-agent keys `toto_bot_<id>_model` / `_skin` already link all three.
- **# of agents you can make = # of skins loaded** (one skin per agent — skins are the limit).
- the agent's **icon comes from its skin**, and shows in **settings** (the bot sub-bar pills).
- **settings → injection (folder) + woodshop (axe)** links wired. ✅

---

## presets — live in the WOODSHOP

the **woodshop** holds a **preset shelf** — reusable saved blocks (an ethics set · a persona ·
a backstory · a tool box · a whole named injection). NOT in the injection config — that keeps its preview.

- **add** a preset → drops it onto any agent (a block on the stack).
- **remove** it from the agent.
- **burn** the preset → deletes it from the shelf (kindling).
- **save = make a preset.** *"saved your work"* — your custom block becomes reusable on every agent.

> build a block once → save it → it's a preset on the woodshop shelf → add to any agent. build once, reuse everywhere.

---

## the make-an-agent flow

```
woodshop → add new agent → blank stack (injection chooser + chat)
   → injection config → create a named injection (agent · model · intake fields · presets)
   → back to woodshop → choose that injection
   = custom agent: stack + skin(+icon) + model + the named injection
```

---

## status / next

- settings agent config (per-agent name/pronouns/backstory/persona/model/injection). ✅
- nurse in the roster. ✅
- **next (when wiring):** injection config port (task #22 — drop role/bot, named injections, presets shelf,
  IP-stripped, localStorage) · woodshop stack assembler (task #29 — blank stack, burnable blocks, dropdown=add new agent).

*the file is the memory. gowf.*
