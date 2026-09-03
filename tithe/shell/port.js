// port.js — THE PORTED COPY (Sum 2026-08-22: "since we port in a fresh copy from web, once ported can we add
// cookies and milk?"). The live Port Side View is a page on another origin; pointed at, it is untouchable.
// PULLED through the bolt (fetch_page) and set as the frame's own document (srcdoc), it is ours: same origin,
// so the same breakdown.js that dresses My View and The Feedline walks it too, the hat on every headline,
// links routed out, the "left" tell for cookies and milk. The live site is not changed in any way.
//
// The copy is a PRINT, not a running paper: every executable <script> is stripped (the page is static
// already; its own scripts would re-pull wires and trip CORS from this origin). The #psv-cards JSON stays
// (data, not code) and gives every story its link. <base href> keeps pictures, styles and fonts on the live
// host. Press the porthole again while it is on top and a fresh copy is pulled (Sum: "pull a copy on each page").
// READ NEXT (the print's .sf-more[data-page] buttons): the live paper's own way, copied — the slug is the bare page name
// (town · world · ludicrous…), the page is APPENDED below the current one with its label, the menu moves down; only the
// fetch differs: it rides the bolt through the card, because the copy cannot fetch the live host cross-origin.
// THE STORY PRESS belongs to the paper's own card script (kept): the card opens first, its link goes out. Titles
// carry data-link for the Breakdown only; they are never anchors (an anchor skipped the card, Sum 2026-08-22).
// OUR OWN IP FIRST (Sum 2026-08-22: "on porthole we own the ip, so we can just hand it the clean version"): each
// title also carries data-text, the paper's own piece from #psv-cards (kick · body · byline · sources), so the
// hat hands the newsie OUR riff, with the source named as a reference, instead of fetching the source page.
(function () {
  'use strict'
  const inv = (cmd, args) => { const c = window.__TAURI__ && (window.__TAURI__.core || window.__TAURI__); if (!(c && c.invoke)) throw new Error('no bolt'); return c.invoke(cmd, args) }
  const here = p => new URL(p, location.href).href
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]))

  // the wiring that runs INSIDE the copy: every story block gets a real <a href> on its title from #psv-cards
  // (keyed by lowercase title, the pressman's own index), so the default press is the article, and
  // breakdown.js has a link to dress. Inline on purpose: it is the copy's only script of its own.
  // the wiring that runs INSIDE the copy. The paper's own card script owns the story press (a press on a block opens
  // the paper's card: the riff, the art, "the article we riffed from →"). We add only: the link on each title as
  // data-link (for the Breakdown's clean read — never an <a>, which would skip the card), the road OUT for the
  // card's own links (side by side through the parent, plus the "left" tell for cookies and milk), the hull's
  // default, the dead snapshot of the plug's dock removed, READ NEXT ported in place, and the title's type kept.
  const WIRE = `(function(){try{var j=document.getElementById('psv-cards');var cards=j?JSON.parse(j.textContent||'{}'):{};
    var norm=function(x){return String(x||'').toLowerCase().replace(/[\u2018\u2019\u201c\u201d"']/g,'').replace(/&amp;/g,'&').replace(/[^a-z0-9&]+/g,' ').trim()};
    var byNorm={};Object.keys(cards).forEach(function(k){var nk=norm(k);if(nk)byNorm[nk]=cards[k];var c=cards[k];if(c&&c.title){var nt=norm(c.title);if(nt&&!byNorm[nt])byNorm[nt]=c}});
    var find=function(t){var n=norm(t);if(!n)return null;if(byNorm[n])return byNorm[n];var p=n.slice(0,56);var keys=Object.keys(byNorm);for(var i=0;i<keys.length;i++){if(keys[i].slice(0,56)===p)return byNorm[keys[i]]}return null};
    document.querySelectorAll('.sf-block.story').forEach(function(b){var h=b.querySelector('.sf-title');if(!h)return;var t=(h.textContent||'').trim();if(!t)return;var c=find(t);if(!c)return;var u=c.link||c.url;if(u)h.setAttribute('data-link',u);
      var own=[c.kick?String(c.kick).toUpperCase():'',c.body||'',c.by?'\u2014 '+c.by:'',(c.sources&&c.sources.length)?'SOURCES: '+c.sources.map(function(x){return (x.t||'')+' '+(x.u||'')}).join(' | '):''].filter(Boolean).join('\\n\\n');
      if(own.length>80)h.setAttribute('data-text',own.slice(0,12000))});
    var P=window.parent,go=function(u){try{var g=P.OZ_SPLIT||P.OZ_OPEN;return !!(g&&g(u))}catch(e){return false}};
    document.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('a[href]');if(!a||e.button!==0)return;if(!/^https?:/i.test(a.href))return;if(a.closest('article'))return;
      var vp=document.getElementById('vp'),title=(vp&&!vp.hidden&&document.getElementById('vp-title')?document.getElementById('vp-title').textContent:a.textContent)||'';var kick=(document.getElementById('vp-kick')||{}).textContent||'';
      if(go(a.href))e.preventDefault();try{P.postMessage({paper:document.body.dataset.paper,left:{title:String(title).trim(),link:a.href,source:String(kick).split('\u00b7').pop().trim(),text:((document.getElementById('vp-body')||{}).textContent||'').slice(0,600),at:Date.now()}},'*')}catch(x){}},true);
    var wireMore=function(){document.querySelectorAll('.sf-more[data-page]').forEach(function(b){if(b.dataset.wired)return;b.dataset.wired=1;b.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();
      if(document.getElementById('pg-'+b.dataset.page)){b.remove();return}b.textContent='opening\u2026';
      try{window.parent.postMessage({paper:document.body.dataset.paper,next:b.dataset.page},'*')}catch(x){}},true)})};wireMore();
    window.addEventListener('message',function(e){var d=e.data;if(!d||!d.nextPage)return;var slug=d.nextPage,b=null;document.querySelectorAll('.sf-more[data-page]').forEach(function(x){if(x.dataset.page===slug)b=x});
      var dv=document.createElement('div');dv.innerHTML=String(d.html||'');var pg=dv.querySelector('.sf-page');
      if(!pg){if(b)b.textContent='not pressed yet';return}
      pg.querySelectorAll('.sf-menu').forEach(function(x){x.remove()});
      var name=(dv.querySelector('.sf-flagtop b')||{textContent:slug}).textContent;var wrap=document.createElement('div');wrap.id='pg-'+slug;
      var lab=document.createElement('div');lab.className='sf-menu-lab';lab.style.cssText='text-align:center;letter-spacing:.14em;text-transform:uppercase;margin:36px 0 12px;border-top:2px solid #1b1712;padding-top:14px';lab.textContent=name;
      wrap.appendChild(lab);wrap.appendChild(pg);var hb=wrap.querySelector('#hull');if(hb)hb.remove();
      var m2=document.querySelector('.sf-menu');var col=document.querySelector('.sf-touchgrass')||document.querySelector('.sf-colophon');
      if(col&&col.parentNode)col.parentNode.insertBefore(wrap,col);else (document.querySelector('main')||document.body).appendChild(wrap);
      if(m2)wrap.appendChild(m2);if(b)b.remove();
      var j2=dv.querySelector('#psv-cards');if(j2){try{var more=JSON.parse(j2.textContent||'{}');Object.keys(more).forEach(function(k){if(!cards[k])cards[k]=more[k]});byNorm={};Object.keys(cards).forEach(function(k){var nk=norm(k);if(nk)byNorm[nk]=cards[k];var c=cards[k];if(c&&c.title){var nt=norm(c.title);if(nt&&!byNorm[nt])byNorm[nt]=c}})}catch(x){}}
      wrap.querySelectorAll('.sf-block.story').forEach(function(bk){var h=bk.querySelector('.sf-title');if(!h)return;var t=(h.textContent||'').trim();if(!t)return;var c=find(t);if(!c)return;var u=c.link||c.url;if(u)h.setAttribute('data-link',u);
        var own=[c.kick?String(c.kick).toUpperCase():'',c.body||'',c.by?'\u2014 '+c.by:''].filter(Boolean).join('\\n\\n');if(own.length>80)h.setAttribute('data-text',own.slice(0,12000))});
      try{window.BREAKDOWN&&BREAKDOWN.dress(wrap)}catch(x){}
      var pgs=document.querySelector('.sf-page');if(pgs&&pgs.classList.contains('sf-onecol')){/* the hull script folds only its own page; the appended one keeps the print's own tiers */}
      wireMore();wrap.scrollIntoView({behavior:'smooth'})});
    var hull=document.getElementById('hull');if(hull){var one=function(){try{return localStorage.getItem('paper-columns')!=='three'}catch(e){return true}};
      var folded=function(){var pg=document.querySelector('.sf-page');return !!(pg&&pg.classList.contains('sf-onecol'))};
      setTimeout(function(){if(one()!==folded())hull.click()},400);
      hull.addEventListener('click',function(){setTimeout(function(){try{localStorage.setItem('paper-columns',folded()?'one':'three')}catch(e){}},50)});
      window.addEventListener('storage',function(e){if(e.key==='paper-columns'&&one()!==folded())hull.click()})}
    var st=document.createElement('style');st.textContent='.sf-block.story{cursor:pointer}';document.head.appendChild(st)}catch(e){}})();`

  // the print's DEAD FURNITURE goes before any script runs: the static snapshot of the plug's dock (#sf-radio — it sits
  // AFTER the radio script in the markup, so "keep the last one" kept the corpse). A real parse, not a regex: nested
  // divs. The serialised document goes on to the string pipeline below.
  function prune(html) {
    try {
      const doc = new DOMParser().parseFromString(html, 'text/html')
      doc.querySelectorAll('#sf-radio').forEach(n => n.remove())   // the living frames (The Pier's studio loop) STAY: an iframe to the live host loads fine (Sum 2026-08-22: "the pier isn't making it into the porthole")
      return '<!doctype html>\n' + doc.documentElement.outerHTML
    } catch (_) { return html }
  }
  function transform(html, url, paperId) {
    const base = url.replace(/[^/]*$/, '')
    let s = prune(String(html || ''))
    // scripts out, the cards index in; inline handlers that reach for stripped globals are already guarded (window.X && X(this))
    // KEPT: the cards index (data), THE HULLS (the paper's own column toggle, inline) and THE PLUG (scroll-radio.js, self-contained,
    // localStorage only — Sum 2026-08-22: "plug doesn't work on card either, copy that from live paper too"). Everything else goes.
    // + THE CARD (Sum 2026-08-22: "clicking on article skips my card; port side view has its own cards for the article"): the inline
    //   script that reads #psv-cards and opens the paper's own card (#vp) on a story press. It owns the press; we stay out of its way.
    s = s.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, m => (/id=["']psv-cards["']/i.test(m) || /THE HULLS/.test(m) || /scroll-radio\.js/i.test(m) || /getElementById\('psv-cards'\)/.test(m)) ? m : '')
    s = s.replace(/<base\b[^>]*>/gi, '')
    s = s.replace(/<head\b[^>]*>/i, m => `${m}<base href="${esc(base)}">`)
    s = s.replace(/<body\b([^>]*)>/i, (m, attrs) => `<body${attrs.replace(/\sdata-paper="[^"]*"/, '')} data-paper="${esc(paperId)}">`)
    s = s.replace(/<\/body>/i, `<script>${WIRE}</script><script src="${esc(here('cards/myview/breakdown.js'))}"></script><script>try{window.BREAKDOWN&&BREAKDOWN.dress(document)}catch(e){}</script></body>`)
    return s
  }

  window.addEventListener('message', e => {   // READ NEXT (Sum 2026-08-22: "the pages after front page are not loading"): the copy asks for a slug,
    const d = e.data; if (!d || typeof d !== 'object' || !d.next || !d.paper) return   // the card pulls it through the bolt (the copy cannot fetch cross-origin) and hands the html back
    const f = [...document.querySelectorAll('iframe.app-frame')].find(x => x.contentWindow === e.source); if (!f || !f.dataset.port) return
    const url = new URL(String(d.next).replace(/[^a-z0-9-]/gi, ''), f.dataset.port).href
    pull(url).then(html => { try { e.source.postMessage({ nextPage: d.next, html }, '*') } catch (_) {} }).catch(err => { try { e.source.postMessage({ nextPage: d.next, html: '' }, '*') } catch (_) {} })
  })
  // pull the page through the bolt and seat it in the frame. resolves when the copy is set (not loaded).
  // the pull: the bolt in the app; in the browser mirror (0zcom, no bolt) the same worker rungs the wires use (wires.js)
  async function pull(url) {
    try { return await inv('fetch_page', { url }) } catch (_) {}
    const rungs = ['https://psv-mirror.sumbhodi.workers.dev/?url=' + encodeURIComponent(url), 'https://api.allorigins.win/raw?url=' + encodeURIComponent(url)]
    for (const r of rungs) { try { const res = await fetch(r); if (res.ok) return await res.text() } catch (_) {} }
    throw new Error('no bolt and no mirror reached the paper')
  }
  async function into(frame, url, paperId) {
    frame.dataset.port = url; frame.dataset.paper = paperId
    try {
      const html = await pull(url)
      frame.srcdoc = transform(html, url, paperId)
    } catch (e) {
      frame.srcdoc = `<!doctype html><meta charset="utf-8"><body style="margin:0;background:#f4efe1;color:#14140f;font:17px/1.6 Georgia,serif;display:flex;align-items:center;justify-content:center;min-height:100vh;text-align:center;padding:30px"><div>could not pull the paper: ${esc(e && e.message || e)}<br><small>press the porthole again to try once more</small></div></body>`
    }
  }
  window.OZ_PORT = { into, transform }
})()
