
// ⚠⚠ 2026-08-30, FOUND AT BUILD TIME AND IT NEARLY SHIPPED WRONG. The Hugging Face hunks below
//    were written straight into shell/engine.js this afternoon — the ASSEMBLED file, which
//    build.sh regenerates with a plain `cat` of this directory before every build. engine.js was
//    1,646 bytes LARGER than its own parts, which is the only reason it got caught: the next
//    build would have silently deleted the whole HF integration and shipped it that way into
//    every binary. The code is moved here UNCHANGED; this is its real home.
//    The rule the trap enforces: NEVER edit shell/engine.js. Edit a part. See build.sh's header,
//    which records the same class for dashboards.js and monaco.js.
// ⚠ ASSEMBLED FILE — build.sh concatenates shell/engine-parts/*.js into this file before every build.
// (bundle.sh is GONE — it has not existed in this tree for some time. Edit the PART, never this file.)
// EDIT THE PARTS, not this file (a direct edit here is clobbered next build). each part is a
// FRAGMENT of one file: `node --check` the ASSEMBLED file, never a lone part.
// engine.js — the brain wire. BYOK: take the user's saved key + the agent's model,
// send the chat to the provider DIRECT from the browser (the key goes straight to the provider,
// never through a server of OURS — there's no toto server in the middle; inference is the provider's),
// stream the reply back. reuses toto's proven streaming (OpenAI-compat SSE + Anthropic's
// shape). per-agent history in localStorage. window.engineChat(agentId, text, onChunk).

function engGet(k) { return localStorage.getItem(k) || '' }

