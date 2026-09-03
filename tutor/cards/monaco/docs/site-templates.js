// site-templates.js — the 🌐 WEBSITES and 🛒 STORES shelves. 2026-08-30.
//
// Sum: "satircal lightly ficiotn, simplified, store and websites please" — and the source is his
// own live site, ~/Local/ozhunga (join/ is the store, A1..C3 the sections). LIGHTLY FICTIONALISED:
// the shape and the voice are his, the names are not, so a stranger who opens one is editing a
// starter and not republishing ozhunga.
//
// ⭐ SIMPLIFIED ON PURPOSE. These are STARTERS. Somebody opens one in the editor, deletes the
// jokes, and ships their thing — so the HTML stays semantic and short, the CSS is a dozen custom
// properties, and there is no framework and no build step. The satire lives entirely in the COPY,
// which is the first thing anyone replaces. Nothing here is clever where clear would do.
//
// SHAPE: parts/00-deck.js's TCATS wants `get: () => [{key,label,filename,data,ext,ai}]` — exactly
// what corporateTemplates() returns. Same contract, so the picker needed one line per shelf.
;(function () {
  'use strict'

  var CSS = [
    ':root{--ink:#1b1a17;--dim:#6d675c;--bg:#fbf9f4;--line:#e4dfd2;--accent:#7a6ef0;--radius:10px}',
    '@media(prefers-color-scheme:dark){:root{--ink:#eceae4;--dim:#9c968a;--bg:#151417;--line:#2c2a30;--accent:#a99cff}}',
    '*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);line-height:1.6;',
    'font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif}',
    '.wrap{max-width:60rem;margin:0 auto;padding:clamp(1.5rem,4vw,4rem) 1.25rem}',
    'a{color:var(--accent)}h1{font-size:clamp(1.9rem,5vw,3rem);line-height:1.1;margin:0 0 .4em}',
    'h2{font-size:1.35rem;margin:2.4rem 0 .6rem}p{margin:0 0 1rem}',
    '.lede{font-size:1.15rem;color:var(--dim);max-width:44ch}',
    '.grid{display:grid;gap:1rem;grid-template-columns:repeat(auto-fit,minmax(15rem,1fr));margin:1.5rem 0}',
    '.card{border:1px solid var(--line);border-radius:var(--radius);padding:1.25rem}',
    '.card h3{margin:0 0 .3rem;font-size:1.05rem}.card p{color:var(--dim);font-size:.94rem;margin:0}',
    '.price{font-size:2rem;margin:.4rem 0}.price small{font-size:.85rem;color:var(--dim);font-weight:400}',
    '.btn{display:inline-block;margin-top:.9rem;padding:.6rem 1.1rem;border-radius:var(--radius);',
    'background:var(--accent);color:#fff;text-decoration:none;font-weight:600}',
    '.btn:focus-visible{outline:3px solid var(--ink);outline-offset:2px}',
    'footer{margin-top:3rem;padding-top:1.2rem;border-top:1px solid var(--line);color:var(--dim);font-size:.88rem}'
  ].join('\n')

  function page(title, body) {
    return '<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n' +
      '<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
      '<title>' + title + '</title>\n<style>\n' + CSS + '\n</style>\n</head>\n<body>\n' +
      '<div class="wrap">\n' + body + '\n</div>\n</body>\n</html>\n'
  }

  var STORE = page('Get in line — Bramble &amp; Vole', [
    '<!-- STORE STARTER. Replace the copy, keep the bones: one promise, three tiers, an honest',
    '     price line, one button per tier. The receipt block is the part people skip and the part',
    '     customers actually read. -->',
    '<h1>Get in line.</h1>',
    '<p class="lede">We make one thing and we make it slowly. There is a waiting list. This is',
    '   presented as a feature and, if we are honest, it is a staffing level.</p>',
    '',
    '<h2>How the line moves</h2>',
    '<div class="grid">',
    '  <div class="card">',
    '    <h3>Standing</h3><div class="price">$0<small> / forever</small></div>',
    '    <p>You are in the line. You may look at the line. Newsletter included, unfortunately.</p>',
    '    <a class="btn" href="#">Join</a>',
    '  </div>',
    '  <div class="card">',
    '    <h3>Seated</h3><div class="price">$5<small> / month</small></div>',
    '    <p>A chair. Early access to things that are not ready. First name known to staff.</p>',
    '    <a class="btn" href="#">Sit down</a>',
    '  </div>',
    '  <div class="card">',
    '    <h3>Named</h3><div class="price">$20<small> / month</small></div>',
    '    <p>Everything, plus your name somewhere small and permanent. Cancel any time; the name',
    '       stays, which is either the perk or the catch.</p>',
    '    <a class="btn" href="#">Take the seat</a>',
    '  </div>',
    '</div>',
    '',
    '<h2>What you actually pay</h2>',
    '<p>Listed prices are what leaves your card. The processor takes its cut, the state takes',
    '   sales tax, and we take what is left — which is less than the number above and more than',
    '   nothing. We would rather write that down than round it off.</p>',
    '',
    '<footer>Bramble &amp; Vole is a fictional storefront in a code template.',
    '  Swap the names, the numbers and the jokes before you ship it.</footer>'
  ].join('\n'))

  var SITE = page('Bramble &amp; Vole — we fix old chairs', [
    '<!-- WEBSITE STARTER. One page, four sections, no build step: who you are, what you do,',
    '     proof, how to reach you. If a section does not earn its scroll, delete it. -->',
    '<h1>We fix old chairs.</h1>',
    '<p class="lede">Two people, a bench, and a queue. Since 2019, mostly by word of mouth,',
    '   which is a polite way of saying we have never advertised and it shows.</p>',
    '',
    '<h2>What we do</h2>',
    '<div class="grid">',
    '  <div class="card"><h3>Re-webbing</h3><p>The bit that sags. Jute or elastic, your call,',
    '    and we will tell you honestly which one your chair wants.</p></div>',
    '  <div class="card"><h3>Joint repair</h3><p>Hide glue, clamps, and a week of leaving it',
    '    alone. The waiting is most of the work.</p></div>',
    '  <div class="card"><h3>Say no</h3><p>Sometimes a chair is done. We will say so before you',
    '    spend money, which loses us the job and keeps us the customer.</p></div>',
    '</div>',
    '',
    '<h2>Proof</h2>',
    '<p>&ldquo;They told me not to bother repairing the first one. I brought them four more.&rdquo;',
    '   &mdash; a customer who exists in this template only.</p>',
    '',
    '<h2>Find us</h2>',
    '<p>Back of the yard, second door. No sign. Ring the bell twice.<br>',
    '   <a href="mailto:hello@example.com">hello@example.com</a></p>',
    '',
    '<footer>A fictional workshop in a code template. Replace everything above this line.</footer>'
  ].join('\n'))

  window.OZ_SITE_TEMPLATES = {
    websites: [
      { key: 'site-onepage', label: '🌐  one-page site', ai: true, ext: 'html',
        filename: 'index.html', data: SITE }
    ],
    stores: [
      { key: 'store-tiers', label: '🛒  tiers &amp; a queue', ai: true, ext: 'html',
        filename: 'store.html', data: STORE }
    ]
  }
})()
