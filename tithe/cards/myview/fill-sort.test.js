// fill-sort.test.js. run: node fill-sort.test.js
// exit 0 on pass, nonzero with a clear message on fail. plain assert, no deps.
'use strict'
const assert = require('assert')
const F = require('./fill-sort.js')
// OLD CONTRACT WRAPPER (2026-08-21): the layout rule became three-column height balance (center takes its
// SHARE, rails keep pictures). centerShare:1 + railPics:0 reproduces the original rule exactly, so every
// earlier test keeps asserting what it asserted. New tests call F.sortEdition directly.
const sortOld = (items, opts) => F.sortEdition(items, Object.assign({ centerShare: 1, railPics: 0 }, opts || {}))

// a seeded shuffle so the determinism test is itself deterministic
function mulberry(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296 } }
function shuffled(arr, seed) { const r = mulberry(seed), a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t } return a }

const T0 = 1755700000000
function mk(id, over) {
  return Object.assign({
    id, title: 'Story ' + id + ' about a thing that happened today', link: 'https://x.test/' + id,
    source: 'wire', ts: T0 - Number(String(id).replace(/\D/g, '') || 0) * 1000,
    summary: 'A short summary of the story.', image: null
  }, over || {})
}
const ids = r => r.map(x => x.id)

let n = 0
function test(name, fn) { try { fn(); n++ } catch (e) { console.error('FAIL: ' + name + '\n  ' + (e && e.message)); process.exit(1) } }

// ── picScore ──
test('picScore: no image is 0, unknown size is 1.3', () => {
  assert.strictEqual(F.picScore(mk(1)), 0)
  assert.strictEqual(F.picScore(mk(1, { image: { url: 'u', w: null, h: null } })), 1.3)
  assert.strictEqual(F.picScore(mk(1, { image: { url: 'u', w: 0, h: 0 } })), 1.3)
  assert.strictEqual(F.picScore(mk(1, { image: { url: '', w: 1000, h: 800 } })), 0)
})
test('picScore: logo and small square penalties, landscape bonus, size ordering', () => {
  assert.strictEqual(F.picScore(mk(1, { image: { url: 'u', w: 200, h: 100 } })), 0.2)
  assert.strictEqual(F.picScore(mk(1, { image: { url: 'u', w: 400, h: 400 } })), 0.3)
  const big = F.picScore(mk(1, { image: { url: 'u', w: 1600, h: 900 } }))
  const mid = F.picScore(mk(1, { image: { url: 'u', w: 800, h: 450 } }))
  const tall = F.picScore(mk(1, { image: { url: 'u', w: 450, h: 800 } }))
  assert.ok(big > mid && mid > tall, 'bigger and landscape outrank')
  assert.ok(Math.abs(mid - tall - 0.25) < 1e-9, 'landscape bonus is 0.25')
  assert.ok(big > 1 && mid > 1 && tall > 1)
})

// ── estimateHeight ──
test('estimateHeight: formula and cap', () => {
  assert.strictEqual(F.estimateHeight({ title: '', summary: '' }), 2)
  assert.strictEqual(F.estimateHeight({ title: 'x'.repeat(38), summary: 'y'.repeat(60) }), 4)
  assert.strictEqual(F.estimateHeight({ title: 'x'.repeat(39), summary: 'y'.repeat(61) }), 6)
  assert.strictEqual(F.estimateHeight({ title: 'x', summary: 'y'.repeat(5000) }), 2 + 1 + Math.ceil(220 / 60))
  assert.strictEqual(F.estimateHeight({ title: 'x', summary: 'y'.repeat(5000) }, 60), 4)
  assert.strictEqual(F.estimateHeight({}), 2)
})

