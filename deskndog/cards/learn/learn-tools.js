// learn-tools.js — 📝 LEARN / tutor profile atomic tool-beans. clean localStorage (toto_learn_*).
// one field = one bean (the jenga grain) — beside read_learn_profile / edit_learn_profile (the coarse pair).
// the tutor reads this profile to pitch lessons at the learner's level. loads after shell/tools.js. card:'learn'.

;(function () {
  const MT = window.makeTool; if (!MT) return
  const setLS = (k, v) => { try { localStorage.setItem(k, String(v)) } catch (_) {} }
  const getLS = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : v } catch (_) { return d } }

  // ⭐ MMMM READ-BACKS (26 Aug) — three surfaces here, so three backs, and each re-reads localStorage
  //    rather than trusting the strike that just wrote it.
  //    ⚠ THE PROFILE BACK IS DELIBERATELY NARROW. The learn card's role sheet says two fields on this
  //    card belong to the LEARNER, in their own words, and no tool may write them. So a read-back that
  //    dumped the whole profile would be handing a bot a fuller view than its own rules allow it to act
  //    on. It reports the field that MOVED and the shape of the rest — never the human's own text.
  const learnBack = key => () => 'on disk \u00b7 ' + key + ': ' + JSON.stringify(String(getLS(key, '')).slice(0, 70))
  const profBack = () => {
    const has = k => (String(getLS(k, '')).trim() ? 'set' : 'empty')
    return 'profile on disk \u2014 how:' + has('toto_learn_how') + ' \u00b7 level:' + has('toto_learn_level') +
      ' \u00b7 hard:' + has('toto_learn_hard') + ' \u00b7 strong:' + has('toto_learn_strong') +
      ' \u00b7 disorders:' + (JSON.parse(getLS('toto_learn_disorders', '[]') || '[]') || []).length
  }
  const lessonBack = () => { try {
      const l = JSON.parse(getLS('toto_learn_lesson', 'null') || 'null') || {}
      const bars = Object.keys(l).filter(k => l[k])
      const courses = JSON.parse(getLS('toto_learn_courses', '[]') || '[]') || []
      return 'the lesson on disk: ' + (bars.length ? bars.length + ' bar(s) built \u2014 ' + bars.join(' \u00b7 ') : 'nothing built yet') +
        ' \u00b7 ' + courses.length + ' lesson(s) saved'
    } catch (_) { return 'could not re-read the lesson' } }

  const field = (id, key, label, example) => MT({
    id, card: 'learn', klass: 'write', readback: learnBack(key),
    blurb: `set the learner's ${label}. the tutor reads it to pitch lessons right.`,
    clue: `set the learner-profile ${label} (overwrites that one field).\ntemplate: { "tool": "${id}", "value": ${example} }\nedge: pass "value".`,
    strike: (call) => { const v = call.value; if (v == null || String(v) === '') return `${id}: pass "value".`; setLS(key, String(v)); return `${id}: ${label} = "${v}".` },
  })
  field('learn_set_how',   'toto_learn_how',   'how they want to learn',     '"examples first, then the rule"')
  field('learn_set_style', 'toto_learn_style', 'learning style',             '"visual"')
  field('learn_set_level', 'toto_learn_level', 'level (grade school → PhD)', '"undergrad"')
  field('learn_set_hard',  'toto_learn_hard',  'what they find hard',        '"abstract notation; needs it grounded"')

  // learning differences / accommodations — an array (toto_learn_disorders)
  const disorders = () => { try { return JSON.parse(getLS('toto_learn_disorders', '[]')) || [] } catch (_) { return [] } }
  const disSet = a => setLS('toto_learn_disorders', JSON.stringify(a))

  MT({ id: 'learn_add_disorder', card: 'learn', klass: 'write', readback: profBack,
    blurb: 'add a learning difference / accommodation the tutor should hold (e.g. ADHD, dyslexia).',
    clue: `add a learning difference or accommodation.\ntemplate: { "tool": "learn_add_disorder", "name": "ADHD" }\nedge: pass a "name".`,
    strike: (call) => { if (!call.name) return `learn_add_disorder: pass a "name".`
      const a = disorders(); const n = String(call.name); if (!a.includes(n)) a.push(n); disSet(a); return `learn_add_disorder: "${n}" noted (${a.length} total).` } })

  MT({ id: 'learn_remove_disorder', card: 'learn', klass: 'sharp', readback: profBack,
    blurb: 'remove a learning difference / accommodation by name.',
    clue: `remove a learning difference by name.\ntemplate: { "tool": "learn_remove_disorder", "name": "ADHD" }\nedge: unknown → reported.`,
    strike: (call) => { const a = disorders(); const next = a.filter(x => x !== call.name)
      if (next.length === a.length) return `learn_remove_disorder: "${call.name}" not in the list.`
      disSet(next); return `learn_remove_disorder: removed "${call.name}".` } })

  MT({ id: 'learn_read_profile', card: 'learn', klass: 'read', readback: profBack,
    blurb: 'read the learner profile — how / style / level / hard + accommodations. read before you edit.',
    clue: `read the learner profile.\ntemplate: { "tool": "learn_read_profile" }`,
    strike: () => { const g = k => getLS(k, ''); const dis = disorders()
      return `learner profile:\n· how: ${g('toto_learn_how') || '—'}\n· style: ${g('toto_learn_style') || '—'}\n· level: ${g('toto_learn_level') || '—'}\n· hard (your inference, yours to edit): ${g('toto_learn_hard') || '—'}\n· accommodations: ${dis.length ? dis.join(', ') : '—'}`
        + `\n\n⚠ THE LEARNER'S OWN WORDS — read-only to you. You have no tool that writes these. If you believe one is wrong or out of date, SAY SO AND ASK THEM to change it in the learn card's ⚙ gear; do not work around it.`
        + `\n· they say they struggle with: ${g('toto_learn_weak_user') || '—'}\n· they say they are good at: ${g('toto_learn_strong_user') || '—'}` } })
  // ══ THE SNIPPET (Sum 2026-08-17) ═══════════════════════════════════════════════════════════
  //  "wire create to the snippet. Enter any info and an AI can create a snippet — ours websearches."
  //  ONE bar = ONE build = ONE call. This is the first of six; the rest stay closed and unbuilt
  //  until the user opens them and chooses to spend. See totois/EDUCATION.md — the resolved design.
  //  ⚠ The tutor SEARCHES FIRST, then writes. The `core` field's own comment in learn.js has said
  //    "(web-search digest)" since June — this is that, finally wired.
  //  Storage: toto_learn_lesson holds the working lesson; only `core` is filled here.
  const LKEY = 'toto_learn_lesson'
  const lessonGet = () => { try { return JSON.parse(getLS(LKEY, '{}')) || {} } catch (_) { return {} } }
  const lessonSet = o => setLS(LKEY, JSON.stringify(o))

  // ══ THE SIX BUILDS (Sum 2026-08-17) ═══════════════════════════════════════════════════════
  //  "the card fires it, there is no bot… the gofai starts the run, the llm fills content out,
  //   except on expand" — expand is pure gofai, the filtered links.
  //  So: the HUMAN clicks a bar → the CARD starts the run → the MODEL fills the text → GOFAI LINTS
  //  it → a fail HANDS BACK with the reason. Nobody plans, nobody picks. Choosing was the expensive
  //  part and there was only ever one right answer.
  //  These are real tools so they carry the harness: a clue in the injection, the read-back from
  //  makeTool, the hand-back on a failed lint, and a lane a bot COULD use later without a rewrite.
  //  ⚠ THE LINTERS ARE THE PROOF-BY-TEST. A section that fails one never reaches a human — it goes
  //    back with the specific reason, which is the difference between a rail and a hope.

  const BANNED = /\b(obviously|simply|as you know|recall that|trivially|it follows immediately|clearly|of course)\b/i
  const strip = h => String(h || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()

  // each returns '' when clean, or the reason to hand back
  const LINT = {
    core: html => {
      const t = strip(html)
      if (t.length < 60) return 'too short — the snippet is 3-4 dense lines: the fact, one worked number, the pattern.'
      if (t.length > 900) return 'too long — this is the speed-read, not the lesson. 3-4 lines.'
      return ''
    },
    phd: html => {
      const t = strip(html)
      if (t.length < 300) return 'too short for the phd register — it should run about twice the snippet, half of it glossing the jargon.'
      if (/\$[^$]+\$/.test(html) && !/reading the formula/i.test(t))
        return 'you used a formula and did not gloss it — every symbol gets its own line in a "Reading the formula" list.'
      if (!/\d/.test(t)) return 'no worked number — every abstraction is followed immediately by a number.'
      return ''
    },
    fifth: html => {
      const t = strip(html)
      if (t.length < 200) return 'too short — the 5th grade register needs the analogy, the worked example, a second example, and the trick.'
      if (!/\d/.test(t)) return 'no real numbers — do the example all the way through, showing what is left at each step.'
      return ''
    },
    // the Oregon-Trail contract — the one shape that does not vary
    practice: html => {
      const t = strip(html)
      if (t.length < 120) return 'too short — a problem is a chain of steps, four choices each.'
      return ''
    },
    test: html => {
      const t = strip(html)
      if (t.length < 200) return 'too short — the test is 3-5 questions, each in the practice shape.'
      return ''
    },
  }
  LINT.core = (h => { const f = LINT.core; return html => f(html) || (BANNED.test(strip(html)) ? 'banned phrase — ' + (strip(html).match(BANNED) || [''])[0] + ' is a cold call wearing a politeness.' : '') })()
  ;['phd', 'fifth', 'practice', 'test'].forEach(k => {
    const f = LINT[k]
    LINT[k] = html => f(html) || (BANNED.test(strip(html)) ? 'banned phrase — "' + (strip(html).match(BANNED) || [''])[0] + '" is a cold call wearing a politeness.' : '')
  })
  window.OZ_LEARN_LINT = LINT   // the card runs these on what comes back

  // ⚠ PRACTICE AND TEST ARE NO LONGER HTML SECTIONS (Sum 2026-08-17). The card stores them as JSON
  //   — practice is {prompt, choices:[{t, ok, feedback}]}, test is an array of those — because GOFAI
  //   has to COUNT the choices and the correct flags. `learn_build_practice` / `learn_build_test`
  //   wrote a STRING into those keys; a tutor calling either would have left the card unable to draw
  //   its own boxes. They are gone, replaced by learn_write_question below, which takes the slots.
  //   Prose sections stay exactly as they were.
  const SECTIONS = [
    ['learn_build_snippet',  'core',     'SNIPPET',    'the speed-read — 3-4 dense lines'],
    ['learn_build_phd',      'phd',      'PHD',        'a PhD in this subject explaining it to a PhD in interpretive dance'],
    ['learn_build_fifth',    'fifth',    '5TH GRADE',  'the house voice — a precocious 5th grader over-explaining to a busy adult'],
  ]
  SECTIONS.forEach(([id, key, label, what]) => MT({ id, card: 'learn', klass: 'write', readback: lessonBack,
    blurb: `build the ${label} section of the learn card — ${what}. the card fires this; the model fills the text; a linter checks it.`,
    clue: `build the ${label} bar.\ntemplate: { "tool": "${id}", "html": "<p>…</p>" }\n`
        + `edge: pass "html". it is LINTED — a fail comes back with the reason and you get another swing.`,
    strike: (call) => {
      if (!call.html) return `${id}: pass "html".`
      const bad = (LINT[key] || (() => ''))(call.html)
      if (bad) return `✗ ${id} REJECTED — ${bad} nothing was written; build it again.`
      const L = lessonGet(); if (!L.topic) return `${id}: no topic yet — the snippet goes first.`
      L[key] = String(call.html); L[key + 'At'] = Date.now(); lessonSet(L)
      try { window.dispatchEvent(new CustomEvent('oz-learn-lesson', { detail: L })) } catch (_) {}
      return `${id}: ${label} written (${strip(call.html).length} chars). the other bars are still unbuilt — the human opens them one at a time.`
    } }))



  // ══ THE EDIT PASS (Sum 1 Sep 2026) ════════════════════════════════════════════════════════════
  //  "if practice or test fail gofai test, or pass back, let tutor fix the too-close errors. Let's
  //   add an edit pass to tutor for all — tests and practice. It just gets asked for help if learn
  //   struggles. On all: gets a copy and can offer to edit and clean it up."
  //
  //  ⚠ WHAT WAS ACTUALLY MISSING, and it was not the write tools. learn_build_phd and
  //  learn_build_fifth already existed and the tutor already had them (the card is the grant). The
  //  gap was on the READ side and it made editing impossible:
  //    1. On a lint FAIL, nothing is written — so there was nothing to fix. You rebuilt blind.
  //    2. The tutor could not SEE what a section currently says, so every "edit" was a rewrite.
  //    3. It got ONE swing at the linter and a rejection. No way to check first.
  //  ⭐ So these two beans are both READS. They turn "write and hope" into "copy · check · fix ·
  //  submit", using the SAME linter the card runs — not a second opinion, the identical function.
  //  window.OZ_LEARN_LINT is already published for exactly this.

  MT({ id: 'learn_read_section',
    run: 'speed', next: 'you now hold the current text — edit it with learn_write_snippet, or check a replacement with learn_lint_section BEFORE writing.', card: 'learn', klass: 'read', readback: lessonBack,
    blurb: 'read what a lesson section says RIGHT NOW, verbatim — the snippet, phd, 5th grade, practice or test. Do this before you edit anything: an edit needs the current text, a rewrite throws it away.',
    clue: `read one section of the live lesson, exactly as it stands.
template: { "tool": "learn_read_section", "where": "phd" }
where: snippet | phd | fifth | practice | test | all
- ⚠ READ BEFORE YOU EDIT. If you rebuild from memory you are not editing, you are replacing — and
  you will quietly drop whatever was already right.
- practice and test come back as JSON (the four-choice objects), not prose.
- "all" gives you a short inventory: what is built, what is empty, how long each one is.`,
    strike: (call) => {
      const L = lessonGet(); if (!L.topic) return 'learn_read_section: no lesson yet.'
      const KEYS = { snippet: 'core', core: 'core', phd: 'phd', fifth: 'fifth' }
      const where = String((call && call.where) || 'all').toLowerCase()
      if (where === 'all') {
        const rows = ['core', 'phd', 'fifth'].map(k => '  ' + (k === 'core' ? 'snippet' : k) + ': '
          + (L[k] ? strip(L[k]).length + ' chars' : 'EMPTY'))
        rows.push('  practice: ' + ((L.practicePool || []).length) + ' question(s)')
        rows.push('  test: ' + ((L.test || []).length) + ' question(s)')
        return 'lesson "' + L.topic + '":\n' + rows.join('\n') + '\nread one with { "tool": "learn_read_section", "where": "phd" }'
      }
      if (where === 'practice' || where === 'test') {
        const qs = where === 'practice' ? (L.practicePool || []) : (L.test || [])
        if (!qs.length) return where + ': nothing written yet.'
        return where + ' — ' + qs.length + ' question(s), verbatim:\n' + JSON.stringify(qs, null, 1)
      }
      const k = KEYS[where]
      if (!k) return 'learn_read_section: "where" is snippet | phd | fifth | practice | test | all.'
      if (!L[k]) return (where) + ': EMPTY — nothing written yet, so there is nothing to edit. Build it instead.'
      return where + ' — verbatim, ' + strip(L[k]).length + ' chars:\n' + L[k]
    } })

  MT({ id: 'learn_lint_section',
    run: 'speed', next: 'it passed? write it with learn_write_snippet. it failed? fix what the linter named and lint again — nothing was written either way.', card: 'learn', klass: 'read', readback: () => 'the linter ran; nothing was written',
    blurb: 'run the card\'s OWN linter on text you are about to submit, and get the reason back WITHOUT writing anything. Check first, fix, then build — instead of one swing and a rejection.',
    clue: `dry-run the linter on a candidate section.
template: { "tool": "learn_lint_section", "where": "phd", "html": "<p>…</p>" }
where: snippet | phd | fifth | practice | test
- ⭐ THIS IS THE SAME FUNCTION THE CARD RUNS (window.OZ_LEARN_LINT), not a second opinion. If it
  passes here it passes there.
- NOTHING IS WRITTEN either way. Use it to fix a section before you spend the build, and to repair
  one the card just handed back.
- it catches: too short / too long, a formula with no gloss, an abstraction with no worked number,
  and the banned filler (obviously · simply · as you know · clearly · of course).
- ⚠ IT CANNOT SEE "too close" DISTRACTORS. That judgement is yours and it is the one the linter has
  no rule for: a wrong choice a knowledgeable person could DEFEND is not a distractor. Read the
  four choices and ask whether each wrong one is FACTUALLY FALSE and a mistake somebody actually
  makes. If two choices are both defensible, the question is broken however clean the prose is.`,
    strike: (call) => {
      const where = String((call && call.where) || '').toLowerCase()
      const k = where === 'snippet' ? 'core' : where
      const fn = (window.OZ_LEARN_LINT || {})[k]
      if (!fn) return 'learn_lint_section: "where" is snippet | phd | fifth | practice | test.'
      if (!call.html) return 'learn_lint_section: pass "html" — the candidate text.'
      const bad = fn(String(call.html))
      return bad ? '✗ WOULD BE REJECTED — ' + bad + '\nFix it and lint again; nothing was written.'
                 : '✓ would pass the ' + where + ' linter (' + strip(call.html).length + ' chars). Nothing was written — build it now to commit it.'
    } })
  // ══ THE TUTOR'S HALF (Sum 2026-08-17) ═══════════════════════════════════════════════════════
  //  "give it tools to re-org lessons if gofai or bot got it wrong in its opinion, read grades,
  //   update/edit bot-defined weakness strength… fire learn in phd first or 5th grade first, then
  //   let it edit practice and tests if it is running the card for the user."
  //  The card can already do all of this for a human clicking bars. These are the same doors, for a
  //  bot driving on the human's behalf. ⚠ Every one of them is a WRITE the human can see and undo.

  const CAT_KEYS = ['math', 'science', 'history', 'language', 'arts', 'tech', 'practical', 'other']
  const CKEY = 'toto_learn_courses'
  const courses = () => { try { const a = JSON.parse(getLS(CKEY, '[]')); return Array.isArray(a) ? a : [] } catch (_) { return [] } }
  const coursesSet = a => { setLS(CKEY, JSON.stringify(a)); try { window.dispatchEvent(new CustomEvent('oz-learn-shelf')) } catch (_) {} }

  MT({ id: 'learn_list_lessons', card: 'learn', klass: 'read', readback: lessonBack,
    blurb: 'list the shelved lessons with their categories — read this before you re-file anything.',
    clue: `list every saved lesson: id, title, category.\ntemplate: { "tool": "learn_list_lessons" }`,
    strike: () => { const l = courses()
      if (!l.length) return 'learn_list_lessons: the shelf is empty.'
      return 'shelved lessons:\n' + l.map(c => `· [${c.id}] ${c.title} — ${c.cat || 'UNSORTED'}`).join('\n') } })

  // ⭐ RE-FILING. The card guesses from a word list and is sometimes wrong ("the Schwarzschild
  //   radius" landed in HISTORY on the first cut, because 'war' is inside Schwarzschild). GOFAI is
  //   fast and free and does not mind being overruled — that is the whole arrangement.
  MT({ id: 'learn_set_category',
    run: 'search', next: 'learn_list_lessons first — you need the exact lesson name it is filed under.', card: 'learn', klass: 'write', readback: lessonBack,
    blurb: 're-file a shelved lesson under a different category when the card guessed wrong.',
    clue: `re-file a lesson.\ntemplate: { "tool": "learn_set_category", "id": "<lesson id>", "cat": "science" }\n`
        + `cat must be one of: ${CAT_KEYS.join(' · ')}. edge: unknown id or cat → reported, nothing written.`,
    strike: (call) => {
      const cat = String(call.cat || '').toLowerCase()
      if (!CAT_KEYS.includes(cat)) return `learn_set_category: "${call.cat}" is not a category. Use one of: ${CAT_KEYS.join(', ')}.`
      const l = courses(); const i = l.findIndex(c => String(c.id) === String(call.id))
      if (i < 0) return `learn_set_category: no lesson with id "${call.id}" — run learn_list_lessons first.`
      const was = l[i].cat || 'UNSORTED'; l[i].cat = cat; coursesSet(l)
      return `learn_set_category: "${l[i].title}" moved ${was} → ${cat}.` } })

  // ⭐ THE GRADES FILE. Append-only, written by the card on every practice attempt and every test.
  //   The tutor READS it; it has no tool to write it, because a record you can edit is not a record.
  MT({ id: 'learn_read_grades', card: 'learn', klass: 'read',
    readback: () => { try { const g = JSON.parse(getLS('toto_learn_grades', '[]') || '[]') || []; return g.length + ' graded sitting(s) on disk \u2014 append-only, and no tool here can write them' } catch (_) { return 'could not re-read the grades' } },
    blurb: "read the learner's grades sheet — every practice attempt and test score, oldest first.",
    clue: `read the grades file (append-only; you cannot write it).\ntemplate: { "tool": "learn_read_grades" }`,
    strike: () => {
      let txt = ''
      try { const f = (window.SANDBOX || {})['grades.txt']; txt = (f && f.data) || '' } catch (_) {}
      if (!txt.trim()) return 'learn_read_grades: no grades yet — nothing has been practised or tested.'
      const lines = txt.trim().split('\n').filter(l => l && l[0] !== '#')
      return `grades (${lines.length} entries):\n` + lines.slice(-60).join('\n')
        + '\n\n⚠ This is the record, not your opinion of it. Read the TREND, not the last line.' } })

  // the bot's OWN read of strength — the mirror of learn_set_hard. Kept separate from the two
  // fields the human wrote about themselves, which you cannot touch.
  field('learn_set_strong', 'toto_learn_strong', 'what they are good at (your inference)', '"spots the pattern before the rule; fast mental arithmetic"')

  // ⭐ BACKFILL (Sum: "can fill in the missing ones that got caught by checker"). The test checker
  //   DROPS a question with two defensible answers, so a 5-question test can arrive as 4. This is
  //   how the tutor puts one back — and it goes through the SAME okQ contract as everything else.
  MT({ id: 'learn_write_question',
    run: 'speed', next: 'learn_lint_section to check it, or learn_write_test for a whole sitting.', card: 'learn', klass: 'write', readback: lessonBack,
    blurb: 'add one question to the practice pool or the test — used to replace one the checker dropped.',
    clue: `add a question.\ntemplate: { "tool": "learn_write_question", "where": "test", "prompt": "…", `
        + `"choices": [{"t":"…","ok":false},{"t":"…","ok":true},{"t":"…","ok":false},{"t":"…","ok":false}], `
        + `"feedback": ["…","…","…","…"] }\n`
        + `where = "test" or "practice". EXACTLY 4 choices, EXACTLY 1 ok:true. feedback is optional for test, `
        + `required for practice. edge: the contract is checked — a fail is reported and nothing is written.`,
    strike: (call) => {
      const q = { prompt: String(call.prompt || ''), choices: Array.isArray(call.choices) ? call.choices : [] }
      const bad = (window.OZ_LEARN_OKQ || (() => ''))(q)
      if (bad) return `✗ learn_write_question REJECTED — ${bad} nothing was written.`
      if (Array.isArray(call.feedback)) q.choices.forEach((c, i) => { c.feedback = call.feedback[i] || c.feedback || '' })
      const where = String(call.where || 'test').toLowerCase()
      if (where === 'practice' && q.choices.some(c => !c.feedback))
        return '✗ learn_write_question REJECTED — practice needs one line of feedback per choice; a wrong answer with no teaching is just a red X.'
      const L = lessonGet(); if (!L.topic) return 'learn_write_question: no lesson yet.'
      if (where === 'practice') { L.practicePool = (L.practicePool || []).concat([q]); L.practice = q }
      else { L.test = (L.test || []).concat([q]); const tp = L.testPool || []
             if (tp.length) { tp[tp.length - 1].qs = (tp[tp.length - 1].qs || []).concat([q]); L.testPool = tp } }
      lessonSet(L)
      try { window.dispatchEvent(new CustomEvent('oz-learn-lesson', { detail: L })) } catch (_) {}
      return `learn_write_question: added to ${where}. It passed the four-choices contract.` } })


  // ⭐⭐ THE FRONT DOOR TO THE SNIPPET (Sum 1 Sep 2026, "123go"): "let tutor write to snippet box and
  //   bypass learn card's pull. Learn can then make phd and 5th grade and test and practice from that."
  //   THE CARD'S OWN ROAD is: human types a topic → live web search → the learner digests it. Right
  //   when nobody is watching. ⚠ BUT WHEN THE TUTOR ALREADY HAS THE TRANSCRIPT the search is strictly
  //   worse — it fetches the internet's version of a subject when the TEACHER'S version is already in
  //   the conversation, and the teacher is who writes the quiz.
  //   ⭐ AND IT UNLOCKS SAVING EVERYTHING ELSE. learn.js shelve() refuses a lesson without BOTH topic
  //   AND core — so practice and test written before a snippet existed never shelved. Writing the
  //   snippet is what makes the whole lesson persist. One bean, two asks.
  //
  //   THE SHAPE IS HIS, and it is not a summary — it is a quiz sheet:
  //     concepts · what the thing IS, minimal — he groks fast, state don't explain
  //     gotchas  · what the TEACHER will test, each with the TELL that gave it away
  //     code     · the copy blocks. "I grok quick, can't type to save my life — need copy-paste
  //                easy buttons just for spellings."
  //     notes    · optional, minimal, last
  //
  //   ⚠⚠ THE LINT THAT MATTERS: A GOTCHA WITHOUT ITS TELL IS REFUSED. Same law as
  //   learn_write_question's "a wrong answer with no teaching is just a red X" — a claim that
  //   something will be on the test, with nothing behind it, is a guess wearing a prediction's coat.
  //   ⭐ The tells are the human nuance a transcript really does carry, and which he says even a dumb
  //   bot picks up: she repeated it three times, she showed more than one example, she said it
  //   outright, she slowed down, the room went quiet.
  MT({ id: 'learn_write_snippet',
    run: 'search', next: 'if you were EDITING rather than seeding, learn_read_section had to run first — an edit that did not read overwrote text it never saw. Next: learn_build_fifth or learn_build_phd from this snippet.', card: 'learn', klass: 'write',
    readback: () => { try {
        const L = JSON.parse(getLS(LKEY, '{}')) || {}
        return L.core ? 'snippet on the card: "' + String(L.core).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 90) + '…" (' + String(L.core).length + ' chars)'
                      : 'the snippet box is still empty'
      } catch (_) { return 'could not re-read the lesson' } },
    blurb: 'write the snippet box DIRECTLY from material you already have — skips the card\'s web search. Use it the moment you hold a transcript or the teacher\'s own words: concepts, gotchas with their tells, copy blocks. It also unlocks shelving, so practice and test finally save.',
    clue: `write the lesson snippet yourself instead of making the card search for it.
template: { "tool": "learn_write_snippet", "topic": "Java float and double",
  "concepts": ["float is 4 bytes, double is 8", "a decimal literal is a double by default"],
  "gotchas": [{ "point": "5.6 + 5.8 prints 11.399999999999999, not 11.4", "tell": "she ran it live and said close but not close enough" }],
  "code": [{ "label": "declare each", "lines": "float  f = 4.2f;\\ndouble d = 4.2;" }],
  "notes": "BigDecimal for money" }
- USE THIS WHENEVER YOU ALREADY HAVE THE MATERIAL — a transcript, a slide, a photo of a board. The
  card's own road runs a web search, which fetches the internet's version of the subject while the
  TEACHER'S version is in your hands. The teacher writes the quiz.
- ⚠ EVERY GOTCHA NEEDS A "tell" AND IS REFUSED WITHOUT ONE. The tell is the evidence that this is
  testable: she repeated it, she showed two or more examples, she said "this will be on the test",
  she slowed down. If you cannot name the tell it is not a gotcha — put it in concepts.
- "code" is the copy-paste sheet: exact strings, no prose, one idea per block. Highest-value part
  for this human. Never skip it.
- CONCEPTS ARE MINIMAL. State, do not explain.
- ⭐ PASS "course" WHENEVER THE LESSON BELONGS TO A CLASS ("CS-1410 java"). The lesson then files INTO
  that class on the shelf instead of becoming its own standalone row. The class must already be on the
  shelf (learn_add_class) — an unknown name just shelves the lesson on its own, nothing is lost.
- After this lands the card builds PhD, 5th grade, practice and test FROM IT — no second search.`,
    strike: (call) => {
      const topic = String((call && call.topic) || '').trim()
      if (!topic) return 'learn_write_snippet: pass "topic".'
      const concepts = Array.isArray(call.concepts) ? call.concepts.filter(Boolean) : []
      const gotchas  = Array.isArray(call.gotchas)  ? call.gotchas.filter(Boolean)  : []
      const code     = Array.isArray(call.code)     ? call.code.filter(Boolean)     : []
      if (!concepts.length && !gotchas.length && !code.length)
        return 'learn_write_snippet: nothing to write — pass at least one of concepts, gotchas or code.'
      const naked = gotchas.filter(g => !g || !String(g.tell || '').trim())
      if (naked.length) return '✗ learn_write_snippet REJECTED — ' + naked.length + ' gotcha(s) with no "tell". Name the evidence (she repeated it · two examples · said it outright · she slowed down), or move it to concepts. A claim that something is on the test with nothing behind it is a guess.'
      const flat = [concepts.join(' '), gotchas.map(g => String(g.point || '') + ' ' + String(g.tell || '')).join(' '), String(call.notes || '')].join(' ')
      const bad = flat.match(BANNED)
      if (bad) return '✗ learn_write_snippet REJECTED — banned filler "' + bad[0] + '". Say the thing; do not tell him he already knows it.'
      const esc = t => String(t == null ? '' : t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      const parts = []
      if (concepts.length) parts.push('<b>concepts</b><ul>' + concepts.map(c => '<li>' + esc(c) + '</li>').join('') + '</ul>')
      if (gotchas.length)  parts.push('<b>gotchas &mdash; this will be on the test</b><ul>'
        + gotchas.map(g => '<li>' + esc(g.point) + ' <i>&mdash; ' + esc(g.tell) + '</i></li>').join('') + '</ul>')
      if (code.length)     parts.push('<b>copy blocks</b>'
        + code.map(k => (k.label ? '<div class="ln-codelabel">' + esc(k.label) + '</div>' : '')
                      + '<pre class="ln-copy"><code>' + esc(k.lines) + '</code></pre>').join(''))
      if (call.notes)      parts.push('<div class="ln-note">' + esc(call.notes) + '</div>')
      const L = lessonGet()
      L.topic = topic
      L.core  = parts.join('')
      // ⭐ 1 Sep 2026 — carry the CLASS down with the lesson (Sum: "something isn't saving them into
      //    class right"). shelve() could only file a lesson into a class that ALREADY held that topic,
      //    so a brand-new lesson never joined one and became a standalone row named after itself. The
      //    lesson now remembers which class it belongs to and shelve() honours it. Optional: an ad-hoc
      //    lesson with no class still shelves the old way.
      const course = String((call && (call.course || call.klass_name)) || '').trim()
      if (course) L.course = course
      lessonSet(L)
      try { window.dispatchEvent(new CustomEvent('oz-learn-lesson', { detail: L })) } catch (_) {}
      return 'learn_write_snippet: "' + topic + '" is on the card — ' + concepts.length + ' concept(s), '
           + gotchas.length + ' gotcha(s) with tells, ' + code.length + ' copy block(s). The lesson can shelve now, '
           + 'so practice and test will SAVE. Next: build PhD, 5th grade, practice and test from this — no second search.' } })
  // ⭐ THE FRONT DOOR TO THE TEMPLATE (Sum 2026-08-17: "give it a front door to the template for
  //   practice and test, so it can just fill it out and skip the card's bot").
  //   The card's own path is learner → 3 passes → GOFAI. That is right when nobody is watching. But
  //   when the TUTOR is already in the conversation, it has the whole context the learner never sees
  //   — what the human just said, what they got wrong out loud, what they are actually asking. Making
  //   it hand that to a second model to re-derive is a call spent to LOSE information.
  //   So: it fills the template itself. ⚠ IT SKIPS THE BOT, NOT THE CONTRACT. Every question still
  //   goes through okQ — the same function the card holds itself to, exported once in learn.js.
  const TEMPLATE = {
    practice: '{ "tool": "learn_write_question", "where": "practice", "prompt": "…", '
            + '"choices": [{"t":"…","ok":false},{"t":"…","ok":true},{"t":"…","ok":false},{"t":"…","ok":false}], '
            + '"feedback": ["why this is the mistake","why this one is right","…","…"] }',
    test:     '{ "tool": "learn_write_test", "questions": [ { "prompt": "…", '
            + '"choices": [{"t":"…","ok":false},{"t":"…","ok":true},{"t":"…","ok":false},{"t":"…","ok":false}] } ] }',
  }
  const LAWS = [
    'EXACTLY four choices. EXACTLY one with ok:true.',
    'Every wrong choice must be FACTUALLY FALSE — not vaguer, not less complete, not a different true fact. If a knowledgeable person could defend it, it is not a distractor.',
    'Every wrong choice must be a mistake SOMEBODY ACTUALLY MAKES. Name the misconception, do not invent noise.',
    'NEVER "all of the above", "none of the above", "both A and B".',
    'PRACTICE needs one line of feedback per choice — the right one says why, each wrong one names the specific misconception. Never "incorrect".',
    'TEST carries no feedback: it is a check, not a lesson.',
    'Vary which position is correct.',
  ]

  MT({ id: 'learn_template', card: 'learn', klass: 'read', readback: () => 'the template is a shape, not a surface \u2014 nothing was written',
    blurb: 'read the exact question template + the rules it is checked against, so you can fill it yourself instead of asking the card to generate one.',
    clue: `read the practice/test template.\ntemplate: { "tool": "learn_template" }`,
    strike: () => 'THE QUESTION TEMPLATE — fill this yourself; you have context the card\'s builder does not.\n\n'
      + 'PRACTICE (one problem, teaching on every choice):\n' + TEMPLATE.practice
      + '\n\nTEST (a whole sitting at once):\n' + TEMPLATE.test
      + '\n\nTHE RULES — checked by the card, not by you:\n' + LAWS.map(l => '· ' + l).join('\n')
      + '\n\nA question that fails is reported with the reason and nothing is written. Writing these yourself '
      + 'skips the card\'s builder entirely — no extra call on their key.' })

  MT({ id: 'learn_write_test', card: 'learn', klass: 'write', readback: lessonBack,
    blurb: 'write a whole test yourself — a new sitting, as many questions as you like. Skips the card\'s generator.',
    clue: `write a full test.\ntemplate: ${TEMPLATE.test}\n`
        + `every question is checked: exactly 4 choices, exactly 1 correct, no "all of the above". `
        + `edge: any question that fails is REPORTED and the rest are still written.`,
    strike: (call) => {
      const qs = Array.isArray(call.questions) ? call.questions : []
      if (!qs.length) return 'learn_write_test: pass "questions" — an array. Call learn_template if you need the shape.'
      const okQ = window.OZ_LEARN_OKQ || (() => '')
      const good = [], bad = []
      qs.forEach((q, i) => { const why = okQ(q); if (why) bad.push(`#${i + 1}: ${why}`); else good.push(q) })
      if (!good.length) return `✗ learn_write_test REJECTED — no question passed:\n${bad.join('\n')}\nNothing was written.`
      const L = lessonGet(); if (!L.topic) return 'learn_write_test: no lesson yet — the snippet goes first.'
      const pool = Array.isArray(L.testPool) ? L.testPool : (L.test ? [{ qs: L.test, at: Date.now(), score: null }] : [])
      pool.push({ qs: good, at: Date.now(), score: null })
      L.testPool = pool; L.test = good; L.testAt = Date.now(); lessonSet(L)
      try { window.dispatchEvent(new CustomEvent('oz-learn-lesson', { detail: L })) } catch (_) {}
      return `learn_write_test: sitting ${pool.length} written with ${good.length} question${good.length > 1 ? 's' : ''}.`
        + (bad.length ? `\n⚠ ${bad.length} rejected and NOT written:\n${bad.join('\n')}` : '')
        + '\nThe human opens the test bar to take it.' } })

  // ══ THE TWO THAT WERE CATALOGUED AND NEVER BUILT — 26 Aug ══════════════════════════════════════
  //  seed_course and explain_and_coach have sat in TOOLKITS on card 'learn' with nothing behind them,
  //  which means toolLines() has been telling the TUTOR and the LEARNER they had both, every turn.
  //  (Sum, 26 Aug: "look like good tools to build and disperse.")

  // ── seed_course — "you seed; learn builds." It fills a real hole: of the thirteen learn beans, not
  //    one could set L.topic, and TOPIC IS WHAT EVERY BAR BUILDS FROM (learn.js reads L.topic in the
  //    snippet, the practice arena, the test writer and the filer). A bot could write questions for a
  //    lesson but could not start one.
  //  ⚠ IT SEEDS, IT DOES NOT BUILD, and that is the blurb's own split. The bars are built by the card
  //    and by the beans that already exist. This lays the seed and says which door builds next, so the
  //    bot hands off instead of pretending the course now exists.
  //  ⚠ IT REFUSES TO OVERWRITE A LESSON IN PROGRESS unless told twice. Re-seeding drops the snippet,
  //    the questions and the test pool that were built against the old topic — silently, since they
  //    live under one key. A lesson is somebody's afternoon.
  MT({ id: 'seed_course', card: 'learn', klass: 'write', readback: lessonBack,
    blurb: 'enter a prompt for the learn card to build a course from. you seed; learn builds.',
    clue:
`plant the SEED a course grows from — the topic every bar is built against.
template: { "tool": "seed_course", "topic": "the physics of a bowed string" }
- a good seed is narrow enough to teach in one sitting and wide enough to have parts. "music" is not a
  seed; "why a bowed string sounds different from a plucked one" is.
- you seed, the CARD builds: after this, the snippet bar is the next door, then learn_write_question and
  learn_write_test. Do not tell the human a course exists — tell them the seed is in and what comes next.
- a lesson already in progress is NOT replaced unless you pass "replace": true, and you should ask the
  human first: re-seeding drops the snippet, the questions and the test pool built against the old topic.
- read learn_read_profile FIRST and pitch the seed at their level; that profile is why it exists.`,
    strike: (call) => {
      const topic = String(call.topic || call.prompt || call.seed || '').trim()
      if (!topic) return 'seed_course: pass "topic" — the prompt the course grows from.'
      if (topic.length < 3) return `seed_course: "${topic}" is too short to build anything from.`
      const L = lessonGet() || {}
      if (L.topic && String(L.topic) !== topic && call.replace !== true)
        return `seed_course: a lesson on "${L.topic}" is already open, and re-seeding drops its snippet, questions and test pool. `
             + `Ask the human, then pass "replace": true. Nothing was written.`
      const was = L.topic || ''
      // ⚠ ONLY `topic` GOES IN THE LESSON OBJECT, and the smoke test is why. The first cut also wrote
      //   seededAt and seededBy in there — and lessonBack counts every truthy key as a BUILT BAR, so a
      //   bare seed read back as "3 bar(s) built — topic · seededAt · seededBy". My metadata was being
      //   reported to the bot as the learner's finished work. The lesson object is the CARD's schema;
      //   extending someone else's shape with your own bookkeeping is how a read-back starts lying.
      //   The provenance lives in its own key, where nothing counts it.
      lessonSet({ topic: topic })
      try { localStorage.setItem('toto_learn_seed', JSON.stringify({ topic: topic, at: Date.now(), by: (window.OZ_ACTOR || 'a bot') })) } catch (_) {}
      try { window.dispatchEvent(new CustomEvent('oz-learn-lesson', { detail: { topic: topic } })) } catch (_) {}
      return `seed_course: seeded "${topic}"${was ? ` (replacing "${was}")` : ''}. `
           + `Nothing is built yet — the card builds the snippet from here, and learn_write_question / learn_write_test follow. `
           + `Say that to the human plainly; do not call it a course yet.` } })

  // ── explain_and_coach — the blurb is three promises and the bean keeps them by handing back FACTS:
  //    "at their level" (the profile), "link-first" (the sources already on disk), "honest about
  //    look-ups" (it says which of those it actually has).
  //  ⚠ IT DOES NOT EXPLAIN. It cannot — there is no model in a bean. What it does is end the guessing:
  //    where the learner is, what they have got wrong lately, what is built and what is not. A coach
  //    who asks "so where are you up to?" every session is not coaching, and that is the question this
  //    answers before the bot opens its mouth.
  //  ⚠ THE PERF LOG IS THE HONEST PART. toto_learn_perf is written by the CARD on every attempt, and no
  //    bean writes it — so weak spots here are measured, not the bot's impression of the learner.
  MT({ id: 'explain_and_coach', card: 'learn', klass: 'read', readback: lessonBack,
    blurb: 'walk the learner through their course at their level. link-first, honest about look-ups.',
    clue:
`get the learner's POSITION before you coach — level, open lesson, what is built, what they keep getting
wrong, and the links already on disk. Fire it at the START of a coaching turn, not after you have guessed.
template: { "tool": "explain_and_coach" }
- AT THEIR LEVEL: the profile comes back with it. Pitch to the level shown; if it is empty, ask once.
- LINK-FIRST: the sources already saved with the lesson come back too. Offer a real link before a
  paraphrase — a link they can check beats an explanation they have to trust.
- HONEST ABOUT LOOK-UPS: this reports what is ON DISK. If it says a bar is not built, it is not built,
  and you say so rather than describing what would be in it.
- the weak spots are MEASURED (the card logs every attempt); they are not your impression. Say which.`,
    strike: () => {
      const g = k => getLS(k, '')
      const L = lessonGet() || {}
      const out = []
      const lvl = g('toto_learn_level'), how = g('toto_learn_how'), hard = g('toto_learn_hard')
      let dis = []; try { dis = JSON.parse(getLS('toto_learn_disorders', '[]') || '[]') || [] } catch (_) {}
      out.push(`① THEIR LEVEL — pitch here:\n  · level: ${lvl || '(unset — ask once, then learn_set_level)'}`
        + `\n  · how they learn: ${how || '—'}\n  · finds hard: ${hard || '—'}`
        + `\n  · accommodations: ${dis.length ? dis.join(', ') : '—'}`)
      if (!L.topic) out.push(`② THE LESSON — none open. seed_course plants one; do not coach a course that is not there.`)
      else {
        const built = ['snippet', 'phd', 'fifth', 'explore', 'practice', 'test'].filter(k => L[k])
        const missing = ['snippet', 'phd', 'fifth', 'explore', 'practice', 'test'].filter(k => !L[k])
        out.push(`② THE LESSON — "${L.topic}"\n  · built: ${built.length ? built.join(' · ') : '(nothing yet)'}`
          + `\n  · NOT built: ${missing.length ? missing.join(' · ') : '(all of it)'} — say so; do not describe what is not there.`
          + `\n  · test sittings: ${(L.testPool || []).length}`)
      }
      let perf = []; try { perf = JSON.parse(getLS('toto_learn_perf', '[]') || '[]') || [] } catch (_) {}
      if (!perf.length) out.push(`③ MEASURED WEAK SPOTS — no attempts logged yet. You have nothing to go on; ask, do not assume.`)
      else {
        const by = {}
        perf.slice(-120).forEach(p => { const k = p.skill || 'general'; by[k] = by[k] || { ok: 0, n: 0 }; by[k].n++; if (p.ok) by[k].ok++ })
        const rows = Object.keys(by).map(k => ({ k, pct: Math.round(by[k].ok / by[k].n * 100), n: by[k].n })).sort((a, b) => a.pct - b.pct)
        out.push(`③ MEASURED WEAK SPOTS — from ${perf.length} logged attempt(s), weakest first:\n`
          + rows.slice(0, 8).map(r => `  · ${r.k}: ${r.pct}% of ${r.n}`).join('\n'))
      }
      const src = Array.isArray(L.sources) ? L.sources : []
      out.push(src.length
        ? `④ LINKS ON DISK — offer one of these before you paraphrase:\n` + src.slice(0, 10).map(x => '  · ' + (x.url || x.href || x)).join('\n')
        : `④ LINKS ON DISK — none saved with this lesson. Say that plainly rather than inventing a citation.`)
      const shelf = JSON.parse(getLS('toto_learn_courses', '[]') || '[]') || []
      out.push(`⑤ THE SHELF — ${shelf.length} finished lesson(s) behind them (learn_list_lessons for the titles).`)
      return out.join('\n\n') } })

  // ── EXPAND / EXPLORE — PURE GOFAI, no model, no tool call. Sum: "expand is pure gofai, all the
  //    links we have been filtering and linting go there." It reads the sources already split out
  //    of every answer by splitSources() in learn.js. Free, instant, and the citations are real.

  // ══ THE CLASS PACKET (Sum 2026-08-28: "when I click on that bar I want to see csis1430 and cs1410
  //    after a chat with tutor… from paste and screenshot, tutor should make a syllabus.md, and an MD
  //    for each assignment or quiz. once you take the class, you have an app for that class — AI
  //    native"). Three beans: the class row, the class file, the module filing. The class's folder is
  //    lessons/<slug>/ — tutor's OWN lane, so the wall never fights these writes.
  const slugify = t => String(t || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40)

  MT({ id: 'learn_add_class', card: 'learn', klass: 'write', readback: lessonBack,
    blurb: 'put a CLASS on the shelf — a real enrolled class (or any course of study) the human names in conversation. its lessons, files, and textbook grow from there.',
    clue: `add a class to the 📚 shelf.
template: { "tool": "learn_add_class", "title": "CSIS-1430 web" }
- fire it when the human names a class they are taking. ONE per class; check the shelf first
  (learn_list_lessons) — a class already there never gets a twin.
- the class owns a sandbox folder (lessons/<slug>/) — class_file_write files the syllabus and
  assignments there; lessons land in it as you build them; the 📖 textbook stitches it all.`,
    strike: (call) => {
      const title = String(call.title || '').trim()
      if (!title) return 'learn_add_class: pass "title" — the class name as the human says it.'
      const cs = courses()
      if (cs.find(x => String(x.title).toLowerCase() === title.toLowerCase())) return 'learn_add_class: "' + title + '" is already on the shelf — nothing added, nothing lost.'
      cs.push({ id: 'lc' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), title, slug: slugify(title), savedAt: Date.now(), lessons: [] })
      coursesSet(cs)
      return 'learn_add_class: "' + title + '" is on the shelf (folder lessons/' + slugify(title) + '/). Next moves: class_file_write for the syllabus, yt_transcript for its lectures.'
    } })

  MT({ id: 'class_file_write', card: 'learn', klass: 'write',
    readback: call => { try {
        const pre = 'lessons/' + slugify(call.course || '') + '/'
        const names = Object.keys(window.SANDBOX || {}).filter(n => n.indexOf(pre) === 0)
        return names.length + ' file(s) in ' + pre + (names.length ? ' — ' + names.map(n => n.split('/').pop()).join(' · ') : '')
      } catch (_) { return 'could not re-read the class folder' } },
    blurb: 'file a document into a class\'s own folder — syllabus.md from a pasted or screenshotted portal, one MD per assignment or quiz. the class\'s 📁 files bar shows it.',
    clue: `write one file into a class folder (lessons/<class-slug>/).
template: { "tool": "class_file_write", "course": "CSIS-1430 web", "name": "syllabus.md", "content": "# …" }
- THE DOCTRINE: when the human pastes or screenshots their class portal, the FIRST file is
  syllabus.md — the rules, the grading weights, the dates that bind. Then ONE .md per assignment
  or quiz as they appear (what it asks, when it locks, what proves it done). The packet accretes.
- "name" is the bare filename (syllabus.md, lab-getting-started.md); the folder comes from "course".
- edge: an unknown course comes back as a FAILED line naming what IS on the shelf.`,
    strike: (call, ctx) => {
      if (!call.content) return 'class_file_write: pass "content" — the document itself.'
      const cs = courses()
      const c = cs.find(x => String(x.title).toLowerCase() === String(call.course || '').toLowerCase()) || cs.find(x => x.id === call.course)
      if (!c) throw new Error('no class "' + (call.course || '?') + '" on the shelf — it holds: ' + (cs.map(x => x.title).join(' · ') || 'nothing — learn_add_class first'))
      const bare = String(call.name || 'note.md').replace(/[^\w.\- ]+/g, '').replace(/^\.+/, '')
      if (!bare) return 'class_file_write: that "name" reduced to nothing — pass a plain filename like syllabus.md.'
      const file = 'lessons/' + (c.slug || slugify(c.title)) + '/' + bare
      ctx.write(file, String(call.content), 'doc')
      try { window.dispatchEvent(new CustomEvent('oz-learn-shelf')) } catch (_) {}
      return 'class_file_write: ' + file + ' is in the class folder (' + String(call.content).length + ' chars). The 📁 files bar shows it.'
    } })

  // ⭐ class_file_read — THE LEARN CARD'S OWN READER (Sum 1 Sep 2026: "tutor should not be using monaco…
  //    not a good place for transcripts"). Until tonight the only numbered reader was monaco's read_file,
  //    so the tutor had to be lent a coder's tool to open its own transcripts, and the ```read fence was
  //    gated on that grant. This reads ONLY under lessons/ — a class folder, its transcripts, a syllabus —
  //    numbered like read_file so an add can still be placed by line, forgiving on the name the same way
  //    (exact key, then a UNIQUE suffix; two hits lists them; no hit names the folder's files).
  MT({ id: 'class_file_read', card: 'learn', klass: 'read',
    readback: call => { try {
        const n = String((call && call.name) || '')
        const sb = window.SANDBOX || {}
        const hit = Object.keys(sb).find(k => k.indexOf('lessons/') === 0 && (k === n || k.endsWith('/' + n.replace(/^\.?\//, ''))))
        return hit ? 'on disk · ' + hit + ': ' + String(sb[hit].data || '').length + ' chars' : 'no such lesson file'
      } catch (_) { return 'could not re-read the class folder' } },
    blurb: 'read a file from a class folder — a transcript, the syllabus, an assignment MD — back WITH LINE NUMBERS. the tutor\'s own reader; never monaco\'s.',
    clue: `read one file from under lessons/ — numbered.
template: { "tool": "class_file_read", "name": "cs-1410-java/transcripts/java-basics-if-statement.txt" }
- "name" is the path under lessons/ (the class slug, then the file). A bare filename works when it is unique.
- this is the same reader the READ step runs on the file you name in a \`\`\`read block — name the transcript
  there in CHAT and the que gets it numbered, for free, before it plans.
- edge: a miss names the files that ARE in that folder — read one of those; do not assume the lesson is missing.`,
    strike: (call, ctx) => {
      const sb = window.SANDBOX || {}
      const want = String((call && (call.name || call.filename)) || '').trim().replace(/^\.?\//, '')
      if (!want) return 'class_file_read: pass "name" — the path under lessons/.'
      const under = Object.keys(sb).filter(k => k.indexOf('lessons/') === 0 && typeof (sb[k] && sb[k].data) === 'string')
      const tail = want.indexOf('lessons/') === 0 ? want : 'lessons/' + want
      let hits = under.filter(k => k === tail)
      if (!hits.length) hits = under.filter(k => k.endsWith('/' + want) || k.endsWith('/' + want.split('/').pop()))
      if (hits.length > 1) return 'class_file_read: "' + want + '" matches ' + hits.length + ' files — say which: ' + hits.join(' · ')
      if (!hits.length) {
        const dir = tail.split('/').slice(0, -1).join('/')
        const near = under.filter(k => k.indexOf(dir + '/') === 0).slice(0, 10)
        return 'class_file_read: "' + want + '" is not under lessons/.' + (near.length ? ' In ' + dir + '/: ' + near.map(k => k.split('/').pop()).join(' · ') + ' — read one of THESE.' : ' Nothing is filed there yet — yt_transcript or class_file_write first.')
      }
      const name = hits[0], lines = String(sb[name].data).split('\n'), CAP = 500
      const body = lines.slice(0, CAP).map((l, i) => (i + 1) + '\t' + l).join('\n')
      const more = lines.length > CAP ? '\n…(' + (lines.length - CAP) + ' more lines — ask for a specific part)' : ''
      return 'read ' + name + (name !== want && name !== tail ? ' (you asked for ' + want + ')' : '') + ' — ' + lines.length + ' lines (numbered):\n' + body + more
    } })

  MT({ id: 'learn_set_module',
    run: 'search', next: 'learn_list_lessons first — the lesson must exist before it can be filed.', card: 'learn', klass: 'write', readback: lessonBack,
    blurb: 'file a saved lesson under a MODULE inside its class — big classes get structure (Module 1, Module 2…), small ones stay flat.',
    clue: `group a lesson under a module header on the shelf.
template: { "tool": "learn_set_module", "course": "CSIS-1430 web", "lesson": "tables and more tags", "module": "Module 1" }
- fire it when the class's own structure names modules — mirror THEIR names, don't invent a scheme.
- pass "module": "" to un-file one back to flat.`,
    strike: (call) => {
      const cs = courses()
      const c = cs.find(x => String(x.title).toLowerCase() === String(call.course || '').toLowerCase()) || cs.find(x => x.id === call.course)
      if (!c) throw new Error('no class "' + (call.course || '?') + '" on the shelf — it holds: ' + (cs.map(x => x.title).join(' · ') || 'nothing'))
      const L = (c.lessons || []).find(l => String(l.topic || '').toLowerCase() === String(call.lesson || '').toLowerCase())
      if (!L) throw new Error('no lesson "' + (call.lesson || '?') + '" in "' + c.title + '" — it holds: ' + ((c.lessons || []).map(l => l.topic).join(' · ') || 'nothing'))
      L.module = String(call.module || '').trim()
      coursesSet(cs)
      return 'learn_set_module: "' + L.topic + '" now sits under ' + (L.module ? '"' + L.module + '"' : 'no module (flat)') + ' in "' + c.title + '".'
    } })

  // ══ THE TUTOR PIPELINE, LAYER 2 — THE NOTES (Sum 2026-08-28: "then a notes section tutor can edit
  //    without learn, so learn can still pull up any snippet or phd or 5th, with the edits based on
  //    use"). The textbook is CURATED BY THE CONVO: a follow-up question marks where dense wasn't
  //    dense enough for THIS learner, and the answer gets promoted here. The note rides ON the saved
  //    lesson (course row → lesson → .notes), so the shelf, the dive, and the 📖 reader all show it —
  //    no learn-card round trip. Append by default; a human can always read and prune on the shelf.
  MT({ id: 'learn_write_note',
    run: 'search', next: 'learn_read_section first; a note APPENDS to what is already there, so you need the current text.', card: 'learn', klass: 'write',
    readback: call => { try {
        const cs = JSON.parse(getLS('toto_learn_courses', '[]') || '[]') || []
        const c = cs.find(x => String(x.title).toLowerCase() === String(call.course || '').toLowerCase()) || cs.find(x => x.id === call.course)
        const L = c && (c.lessons || []).find(l => String(l.topic || '').toLowerCase() === String(call.lesson || '').toLowerCase())
        return L ? 'on the shelf · notes now ' + String(L.notes || '').replace(/<[^>]+>/g, ' ').trim().length + ' chars on "' + (L.topic || '?') + '"' : 'that course/lesson is not on the shelf'
      } catch (_) { return 'could not re-read the shelf' } },
    blurb: 'promote an answer into the textbook: append (or replace) the NOTES on a saved lesson. fired when a follow-up question showed the dense version was not dense enough for THIS learner.',
    clue: `write the notes section of a saved lesson — the layer-2 residue of the conversation.
template: { "tool": "learn_write_note", "course": "…", "lesson": "…", "html": "<p>…</p>", "mode": "append" }
- "course" = the class title on the shelf (or its id) · "lesson" = the lesson's topic, as saved.
- "mode": "append" (default — notes ACCRETE) or "replace" (only when the human asked for a rewrite).
- WHEN to fire: the learner asked a follow-up, your answer landed, and it belongs in their book.
  Not every answer — the ones that mark where the dense sheet failed them.
- edge: an unknown course or lesson comes back as a plain FAILED line naming what IS on the shelf.`,
    strike: (call) => {
      if (!call.html) return 'learn_write_note: pass "html" — the note itself.'
      const bad = String(call.html).replace(/<[^>]+>/g, ' ').match(BANNED)
      if (bad) return '✗ learn_write_note REJECTED — "' + bad[0] + '" is a cold call wearing a politeness. nothing was written; say it straight.'
      const cs = courses()
      const c = cs.find(x => String(x.title).toLowerCase() === String(call.course || '').toLowerCase()) || cs.find(x => x.id === call.course)
      if (!c) throw new Error('no course "' + (call.course || '?') + '" on the shelf — it holds: ' + (cs.map(x => x.title).join(' · ') || 'nothing'))
      const L = (c.lessons || []).find(l => String(l.topic || '').toLowerCase() === String(call.lesson || '').toLowerCase())
      if (!L) throw new Error('no lesson "' + (call.lesson || '?') + '" in "' + c.title + '" — it holds: ' + ((c.lessons || []).map(l => l.topic).join(' · ') || 'nothing'))
      L.notes = (call.mode === 'replace' || !L.notes) ? String(call.html) : String(L.notes) + '\n' + String(call.html)
      L.notesAt = Date.now()
      coursesSet(cs)
      return 'learn_write_note: the note is in the book — "' + c.title + '" / "' + L.topic + '" (' + String(L.notes).replace(/<[^>]+>/g, ' ').trim().length + ' chars of notes now). The 📖 reader shows it at the lesson\'s foot.'
    } })

  // ══ THE TUTOR PIPELINE, LAYER 0 (Sum 2026-08-28: "we need this tool… if youtube, do this, save the
  //    transcript… tutor needs this first and foremost as every online class is this lazy") ═══════════
  //  The tool goes to TUTOR; it LIVES here in LEARN — tutor is the hands, learn is the library.
  //  Proven by hand first on his real SLCC week (the whole design: totois/EDUCATION.md, layer 0/1/2).
  //  ⚠ THE ROAD, PROVEN BY CURL 28 Aug: the watch-page caption URLs return an EMPTY 200 now (youtube
  //    wants a proof-of-origin token from web clients) — so the bolt is yt_player (main.rs), one
  //    narrow innertube POST as the ANDROID client, whose track URLs still answer. The track itself
  //    is a GET through the existing fetch_page bolt (UA-agnostic, verified), returning timedtext
  //    XML — flattened here by tag-strip. Caption LANGUAGE VARIES PER VIDEO (en vs en-US vs en-orig
  //    bit us on 28 Aug) — so match en* by prefix, prefer manual over auto (asr) tracks.
  //  Layer 1 (the dense, opinionated digest) is NOT this bean's job — no model in a bean. The clue
  //    tells the bot the digest is ITS next move, so the pipeline reads as one gesture to the human.
  // timedtext XML → plain prose: strip tags, unescape the five entities youtube uses, collapse space
  const flattenTimedtext = xml => String(xml || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ').trim()
  MT({ id: 'yt_transcript', card: 'learn', klass: 'write',
    run: 'search', next: 'this was LAYER 0 — the raw ore. Now READ what came back and digest it: learn_write_snippet with the concepts, the gotchas and their tells. Do not stop at saving the file; saving is not teaching.',
    readback: call => { try {
        // ⚠ 1 Sep 2026 — this counted the FLAT drawer no matter where the write went, so a transcript
        //    filed under a class reported "2 on the shelf" by looking at somebody else's shelf. Caught
        //    live: the bot said "transcript pulled and saved to cs1410, two on the shelf" having pulled
        //    nothing — the two were old files in the flat drawer. A readback that reads the wrong place
        //    is worse than none: it manufactures evidence for an act that did not happen.
        const c0 = String((call && call.course) || '').trim()
        const pre0 = c0 ? 'lessons/' + slugify(c0) + '/transcripts/' : 'lessons/transcripts/'
        const names = Object.keys(window.SANDBOX || {}).filter(n => n.indexOf(pre0) === 0)
        const last = names[names.length - 1]
        const d = last && window.SANDBOX[last] ? String(window.SANDBOX[last].data || '') : ''
        return names.length + ' transcript(s) on the shelf' + (last ? ' · newest ' + last + ' (' + d.length + ' chars): "' + d.slice(0, 90).replace(/"/g, "'") + '…"' : '')
      } catch (_) { return 'could not re-read the transcript shelf' } },
    blurb: 'a youtube link → its transcript saved as a sandbox file. layer 0 of the tutor pipeline: fetch, flatten, file. ALWAYS the first move on a lecture link — digest it yourself after.',
    clue: `save the transcript of a youtube video into the library.
template: { "tool": "yt_transcript", "url": "https://www.youtube.com/watch?v=…", "course": "CS-1410 java", "name": "optional-slug" }
- "course" is OPTIONAL but PASS IT whenever the human named a class: the file then lands in that class's
  own folder (lessons/<class-slug>/transcripts/). Without it everything piles into one flat drawer.
- ⚠ IN A QUE LINE, PUT THE URL AND THE COURSE ON THE SAME LINE — "learn yt_transcript <url> CS-1410 java".
  A que step carries ONE argument, so a course parked on a different step (learn_add_class) never reaches
  this call and the file lands flat. Caught live 1 Sep 2026: the plan was right, the filing was not.
- pass the FULL youtube url (watch, youtu.be, or shorts links all work). "name" is optional — a short
  slug for the file; without it the video's own title is slugged.
- the file lands at lessons/transcripts/<slug>.txt and the result hands back the first lines.
- THIS IS LAYER 0 ONLY — the raw ore. YOUR next move is layer 1: read what came back and digest it
  into a dense, opinionated breakdown (keep "this will be on the quiz", drop the anecdotes, flag the
  contrasts). Then offer the registers.
- edge: a video with captions OFF comes back as a plain FAILED line — say so, do not invent a summary.`,
    strike: async (call, ctx) => {
      // 2 Sep 2026 17:30 — the key is whatever the bot called it. Gemini-flash sent {"tool":"yt_transcript","link":…} and the
      //    strike answered 'pass "url"' over a perfectly good link one key away. Take url · link · href, else the first value that
      //    looks like a youtube address. Being liberal here is free: the regex below still has to find a real watch link.
      const url = String(call.url || call.link || call.href || (Object.values(call || {}).find(v => /youtu\.?be/i.test(String(v))) || ''))
      const m = url.match(/(?:youtube\.com\/(?:watch\?[^#]*v=|shorts\/)|youtu\.be\/)([\w-]{6,20})/)
      if (!m) return 'yt_transcript: pass "url" — a youtube watch / youtu.be / shorts link.'
      const inv = window.__TAURI__ && window.__TAURI__.core && window.__TAURI__.core.invoke ? window.__TAURI__.core.invoke
                : window.__TAURI__ && window.__TAURI__.invoke ? window.__TAURI__.invoke : null
      if (!inv) throw new Error('no fetch bolt — yt_transcript needs the native app (yt_player + fetch_page)')
      let player = {}; try { player = JSON.parse(String(await inv('yt_player', { videoId: m[1] }) || '')) } catch (_) { throw new Error('the player answer would not parse — nothing was saved') }
      const tracks = (((player.captions || {}).playerCaptionsTracklistRenderer || {}).captionTracks) || []
      if (!tracks.length) throw new Error('no caption tracks on this video (captions off, or ' + ((player.playabilityStatus || {}).status || 'a wall') + ') — nothing was saved')
      // language varies per video (en / en-US / en-orig): en* by prefix, manual beats auto (asr), else first
      const en = tracks.filter(t => String(t.languageCode || '').indexOf('en') === 0)
      const track = en.find(t => t.kind !== 'asr') || en[0] || tracks[0]
      if (!track || !track.baseUrl) throw new Error('no usable caption track — nothing was saved')
      const text = flattenTimedtext(String(await inv('fetch_page', { url: track.baseUrl }) || ''))
      if (!text) throw new Error('the caption track came back empty — nothing was saved')
      const title = (player.videoDetails || {}).title || m[1]
      const slug = String(call.name || title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || m[1]
      // ⭐ 1 Sep 2026 (Sum: "these should be saving to sandbox in my cs1410 folder"). A transcript is
      //    coursework, and coursework belongs to a CLASS. It used to land in one flat lessons/transcripts/
      //    drawer for every subject at once, so a Java lecture and a web-design lecture sat side by side
      //    with nothing but a slug to tell them apart — and learn_add_class had already given each class
      //    its own folder. Pass "course" and it files itself; leave it off and nothing changes.
      // ⚠ FORGIVING (1 Sep 2026): the que carries one argument per step, so a clone handed
      //    "<url> CS-1410 java" may put the whole string in "url" and leave "course" empty. Rather than
      //    lose the filing over a space, take whatever trails the url as the course. Be liberal in what
      //    you accept — the alternative is a correct plan filing to the wrong drawer, silently.
      let course = String(call.course || '').trim()
      if (!course) { const tail = url.replace(m[0], '').replace(/^[?&#][^\s]*/, '').trim(); if (tail) course = tail }
      // 2 Sep 2026 — THE TITLE KNOWS ITS CLASS. With no course named, a lecture titled "CSIS 1430 Orientation Part 5" went to
      //    the flat drawer (or wherever the bot guessed — it guessed cs-1410-java). If the title carries a class code and a
      //    lessons/<class>/ folder already starts with that code, that folder is the answer. Only when nothing was asked:
      //    a course the human or the bot named still wins, and a title with no code still lands in the flat drawer.
      // 18:35 — and when a course WAS given but the title carries a different class's code that also has a folder on the shelf, the
      //    title wins and the result says so: the runner clone guessed cs-1410-java for "CSIS 1430 Orientation Part 5" on a clean
      //    reset (the tutor's own context is full of cs-1410). A guess loses to evidence; a human who really wants it elsewhere
      //    moves it, and the result tells them where it went and why.
      let refiled = ''
      try {
        const slugs = [...new Set(Object.keys(window.SANDBOX || {}).map(k => (k.match(/^lessons\/([^/]+)\//) || [])[1]).filter(x => x && x !== 'transcripts'))]
        const codes = (String(title).match(/\b([a-z]{2,5})[- ]?(\d{4})\b/gi) || []).map(c => c.toLowerCase().replace(/[- ]/g, '').replace(/^([a-z]+)(\d{4})$/, '$1-$2'))
        const hit = slugs.find(sl => codes.some(c => sl.startsWith(c)))
        if (hit && !course) course = hit
        else if (hit && course && slugify(course) !== hit && slugs.includes(slugify(course)) && !codes.some(c => slugify(course).startsWith(c))) { refiled = ' (the title says ' + codes[0].toUpperCase() + ', so it went under ' + hit + ', not ' + slugify(course) + ')'; course = hit }
      } catch (_) {}
      const file = (course ? 'lessons/' + slugify(course) + '/transcripts/' : 'lessons/transcripts/') + slug + '.txt'
      ctx.write(file, title + '\n' + '='.repeat(Math.min(title.length, 80)) + '\n\n' + text, 'doc')
      // ⭐ 1 Sep 2026 — repaint the shelf. The file landed in the right class folder every time; the card's
      //    class row is painted once and only repaints on 'oz-learn-shelf', so a fresh transcript stayed
      //    invisible until a reopen and read as "the course didn't file right" (Sum, 22:18). Same event
      //    coursesSet fires — one listener, one repaint, no new road.
      try { window.dispatchEvent(new CustomEvent('oz-learn-shelf')) } catch (_) {}
      return 'yt_transcript: saved ' + file + refiled + ' (' + text.length + ' chars) — "' + title + '". Layer 0 done. NOW read it and digest: dense, opinionated, quiz-first.\n\nOPENING LINES:\n' + text.slice(0, 400) + '…'
    } })
})()