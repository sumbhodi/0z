# wellness ↔ food — the toolkit contract (for the woodshop)

Notes for the **wellness toolkit** you assign in the woodshop. Wellness's job: *read a photo, link resources, and **edit the food doc.*** This is what it needs to be able to find and change.

## the one doc (shared state)

The food card writes the whole food plan/log to the sandbox on every change:

```
window.SANDBOX['food-plan.json'].data  // JSON string
```

Shape:

```json
{
  "day": "Wed · Mar 26",
  "goal": 3066,
  "meals":  [ { "d": "2026-03-26", "t": "18:00", "n": "Ham & cheese sandwich",
               "kcal": 660, "p": 30, "f": 33, "c": 56, "status": "planned|eaten",
               "sv": { "fr": 0, "vg": 0, "cb": 1, "pr": 1, "al": 0, "sw": 0 } } ],
  "pantry": [ { "k": "chicken", "icon": "🍗", "n": "chicken", "u": "portions",
               "ct": 2, "mx": 5, "st": "ready|prepped|stocked|buy", "exp": "4d", "note": "" } ]
}
```

## what wellness must be able to find + edit

Every **button, symbol, name, and value** on the food card maps to a field here:

| on the card | the field | wellness edits it to… |
|---|---|---|
| the little card's **emoji/emoticon** | `pantry[].icon` (3-char max) | give an item a custom icon |
| the **name** | `pantry[].n` / `meals[].n` | rename |
| the **−/＋ count** + dot-grid | `pantry[].ct` (0..`mx`) | set how many you have |
| the **state section** (Eat Now / Prep / Grocery) | `pantry[].st` | move buy→stocked→prepped→ready (the **prep push**) |
| the **macros** | `meals[].kcal/p/f/c` | log a read meal (grams) |
| the **servings** (Log week/month table) | `meals[].sv` = `{fr,vg,cb,pr,al,sw}` | count food-group servings: 🍎fruit 🥦veggies 🍞carbs 🍗protein 🍺alcohol 🍰sweets |
| **planned vs eaten** | `meals[].status` | flip expectation → reality |

## the tools to give it (in the woodshop)

1. **read_food_doc** — parse `food-plan.json` (see current pantry + log + container notes for the math).
2. **edit_food_doc** — write items back: add/rename, set `ct`/`st`/`icon`, push `stocked→ready` (the prep step), append a meal with macros.
3. **web search** (already engine-level) — for "link resources."

## the one wire still open on the card side

The card **writes** the doc but doesn't yet **watch** it. Add a small watcher: poll/observe `food-plan.json`, and on change re-render the food card. Then: *photo → wellness reads → edits the doc → card updates,* with no refresh. (Currently: photo → cache → wellness reads & responds in convo; the write-back loop closes once `edit_food_doc` exists + the watcher is wired.)

## the vibe (already in the persona)

Wide grocery-pile shot → it asks for **close-ups on ingredient lists + nutrition panels** (reads what a human reads, **no barcodes**). At prep it uses **known container sizes + the log** for the math (~330 kcal/container of nuts, ~650 for a whole caesar, ramekins for dressing). Estimates always flagged as a guess. Can't prescribe/diagnose/treat — the super glue's all dried up.
