// wires.js — THE WIRE KIT, shared by My View and The Feedline (one factory, two papers — IC's 5 R's).
// Lifted verbatim out of cards/myview/myview.html on 2026-08-22 (Sum: "newsie just gets to choose which
// wires to pull, reads the wire"): the catalog (WIRES · GROUP · GLABEL · MUSEUM · NAME) and the fetch
// ladder + parser (scroll-news.js L97-149 by way of My View). Classic script: these top-level consts are
// visible to the sheet's own <script> that follows. Nothing here touches the DOM.

// ── the catalog — carried from the parked lb-headlines-lanes.js so fill day starts loaded
const WIRES = [
  ['bbc','BBC','https://feeds.bbci.co.uk/news/world/rss.xml'],
  ['aljazeera','Al Jazeera','https://www.aljazeera.com/xml/rss/all.xml'],
  ['skynews','Sky News','https://feeds.skynews.com/feeds/rss/world.xml'],
  ['fox','FOX','https://moxie.foxnews.com/google-publisher/latest.xml'],
  ['npr','NPR','https://feeds.npr.org/1001/rss.xml'],
  ['guardian','Guardian','https://www.theguardian.com/world/rss'],
  ['nyt','NYT','https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml'],
  ['gnews','Wire','https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en'],
  ['ars','Ars','https://feeds.arstechnica.com/arstechnica/index'],
  ['hn','HN','https://hnrss.org/frontpage'],
  ['quanta','Quanta','https://www.quantamagazine.org/feed/'],
  ['phys','Phys.org','https://phys.org/rss-feed/'],
  ['nature','Nature','https://www.nature.com/nature.rss'],
  ['positive','Positive','https://www.positive.news/feed/'],
  ['goodnews','GoodNews','https://www.goodnewsnetwork.org/feed/'],
  ['grist','Grist','https://grist.org/feed/'],
]
// more wires (Sum 2026-08-21: "the weird, the science, the funnies", the museums). COMICS and WEIRD are the
// paper's own lists, cards/scroll/scroll-news.js L256 and L287, verbatim. Science joins what was already here.
WIRES.push(
  ['nasa','NASA','https://www.nasa.gov/news-release/feed/'], ['scidaily','ScienceDaily','https://www.sciencedaily.com/rss/top/science.xml'],
  ['oddity','Oddity Central','https://www.odditycentral.com/feed'], ['weirduni','Weird Universe','https://www.weirduniverse.net/feed'], ['boing','Boing Boing','https://boingboing.net/feed'],
  ['xkcd','xkcd','https://xkcd.com/rss.xml'], ['smbc','SMBC','https://www.smbc-comics.com/comic/rss'], ['pdl','Poorly Drawn Lines','https://poorlydrawnlines.com/feed/'],
  ['oatmeal','The Oatmeal','https://theoatmeal.com/feed/rss'], ['dino','Dinosaur Comics','https://www.qwantz.com/rssfeed.php'], ['qc','Questionable Content','https://www.questionablecontent.net/QCRSS.xml'],
  // THE RAG — tabloids, gossip, satire (scroll-news.js section 'rag', verbatim). This is where celebrity lived.
  ['tmz','TMZ','https://www.tmz.com/rss.xml'], ['nypost','NY Post','https://nypost.com/feed/'], ['onion','The Onion','https://www.theonion.com/rss'], ['bee','Babylon Bee','https://babylonbee.com/feed'], ['reductress','Reductress','https://reductress.com/feed/'],
  // DESIGN (scroll-news.js section 'design')
  ['archdaily','ArchDaily','https://feeds.feedburner.com/Archdaily'], ['dezeen','Dezeen','https://www.dezeen.com/feed/'], ['inhabitat','Inhabitat','https://inhabitat.com/feed/'],
  // US + the video desks (scroll-news.js sections 'us' and 'video' — YouTube channel feeds, Atom, thumbnails ride media:thumbnail)
  ['cnn','CNN','https://news.google.com/rss/search?q=when:24h+site:cnn.com&hl=en-US&gl=US&ceid=US:en'],
  ['ajvid','Al Jazeera · video','https://www.youtube.com/feeds/videos.xml?channel_id=UCNye-wNBqNL5ZzHSJj3l8Bg'], ['bbcvid','BBC · video','https://www.youtube.com/feeds/videos.xml?channel_id=UC16niRr50-MSBwiO3YDb3RA'], ['cnnvid','CNN · video','https://www.youtube.com/feeds/videos.xml?channel_id=UCupvZG-5ko_eiXAupbDfxWw'], ['dwvid','DW · video','https://www.youtube.com/feeds/videos.xml?channel_id=UCknLrEdhRCp1aegoMqRaCZg'], ['france24','France 24 · video','https://www.youtube.com/feeds/videos.xml?channel_id=UCQfwfsi5VrQ8yKZ-UWmAEFg'],
  // ENTERTAINMENT — the What's On desks (Variety · Collider · Decider · Screen Rant) and the rest of the row
  ['variety','Variety','https://variety.com/feed/'], ['collider','Collider','https://collider.com/feed/'], ['decider','Decider','https://decider.com/feed/'], ['screenrant','Screen Rant','https://screenrant.com/feed/'],
  ['deadline','Deadline','https://deadline.com/feed/'], ['rollingstone','Rolling Stone','https://www.rollingstone.com/feed/'], ['pitchfork','Pitchfork','https://pitchfork.com/feed/feed-news/rss'], ['thr','Hollywood Reporter','https://www.hollywoodreporter.com/feed/'],
  // THE TOWNS — the local desks (scroll-news.js 'local' + the town pills in scroll.js, verbatim)
  ['abc4','ABC4 Utah','https://www.abc4.com/feed/'], ['deseret','Deseret News','https://www.deseret.com/arc/outboundfeeds/rss/'], ['ksl','KSL','https://www.ksl.com/rss/news'],
  ['pvtimes','Pahrump Valley Times','https://pvtimes.com/feed/'], ['lvsun','Las Vegas Sun','https://lasvegassun.com/feeds/headlines/'], ['rj','Review-Journal','https://www.reviewjournal.com/feed/'], ['nvcurrent','Nevada Current','https://nevadacurrent.com/feed/'], ['nvindy','Nevada Independent','https://thenevadaindependent.com/feed'], ['reno','This Is Reno','https://thisisreno.com/feed/'],
  ['cosun','Colorado Sun','https://coloradosun.com/feed/'], ['denverite','Denverite','https://denverite.com/feed/'], ['denverpost','Denver Post','https://www.denverpost.com/feed/'],
  ['latimes','LA Times · local','https://www.latimes.com/local/rss2.0.xml'], ['ocreg','OC Register','https://www.ocregister.com/feed/'], ['dailynews','LA Daily News','https://www.dailynews.com/feed/'], ['presstel','Press-Telegram','https://www.presstelegram.com/feed/'], ['lbpost','Long Beach Post','https://lbpost.com/feed/'], ['lbbiz','LB Business Journal','https://lbbusinessjournal.com/feed/'],
  ['sfstandard','SF Standard','https://sfstandard.com/feed/'], ['seattle','Seattle Times','https://www.seattletimes.com/feed/'], ['gothamist','Gothamist','https://gothamist.com/feed'], ['blockclub','Block Club Chicago','https://blockclubchicago.org/feed/'], ['boston','Boston.com','https://www.boston.com/feed/'], ['standard','Evening Standard','https://www.standard.co.uk/rss'],
)
const GROUP = {
  news: ['bbc','aljazeera','skynews','fox','npr','cnn','guardian','nyt','gnews','positive','goodnews','grist'],
  rag: ['tmz','nypost','onion','bee','reductress'],
  entertainment: ['variety','collider','decider','screenrant','deadline','rollingstone','pitchfork','thr'],
  science: ['ars','hn','quanta','phys','nature','nasa','scidaily'],
  design: ['archdaily','dezeen','inhabitat'],
  weird: ['oddity','weirduni','boing'], funnies: ['xkcd','smbc','pdl','oatmeal','dino','qc'],
  video: ['ajvid','bbcvid','cnnvid','dwvid','france24'],
  towns: ['abc4','deseret','ksl','pvtimes','lvsun','rj','nvcurrent','nvindy','reno','cosun','denverite','denverpost','latimes','ocreg','dailynews','presstel','lbpost','lbbiz','sfstandard','seattle','gothamist','blockclub','boston','standard'],
  museums: ['cma','met','vam'] }