// ── dedupe ──
test('dedupe: keeps the better pic, drops the other as duplicate', () => {
  const a = mk('a', { title: 'Mayor opens the new bridge over the river', ts: T0, image: null })
  const b = mk('b', { title: 'Mayor opens the new bridge over the river!', ts: T0 - 5000, image: { url: 'u', w: 1600, h: 900 } })
  const r = sortOld([a, b])
  assert.deepStrictEqual(ids(r.center), ['b'])
  assert.strictEqual(r.dropped.length, 1)
  assert.strictEqual(r.dropped[0].why, 'duplicate')
  assert.strictEqual(r.dropped[0].item.id, 'a')
  assert.strictEqual(r.stats.dedupedCount, 1)
})
test('dedupe: equal pics keep the earlier ts', () => {
  const a = mk('a', { title: 'Council votes on the parking plan tonight', ts: T0 })
  const b = mk('b', { title: 'Council votes on the parking plan tonight', ts: T0 - 5000 })
  const r = sortOld([a, b])
  assert.deepStrictEqual(ids(r.left), ['b'])
  assert.strictEqual(r.dropped[0].item.id, 'a')
})
test('dedupe: distinct stories survive, short titles use word sets', () => {
  const a = mk('a', { title: 'Rain on Tuesday' })
  const b = mk('b', { title: 'Rain on Thursday' })
  const c = mk('c', { title: 'Jazz festival lineup announced for the fall season' })
  const r = sortOld([a, b, c])
  assert.strictEqual(r.dropped.length, 0)
  assert.ok(F.titleOverlap('Rain on Tuesday', 'Rain on Tuesday') === 1)
  assert.ok(F.titleOverlap('Rain on Tuesday', 'Rain on Thursday') < 0.6)
})

// ── fairness ──
test('fairness: a 3-item source lands within the first 6 interleaved positions', () => {
  const big = [], small = []
  for (let i = 0; i < 30; i++) big.push(mk('big' + i, { source: 'BigWire', title: 'Big wire story number ' + i + ' with its own words ' + i * 7 }))
  for (let i = 0; i < 3; i++) small.push(mk('sm' + i, { source: 'SmallWire', ts: T0 - 100000 - i * 1000, title: 'Small wire piece number ' + i + ' quite different ' + i * 11 }))
  const order = F.interleaveBySource(F.canonSort(big.concat(small)))
  const pos = order.map((it, i) => it.source === 'SmallWire' ? i : -1).filter(i => i >= 0)
  assert.deepStrictEqual(pos, [1, 3, 5])
  assert.ok(Math.max.apply(null, pos) < 6)
  const r = sortOld(big.concat(small))
  const railed = r.left.concat(r.right).filter(it => it.source === 'SmallWire')
  assert.strictEqual(railed.length, 3, 'the small wire is not buried by the cutoff')
})

// ── center ordering ──
test('center: ranked by picScore desc then ts desc, capped at centerMax, pics kept', () => {
  const items = [
    mk('p1', { image: { url: 'u', w: 800, h: 450 }, ts: T0 - 1 }),
    mk('p2', { image: { url: 'u', w: 1600, h: 900 }, ts: T0 - 9 }),
    mk('p3', { image: { url: 'u', w: 1600, h: 900 }, ts: T0 - 2 }),
    mk('p4', { image: { url: 'u', w: null, h: null } }),
    mk('logo', { image: { url: 'u', w: 100, h: 100 } }),
    mk('n1')
  ].map((it, i) => Object.assign(it, { title: 'Headline ' + i + ' with distinct words ' + ['alpha', 'bravo', 'charlie', 'delta', 'echo', 'foxtrot'][i] }))
  const r = sortOld(items, { centerMax: 2 })
  assert.deepStrictEqual(ids(r.center), ['p3', 'p2'])
  assert.ok(r.center.every(it => it.image && it.image.url && !it.textOnly))
  const rails = r.left.concat(r.right)
  assert.ok(rails.every(it => it.image === null && it.textOnly === true))
  assert.ok(ids(rails).indexOf('p1') >= 0 && ids(rails).indexOf('logo') >= 0 && ids(rails).indexOf('n1') >= 0)
})

