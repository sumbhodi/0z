// phone.js — phone chat skin
(function phoneMount() {
  const mount = document.getElementById('skin-mount');
  if (!mount) return;

  const s = document.createElement('style');
  s.textContent = `
.p-phone { display: flex; flex-direction: column; height: 100%; aspect-ratio: 538 / 1075; width: auto; max-width: 100%; margin: 0 auto; background: #0d0820; overflow: hidden; position: relative; }
.p-phone .ph { background: url('skins/phone/city.png') center / cover no-repeat, #0d0820; border-bottom: 1px solid rgba(80,50,120,.4); flex-shrink: 0; position: relative; z-index: 10; }
.p-phone .ph-title { color: #e0d0ff; font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif; font-weight: 600; }
.phone-frame-overlay { position: absolute; top: 44px; left: 0; width: 100%; height: calc(100% - 44px); object-fit: fill; pointer-events: none; z-index: 5; }
.phone-body { display: flex; flex-direction: column; flex: 1; min-height: 0; padding: 10% 9% 4%; position: relative; z-index: 6; }
.phone-msgs { flex: 1; min-height: 0; overflow-y: auto; padding: 10px 0; display: flex; flex-direction: column; gap: 6px; }
.phone-msgs::-webkit-scrollbar { width: 3px; }
.phone-msgs::-webkit-scrollbar-thumb { background: rgba(120,80,200,.3); border-radius: 2px; }
.p-phone .oz-msg { max-width: 78%; padding: 8px 12px; font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif; font-size: var(--fs-body); line-height: 1.4; border-radius: 8px; word-wrap: break-word; }
.p-phone .oz-msg-bot { align-self: flex-start; background: #2d1850; color: #e0ccff; border-bottom-left-radius: 2px; box-shadow: 0 3px 0 #1a0e30; }
.p-phone .oz-msg-u   { align-self: flex-end;   background: #1a2e40; color: #c0d8f0; border-bottom-right-radius: 2px; box-shadow: 0 3px 0 #0f1e2a; }
.p-phone .oz-msg-u::before   { content: ''; }
.p-phone .oz-msg-bot::before { content: ''; }
.phone-floor { display: flex; align-items: center; gap: 8px; padding: 8px 0; flex-shrink: 0; position: relative; z-index: 6; }
.phone-input-field { flex: 1; background: rgba(30,22,50,.9); border: 1.5px solid rgba(100,70,160,.5); border-radius: 18px; padding: 6px 14px; font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif; font-size: var(--fs-body); color: #c8c0e0; outline: none; resize: none; overflow-y: auto; line-height: 1.4; min-height: 36px; max-height: 168px; }
.phone-input-field::placeholder { color: rgba(160,140,200,.3); }
.phone-send-btn { width: 44px; height: 44px; border-radius: 50%; flex-shrink: 0; background: radial-gradient(circle at 38% 33%, #8844cc, #4418aa); border: none; color: #fff; font-size: 20px; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 3px 0 #2a0880; }
.phone-send-btn:hover { background: radial-gradient(circle at 38% 33%, #aa66ee, #6622cc); }
`;
  document.head.appendChild(s);

  mount.innerHTML = `
<div id="phone-card" class="p-phone">
  <div class="ph ph-row1">
    <img src="skins/phone/chat.png" class="oz-model-icon" alt="chat" style="height:28px;width:auto;border-radius:4px">
    <span class="ph-title" style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-weight:600;color:#e0d0ff">phone</span>
    <div class="coder-jewels">
      <div class="coder-jewel cj-r" id="phone-jsr"></div>
      <div class="coder-jewel cj-a" id="phone-jsa"></div>
      <div class="coder-jewel cj-g" id="phone-jsg"></div>
    </div>
    <button class="bot-stop" id="phone-stop" style="display:none">⏹</button>
  </div>
  <img src="skins/phone/phone-purple.png" class="phone-frame-overlay" alt="">
  <div class="phone-body" id="phone-body">
    <div class="phone-msgs" id="phone-msgs"></div>
    <div class="phone-floor" onclick="event.stopPropagation()">
      <textarea class="phone-input-field" id="phone-input" placeholder="message..." rows="1"></textarea>
      <button class="phone-send-btn" id="phone-send">↑</button>
    </div>
  </div>
</div>`;

  toto.mount({ skinId: 'phone', cardId: 'phone-card', msgsId: 'phone-msgs', inputId: 'phone-input', sendId: 'phone-send', stopId: 'phone-stop' });

  const _pi = document.getElementById('phone-input');
  if (_pi) {
    const MAX_H = 168;
    _pi.addEventListener('input', function () {
      this.style.height = 'auto';
      this.style.height = Math.min(this.scrollHeight, MAX_H) + 'px';
    });
  }
})();