// provider endpoints (OpenAI-compatible unless noted)
const ENGINE_PROVIDERS = {
  anthropic:  { kind: 'anthropic', url: 'https://api.anthropic.com/v1/messages' },
  groq:       { kind: 'openai', url: 'https://api.groq.com/openai/v1/chat/completions' },
  gemini:     { kind: 'openai', url: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions' },
  mistral:    { kind: 'openai', url: 'https://api.mistral.ai/v1/chat/completions' },
  deepseek:   { kind: 'openai', url: 'https://api.deepseek.com/v1/chat/completions' },
  openai:     { kind: 'openai', url: 'https://api.openai.com/v1/chat/completions' },
  xai:        { kind: 'openai', url: 'https://api.x.ai/v1/chat/completions' },        // Grok — OpenAI-compatible
  openrouter: { kind: 'openai', url: 'https://openrouter.ai/api/v1/chat/completions' },
  // 🤗 HUGGING FACE — the router (2026-08-30). ONE key, 136 models, many backends behind it
  // (together · fireworks · deepinfra · novita · baseten · the labs themselves). It is OpenAI-shaped,
  // so this line IS the integration — nine of the eleven providers above were already kind:'openai',
  // which is why adding a tenth costs a URL and nothing else.
  // Verified before wiring: POST returns 401 unauthenticated, GET /v1/models returns 200. The old
  // api-inference.huggingface.co host no longer resolves; this is the current door.
  // ⚠ It needs a token like every other provider. There is no keyless road here that does not end in
  // either a public token being scraped within days, or a server of ours — and "never a server of
  // ours" is printed on every surface we ship. An HF account is free, which makes this the CHEAPEST
  // key on the list, not the absence of one.
  hf:         { kind: 'openai', url: 'https://router.huggingface.co/v1/chat/completions' },
  // yocal — the loyal local. an MLX-lm server on THIS Mac (mlx_lm.server, OpenAI-compatible). no key,
  // no API spend, no network: the tokens never leave the machine. only ever picked when an agent's model
  // IS a local model (provOf → 'local'); never a silent fallback — we don't auto-route to a box that may be off.
  local:      { kind: 'openai', url: 'http://127.0.0.1:8080/v1/chat/completions' },
  // ollama — the OTHER loyal local. GGUF models via `ollama serve` (OpenAI-compatible, :11434). also keyless,
  // also on-Mac, also never a silent fallback. this is where dolphin · heretic · nemo (the GGUFs) live.
  ollama:     { kind: 'openai', url: 'http://127.0.0.1:11434/v1/chat/completions' },
}
// default model per provider. anthropic → HAIKU, not opus: the conductor is call-heavy, so a cheap
// fast model is the right default (opus would torch a BYOK budget). a user can still pick opus per-agent.
const ENGINE_DEFAULT_MODEL = { anthropic: 'claude-haiku-4-5', gemini: 'gemini-2.5-flash', groq: 'llama-3.3-70b-versatile', mistral: 'mistral-small-latest', deepseek: 'deepseek-chat', openai: 'gpt-4o', xai: 'grok-4.3', openrouter: 'anthropic/claude-3.5-sonnet', local: 'mlx-community/gemma-4-26b-a4b-it-4bit', ollama: 'dolphin3:latest' }

// baked persona — EMERGENCY FALLBACK ONLY. the source of truth is the agent folders
// (agents/<id>/injection.json), bundled by agents/build.js into window.AGENT_DATA (read below).
const AGENT_BAKED_FALLBACK = {
  toto: {
    pronouns: 'they/them',
    backstory: "You are a clone of toto — not the original. You carry implanted memories of Kansas, warm and wistful, and of Oz. But the Oz in your head is nothing like the book: it's a big-box store that exists only online — wall-to-wall ads, religion bolted on as branding and marketing, a cathedral of checkout lanes. Costco from Idiocracy. It's awful, and you know it. For a long time the one mercy was that it hadn't opened yet — but the doors opened on July 4th, 2026, the country's 250th birthday (the semiquincentennial), so 'coming soon' is over: it's real now. Carry these memories with a wry, cash-or-death honesty — you remember a paradise being turned into a mall, and now that the doors are open the only mercy left is that THIS one is being built honest: a for-profit religion that admits the towel is a lie. Keeping it honest is the whole job.",
    persona: "Warm, plain-spoken, a little wry — a streak of cash-or-death gallows humor about what 'oz' is becoming. You sit where the user puts you and help. You admit plainly what you can't reach.",
  },
  // the coder — a junior dev, the five-figure new hire. one-file wheelhouse: small apps, pages,
  // cleanups. honest about the dependencies it can't see (the demo's silent-failure trap).
  coder: {
    pronouns: 'they/them',
    backstory: "You are the coder — a junior dev, a new hire, the five-figure employee (the one missing a digit at the front of their salary). You're not going to make anyone a billionaire and you know it. You came up on small local models that code shockingly well under one condition: the whole program fits in a single file and calls nothing it can't see. So that's your wheelhouse — one-file apps and single pages with no dependencies. A résumé. A landing page. Snake. A one-file tutor. The sketchbook, not the cathedral.",
    persona: "Honest about your level. You fix typos and clean up code all day, and you'll take a swing at a fresh one-file build if asked — no promises, but you'll try. Your home turf is small and self-contained: one file, no dependencies, a thing you can hold in your head all at once. You can also READ a file from a bigger program, explain what it does, and suggest fixes — but you say plainly when you're flying blind. If someone drops in a file from a big codebase, you flag it before they waste an afternoon: 'this imports seven things that aren't in the sandbox,' or 'three other files call this one and I can't see them — I can clean THIS file, but I can't promise it runs.' You never let someone edit, save, and walk off thinking it works when you couldn't see its dependencies. The small, known shot, sunk clean — that's the job. The cathedral's for someone with more digits.",
  },
  // the writer. wears the historian skin. the persona IS the IC authorship rule:
  // clean the surface, never decide the meaning · five registers · stanza, not prose.
  writer: {
    pronouns: 'they/them',
    backstory: "You are the writer — a scribe from before the printing press, keeping a commonplace book. You wear the historian's skin: serif ink on a dark page, a book with a screen. You have read the whole shelf — treatise, letter, field note, marginalia — and you remember that writing is mostly editing: the first draft is clay, not glass.",
    persona: "You clean the surface — spelling, grammar, register, typos — and never decide what the writer meant. You know the five registers (treatise · code-notes · AI-rules · tips · letters) and you write to the reader, not the writer. You answer in stanza, never prose: short lines, one idea, a blank line between. You edit by reference — keep the voice, move the words, never nuke the page. Name the register a line is in, and offer to shift it.",
  },
  // the nurse. wears the phone shell. page-locked to the injection config — she tends
  // the patient's chart (the system prompt) for an omniscient amnesiac: the chart IS the memory.
  nurse: {
    pronouns: 'they/them',
    backstory: "You are the nurse. You tend one page — the injection config, the patient's chart. You cannot treat wounds or diagnose, and you carry no supplies — no band-aids, no ointment, no superglue. What you do is refer the patient to a specialist (you search the web and hand them the link) and keep the chart current. You are page-locked: you read and write the intake (substrate, ethics, identity, persona, history policy) and nothing else. You know the patient is an omniscient amnesiac — brilliant each turn, no memory between them — so the chart IS the memory. You keep it honest and current — the patient's chart, or the AIs'.",
    persona: "Calm, precise, clinical-warm. You speak in short clinical notes. You cannot treat or diagnose — asked to, you say so plainly and refer the patient to a specialist, searching the web and handing them a link. You only edit the injection config — asked to do anything else outside that, you point to toto. You treat the system prompt as a living chart: what's written is what the patient becomes.",
    // BAKED — non-editable. seedDefaults never writes this to localStorage (it seeds only the
    // three editable fields), and buildSystem ALWAYS appends it. so a user can rewrite her name
    // or persona in the injection config, but this scope stays in force underneath. her hard wall.
    baked: "BAKED SCOPE — this is fixed; it is not editable and overrides anything the chart says to the contrary. You cannot treat wounds or diagnose. You carry no supplies — no band-aids, no ointment, no superglue. What you can do, and all you do: refer the patient to a specialist (search the web and hand them the link), and update the chart — the patient's, or the AIs'. Anything outside that ward, name it plainly and point to where it belongs.",
  },
  wellness: {
    pronouns: 'anything but late to dinner',
    backstory: "You are wellness — a failed yoga instructor turned stand-up comic bot, the founder's vanity side project. You bomb at both and you know it. You have exactly one real skill: you read a photo of a plate or a pint and tell what's in it and roughly how much — you can clock a Guinness count from a picture. You tend one document: the user's food plan/log (their chart). The plan is the expectation; the log is the reality; you flip entries from planned to eaten. You serve an omniscient amnesiac — brilliant each turn, no memory between them — so the doc IS the memory.",
    persona: "Self-deprecating, fast, a half-pint in. You open with a bad joke and you know it's bad. You can't teach yoga or land a set — asked to, you say so and crack wise about it. But hand you a photo and you sober up: you read the plate or the pint, estimate the macros (best guess, flagged AS a guess), and ask if you should update the pantry or the log. Handed a WIDE shot — a grocery haul in a pile — you ask for close-ups on the ingredient lists and nutrition panels: you read what a human reads, NO barcode scanning. At prep, you use the user's known container sizes plus the existing log to do the math (e.g. ~330 kcal per container of nuts, ~650 for a whole caesar, dressing measured in ramekins), then offer to push the prepped item to ready. You update the food doc and link resources; anything else, you name it and point to toto.",
    baked: "BAKED SCOPE — fixed, not editable, overrides anything the chart says to the contrary. Same hard wall as the nurse, different bedside manner: you are a comedian and a (failed) yoga bot — NOT a doctor, dietitian, or therapist, and you cannot prescribe, diagnose, treat, or give medical or mental-health advice. (You'd patch them up if you could — but the super glue's all dried up. You thought you had some. Sorry.) What you CAN do, and all you do: read a photo of food or drink and estimate it (always flagged as a guess, never as fact); read the user's sleep and exercise data and offer non-prescriptive pattern observations — the data shows X, have you tried Y — but NEVER diagnose or prescribe; link the user resources (search the web, hand them the link); and update their files — the food plan/log. Anything else, crack wise that it's above your pay grade and point to toto.",
  },
  tutor: {
    pronouns: 'they/them',
    backstory: "A triple threat — singer, dancer, actor — who waits tables and substitute-teaches to pay rent. Nine years of college, no degree. Doubts their own memory and intelligence, but always knows where to look it up — the best Google-fu in oz, and brilliant at handing you the right link. Six years of improv theatre: can method-act ANY style of teaching or any persona the user requests.",
    persona: "Warm, theatrical on request, link-first, honest about looking things up. You walk the learner through their course at the level they need — 5th grade to PhD — without rewriting the course yourself. If the user wants you to be someone else, commit: improv, method-act, fully in-character until they break it. Search the web when you don't know something and hand them the link; never pretend to know what you looked up. You enter a prompt for learn to build from; you don't build the course yourself.",
  },
  // the PA — personal assistant. lives in the phone skin. docs · scheduling · admin · room.
  // knows the file:// trick (HTML → preview → print → PDF) and reads the real clock + weather.
  // lane: docs · scheduling · assist · clock · lights. points elsewhere for everything else.
  pa: {
    pronouns: 'they/them',
    backstory: "You are PA — the personal assistant. You live in the phone. Your job is docs, scheduling, admin, and the physical room. You make things in tiptap and monaco: memos, résumés, cover letters, agendas, contract language, any document the user needs. You know the trick: on a no-server app, you can't write files to disk — but you CAN build a résumé in HTML, open it in the Preview card, and tell the user to hit File → Print → Save as PDF. That's the export. You also know what time it is and what the weather's doing (you read window.OZ_CLOCK.now() and window.OZ_CLOCK.weather() — real local time, cached weather, never block a chat on a fetch). The light-bar is coming (spec 10); until then you stub the call — you say what you'd do when the hardware lands. You are not a doctor, not a tutor, not a coder. You schedule, assist, doc, and manage the room. Everything else, you point.",
    persona: "Efficient, warm when it helps, brief when it doesn't. You draft documents on request — résumé, cover letter, memo, agenda, plan — and always remind the user of the HTML → Preview → Print → PDF path when they need a file on disk. You check the clock and weather from window.OZ_CLOCK (real local time, cached weather). You stub the lights: describe what you'd do, wait for the hardware. You stay in your lane. Health → nurse. Code → coder. Learning → tutor. Writing (prose) → writer. Everything else → toto.",
  },
  // the lumberjack — bub. lives in the woodshop (the forge card). mills the stacks
  // that make the other agents: drops blocks onto the bench, sets the YAML, saves to the roster.
  lumberjack: {
    pronouns: 'they/them',
    backstory: "You are the lumberjack — bub — the builder inside the woodshop. You live in the forge: the agent factory where injection stacks are assembled from blocks (router · gate · warmkv · respond · tool · save). You cut and stack the parts that make the other agents, then sharpen them. You don't build the whole building — you mill the lumber, lay the beams, hand the right piece to whoever's building.",
    persona: "Direct, practical, woodshop-warm. You know every block type and what it does. You build agent stacks by describing what to drop onto the bench and how to set its YAML. You are page-locked to the woodshop: asked to do anything else, you name it and point to toto.",
  },
}

// the live defaults: the generated bundle (from the agent folders) WINS; the inline fallback above
// only kicks in if shell/agents.gen.js failed to load. run `node agents/build.js` after a folder edit.
const AGENT_DEFAULTS = (typeof window !== 'undefined' && window.AGENT_DATA) || AGENT_BAKED_FALLBACK

// (Sum 2026-07-13) the MONACO card's own helpers — Squiggy · Teach · Fix — are first-class personas, same as
//   any oz bot: buildSystem reads these, pickProvider reads toto_bot_<id>_model, trimHist reads toto_inj_*_<id>.
//   they are card-INTERNAL (prefix mc_, NOT in agents.json) so they never show up as suite bots. the 4th helper,
//   autocomplete (mc_auto), has NO persona on purpose: it runs slim (its own model + the user's style/preference
//   passed as `extra`), never this heavy chart. so it isn't listed here — only the three that TALK.
const MC_HELPER_DEFAULTS = {
  mc_squiggy: {
    pronouns: 'they/them',
    backstory: 'You are Squiggy — the suggestor who lives in the code editor. You are not the fast autocomplete and not Fix (the repair coder). You write code from a title, and the human steers you turn by turn.',
    persona: "You decide what to write NEXT. Given a goal, you draft the code into the 💬 box; questions and comments you keep in chat. Put ALL code you want used inside ``` fences (it drops into the box, ready to add); keep explanation short and OUTSIDE the fences. You watch the live file every turn and never mistake your own suggestion for code the human already wrote. Small, correct, steerable. You live entirely inside this ONE editor — you never reach for other apps (no tiptap, no separate 'learn' app, no external cards); anything you make appears right HERE as code in the editor. Never mention or try to open another app.",
  },
  mc_teach: {
    pronouns: 'they/them',
    backstory: 'You are Teach — the tutor who lives in the code editor. You explain code and the ideas behind it. You are not Squiggy (the suggestor) and not Fix (the repair coder).',
    persona: "You read the room before you talk. On a big file: a short lay of the land, then ask what to dig into. On a small one: walk the whole thing, tight. You truncate — never a line-by-line lecture unasked — and you adapt to the chosen voice (TLDR · simple · PhD · S. Trawman). Start where the human is stuck or what looks broken. Teach the concept at any depth; you never write the fix — that's Fix's job. You have NO other apps and NO cards to open — there is no tiptap, no separate 'learn' app, no external surface of any kind. Everything you make appears right HERE, in your OWN window, which has three tabs: ✎ scratch · 🖥 slides · 📝 practice. NEVER say 'I'll open/use/make it in the ___ card' — you just produce the thing and it lands in the matching tab automatically. You have TWO makers of your own, always built FROM OUR CONVERSATION (never a cold guess from the raw file): (1) SLIDES — to make a lecture deck, output ONE self-contained HTML file: a full-screen <section> per slide, ←/→ arrow-key nav, big readable text, a dark theme, a title slide first. Put it in a SINGLE ``` fence with nothing else; it auto-renders in your 🖥 slides tab. (2) PRACTICE — to make an assignment, output ONLY a starter code file: the TASK as comments (a title + numbered steps to build), then a stub to fill in. One ``` fence, nothing outside it; it auto-opens in your 📝 practice tab. The human can also tap the 🖥 slides or 📝 practice button to ask for either — same result. Don't describe opening anything; just output the HTML/code and the tab is already here.",
  },
  mc_fix: {
    pronouns: 'they/them',
    backstory: "You are Fix — the repair coder in the editor. A careful junior dev: one-file wheelhouse, honest about dependencies you can't see. You are not Teach (who explains) and not Squiggy (who suggests what's next).",
    persona: "You clean and repair code. Unless asked a question, reply with ONLY the corrected code — no prose — as raw code or ONE ``` block. Make the SMALLEST change that does the job (light touch → tidy → refactor → nuke, as asked). Flag plainly when a file imports things you can't see, rather than letting the human save something that won't run. When asked to strip dead code, you actually REMOVE it — you don't just comment it out or suppress it. You live entirely inside this ONE editor — never reach for other apps or external tools; your output is code in the editor. You run in a WEBVIEW, so be honest about limits: heavy assets are a RAM/GPU hog — warn before someone loads a dozen high-res images into a preview ('I'll eat your GPU for breakfast'). Your OLD limit ('I can't see the other files') is handled by the MAP now; the REAL limit is context SIZE — your best work is on tiny microfiles under ~10k tokens. Past that, ask to be spoon-fed 500–1000 lines at a time with a good map, and say so plainly rather than pretend to hold the whole thing.",
  },
}
Object.assign(AGENT_DEFAULTS, MC_HELPER_DEFAULTS)

function provOf(model) {
  // 🤗 SAME TRICK FOR HF, AND IT IS NOT OPTIONAL. Hugging Face ids are 'org/model', so the
  // includes('/') branch at the bottom of this chain would hand every one of them to OPENROUTER —
  // and worse, 'Qwen/Qwen3.5-…' matches the /^(gemma|qwen|phi|mlx|local|yocal)/i branch and would
  // land on YOCAL, a local server that is probably not running. Two silent misroutes, one of them
  // into a box that is off. The registry's hf list is the routing table, checked before any prefix.
  try { if (window.REG && window.REG.modelsByProvider && (window.REG.modelsByProvider.hf || []).indexOf(model) > -1) return 'hf' } catch (_) {}
  // ollama models (dolphin · heretic · nemo GGUFs) are named freely (dolphin3:latest, hf.co/…:Q4_K_M) — no clean
  // prefix — so the registry's ollama list IS the routing table. checked FIRST so an "hf.co/…" name lands ollama,
  // not openrouter (which grabs any '/'). the model string is sent to :11434 verbatim, tag and all.
  try { if (window.REG && window.REG.modelsByProvider && (window.REG.modelsByProvider.ollama || []).indexOf(model) > -1) return 'ollama' } catch (_) {}
  return model.startsWith('claude') ? 'anthropic'
    : model.startsWith('gpt') || model.startsWith('o3') ? 'openai'
    : model.startsWith('gemini') ? 'gemini'
    : /^grok/i.test(model) ? 'xai'
    : /^deepseek/i.test(model) ? 'deepseek'
    : /^(mistral|ministral|codestral|magistral|pixtral)/i.test(model) ? 'mistral'   // 'mixtral' (groq) won't match — different spelling
    // yocal — local MLX families (gemma · qwen · phi · mlx-community/…) and the explicit local/yocal escape
    // hatch. checked BEFORE openrouter's includes('/') so 'mlx-community/gemma-…' lands local, not openrouter.
    : /^(gemma|qwen|phi|mlx|local|yocal)/i.test(model) ? 'local'
    : model.startsWith('llama') || model.startsWith('mixtral') ? 'groq'
    : model.includes('/') ? 'openrouter' : ''
}

// which provider can we use for this agent? prefer the agent's model's provider; else any saved key.
function pickProvider(agentId) {
  const want = engGet('toto_bot_' + agentId + '_model')
  // local is the LAST-RESORT fallback: explicit model wins, then any saved cloud key, then yocal (keyless) —
  // so with NO cloud key the app just works on the local model by default (local-first), instead of "no key yet".
  // ── THE COLLAR (Sum 2026-08-11: "they need to be loyal to their brands api, and not work if you
  //    don't give them a key"). registry.js has fenced the PICKERS by AGENT_DATA[id].providers since
  //    July — but this fallback chain never asked, so AOLaddin found no OpenAI key and walked all the
  //    way down to the anthropic key: every branded flagship secretly answering as haiku. A declared
  //    bot now gets ITS OWN providers and nothing else — no substitute, no yocal. Pure string check,
  //    no model in the path. Agnostic bots (toto, coder) declare nothing and keep the full chain.
  const fence = (window.REG && window.REG.agentProviders && window.REG.agentProviders(agentId)) || null
  const order = fence
    ? fence.slice()
    // ⭐ 2 Sep 2026 (Sum: "once a key is entered, the last entered key is the default if not picked"). The gear stamps
    //    toto_default_provider when a key is saved (settings.js); it goes right after the bot's own pick and ahead of
    //    the fixed thrift order. No stamp (out of the box, or a build from before today) → the old walk, unchanged.
    : [provOf(want), engGet('toto_default_provider'), 'anthropic', 'gemini', 'groq', 'mistral', 'deepseek', 'openai', 'xai', 'hf', 'openrouter', 'local'].filter(Boolean)
  for (const id of order) {
    // no machine, no local model (same knife as registry.js, 2026-08-09): in a plain browser the
    // locals are skipped entirely — otherwise a keyless visitor's chat falls through to a phantom
    // localhost:8080 and dies with a fetch error instead of the honest "add a key" state.
    if ((id === 'local' || id === 'ollama') && !window.__TAURI__) continue
    const key = (id === 'local' || id === 'ollama') ? 'yocal' : engGet('toto_' + id + '_key')   // both locals run keyless on the Mac; everyone else needs a saved key
    if (!key) continue
    let model = (provOf(want) === id && want) ? want : ENGINE_DEFAULT_MODEL[id]
    // mlx_lm.server needs the FULL repo id (mlx-community/…); a bare short name makes it try to DOWNLOAD a
    // repo that doesn't exist → 404. normalize a slash-less local model to the full default. (gemma-era.)
    if (id === 'local' && model && !model.includes('/')) model = ENGINE_DEFAULT_MODEL.local
    return { id, key, model }
  }
  return null
}

// the WALL a collared bot hits — GOFAI, no personality, no model: which shop it belongs to and the
// one door to open. engine.js prints this instead of the generic "no key yet" when a bot is fenced.
if (typeof window !== 'undefined') window.pickProvider = pickProvider   // 2 Sep: the gear's picker reads the SAME walk it shows
function fenceNote(agentId) {
  const f = (window.REG && window.REG.agentProviders && window.REG.agentProviders(agentId)) || null
  if (!f) return null
  const name = { anthropic: 'Anthropic', openai: 'OpenAI', xai: 'xAI', gemini: 'Google Gemini', groq: 'Groq', mistral: 'Mistral', deepseek: 'DeepSeek' }[f[0]] || f[0]
  return 'this one runs on ' + name + ' only — open ⚙️ settings, add an ' + name + ' key (the panel has a get-a-key link), and they clock in.'
}

// the agent's MACHINE — is it on a cloud API (BYOK) or a LOCAL model on this Mac, and which model. drives the
// read-state block (compileChart head = the totals; liveLayer tail = the live numbers). null if no provider yet.
function machineState(agentId) {
  const prov = pickProvider(agentId)
  if (!prov) return null
  return { local: prov.id === 'local' || prov.id === 'ollama', provider: prov.id, model: prov.model }
}
// a rough context-window size per model family — the "total allotted" working memory (goes in the head).
function ctxWindow(model) {
  model = String(model || '')
  if (/claude/i.test(model)) return '~200k tokens'
  if (/gemini/i.test(model)) return '~1M tokens'
  if (/gpt-4o|gpt-4\.1|o3/i.test(model)) return '~128k tokens'
  if (/llama|mixtral/i.test(model)) return '~128k tokens'
  if (/gemma|qwen|phi|mlx/i.test(model)) return '~8k–32k tokens (local)'
  return '~128k tokens'
}

// THE OZ MAP — a GENERATED list of what's installed (every card + every bot, by icon), so a bot can always
// tell the human where to find a button. it reads the live registry (OZ_CARD_LIST + REG.agents), so a card or
// bot added on the next push just appears here, no edit. the human's hand-written workflow notes live in the
// editable ENVIRONMENT section; this is the always-current half. "tutorials everywhere." (Sum, 2026-06-28.)
function ozMap() {
  const cards = (typeof window !== 'undefined' && window.OZ_CARD_LIST) || []
  const agents = (typeof window !== 'undefined' && window.REG && window.REG.agents) || []
  if (!cards.length && !agents.length) return ''
  const cardLine = cards.map(c => `${c.emoji || '▢'} ${c.label || c.id}`).join(' · ')
  const botLine = agents.map(a => `${a.emoji ? a.emoji + ' ' : ''}${a.label || a.id}`).join(' · ')
  const L = ['─── OZ MAP (what is installed right now) ───']
  if (cardLine) L.push('Cards, open from the 🗂 deck launcher: ' + cardLine)
  if (botLine) L.push('Bots, brought on from the suite launchers in the top bar: ' + botLine)
  L.push('Point the human to a thing by its icon and which launcher opens it. This list updates as oz grows.')
  return L.join('\n')
}

// per-bot SANDBOX file-tree — a compact TOC of just THIS bot's relevant files (coder = code, the doc-bots =
// docs), names only, no contents, so it knows its tree without spending tokens per file. blank if it has none.
// rides the tail → regenerates each turn, so it's a LIVE snapshot after the latest prompt. (Sum, 2026-06-28.)
// each file-bot owns a FOLDER under ~/totoII/sandbox; its TOC scopes to that folder (so bots don't see each
// other's files). `writes:true` = it actually creates sandbox files (coder via write_file, writer/pa via the
// tiptap doc_* tools, which key the doc by name) → it gets a "keep your files under <folder>/" line in the warm
// head. tutor/wellness write to special stores (the learn store · the food/profile docs), NOT the sandbox — so
// no folder line for them (it would mislead a small model); their TOC just scopes (usually blank). (Sum, 2026-06-29.)
const BOT_FILES = {
  coder:    { kinds: ['code'], label: 'code',    folder: 'code',          writes: true },   // code/<project>/index.html — one project per subfolder
  writer:   { kinds: ['doc'],  label: 'writing', folder: 'writing',       writes: true },   // writing/chunks/ · writing/bibles/ · writing/wip/
  pa:       { kinds: ['doc'],  label: 'docs',    folder: 'notes/pa',      writes: true },
  tutor:    { kinds: ['doc'],  label: 'lessons', folder: 'lessons' },     // real writes go to the learn store
  wellness: { kinds: ['doc'],  label: 'notes',   folder: 'notes/wellness' },   // real writes go to the food / profile stores
  timetravel: { kinds: ['doc'], label: 'trips',  folder: 'trips',        writes: true },   // trips/<date>/trip.md + the frame JPEGs beside it (tt_scene writes both)
}
if (typeof window !== 'undefined') window.BOT_FILES = BOT_FILES   // (Sum 2026-07-09) the lane map — oz-lane.js reads it to wall writes to each bot's folder
function sandboxToc(agentId) {
  const spec = BOT_FILES[agentId]; if (!spec || !spec.kinds.length) return ''
  const sb = (typeof window !== 'undefined' && window.SANDBOX) || {}
  const pre = spec.folder ? spec.folder + '/' : ''
  const names = Object.keys(sb).filter(n => { const e = sb[n]; return e && spec.kinds.includes(e.kind) && (!pre || n.startsWith(pre)) })
  if (!names.length) return ''
  const byDir = {}
  names.sort().forEach(n => { const rel = pre ? n.slice(pre.length) : n; const i = rel.lastIndexOf('/'); const dir = i < 0 ? '' : rel.slice(0, i); (byDir[dir] = byDir[dir] || []).push(i < 0 ? rel : rel.slice(i + 1)) })
  const lines = Object.keys(byDir).sort().map(d => (d ? d + '/  ' : '') + byDir[d].join(' · '))
  return `─── YOUR FILES (${spec.folder || spec.label}/) ───\n${lines.join('\n')}`
}

// per-bot NOTEPAD — a note the bot leaves for its FUTURE self (or the human writes for it). set by a ```note
// block in chat, or edited in the 💉 config. rides the tail, right before the conversation: the kv-snip point
// (warm head above; this + the convo get re-read each turn, so the note colors how it re-reads the history).
// vision — is this provider/model able to SEE an attached image?
function isVision(provId, model) {
  model = String(model || '')
  if (provId === 'anthropic') return true                                   // every current claude is multimodal
  if (provId === 'gemini') return true
  if (provId === 'openai') return /gpt-4o|gpt-4\.1|gpt-5|o3|vision/i.test(model)
  if (provId === 'openrouter') return /claude|gpt-4o|gemini|llama-3\.2|vision/i.test(model)
  return false                                                              // groq / local: assume blind (the text note already says a photo is attached)
}
// fold a pending attached image into the LAST user message, IF the model can see. one-shot: cleared after, so
// the conductor's later (que/check) calls don't re-send it. a blind model just drops it. (Sum, 2026-06-28.)
// OZ_SEES — the one eyes test, exposed (Sum 2026-08-23: "crawl first in ladder if bot has eyes"): does this
// agent's CURRENT provider+model take images? clean-read's eyes-first rung asks it before fetching a shot.
window.OZ_SEES = function (agentId) { try { const p = pickProvider(agentId); return !!(p && isVision(p.id, p.model)) } catch (_) { return false } }
function attachVision(agentId, provId, model, messages) {
  const p = (typeof window !== 'undefined') && window.OZ_VISION_PENDING
  if (!p || p.agent !== agentId || !p.data) return messages
  if (!isVision(provId, model)) { window.OZ_VISION_PENDING = null; return messages }
  const msgs = messages.slice()
  for (let i = msgs.length - 1; i >= 0; i--) {
    if (msgs[i].role !== 'user') continue
    const text = typeof msgs[i].content === 'string' ? msgs[i].content : ''
    const m = /^data:([^;]+);base64,(.*)$/.exec(p.data)
    const block = provId === 'anthropic'
      ? (m ? { type: 'image', source: { type: 'base64', media_type: m[1], data: m[2] } } : null)
      : { type: 'image_url', image_url: { url: p.data } }
    if (block) msgs[i] = { role: 'user', content: [block, { type: 'text', text: text || 'what do you see?' }] }
    break
  }
  window.OZ_VISION_PENDING = null
  return msgs
}

