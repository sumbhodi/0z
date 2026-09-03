// beach.js — dolphin / aquarium skin
(function beachMount() {
  const mount = document.getElementById('skin-mount');
  if (!mount) return;

  const s = document.createElement('style');
  s.textContent = `
@keyframes caustic {
  0%   { opacity: 0.32; transform: scale(1)    translateX(0px)  rotate(0deg); }
  25%  { opacity: 0.48; transform: scale(1.04) translateX(6px)  rotate(1deg); }
  50%  { opacity: 0.36; transform: scale(1.02) translateX(-4px) rotate(-1deg); }
  75%  { opacity: 0.52; transform: scale(1.05) translateX(3px)  rotate(0.5deg); }
  100% { opacity: 0.32; transform: scale(1)    translateX(0px)  rotate(0deg); }
}
#beach-card {
  display: flex; flex-direction: column;
  height: 100%; overflow: hidden;
  border-radius: var(--r-md) var(--r-md) 0 0;
  border: 1px solid rgba(160,215,235,0.45); border-bottom: 0;
  background: var(--chat-bg);
  box-shadow: 0 6px 28px rgba(0,0,0,0.55), 0 2px 6px rgba(0,0,0,0.3),
    inset 0 2px 0 rgba(255,255,255,0.45), inset 2px 0 0 rgba(255,255,255,0.2),
    inset -2px -2px 0 rgba(0,60,100,0.25), inset 0 0 40px rgba(0,140,200,0.08);
  position: relative;
}
#beach-card::before {
  content: ''; position: absolute; top: 0; left: 0;
  width: 60%; height: 3px;
  background: linear-gradient(to right, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.1) 60%, transparent 100%);
  pointer-events: none; z-index: 4; border-radius: var(--r-md) 0 0 0;
}
#beach-card::after {
  content: ''; position: absolute; top: 44px; left: 0; right: 0; bottom: 0;
  background: radial-gradient(ellipse 140px 80px at 20% 30%, rgba(0,180,220,0.22) 0%, transparent 70%),
    radial-gradient(ellipse 100px 120px at 70% 55%, rgba(0,140,200,0.18) 0%, transparent 70%),
    radial-gradient(ellipse 160px 60px at 45% 75%, rgba(80,200,240,0.14) 0%, transparent 70%);
  animation: caustic 8s ease-in-out infinite;
  pointer-events: none; z-index: 0;
}
#dolphin-header {
  background: linear-gradient(to bottom, #cce8f4 0%, #b8d8ec 100%);
  border-bottom: 2px solid rgba(60,160,220,0.5);
  box-shadow: inset 3px 0 0 rgba(255,255,255,0.5), inset -3px 0 0 rgba(255,255,255,0.5), inset 0 3px 0 rgba(255,255,255,0.4);
  flex-shrink: 0; position: relative; z-index: 2; cursor: default;
}
#beach-card .pb {
  display: flex; flex-direction: column; flex: 1; overflow: hidden;
  padding: 0 4px 4px;
  background: rgba(160,215,235,0.45);
  box-shadow: inset 3px 0 0 rgba(255,255,255,0.35), inset -3px 0 0 rgba(255,255,255,0.35), inset 0 3px 10px rgba(0,20,50,0.25);
}
#beach-msgs {
  flex: 999 1 0; padding: 18px 18px 10px;
  display: flex; flex-direction: column; gap: 12px; scroll-behavior: smooth;
  background: linear-gradient(to bottom, #8ab4d4 0%, #4a7ea0 18%, #1e4d6e 40%, #0f2e48 70%, #08192e 100%);
  position: relative; z-index: 1;
}
#beach-msgs::-webkit-scrollbar { width: 4px; }
#beach-msgs::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }
#beach-card .oz-msg-u {
  align-self: flex-end; animation: msg-in 0.22s ease-out;
  border: 1px solid rgba(180,220,240,0.4);
  border-radius: 28px 0 0 24px; border-right: none;
  margin-right: -18px; padding: 12px 28px 12px 22px; max-width: 84%;
  color: #0d1e2e;
  background: linear-gradient(160deg, #ffffff 0%, #e8f4fb 50%, #d4eaf6 100%);
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}
#beach-card .oz-msg-bot {
  align-self: flex-start; animation: msg-in 0.22s ease-out;
  border: 1px solid rgba(126,255,212,0.25);
  border-radius: 0 28px 24px 0; border-left: none;
  margin-left: -18px; padding: 12px 22px 12px 28px; max-width: 90%;
  color: #0d1e2e;
  background: linear-gradient(200deg, #eafff8 0%, #d4f7ee 50%, #c0f0e4 100%);
  box-shadow: 0 2px 8px rgba(0,0,0,0.12);
}
#beach-wave {
  flex-shrink: 0; height: 28px; cursor: ns-resize;
  background: linear-gradient(to bottom, #4a7ea0 0%, #0f2e48 100%);
  position: relative;
}
#beach-wave::after {
  content: '⇕'; position: absolute; left: 10px; top: 50%; transform: translateY(-50%);
  font-size: 16px; font-weight: 900; color: rgba(0,0,0,0.55); pointer-events: none;
}
#beach-ball-toggle {
  flex-shrink: 0; align-self: center; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  padding: 4px 8px;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.25));
  transition: transform 0.15s;
}
#beach-ball-toggle:hover { transform: scale(1.1) rotate(15deg); }
#beach-input-wrap { flex: 1; display: flex; align-items: stretch; gap: 12px; }
#beach-floor {
  display: flex; flex: 1 0 60px; min-height: 60px; align-items: stretch; gap: 0; padding: 0 8px;
  border-top: 2px solid #a08050;
  background: linear-gradient(to bottom, #d4b87a 0%, #c0a060 60%, #b09050 100%);
  box-shadow: inset 0 2px 0 rgba(255,255,255,0.3), inset 0 -2px 4px rgba(0,0,0,0.2);
}
#beach-input {
  background: #e8d4a8; border: 1px solid #c4a060; border-radius: var(--r-md);
  color: #2a1a04; box-shadow: inset 0 2px 6px rgba(100,60,10,0.12);
  flex: 1; align-self: stretch;
}
#beach-input::placeholder { color: rgba(100,70,20,0.4); }
#beach-send {
  background: linear-gradient(to bottom, #e8d4a0 0%, #c8a860 100%);
  color: #3a2008; border: 1px solid #a07840; border-radius: var(--r-md);
  box-shadow: 0 3px 0 #7a5820, inset 0 1px 0 rgba(255,255,255,0.45);
}
#beach-send:hover  { transform: translate(-1px,-1px); box-shadow: 0 4px 0 #7a5820, inset 0 1px 0 rgba(255,255,255,0.45); }
#beach-send:active { transform: translate(1px,3px);   box-shadow: none; }
#beach-card.powered-off .pb { opacity: 0.35; pointer-events: none; }
`;
  document.head.appendChild(s);

  mount.innerHTML = `
<div id="beach-card" class="panel p-beach">
  <div id="dolphin-header" class="ph ph-row1">
    <span style="font-size:24px;line-height:1">🐬</span>
    <span class="ph-title" style="color:#0a3a5a">toto</span>
    <div class="coder-jewels">
      <div class="coder-jewel cj-r" id="beach-jsr"></div>
      <div class="coder-jewel cj-a" id="beach-jsa"></div>
      <div class="coder-jewel cj-g" id="beach-jsg"></div>
    </div>
    <button class="bot-stop" id="beach-stop" style="display:none">⏹</button>
  </div>
  <div class="pb">
    <div id="beach-msgs" class="skin-out"></div>
    <div id="beach-wave">
      <svg width="100%" height="100%" viewBox="0 0 400 28" preserveAspectRatio="none">
        <rect x="0" y="14" width="400" height="14" fill="#0f2e48"/>
        <path d="M0 14 Q30 4 60 14 Q90 24 120 12 Q150 2 180 12 Q210 22 240 10 Q270 0 300 12 Q330 22 360 10 Q385 2 400 10 L400 28 L0 28 Z" fill="#1e6090"/>
        <path d="M0 14 Q30 4 60 14 Q90 24 120 12 Q150 2 180 12 Q210 22 240 10 Q270 0 300 12 Q330 22 360 10 Q385 2 400 10" fill="none" stroke="rgba(255,255,255,0.7)" stroke-width="2.5" stroke-linecap="round"/>
      </svg>
    </div>
    <div id="beach-floor" class="skin-kbd" onclick="event.stopPropagation()">
      <div id="beach-ball-toggle" title="open keyboard" style="font-size:40px;line-height:1;display:flex;align-items:center;justify-content:center;width:44px;height:44px">🐚</div>
      <div id="beach-input-wrap" style="display:none">
        <textarea id="beach-input" class="bot-input" placeholder="…" spellcheck="false"></textarea>
        <button id="beach-send" class="bot-send">send</button>
      </div>
    </div>
  </div>
</div>`;

  toto.mountResize({ sliderId: 'beach-wave', topId: 'beach-msgs', minTop: 60, minBottom: 60 });
  toto.mountToggle({ toggleId: 'beach-ball-toggle', inputWrapId: 'beach-input-wrap', focusId: 'beach-input' });
  toto.mount({ skinId: 'beach', cardId: 'beach-card', msgsId: 'beach-msgs', inputId: 'beach-input', sendId: 'beach-send', stopId: 'beach-stop' });
})();
