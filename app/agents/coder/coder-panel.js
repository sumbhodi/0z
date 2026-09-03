// coder-panel.js — the coder's gear: basic bot + its CODING STYLES. the coder's "notes" ARE coding styles.
// seeded with IC.md distilled for a 1b model. a CS grunt edits + saves these RIGHT HERE (multiple files,
// inline) — NOT in tiptap. that rule is for PROSE; making a coder edit style config in a word processor is
// wrong. the injection card just POINTS at these to OPEN them; the editing lives in the gear.
;(function () {
  const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  const get = k => localStorage.getItem(k) || ''
  const setk = (k, v) => localStorage.setItem(k, v)

  // IC.md, distilled — audience: a 1b coder. short on purpose. imperative, numbered, english only.
  const IC_CHEAT =
`# IC — cheat sheet · for a 1b coder
write code every reader can follow: a 1b model, a grandparent, you at 3am.

1. SMALL FILES. build 100–500 lines. one file = one concern. replaceable without reading another file.
2. NAMES ARE FAMILIES. prefix-group: fire* · _dev* · *Poll · make* · set*. say it aloud — does it sound like what it does?
3. BREATHE. one blank line between a comment and its code. always.
4. TOKENS ARE LAW. a value used twice → a const/token. no magic numbers. never !important (fix the specificity).
5. THE 5 R's. Reduce (delete the line if it still works). Reuse (a factory, never copy-paste). Recycle (one concern/file). Respect (a 1b model reads it cold). Recover (trash, never rm).
6. TWO BLOCKS. FOR HUMANS (5th grade, warm) + FOR AI (numbered imperatives, english only).
7. SHOW THE WORK. every number, every step. don't skip what feels obvious.
8. SOLID HEX on text. never opacity/rgba on text — it renders washed out.
9. BUILD SMALL → SHIP COMPOSED. tiny bites: one function, verify, next. "nothing broke, keep going."
10. THREE STRIKES → NEW FILE. fails twice in one file → start a clean one-concern file, get it working, port it back.
11. PHYSICAL OBJECTS. a button has mass (bg + a 3px floor). can't imagine picking it up? redesign it.
12. MOVE THE VIEW, NOT THE CONTENT. multi-page = pages stay in the DOM, translate the camera. never show/hide.
13. localStorage IS THE PRODUCT. everything the user set survives a refresh.

the machine inherits what we build. write it for the next reader — you, exhausted, holding a map in the dark.`

  const STYLES_SEED = [
    { id: 'ic', name: 'IC — the house style', baked: true, body: IC_CHEAT },
    { id: 'project', name: 'this project — conventions', body: 'vanilla JS, one file, no deps, no build step. CSS vars for every repeated value. localStorage persistence. emoji UI. ship-pass = the folio header at the end.' },
  ]
  function csLoad() { try { const a = JSON.parse(localStorage.getItem('toto_coder_styles') || 'null'); if (Array.isArray(a) && a.length) return a } catch (_) {} return JSON.parse(JSON.stringify(STYLES_SEED)) }
  function csSave(a) { try { localStorage.setItem('toto_coder_styles', JSON.stringify(a)) } catch (_) {} if (window.pulse) window.pulse('library') }
  function csSeed(id) { const s = STYLES_SEED.find(x => x.id === id); return s ? s.body : '' }
  function csId() { return 'cs' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5) }

  function styleBox(s) {
    return `<div class="wv-box" data-id="${esc(s.id)}">
      <div class="wv-box-head">
        <span class="wv-name">${esc(s.name)}</span>
        <span class="wv-flex"></span>
        ${s.baked ? `<button class="wv-reset" data-id="${esc(s.id)}" title="reset to IC default">↺</button>`
                  : `<button class="wv-del" data-id="${esc(s.id)}" title="delete">✕</button>`}
      </div>
      <textarea class="wv-rules cs-body" data-id="${esc(s.id)}" rows="7" spellcheck="false" placeholder="the rules — naming · structure · what to never do.">${esc(s.body)}</textarea>
    </div>`
  }

  function render(panel) {
    const S = window.SETTINGS, d = (window.AGENT_DATA && window.AGENT_DATA.coder) || {}
    const styles = csLoad()
    panel.innerHTML =
      `<div class="wv-sec">🧑 basic bot</div>
       <div class="wv-persona cs-persona">
         ${S ? S.field('toto_bot_coder_name', 'name', 'optional', 1) : ''}
         ${S ? S.field('toto_bot_coder_pronouns', 'pronouns', 'they/them', 1) : ''}
         ${S ? S.field('toto_bot_coder_persona', 'persona', 'core personality + how it codes.', 4, d.persona) : ''}
         ${S ? S.field('toto_bot_coder_backstory', 'backstory', 'a history that shapes the voice.', 3, d.backstory) : ''}
       </div>
       ${S ? S.modelField('coder') : ''}
       <div class="wv-sec">🎨 coding styles <span class="wv-sec-sub">— edited here, not in tiptap; multiple files</span></div>
       <div class="wv-boxes cs-list">${styles.map(styleBox).join('')}</div>
       <button class="wv-add cs-add">＋ add a style file</button>`

    panel.querySelectorAll('.cs-persona input[data-k], .cs-persona textarea[data-k]').forEach(el =>
      el.addEventListener('input', () => setk(el.dataset.k, el.value)))
    if (S) S.wireModel(panel, 'coder')
    panel.querySelectorAll('.cs-body').forEach(ta => ta.addEventListener('input', () => {
      const a = csLoad(), s = a.find(x => x.id === ta.dataset.id); if (s) { s.body = ta.value; csSave(a) }
    }))
    panel.querySelector('.cs-add').addEventListener('click', async () => {
      const name = (await window.ozPrompt('name this style file (e.g. "python", "this client\'s rules"):') || '').trim(); if (!name) return
      const a = csLoad(); a.push({ id: csId(), name, body: '' }); csSave(a); render(panel)
      const ta = panel.querySelector(`.cs-body[data-id]:last-of-type`); if (ta) { ta.scrollIntoView({ block: 'center' }); ta.focus() }
    })
    panel.querySelectorAll('.wv-del').forEach(b => b.addEventListener('click', () => { csSave(csLoad().filter(x => x.id !== b.dataset.id)); render(panel) }))
    panel.querySelectorAll('.wv-reset').forEach(b => b.addEventListener('click', () => { const a = csLoad(), s = a.find(x => x.id === b.dataset.id); if (s) { s.body = csSeed(b.dataset.id); csSave(a); render(panel) } }))
  }

  window.wireCoderGear = function (bar) {
    return window.makeSettings(bar, {
      headSel: '.ab-head',   // (2026-08-28) before:'.ab-add' retired — gear seats far right via mountGear
      content: bar.querySelector('.convo'),
      title: 'coder — coding styles · persona · model',
      render: render,
    })
  }

  // THE CODER'S NOTES == its gear: project the CODING STYLES into the injection. owner 'coder' → they open
  // the coder's bar (edit the style in its gear). register the home with the bot-library bean.
  window.coderNotesFromGear = function () {
    return csLoad().map(s => ({ folder: 'coding-styles', name: 'cs-' + s.id, display: s.name, on: false, body: s.body || '', owner: 'coder', source: s.baked ? 'ai' : 'hil' }))
  }
  if (window.registerBotLibrary) window.registerBotLibrary('coder', {
    project: window.coderNotesFromGear,
    open: () => window.toggleAgent && window.toggleAgent('coder', true),
    remove: (note) => { csSave(csLoad().filter(s => 'cs-' + s.id !== note.name)); if (window.pulse) window.pulse('library') },
  })
})()
