// analog.js — IBM mainframe / printer skin
(function analogMount() {
  const mount = document.getElementById('skin-mount');
  if (!mount) return;

  const s = document.createElement('style');
  s.textContent = `
.p-analog { display: flex; flex-direction: column; flex: 1; height: 100%; background: linear-gradient(180deg, #6A7060 0%, #5C6452 40%, #626858 100%); border: 1px solid #2A3020; border-radius: 4px; box-shadow: 0 8px 28px rgba(0,0,0,0.55), 0 2px 6px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.15), inset 0 -1px 0 rgba(0,0,0,0.28); overflow: hidden; }
.p-analog .ph { background: linear-gradient(180deg, #4A5040 0%, #3E4438 100%); border-bottom: 2px solid #2A2E24; flex-shrink: 0; box-shadow: inset 4px 4px 0 rgba(255,255,255,0.18), inset -4px -2px 0 rgba(0,0,0,0.22); }
.analog-title { font-size: var(--fs-title); text-transform: uppercase; letter-spacing: 2px; font-weight: 700; color: #8A9A80; text-shadow: 0 1px 0 rgba(0,0,0,0.6), 0 -1px 0 rgba(255,255,255,0.08); }
.analog-teeth { height: 18px; flex-shrink: 0; margin-left: 14px; background: linear-gradient(180deg, #2A2E24 0%, #7A8070 35%, #C8C4A8 70%, #F0EBD4 100%); }
.analog-printer { flex: 999 1 0; background-color: #F0EBD4; background-image: repeating-linear-gradient(180deg, transparent 0px, transparent 9px, rgba(0,0,0,0.18) 9px, rgba(0,0,0,0.18) 16px), linear-gradient(90deg, #D8D3BA 0px, #D8D3BA 13px, transparent 13px), linear-gradient(90deg, transparent 13px, #C4BFA4 13px, #C4BFA4 14px, transparent 14px), repeating-linear-gradient(180deg, rgba(180,220,180,0.28) 0px, rgba(180,220,180,0.28) 18px, transparent 18px, transparent 36px); background-size: 14px 25px, 100% 100%, 100% 100%, 100% 36px; background-repeat: repeat-y, no-repeat, no-repeat, repeat; padding: 10px 14px 10px 24px; font-family: 'Courier New', 'Courier', monospace; font-size: var(--fs-body); line-height: 1.65; color: #1A2A1A; }
.analog-printer::-webkit-scrollbar { width: 5px; }
.analog-printer::-webkit-scrollbar-track { background: #CEC9AE; }
.analog-printer::-webkit-scrollbar-thumb { background: #A09A7A; border-radius: 3px; }
.p-analog .oz-msg-u   { display: block; color: #4A3010; font-style: italic; white-space: pre-wrap; word-break: break-word; min-height: 1.65em; margin-bottom: 2px; }
.p-analog .oz-msg-bot { display: block; color: #1A3A1A; white-space: pre-wrap; word-break: break-word; min-height: 1.65em; margin-bottom: 8px; }
.p-analog .oz-msg-u::before   { content: '~ '; color: #9A6A20; font-style: normal; font-weight: 700; }
.p-analog .oz-msg-bot::before { content: '= '; color: #2A7A2A; font-weight: 700; }
.analog-tubes { background: linear-gradient(180deg, #323228 0%, #26261E 100%); border-top: 1px solid #16160E; border-bottom: 1px solid #16160E; padding: 3px 10px; height: 34px; display: flex; align-items: center; justify-content: space-between; cursor: ns-resize; flex-shrink: 0; gap: 2px; user-select: none; touch-action: none; }
.analog-tubes:hover { background: linear-gradient(180deg, #3C3C30 0%, #2E2E24 100%); }
.analog-resize-arr { font-size: 9px; color: #5A5030; opacity: 0.5; flex-shrink: 0; }
.ctube { width: 20px; height: 28px; position: relative; flex-shrink: 0; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; gap: 1px; }
.ct-glass { width: 12px; height: 16px; border-radius: 6px 6px 2px 2px; background: linear-gradient(180deg, rgba(48,38,14,0.5), rgba(18,14,4,0.88)); border: 1px solid #484020; position: relative; overflow: hidden; flex-shrink: 0; }
.ct-glow { position: absolute; left: 50%; top: 55%; transform: translate(-50%,-50%); width: 6px; height: 8px; border-radius: 50%; background: #FF8800; opacity: 0; filter: blur(3px); transition: opacity 0.3s; }
.ctube:nth-child(odd) .ct-glow { opacity: 0.2; }
@keyframes tube-flicker { 0%,100% { opacity: 0.18; } 30% { opacity: 0.38; } 60% { opacity: 0.12; } }
.analog-tubes:hover .ctube:nth-child(odd) .ct-glow { animation: tube-flicker 1.8s ease-in-out infinite; }
.ct-base { width: 15px; height: 4px; background: linear-gradient(90deg,#484020,#887840,#484020); border-radius: 1px; flex-shrink: 0; }
.ct-pins { display: flex; gap: 2px; }
.ct-pin  { width: 1px; height: 3px; background: #686040; border-radius: 0 0 1px 1px; }
.analog-dock { display: flex; align-items: stretch; flex: 1 0 72px; min-height: 72px; background: linear-gradient(180deg, #2A2218 0%, #1E1A12 100%); border-top: 1px solid #160E08; position: relative; }
.analog-dock-left, .analog-dock-right { width: 76px; flex-shrink: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; padding: 6px 8px; }
.analog-dock-left { cursor: pointer; border-right: 1px solid #1A1408; transition: background 0.15s; }
.analog-dock-left:hover { background: rgba(255,153,0,0.06); }
.analog-dock.open .analog-dock-left { background: rgba(255,153,0,0.04); }
.analog-stack { width: 44px; height: 52px; position: relative; flex-shrink: 0; }
.astack-card { position: absolute; width: 36px; height: 46px; bottom: 0; left: 4px; background: linear-gradient(180deg, #E8D8A8, #D4C088); border: 1px solid #B8A060; border-radius: 1px; }
.astack-card::before { content: ''; display: block; height: 4px; margin: 4px 3px 0; background: repeating-linear-gradient(90deg, transparent 0px, transparent 3px, rgba(0,0,0,0.18) 3px, rgba(0,0,0,0.18) 5px); border-radius: 1px; }
.analog-dock-left  .astack-card:nth-child(1) { transform: rotate(-5deg) translateY(5px); }
.analog-dock-left  .astack-card:nth-child(2) { transform: rotate(-1deg) translateY(2px); }
.analog-dock-left  .astack-card:nth-child(3) { transform: rotate(4deg); }
.analog-dock-right .astack-card:nth-child(1) { transform: rotate(-4deg) translateY(4px); }
.analog-dock-right .astack-card:nth-child(2) { transform: rotate(3deg); }
.analog-dock-right { border-left: 1px solid #1A1408; }
.analog-dock-inner { flex: 1; display: flex; align-items: stretch; position: relative; overflow: hidden; }
.analog-dock-slot { width: 56px; flex-shrink: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; }
.analog-slot-left  { border-right: 1px solid #1A1408; }
.analog-slot-right { border-left:  1px solid #1A1408; }
.aslot-label { font-size: 9px; letter-spacing: 0.12em; color: #6A5A40; text-transform: uppercase; font-family: monospace; }
.acard-slot { width: 44px; flex-shrink: 0; }
.acard-slot-lip { height: 4px; background: linear-gradient(180deg, #4A3A22 0%, #362A18 100%); border: 1px solid #1A1208; }
.acard-slot-lip:first-child { border-radius: 2px 2px 0 0; }
.acard-slot-lip:last-child  { border-radius: 0 0 2px 2px; }
.acard-slot-opening { height: 8px; background: #050300; box-shadow: inset 0 2px 4px rgba(0,0,0,0.95), inset 0 -1px 2px rgba(0,0,0,0.6); background-image: repeating-linear-gradient(90deg, transparent 0px, transparent 6px, rgba(255,160,40,0.07) 6px, rgba(255,160,40,0.07) 7px); }
.analog-dock-center { flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 0 6px; }
.analog-porthole { width: 52px; height: 52px; border-radius: 50%; flex-shrink: 0; background: #020500; overflow: hidden; position: relative; border: 4px solid #3A4A1A; box-shadow: 0 0 0 2px #101408, 0 0 0 5px #2A3210, inset 0 0 12px rgba(0,50,0,0.8), 0 2px 5px rgba(0,0,0,0.7); }
.analog-porthole svg { width: 100%; height: 100%; display: block; }
.aosc-lbl { position: absolute; bottom: 4px; left: 0; right: 0; text-align: center; font-size: 7px; color: #2A6020; letter-spacing: 0.1em; opacity: 0.85; font-family: monospace; }
.aosc-trace { fill: none; stroke: #00CC44; stroke-width: 2; filter: drop-shadow(0 0 3px #00EE44); }
.analog-speaker { width: 52px; height: 52px; border-radius: 50%; flex-shrink: 0; background: radial-gradient(circle at 38% 33%, #262620, #0E0E0C); border: 3px solid #38481E; box-shadow: 0 0 0 4px #181C10, inset 0 2px 5px rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; }
.analog-grille { width: 36px; height: 36px; border-radius: 50%; background: repeating-linear-gradient(0deg, transparent 0px, transparent 3px, rgba(80,100,60,0.16) 3px, rgba(80,100,60,0.16) 4px), repeating-linear-gradient(90deg, transparent 0px, transparent 3px, rgba(80,100,60,0.16) 3px, rgba(80,100,60,0.16) 4px); display: flex; align-items: center; justify-content: center; }
.analog-speaker-center { width: 12px; height: 12px; border-radius: 50%; background: radial-gradient(circle at 35% 35%, #8A9870, #3A4A2A); }
.analog-input-wrap { display: none; flex: 1; align-items: stretch; padding: 6px 8px; gap: 8px; background: linear-gradient(180deg, #181410 0%, #120E08 100%); }
.analog-dock.open .analog-input-wrap { display: flex; }
.analog-dock.open .analog-dock-center, .analog-dock.open .analog-dock-slot { display: none; }
.analog-input { flex: 1; background: #080604; border: 1px solid #3A2810; color: #FF9900; font-family: 'Courier New', monospace; caret-color: #FF9900; border-radius: 2px; box-shadow: inset 0 2px 6px rgba(0,0,0,0.7); }
.analog-input::placeholder { color: #4A2E08; opacity: 1; }
.analog-input:focus { outline: 1px solid rgba(255,153,0,0.6); border-color: rgba(255,153,0,0.5); }
.analog-send { padding: 6px 14px; background: linear-gradient(180deg, #B85E08 0%, #8A3E06 100%); color: #FFD080; border: 1px solid rgba(255,153,0,0.3); border-radius: 3px; font-family: 'Courier New', monospace; font-size: var(--fs-label); font-weight: 900; letter-spacing: 0.2em; box-shadow: 0 2px 0 rgba(0,0,0,0.4); align-self: center; }
.analog-send:hover  { background: linear-gradient(180deg, #D06810 0%, #A04A08 100%); }
.analog-send:active { transform: translateY(1px); box-shadow: none; }
.p-analog.powered-off .pb { opacity: 0.35; pointer-events: none; }
`;
  document.head.appendChild(s);

  const tubeHTML = Array.from({length:9}, (_,i) =>
    `<div class="ctube" id="analog-ct${i}">
      <div class="ct-glass"><div class="ct-glow"></div></div>
      <div class="ct-base"></div>
      <div class="ct-pins"><div class="ct-pin"></div><div class="ct-pin"></div><div class="ct-pin"></div></div>
    </div>`
  ).join('');

  mount.innerHTML = `
<div id="analog-card" class="p-analog">
  <div class="ph ph-row1" id="analog-ph">
    <svg class="oz-model-icon" viewBox="0 0 24 28" width="24" height="28" fill="none">
      <line x1="12" y1="0" x2="12" y2="4" stroke="#8A9A80" stroke-width="1.5"/>
      <circle cx="12" cy="1.5" r="1.5" fill="#8A9A80"/>
      <rect x="5" y="4" width="14" height="10" rx="2" fill="#6A7A60" stroke="#8A9A80" stroke-width="0.8"/>
      <rect x="7" y="7" width="3" height="2" rx="1" fill="#FF9900" opacity="0.9"/>
      <rect x="14" y="7" width="3" height="2" rx="1" fill="#FF9900" opacity="0.9"/>
      <line x1="8" y1="11.5" x2="16" y2="11.5" stroke="#8A9A80" stroke-width="0.6"/>
      <rect x="10" y="14" width="4" height="2" fill="#5A6A50"/>
      <rect x="3" y="16" width="18" height="11" rx="2" fill="#5A6A50" stroke="#7A8A70" stroke-width="0.8"/>
      <rect x="7" y="18" width="10" height="6" rx="1" fill="#3A4A30" stroke="#6A7A60" stroke-width="0.5"/>
      <circle cx="9" cy="21" r="1" fill="#00CC44" opacity="0.8"/>
      <circle cx="12" cy="21" r="1" fill="#FF9900" opacity="0.6"/>
      <circle cx="15" cy="21" r="1" fill="#CC2200" opacity="0.5"/>
    </svg>
    <span class="ph-title analog-title">analog</span>
    <div class="coder-jewels">
      <div class="coder-jewel cj-r" id="analog-jsr"></div>
      <div class="coder-jewel cj-a" id="analog-jsa"></div>
      <div class="coder-jewel cj-g" id="analog-jsg"></div>
    </div>
    <button class="bot-stop" id="analog-stop" style="display:none">⏹</button>
  </div>
  <div class="skin-body">
  <div class="analog-teeth"></div>
  <div class="analog-printer skin-out" id="analog-msgs"></div>
  <div class="analog-tubes" id="analog-tubes" title="drag to resize">
    <span class="analog-resize-arr">↕</span>
    ${tubeHTML}
    <span class="analog-resize-arr">↕</span>
  </div>
  <div class="analog-dock skin-kbd" id="analog-dock">
    <div class="analog-dock-left" id="analog-dock-left" title="open keyboard">
      <div class="analog-stack">
        <div class="astack-card"></div><div class="astack-card"></div><div class="astack-card"></div>
      </div>
    </div>
    <div class="analog-dock-inner">
      <div class="analog-dock-slot analog-slot-left">
        <div class="acard-slot"><div class="acard-slot-lip"></div><div class="acard-slot-opening"></div><div class="acard-slot-lip"></div></div>
        <span class="aslot-label">INPUT</span>
      </div>
      <div class="analog-dock-center" id="analog-dock-center">
        <div class="analog-porthole"><svg viewBox="0 0 80 80"><path class="aosc-trace" d="M0,40 Q20,20 40,40 Q60,60 80,40"/></svg><span class="aosc-lbl">T/s</span></div>
        <div class="analog-speaker"><div class="analog-grille"><div class="analog-speaker-center"></div></div></div>
        <div class="analog-porthole"><svg viewBox="0 0 80 80"><path class="aosc-trace" d="M0,40 Q20,55 40,40 Q60,25 80,40"/></svg><span class="aosc-lbl">LOAD</span></div>
      </div>
      <div class="analog-dock-slot analog-slot-right">
        <div class="acard-slot"><div class="acard-slot-lip"></div><div class="acard-slot-opening"></div><div class="acard-slot-lip"></div></div>
        <span class="aslot-label">OUTPUT</span>
      </div>
      <div class="analog-input-wrap" id="analog-input-wrap" onclick="event.stopPropagation()">
        <textarea id="analog-input" class="bot-input analog-input" placeholder="submit job…"></textarea>
        <button id="analog-send" class="bot-send analog-send">RUN</button>
      </div>
    </div>
    <div class="analog-dock-right">
      <div class="analog-stack"><div class="astack-card"></div><div class="astack-card"></div></div>
    </div>
  </div>
  </div>
</div>`;

  toto.mountResize({ sliderId: 'analog-tubes', topId: 'analog-msgs', minTop: 80, minBottom: 80 });

  const dockLeft  = document.getElementById('analog-dock-left');
  const dock      = document.getElementById('analog-dock');
  const inputWrap = document.getElementById('analog-input-wrap');
  const inputEl   = document.getElementById('analog-input');
  if (dockLeft && dock && inputWrap) {
    dockLeft.addEventListener('click', () => {
      const isOpen = dock.classList.contains('open');
      dock.classList.toggle('open', !isOpen);
      inputWrap.style.display = isOpen ? 'none' : 'flex';
      if (!isOpen && inputEl) inputEl.focus();
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && dock.classList.contains('open')) {
        dock.classList.remove('open');
        inputWrap.style.display = 'none';
      }
    });
  }

  toto.mount({ skinId: 'analog', cardId: 'analog-card', msgsId: 'analog-msgs', inputId: 'analog-input', sendId: 'analog-send', stopId: 'analog-stop' });
})();