// ── rail balance ──
test('rails: balanced by estimated height, matches an independent greedy', () => {
  const items = []
  const titles = ['x'.repeat(20), 'x'.repeat(50), 'x'.repeat(20), 'x'.repeat(50), 'x'.repeat(70), 'x'.repeat(70), 'x'.repeat(10), 'x'.repeat(10)]
  const sums = ['s'.repeat(30), 's'.repeat(100), 's'.repeat(100), 's'.repeat(30), 's'.repeat(10), 's'.repeat(10), 's'.repeat(200), 's'.repeat(100)]
  titles.forEach((t, i) => items.push(mk('r' + i, { title: t + ' ' + i, summary: sums[i], source: 'w' + (i % 3) })))
  const r = sortOld(items)
  // the rails are measured at the RAIL's width (2026-08-22): summary cap 140, ~26 title chars and ~44 summary chars a line
  const railH = it => F.estimateHeight(it, 140, 26, 44)
  const hs = a => a.reduce((s, it) => s + railH(it), 0)
  assert.strictEqual(r.stats.leftHeight, hs(r.left))
  assert.strictEqual(r.stats.rightHeight, hs(r.right))
  let L = 0, R = 0
  F.interleaveBySource(F.canonSort(items)).forEach(it => { const h = railH(it); if (L <= R) L += h; else R += h })
  assert.strictEqual(r.stats.leftHeight, L)
  assert.strictEqual(r.stats.rightHeight, R)
  assert.ok(Math.abs(L - R) <= 3, 'fixture balances within 3 units, got ' + L + ' vs ' + R)
  assert.strictEqual(r.left.length + r.right.length, 8)
})
test('rails: railMax caps and overflow is dropped', () => {
  const items = []
  for (let i = 0; i < 25; i++) items.push(mk('o' + i, { title: 'Overflow story ' + i + ' ' + ['k', 'l', 'm', 'n', 'p'][i % 5] + i * 3 }))
  const r = sortOld(items, { railMax: 4 })
  assert.strictEqual(r.left.length, 4)
  assert.strictEqual(r.right.length, 4)
  assert.strictEqual(r.dropped.filter(d => d.why === 'overflow').length, 17)
  assert.strictEqual(r.stats.droppedCount, 17)
})

// ── determinism ──
test('determinism: shuffled input five times gives deep-equal output', () => {
  const items = []
  for (let i = 0; i < 40; i++) {
    items.push(mk('d' + i, {
      source: ['A', 'B', 'C', 'D'][i % 4],
      title: 'Det story ' + i + ' ' + ['red', 'green', 'blue', 'gold', 'grey'][i % 5] + ' ' + (i * 13 % 7),
      image: i % 3 === 0 ? { url: 'u', w: 400 + i * 37, h: 300 + i * 11 } : (i % 3 === 1 ? { url: 'u', w: null, h: null } : null),
      summary: i % 2 ? 's'.repeat(i * 9) : undefined
    }))
  }
  items.push(mk('d40', { title: 'Det story 3 red 4', ts: items[3].ts }))   // a true duplicate with an equal ts
  const base = JSON.stringify(sortOld(items))
  for (let s = 1; s <= 5; s++) {
    assert.strictEqual(JSON.stringify(sortOld(shuffled(items, s * 101))), base, 'shuffle ' + s + ' differs')
  }
  assert.ok(!items.some(it => it.textOnly), 'input is not mutated')
})

// ── edge cases ──
test('edge: empty input', () => {
  const r = sortOld([])
  assert.deepStrictEqual(r, { center: [], left: [], right: [], dropped: [], stats: { inCount: 0, dedupedCount: 0, centerCount: 0, leftCount: 0, rightCount: 0, leftHeight: 0, rightHeight: 0, centerHeight: 0, centerTarget: 0, droppedCount: 0, boostedCount: 0 } })
  assert.doesNotThrow(() => sortOld(null))
  assert.doesNotThrow(() => sortOld(undefined, null))
  assert.doesNotThrow(() => sortOld([null, 3, 'x']))
})
test('edge: all no-pic fills rails, center empty', () => {
  const items = []
  for (let i = 0; i < 10; i++) items.push(mk('np' + i, { title: 'No pic story ' + i + ' ' + ['one', 'two', 'three', 'four', 'five'][i % 5] + i }))
  const r = sortOld(items)
  assert.strictEqual(r.center.length, 0)
  assert.strictEqual(r.left.length + r.right.length, 10)
})
test('edge: all-pic fills center, rest to rails text-only', () => {
  const items = []
  for (let i = 0; i < 10; i++) items.push(mk('ap' + i, { title: 'All pic story ' + i + ' ' + ['one', 'two', 'three', 'four', 'five'][i % 5] + i, image: { url: 'u', w: 1200, h: 800 } }))
  const r = sortOld(items)
  assert.strictEqual(r.center.length, 6)
  assert.strictEqual(r.left.length + r.right.length, 4)
  assert.ok(r.left.concat(r.right).every(it => it.image === null && it.textOnly === true))
})
test('edge: missing title and summary, null w/h, no ids, do not throw', () => {
  const items = [
    { id: 'm1', ts: T0, image: { url: 'u', w: null, h: null } },
    { id: 'm2', ts: T0, title: null, summary: null, image: { url: 'u' } },
    { ts: T0, title: 'no id here at all really' },
    { ts: T0, title: 'no id here at all really' },
    { id: 'm5' },
    { id: 'm6', title: 'Plain words and more plain words', image: { url: 'u', w: 'abc', h: 'def' } }
  ]
  let r
  assert.doesNotThrow(() => { r = sortOld(items) })
  const all = r.center.length + r.left.length + r.right.length + r.dropped.length
  assert.strictEqual(all, items.length)
  assert.strictEqual(r.stats.inCount, 6)
})


