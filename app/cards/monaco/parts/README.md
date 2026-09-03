# monaco.js parts — the chunked manuscript (IC pass 3, 2026-07-14)

`bundle.sh` concatenates `*.js` here (filename order) into `../monaco.js` before every build,
then `node --check`s the result. **Edit the parts. Never edit monaco.js** — it's clobbered next build.

Each part is a FRAGMENT of one IIFE closure — a lone part is NOT valid JS. Check the assembled file.

| part | holds |
|---|---|
| 00-deck | header + page-0 TOC + tabs/recency/dock · history · name bar · jewels/autosave · sandbox · open/import · wrecker · save |
| 10-run | ▶ RUN · console/cli/preview/problems · `serve` · Monaco CDN loader |
| 20-squiggy | Squiggy levels · linter · click-to-fix · suggestor · ascended LLM tier · headless · chat · change-log |
| 30-sqbox-keys | the suggestion box · keys drawer (ƒ/{}/123) · keyboard nav · hotkeys · ⌘K palette · mcAction |
| 24-ic-rules | the 32 numbered house rules (the numbers are LAW — append only) + the mechanical runner |
| 25-sweep | 🔍 CHECK WORK — the ratchet, the walk, FIX ALL |
| 26-sweep-better | 🌍 MAKE BETTER — rung 4, the crowd, gated on a clean sweep |
| 40-find | find/replace panel · scope · the highlighter |
| 50-teach | fix/teach shared bar · tool threads · GOFAI rails · teach window (scratch/slides/practice) · code-fold |
| 60-garages | garages · wings · grips · collapse · ⛶ fullscreen |
| 70-fix | the Fix workspace · jenga apply-modes · health report |
| 80-card | stream panel · card builder · templates · the pit · setup/wiring |

Byte-identity was proven at the split (`cat parts/*.js | cmp - monaco.js`) — the runtime is unchanged.
Next step (the REAL refactor, later): parts become IIFE beans with a shared namespace; the monolith dies.

---

## THE HOST SEAM — what Monaco expects from outside its wall

*Sum 2026-07-29: "squiggy can't rely on anything outside monaco in 0z — we are stripping and*
*selling just monaco, no broken dependencies." This is that ledger. Sync, not lean: Monaco never*
*imports another CARD's runtime. It only ever asks the HOST for a service, and the host is swappable.*

**Never depend on another card.** Not coder, not the paper, not the desk. If a feature seems to need
one, it needs a host service instead. (Rung 4 briefly called coder's agent for web search — that was
the bug this ledger exists to prevent. It calls `searchWeb` now, and any model can use it.)

**LOAD-BEARING — a standalone build must provide these three:**

```
window.monaco       the editor. CDN-loaded in 10-run.
window.SANDBOX      the file store. 80 call sites — the single biggest seam.
window.engineRaw    ({agentId, messages, onChunk}) → {text}. every AI feature rides this one shape.
```

**FEATURE-GATED — absent means one feature goes quiet, nothing breaks:**

```
window.searchWeb           (engine, query) → text.  rung 4 only. guarded, says so plainly.
window.__TAURI__           disk writes (sweeps/, WISHLIST.md). every call already in a try/catch.
window.OZ_FS · OZ_CLI      ▶ RUN and the file lane.
window.OZ_MAP              god-tier suggestor: the referenced-but-missing files.
window.previewSandboxFile  the preview pane.
```

**SHELL CHROME — cosmetic. a standalone build stubs these to no-ops:**

```
toggleCard · expandCard · makeCard · CARD_BUILDERS · setJewel · syncSolo · pulse
mkContextBar · monacoReveal · OZ_PALETTE · OZ_KBD · OZ_GEAR_SVG · OZ_SETTINGS
OZ_A11Y · TIPTAP_TEMPLATES
```

**The audit, so this list can never quietly rot:**

```bash
grep -ohE "window\.[A-Za-z_$][A-Za-z0-9_$]*" parts/*.js | sort | uniq -c | sort -rn
```

Anything new in that output that isn't named above is either a host service you must add here,
or a cross-card dependency you must remove. There is no third option.
