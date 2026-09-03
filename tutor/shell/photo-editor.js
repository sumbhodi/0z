// photo-editor.js — OZ_EDIT, the classic editor. a pic opens here; MS-Paint-in-Win97 register: big blocky
// buttons, minimal, it just works. all HARDCODED canvas — no AI, no engine, no server (the cheap 99%).
//
// FOR HUMANS:
//   filter presets · light sliders (bright/contrast/color) · rotate + flip · crop-by-drag · reformat-to-aspect.
//   save bakes the whole chain (crop → rotate/flip/filter → aspect) into a new PNG. the original stays put
//   (you output a version). cancel walks away clean. crop and aspect-snap are mutually exclusive — two ways to reshape.
//
// FOR AI:
//   OZ_EDIT.open(url, { onSave(dataURL) }). live preview = CSS filter+transform on the <img>; save = bake()
//   replays the same on a canvas and returns a PNG dataURL. shared by miraigen's gallery + MUD.

;(function () {
  const FILTERS = [
    { id: '',      label: 'none',  css: '' },
    { id: 'bw',    label: 'B&W',   css: 'grayscale(1)' },
    { id: 'sepia', label: 'sepia', css: 'sepia(.7)' },
    { id: 'warm',  label: 'warm',  css: 'saturate(1.25) sepia(.22) hue-rotate(-8deg)' },
    { id: 'cool',  label: 'cool',  css: 'saturate(1.1) hue-rotate(16deg) brightness(1.03)' },
    { id: 'vivid', label: 'vivid', css: 'saturate(1.6) contrast(1.08)' },
    { id: 'fade',  label: 'fade',  css: 'contrast(.86) brightness(1.1) saturate(.82)' },
  ]
  const fcss = id => (FILTERS.find(f => f.id === id) || FILTERS[0]).css

  function open(url, opts) {
    opts = opts || {}
    const veil = document.createElement('div'); veil.className = 'oz-edit-veil'
    veil.innerHTML = `<div class="oz-edit">
      <div class="oz-edit-bar"><span class="oz-edit-title">✎ edit</span><button class="oz-edit-cancel">cancel</button><button class="oz-edit-save">save</button></div>
      <div class="oz-edit-stage"><div class="oz-edit-frame"><img class="oz-edit-img" src="${url}" alt="edit"><div class="oz-edit-crop"><div class="oz-edit-marquee"></div></div></div></div>
      <div class="oz-edit-tools">
        <div class="oz-edit-grp"><span class="oz-edit-lab">filter</span><div class="oz-edit-filts"></div></div>
        <div class="oz-edit-grp"><span class="oz-edit-lab">light</span>
          <label>bright <input type="range" class="oz-adj" data-a="brightness" min="50" max="150" value="100"></label>
          <label>contrast <input type="range" class="oz-adj" data-a="contrast" min="50" max="150" value="100"></label>
          <label>color <input type="range" class="oz-adj" data-a="saturate" min="0" max="200" value="100"></label>
        </div>
        <div class="oz-edit-grp"><span class="oz-edit-lab">rotate</span>
          <button class="oz-edit-btn" data-rot="-90" title="left">↺</button><button class="oz-edit-btn" data-rot="90" title="right">↻</button>
          <button class="oz-edit-btn" data-flip="h" title="flip horizontal">⇆</button><button class="oz-edit-btn" data-flip="v" title="flip vertical">⇅</button>
        </div>
        <div class="oz-edit-grp"><span class="oz-edit-lab">crop</span>
          <button class="oz-edit-btn" data-crop="toggle" title="drag a box on the photo">✂ crop</button><button class="oz-edit-btn" data-crop="clear" title="clear the crop box">clear</button>
        </div>
        <div class="oz-edit-grp"><span class="oz-edit-lab">size</span>
          <button class="oz-edit-fmt on" data-asp="0">orig</button><button class="oz-edit-fmt" data-asp="1" title="square (IG)">1:1</button><button class="oz-edit-fmt" data-asp="0.8" title="portrait (IG)">4:5</button><button class="oz-edit-fmt" data-asp="0.5625" title="story / reel / TikTok">9:16</button><button class="oz-edit-fmt" data-asp="1.7778" title="landscape (YT)">16:9</button>
        </div>
      </div>
    </div>`
    const img = veil.querySelector('.oz-edit-img'), frame = veil.querySelector('.oz-edit-frame')
    const state = { filter: '', brightness: 100, contrast: 100, saturate: 100, rot: 0, flipH: 1, flipV: 1, aspect: 0, crop: null }
    function applyLive() {
      img.style.filter = `brightness(${state.brightness}%) contrast(${state.contrast}%) saturate(${state.saturate}%) ${fcss(state.filter)}`
      img.style.transform = `rotate(${state.rot}deg) scale(${state.flipH}, ${state.flipV})`
      if (state.aspect > 0) { frame.style.aspectRatio = String(state.aspect); frame.classList.add('cropped') }
      else { frame.style.aspectRatio = ''; frame.classList.remove('cropped') }
    }
    const filts = veil.querySelector('.oz-edit-filts')
    filts.innerHTML = FILTERS.map(f => `<button class="oz-edit-filt${f.id === '' ? ' on' : ''}" data-f="${f.id}">${f.label}</button>`).join('')
    filts.querySelectorAll('.oz-edit-filt').forEach(b => b.onclick = () => { state.filter = b.dataset.f; filts.querySelectorAll('.oz-edit-filt').forEach(x => x.classList.toggle('on', x === b)); applyLive() })
    veil.querySelectorAll('.oz-adj').forEach(s => s.addEventListener('input', () => { state[s.dataset.a] = +s.value; applyLive() }))
    veil.querySelectorAll('[data-rot]').forEach(b => b.onclick = () => { state.rot = (state.rot + (+b.dataset.rot)) % 360; applyLive() })
    veil.querySelector('[data-flip="h"]').onclick = () => { state.flipH *= -1; applyLive() }
    veil.querySelector('[data-flip="v"]').onclick = () => { state.flipV *= -1; applyLive() }
    veil.querySelectorAll('.oz-edit-fmt').forEach(b => b.onclick = () => {
      state.aspect = +b.dataset.asp
      veil.querySelectorAll('.oz-edit-fmt').forEach(x => x.classList.toggle('on', x === b))
      if (state.aspect > 0) setCropMode(false, true)   // aspect-snap and freeform-crop are mutually exclusive
      applyLive()
    })

    // crop-by-drag — rubber-band a box over the photo; the dim shows what you keep. fractions of the displayed
    // image, baked FIRST (natural space) so it composes cleanly with rotate/flip/filter/aspect.
    const cropLayer = veil.querySelector('.oz-edit-crop'), marquee = veil.querySelector('.oz-edit-marquee')
    const cropBtn = veil.querySelector('[data-crop="toggle"]'), clamp01 = v => Math.max(0, Math.min(1, v))
    function drawMarquee() {
      const cr = state.crop
      if (!cr) { marquee.style.display = 'none'; return }
      marquee.style.display = 'block'
      marquee.style.left = (cr.x * 100) + '%'; marquee.style.top = (cr.y * 100) + '%'
      marquee.style.width = (cr.w * 100) + '%'; marquee.style.height = (cr.h * 100) + '%'
    }
    function setCropMode(on, keepCrop) {
      frame.classList.toggle('cropping', on); cropBtn.classList.toggle('on', on)
      if (!on && !keepCrop) { state.crop = null; drawMarquee() }
      if (on && state.aspect > 0) {   // turning crop on drops the aspect snap
        state.aspect = 0; veil.querySelectorAll('.oz-edit-fmt').forEach(x => x.classList.toggle('on', x.dataset.asp === '0')); applyLive()
      }
    }
    cropBtn.onclick = () => setCropMode(!frame.classList.contains('cropping'))
    veil.querySelector('[data-crop="clear"]').onclick = () => { state.crop = null; drawMarquee() }
    cropLayer.addEventListener('mousedown', e => {
      const r = cropLayer.getBoundingClientRect()
      const sx = clamp01((e.clientX - r.left) / r.width), sy = clamp01((e.clientY - r.top) / r.height)
      const move = ev => {
        const cx = clamp01((ev.clientX - r.left) / r.width), cy = clamp01((ev.clientY - r.top) / r.height)
        state.crop = { x: Math.min(sx, cx), y: Math.min(sy, cy), w: Math.abs(cx - sx), h: Math.abs(cy - sy) }
        drawMarquee()
      }
      const up = () => {
        document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up)
        if (state.crop && (state.crop.w < 0.02 || state.crop.h < 0.02)) { state.crop = null; drawMarquee() }   // a tap, not a drag
      }
      document.addEventListener('mousemove', move); document.addEventListener('mouseup', up)
      e.preventDefault()
    })

    // cap the editor to the REAL viewport (WKWebView over-reports vh, which shoved the toolbar off-screen)
    const fit = () => { const ed = veil.querySelector('.oz-edit'); if (ed) ed.style.maxHeight = Math.max(240, veil.clientHeight - 40) + 'px' }
    const close = () => { window.removeEventListener('resize', fit); veil.remove() }
    veil.querySelector('.oz-edit-cancel').onclick = close
    veil.querySelector('.oz-edit-save').onclick = () => bake(url, state).then(out => { if (opts.onSave) opts.onSave(out); close() })
    veil.addEventListener('click', e => { if (e.target === veil) close() })
    document.body.appendChild(veil)
    requestAnimationFrame(fit); window.addEventListener('resize', fit)
  }

  // bake — replay the live edits onto a canvas → a new PNG. the original is never touched (output a version).
  // chain: crop (freeform, natural space) → rotate/flip/filter → aspect center-crop.
  function bake(url, s) {
    return new Promise(res => {
      const im = new Image()
      im.onload = () => {
        try {
          // 1) crop-by-drag — slice the chosen box out of the natural image first (fractions → pixels)
          const nw = im.naturalWidth, nh = im.naturalHeight
          let cx = 0, cy = 0, cw = nw, ch = nh
          if (s.crop && s.crop.w > 0.005 && s.crop.h > 0.005) {
            cx = Math.round(s.crop.x * nw); cy = Math.round(s.crop.y * nh)
            cw = Math.max(1, Math.round(s.crop.w * nw)); ch = Math.max(1, Math.round(s.crop.h * nh))
          }
          const base = document.createElement('canvas'); base.width = cw; base.height = ch
          base.getContext('2d').drawImage(im, cx, cy, cw, ch, 0, 0, cw, ch)
          // 2) rotate / flip / filter the cropped base
          const rot = ((s.rot % 360) + 360) % 360, swap = (rot === 90 || rot === 270)
          const c = document.createElement('canvas'); c.width = swap ? ch : cw; c.height = swap ? cw : ch
          const x = c.getContext('2d')
          x.translate(c.width / 2, c.height / 2); x.rotate(rot * Math.PI / 180); x.scale(s.flipH, s.flipV)
          x.filter = `brightness(${s.brightness}%) contrast(${s.contrast}%) saturate(${s.saturate}%) ${fcss(s.filter)}`
          x.drawImage(base, -cw / 2, -ch / 2)
          // 3) reformat — center-crop the result to the chosen aspect (1:1 · 4:5 · 9:16 · 16:9)
          if (s.aspect && s.aspect > 0) {
            const bw = c.width, bh = c.height
            let aw = bw, ah = bw / s.aspect
            if (ah > bh) { ah = bh; aw = bh * s.aspect }
            const c2 = document.createElement('canvas'); c2.width = Math.round(aw); c2.height = Math.round(ah)
            c2.getContext('2d').drawImage(c, (bw - aw) / 2, (bh - ah) / 2, aw, ah, 0, 0, c2.width, c2.height)
            return res(c2.toDataURL('image/png'))
          }
          res(c.toDataURL('image/png'))
        } catch (_) { res(url) }
      }
      im.onerror = () => res(url); im.src = url
    })
  }

  window.OZ_EDIT = { open }
})()