test('three-column height balance: center share, rails keep pictures, flags and fallbacks', () => {
  const items = []
  for (let i = 0; i < 40; i++) items.push(mk('b' + i, { source: ['a', 'b', 'c', 'd'][i % 4], title: 'Story number ' + i + ' with a headline of ordinary length', summary: 'Summary text '.repeat(12), image: { url: 'https://img/' + i + '.jpg', w: 1600, h: 900 } }))
  const ed = F.sortEdition(items, { centerMax: 1e9, railMax: 1e9 }), st = ed.stats
  assert.ok(ed.center.length > 1 && ed.center.length < 40, 'center holds a share, not everything: ' + ed.center.length)
  assert.ok(st.centerHeight <= st.centerTarget + 12, 'center stays near its target: ' + st.centerHeight + ' vs ' + st.centerTarget)
  assert.strictEqual(ed.left.length + ed.right.length + ed.center.length, 40, 'nothing dropped with caps open')
  assert.ok(Math.abs(st.leftHeight - st.rightHeight) <= 12, 'rails balanced by height: ' + st.leftHeight + ' / ' + st.rightHeight)
  assert.ok(ed.left.concat(ed.right).every(x => x.image && x.image.url && x.railPic === true && x.textOnly === false), 'rail items keep their pictures, flagged railPic')
  const ed2 = F.sortEdition(items, { centerMax: 1e9, railMax: 1e9, railPics: 0 })
  assert.ok(ed2.left.concat(ed2.right).every(x => x.image === null && x.textOnly === true), 'railPics:0 restores text-only rails')
  const ed3 = F.sortEdition(items, { centerMax: 1e9, railMax: 1e9, centerShare: 1 })
  assert.strictEqual(ed3.center.length, 40, 'centerShare:1 takes every picture to the center')
})


test('the megaphone: a boosted word goes to the front of the center, picture or not', () => {
  const items = []
  for (let i = 0; i < 12; i++) items.push(mk('m' + i, { source: ['a', 'b'][i % 2], title: (i === 7 ? 'Utah data centre wins a water fight' : 'Story number ' + i + ' about ordinary things'), image: i % 3 ? { url: 'https://img/' + i + '.jpg', w: 1600, h: 900 } : null }))
  const ed = F.sortEdition(items, { centerMax: 1e9, railMax: 1e9, boost: ['data centre'] })
  assert.strictEqual(ed.center[0].id, 'm7', 'the boosted story leads the center')
  assert.strictEqual(ed.center[0].boosted, true)
  assert.strictEqual(ed.stats.boostedCount, 1)
  const quiet = F.sortEdition(items, { centerMax: 1e9, railMax: 1e9 })
  assert.notStrictEqual(quiet.center[0] && quiet.center[0].id, 'm7', 'without the megaphone it sits where its (missing) picture puts it')
  assert.strictEqual(quiet.stats.boostedCount, 0)
})

const demo = F.sortEdition((() => { const a = []; for (let i = 0; i < 20; i++) a.push(mk('z' + i, { title: 'Demo ' + i + ' ' + ['a', 'b', 'c', 'd', 'e'][i % 5] + i * 3, image: i % 2 ? { url: 'u', w: 1000 + i, h: 600 } : null })); return a })())
console.log('PASS ' + n + ' tests; demo edition center=' + demo.stats.centerCount + ' left=' + demo.stats.leftCount + ' right=' + demo.stats.rightCount + ' heights=' + demo.stats.leftHeight + '/' + demo.stats.rightHeight + ' dropped=' + demo.stats.droppedCount)
