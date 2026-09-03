// historian.js — book / archive skin
(function historianMount() {
  const mount = document.getElementById('skin-mount');
  if (!mount) return;

  const s = document.createElement('style');
  s.textContent = `
.p-hist {
  --hist-bg: #0e0c0a; --hist-screen: #0a0908; --hist-ink: #c8b890; --hist-dim: rgba(200,184,144,0.2);
  display: flex; flex-direction: column; height: 100%;
  background: var(--hist-bg); border-color: #2a2018;
  box-shadow: 0 10px 36px rgba(0,0,0,0.85); overflow: hidden;
}
.p-hist .ph { flex-shrink: 0; background: url('skins/historian/hist-topbar.png') center / 100% 100% no-repeat, #1a1408; border-bottom: 2px solid #2a2018; }
.p-hist .coder-jewel { border: 1px solid rgba(154,120,72,0.3); }
.hist-book-wrap { flex: 999 1 0; min-height: 0; position: relative; display: flex; flex-direction: column; background: var(--hist-screen); overflow: hidden; }
.hist-top-img { position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: fill; z-index: 5; pointer-events: none; }
.hist-msgs { flex: 1; min-height: 0; overflow-y: auto; padding: 14% 14% 4%; font-family: 'Georgia', 'Times New Roman', serif; font-size: var(--fs-body); line-height: 1.7; color: var(--hist-ink); position: relative; z-index: 1; }
.hist-msgs::-webkit-scrollbar { width: 3px; }
.hist-msgs::-webkit-scrollbar-thumb { background: var(--hist-dim); border-radius: 2px; }
.p-hist .oz-msg-u   { display: block; color: #b8956a; font-size: var(--fs-body); margin-bottom: 3px; font-style: italic; }
.p-hist .oz-msg-bot { display: block; color: var(--hist-ink); margin-bottom: 10px; }
.hist-slider { flex-shrink: 0; cursor: ns-resize; user-select: none; position: relative; z-index: 4; touch-action: none; }
.hist-slider-img { pointer-events: none; display: block; width: 100%; height: 18px; object-fit: fill; }
.hist-buttons-wrap { position: relative; flex: 1 0 120px; min-height: 120px; z-index: 4; }
.hist-buttons-img { display: block; width: 100%; height: 100%; object-fit: fill; }
.hbw-talk, .hbw-send { position: absolute; top: 0; bottom: 0; cursor: pointer; z-index: 3; min-width: 30px; }
.hbw-talk { left: 0; width: 18%; }
.hbw-send { right: 0; width: 18%; }
.hist-bottom { position: absolute; top: 8%; bottom: 8%; left: 20%; right: 20%; z-index: 5; background: rgba(228,210,170,0.95); border: 2px solid rgba(100,70,30,0.35); border-radius: 3px; box-shadow: inset 0 1px 3px rgba(0,0,0,0.15); overflow: hidden; }
.hist-textarea { display: block; width: 100%; height: 100%; background: transparent; border: none; color: #1a0e04; font-family: 'Georgia', 'Times New Roman', serif; font-size: var(--fs-label); line-height: 1.4; caret-color: #5a3010; outline: none; resize: none; padding: 6px 20px; overflow-y: auto; }
.hist-textarea::placeholder { color: rgba(80,50,20,0.4); }
`;
  document.head.appendChild(s);

  mount.innerHTML = `
<div id="hist-card" class="p-hist">
  <div class="ph ph-row1">
    <span class="oz-model-icon" style="font-size:22px;line-height:1;display:flex;align-items:center">📜</span>
    <span class="ph-title" style="font-family:'Georgia',serif;color:#c8b890">historian</span>
    <div class="coder-jewels">
      <div class="coder-jewel cj-r" id="historian-jsr"></div>
      <div class="coder-jewel cj-a" id="historian-jsa"></div>
      <div class="coder-jewel cj-g" id="historian-jsg"></div>
    </div>
    <button class="bot-stop" id="historian-stop" style="display:none">⏹</button>
  </div>
  <div class="hist-book-wrap" id="hist-book-wrap">
    <img class="hist-top-img" src="skins/historian/historian-top.png" alt="">
    <div id="hist-msgs" class="hist-msgs"></div>
  </div>
  <div class="hist-slider" id="hist-slider">
    <img class="hist-slider-img" src="skins/historian/historian-slider.png" alt="" draggable="false">
  </div>
  <div class="hist-buttons-wrap">
    <img class="hist-buttons-img" src="skins/historian/historian-buttons-off.png" alt="">
    <div class="hbw-talk" id="hbw-talk" title="talk"></div>
    <div class="hbw-send" id="hist-send" title="send"></div>
    <div class="hist-bottom" id="hist-bottom" style="display:none">
      <textarea id="hist-input" class="hist-textarea" placeholder="ask the historian..."></textarea>
    </div>
  </div>
</div>`;

  toto.mountResize({ sliderId: 'hist-slider', topId: 'hist-book-wrap', minTop: 60, minBottom: 120 });
  toto.mountToggle({ toggleId: 'hbw-talk', inputWrapId: 'hist-bottom', focusId: 'hist-input', displayValue: 'block' });
  toto.mount({ skinId: 'historian', cardId: 'hist-card', msgsId: 'hist-msgs', inputId: 'hist-input', sendId: 'hist-send', stopId: 'historian-stop' });
})();
