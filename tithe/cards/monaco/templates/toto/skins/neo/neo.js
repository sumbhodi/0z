// neo.js — CRT terminal skin
(function neoMount() {
  const mount = document.getElementById('skin-mount');
  if (!mount) return;

  const s = document.createElement('style');
  s.textContent = `
.p-neo {
  display: flex; flex-direction: column; height: 100%;
  background: #C4BC9C; border: 1px solid #9A9280;
  border-radius: var(--r-sm);
  box-shadow: 0 6px 20px rgba(0,0,0,0.45), 0 2px 4px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.15);
  overflow: visible;
}
.p-neo .ph { background: #d4d0c0; border-bottom: 2px solid #a8a498; flex-shrink: 0; box-shadow: inset 4px 4px 0 rgba(255,255,255,0.5), inset -4px 0 0 rgba(0,0,0,0.15); }
.p-neo .ph-title { color: #062018; letter-spacing: 2px; }
.neo-pb { display: flex; flex-direction: column; flex: 1; min-height: 0; background: #d4d0c0; padding: 20px 18px 22px; box-shadow: inset 4px 4px 0 rgba(255,255,255,0.5), inset -4px -4px 0 rgba(0,0,0,0.2), inset 1px 1px 0 rgba(255,255,255,0.3); overflow: hidden; }
.neo-out {
  flex: 999 1 0; padding: 12px 14px;
  font-family: ui-monospace, 'SF Mono', 'Fira Code', monospace;
  font-size: var(--fs-body); line-height: 1.65; color: #00FF88; background: #01100a;
  border-radius: 4px; outline: 6px solid #3a3830; outline-offset: -1px;
  box-shadow: 0 0 0 10px #9a9590, 0 0 0 11px #6a6560, inset 4px 4px 12px rgba(0,0,0,0.7), inset -2px -2px 6px rgba(0,0,0,0.4);
  background-image: repeating-linear-gradient(0deg, rgba(0,0,0,0.18) 0px, rgba(0,0,0,0.18) 1px, transparent 1px, transparent 3px);
}
.neo-out::-webkit-scrollbar { width: 3px; }
.neo-out::-webkit-scrollbar-thumb { background: rgba(0,255,136,0.3); border-radius: 2px; }
.p-neo .oz-msg-u   { display: block; color: #7EFFD4; margin-bottom: 2px; }
.p-neo .oz-msg-bot { display: block; color: #00FF88; margin-bottom: 6px; }
.p-neo .oz-msg-u::before   { content: '~ '; color: #3a8060; }
.p-neo .oz-msg-bot::before { content: '= '; color: #007a40; }
.p-neo .panel-resize-h { flex-shrink: 0; height: 30px; background-color: #b8b4a4; border-top: 1px solid rgba(0,0,0,0.15); border-bottom: 1px solid rgba(0,0,0,0.12); cursor: ns-resize; user-select: none; touch-action: none; position: relative; margin: 10px -18px; }
.p-neo .panel-resize-h::after { content: '⇕'; position: absolute; left: 10px; top: 50%; transform: translateY(-50%); font-size: 13px; font-weight: 900; color: rgba(0,0,0,0.55); pointer-events: none; background: rgba(0,0,0,0.12); border: 1px solid rgba(0,0,0,0.2); border-radius: 3px; width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; line-height: 22px; text-align: center; }
.p-neo .panel-resize-h:hover { background-color: #a0a090; }
.p-neo .panel-resize-h:hover::after { color: rgba(0,0,0,0.85); background: rgba(0,0,0,0.2); }
.neo-kbd-bar { position: relative; display: flex; flex-direction: row; align-items: stretch; background: linear-gradient(to bottom, #bfbcac 0%, #aaa898 100%); flex: 1 0 56px; min-height: 56px; box-shadow: inset 0 1px 0 rgba(255,255,255,0.45), inset 0 -2px 0 rgba(0,0,0,0.22); }
.neo-kbd-bar::before { content: ''; position: absolute; top: 4px; left: 48px; right: 20px; bottom: 4px; border-radius: 2px; background-image: repeating-linear-gradient(90deg, rgba(210,206,192,0.75) 0px, rgba(210,206,192,0.75) 9px, rgba(70,66,56,0.28) 9px, rgba(70,66,56,0.28) 11px), repeating-linear-gradient(180deg, transparent 0px, transparent 8px, rgba(70,66,56,0.90) 8px, rgba(70,66,56,0.90) 9px, transparent 9px, transparent 19px, rgba(70,66,56,0.90) 19px, rgba(70,66,56,0.90) 20px, transparent 20px, transparent 30px, rgba(70,66,56,0.90) 30px, rgba(70,66,56,0.90) 31px, transparent 31px, transparent 41px, rgba(70,66,56,0.90) 41px, rgba(70,66,56,0.90) 42px, transparent 42px, transparent 50px); pointer-events: none; }
.neo-kbd-bar::after { content: ''; position: absolute; top: 4px; right: 4px; bottom: 4px; width: 16px; border-radius: 2px; background: repeating-linear-gradient(180deg, rgba(210,206,192,0.65) 0px, rgba(210,206,192,0.65) 8px, rgba(70,66,56,0.25) 8px, rgba(70,66,56,0.25) 9px, rgba(210,206,192,0.5) 9px, rgba(210,206,192,0.5) 19px, rgba(70,66,56,0.22) 19px, rgba(70,66,56,0.22) 20px, rgba(210,206,192,0.4) 20px, rgba(210,206,192,0.4) 30px); pointer-events: none; }
.neo-kbd-inner { display: contents; }
.neo-kbd-toggle { width: 44px; display: flex; align-items: center; justify-content: center; align-self: center; cursor: pointer; flex-shrink: 0; color: #6a6458; border-right: 1px solid rgba(0,0,0,0.15); transition: color 0.15s, background 0.15s; user-select: none; }
.neo-kbd-toggle:hover { color: #3a3428; background: rgba(0,0,0,0.06); }
.neo-kbd-bar.open .neo-kbd-toggle { color: #2a2418; background: rgba(0,0,0,0.08); }
.neo-kbd-input-wrap { display: none; flex: 1; align-items: stretch; gap: 7px; padding: 0 9px 0 8px; background: linear-gradient(to bottom, #bfbcac 0%, #aaa898 100%); position: relative; z-index: 2; }
.neo-kbd-bar.open .neo-kbd-input-wrap { display: flex; }
.neo-input { flex: 1; background: #0e1a10; border: 2px solid #3a3830; border-radius: 4px; color: #00FF88; font-family: ui-monospace, 'SF Mono', monospace; caret-color: #00FF88; box-shadow: inset 0 2px 6px rgba(0,0,0,0.6); background-image: repeating-linear-gradient(0deg, rgba(0,0,0,0.18) 0px, rgba(0,0,0,0.18) 1px, transparent 1px, transparent 3px); }
.neo-input::placeholder { color: #1a5c35; }
.neo-input:focus { border-color: rgba(0,255,136,0.5); }
.neo-send { padding: 6px 14px; background: #3a3830; color: #00FF88; border: 1px solid rgba(0,255,136,0.3); border-radius: 4px; font-family: ui-monospace, monospace; font-size: var(--fs-label); font-weight: 700; letter-spacing: 1px; box-shadow: 0 2px 0 rgba(0,0,0,0.4); }
.neo-send:hover { background: #4a4838; }
.neo-send:active { transform: translateY(1px); box-shadow: none; }
`;
  document.head.appendChild(s);

  mount.innerHTML = `
<div id="neo-card" class="p-neo">
  <div class="ph ph-row1">
    <svg class="oz-model-icon" width="28" height="28" viewBox="0 0 28 28" fill="none">
      <rect x="0.5" y="0.5" width="27" height="19" rx="2.5" fill="#C4BC9C" stroke="#9A9280" stroke-width="0.8"/>
      <rect x="0.5" y="0.5" width="27" height="4" rx="2.5" fill="rgba(255,255,255,0.18)"/>
      <rect x="3" y="3" width="22" height="14" rx="1.5" fill="#060D04"/>
      <line x1="5" y1="7" x2="12" y2="7" stroke="#00CC44" stroke-width="0.9" stroke-linecap="round"/>
      <line x1="5" y1="10" x2="18" y2="10" stroke="#00CC44" stroke-width="0.9" stroke-linecap="round" opacity="0.6"/>
      <line x1="5" y1="13" x2="14" y2="13" stroke="#00CC44" stroke-width="0.9" stroke-linecap="round" opacity="0.4"/>
      <rect x="12" y="6" width="2.5" height="2" rx="0.3" fill="#00EE55"/>
      <circle cx="25.5" cy="17.5" r="1.1" fill="#00CC44" opacity="0.7"/>
      <circle cx="22.5" cy="17.5" r="1.1" fill="#FF9900" opacity="0.4"/>
      <rect x="11" y="19" width="6" height="3.5" rx="0.5" fill="#ACA898"/>
      <rect x="6" y="22.5" width="16" height="3" rx="1.5" fill="#B8B0A0" stroke="#9A9288" stroke-width="0.5"/>
    </svg>
    <span class="ph-title" style="color:#062018;letter-spacing:2px">neo</span>
    <div class="coder-jewels">
      <div class="coder-jewel cj-r" id="neo-jsr"></div>
      <div class="coder-jewel cj-a" id="neo-jsa"></div>
      <div class="coder-jewel cj-g" id="neo-jsg"></div>
    </div>
    <button class="bot-stop" id="neo-stop" style="display:none">⏹</button>
  </div>
  <div class="neo-pb">
    <div class="neo-out skin-out" id="neo-out"></div>
    <div class="panel-resize-h" id="neo-resize" title="drag to resize"></div>
    <div class="neo-kbd-bar skin-kbd" id="neo-kbd">
      <div class="neo-kbd-inner">
        <div class="neo-kbd-toggle" id="neo-kbd-toggle" title="keyboard">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
            <rect x="2" y="6" width="20" height="13" rx="2" stroke="currentColor" stroke-width="1.8"/>
            <line x1="6" y1="10.5" x2="6" y2="10.5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
            <line x1="10" y1="10.5" x2="10" y2="10.5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
            <line x1="14" y1="10.5" x2="14" y2="10.5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
            <line x1="18" y1="10.5" x2="18" y2="10.5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
            <line x1="7" y1="14.5" x2="17" y2="14.5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
          </svg>
        </div>
        <div class="neo-kbd-input-wrap" id="neo-kbd-input-wrap" style="display:none" onclick="event.stopPropagation()">
          <textarea id="neo-input" class="bot-input neo-input" rows="1" placeholder="> type here..."></textarea>
          <button id="neo-send" class="bot-send neo-send">send</button>
        </div>
      </div>
    </div>
  </div>
</div>`;

  toto.mountResize({ sliderId: 'neo-resize', topId: 'neo-out', minTop: 60, minBottom: 56 });
  toto.mountToggle({ toggleId: 'neo-kbd-toggle', inputWrapId: 'neo-kbd-input-wrap', focusId: 'neo-input' });
  toto.mount({ skinId: 'neo', cardId: 'neo-card', msgsId: 'neo-out', inputId: 'neo-input', sendId: 'neo-send', stopId: 'neo-stop' });
})();