const GLABEL = { news: 'the news', rag: 'the rag — tabloids · gossip · satire', entertainment: "entertainment — what's on", science: 'the science', design: 'design', weird: 'the weird', funnies: 'the funnies', video: 'the video desks', towns: 'the towns', museums: 'the museums' }
// the museums are APIs, not RSS — the canvas lane's two CC0 houses (cards/scroll/scroll.js L1291-1306, mappers verbatim).
// ⚠ They fire ONLY on a FILL press, through the ladder, never on open (Sum 2026-08-05 killed live art calls on page load).
// the Art Institute of Chicago is STRIPPED (Sum 2026-08-22): its image server sits behind a Cloudflare bot challenge
// (cf-mitigated: challenge, 403 to the frame). No bot challenges in My View or The Feedline. Three houses remain.
const MUSEUM = { cma: 'Cleveland Museum of Art', met: 'The Met', vam: 'V&A London' }   // four houses, all keyless open access
const NAME = Object.assign(Object.fromEntries(WIRES.map(([id, n]) => [id, n])), MUSEUM)

// ── THE FETCH LADDER + THE PARSER — cards/scroll/scroll-news.js L97-149, verbatim. The bolt rung is
//    the fetch_page command (ported 2026-08-21); in the browser mirror that rung throws and the
//    worker/allorigins rungs carry, exactly as they do for the paper.
const MIRROR  = u => 'https://psv-mirror.sumbhodi.workers.dev/?url=' + encodeURIComponent(u)
const MIRROR2 = u => 'https://api.allorigins.win/raw?url=' + encodeURIComponent(u)
async function metal(url) {
  const P = window.parent, c = P && P.__TAURI__ && (P.__TAURI__.core || P.__TAURI__)
  if (!(c && c.invoke)) throw new Error('no bolt')
  const t = await c.invoke('fetch_page', { url }); if (!t) throw new Error('empty'); return t
}
async function grab(url) {
  try { const r = await fetch(url); if (r.ok) return await r.text() } catch (_) {}
  try { return await metal(url) } catch (_) {}
  try { const r = await fetch(MIRROR(url)); if (r.ok) return await r.text() } catch (_) {}
  const r = await fetch(MIRROR2(url)); if (r.ok) return await r.text()
  throw new Error('feed unreachable')
}
const picOf = m => {
  const u = m.getAttribute('url') || ''
  const t = (m.getAttribute('type') || '') + (m.getAttribute('medium') || '')
  return u && (/image/.test(t) || /\.(jpe?g|png|webp)([?#]|$)/i.test(u)) ? u : ''
}
function parse(xml) {
  const doc = new DOMParser().parseFromString(xml, 'text/xml')
  let nodes = Array.from(doc.querySelectorAll('item'))            // RSS
  if (!nodes.length) nodes = Array.from(doc.querySelectorAll('entry'))  // Atom
  return nodes.map(it => {   // second change to the transplant: the 14-item trim is gone, the full wire lands (Sum: 'load full wire into page')
    const g = t => it.querySelector(t)?.textContent || ''
    const raw = g('description') || g('summary') || g('content') || ''
    let img = '', best = 0
    ;['thumbnail', 'content'].forEach(tag => Array.from(it.getElementsByTagNameNS('*', tag)).forEach(m => {
      const u = picOf(m), w = parseInt(m.getAttribute('width'), 10) || 1
      if (u && w > best) { img = u; best = w }
    }))
    if (!img) { const e = it.querySelector('enclosure[type^="image"]'); if (e) img = e.getAttribute('url') || '' }
    if (!img) { const mm = raw.match(/<img[^>]+src=['"]([^'"]+)['"]/i); if (mm && !/pixel|track|1x1/i.test(mm[1])) img = mm[1] }
    if (!img) {
      let enc = ''; try { const n = it.getElementsByTagNameNS('*', 'encoded')[0]; enc = n ? n.textContent : '' } catch (_) {}
      const hay = (enc || raw).replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'").replace(/&amp;/g, '&')
      const mm = hay.match(/<img[^>]+src=['"]([^'"]+)['"]/i); if (mm && !/pixel|track|1x1/i.test(mm[1])) img = mm[1]
    }
    let link = (it.querySelector('link')?.textContent || '').trim()
    if (!link) { const a = it.querySelector('link'); link = (a && (a.getAttribute('href') || a.textContent) || '').trim() }
    const when = g('pubDate') || g('published') || g('updated') || ''
    return {
      title: (g('title') || '').replace(/\s+/g, ' ').trim(), link,
      desc: raw.replace(/<[^>]*>/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ').replace(/\s+/g, ' ').trim().slice(0, 360),
      img, hero: !!img, ts: when ? Date.parse(when) || 0 : 0,
      imgW: best > 1 ? best : null,   // one field added to the transplant: the widest media width parse() already found, for the sorter's picScore
    }
  }).filter(x => x.title && x.link)
}

