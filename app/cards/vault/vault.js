// vault.js — 🔐 THE VAULT. The safe, given a room and a keeper.
//
// ⭐⭐ ONE IMPLEMENTATION, TWO DOORS. Sum, 31 Aug 2026: "port and sync can have two homes, no need
// to strip from gear — that still works for minimal strips. Vogel and card are another perk of
// suite." So this card adds a DOOR, it does not move the thing:
//
//   ⚙ gear → settings.js:553  →  window.OZ_SAFE.renderInto(el)   ← every strip, no suite needed
//   🔐 vault card (here)      →  window.OZ_SAFE.renderInto(el)   ← the full suite's perk
//
// ⚠ TWO HOMES FOR A CAPABILITY IS FINE. TWO IMPLEMENTATIONS IS WHAT ROTS — they drift, one gets a
// fix the other does not, and a year on nobody knows which is authoritative. So there is NO safe
// logic in this file. Not one line. It is a room with a door and a call. All six boxes, the
// AES-GCM/PBKDF2 encryption, the pack/unpack roads — all of it stays in cards/settings/safe.js,
// which was already exposing exactly the interface this needed (renderInto). Nothing was refactored
// to make this possible; the seam was already cut. GREP BEFORE CARVE.
//
// ⭐ THE KEEPER IS VOGEL, and it is not an arbitrary pairing: a clerk who processes forms, keeps the
// minutes and files immaculately. SYNC IS PAPERWORK. The port is a counter. This is the one job in
// the app that is literally Vogel's job description — and Vogel has been a bot without a room since
// it arrived. A bot without a card is a talking head; a card without a bot is a filing cabinet
// nobody opens.
//
// THE ART — three separate pieces doing three separate jobs, and they must not be merged:
//   cards/vault/vault.png      the brass padlock — THE CARD's icon (replaces the 🔒 emoji)
//   skin/portsync-topbar.jpg   modern steel cabinets under fluorescent — THE CARD's head art
//   agents/vogel/vogel.png     the emoji pin pad — VOGEL'S FACE, unchanged, and it stays that way
//   ⭐ Sum's line that made the icon obvious: "this suite can have pin pad emoji, makes sense to
//     open a vault." A pin pad opens a vault. The keeper IS the keypad.

window.CARD_BUILDERS = window.CARD_BUILDERS || {}

function buildVault () {
  const body = document.createElement('div')
  body.className = 'p-vault'

  // ⚠ THE SAFE MAY NOT BE LOADED YET. safe.js is a plain script like this one, and script order is
  //   not a contract worth betting a blank card on. Draw an honest empty state and try again on the
  //   next open, rather than rendering nothing and looking broken.
  const mount = () => {
    if (window.OZ_SAFE && window.OZ_SAFE.renderInto) { body.innerHTML = ''; window.OZ_SAFE.renderInto(body); return true }
    body.innerHTML = '<p class="vault-wait">the safe has not loaded yet — close this card and open it again.</p>'
    return false
  }
  mount()

  const card = window.makeCard({
    id: 'vault',
    icon: 'cards/vault/vault.png',
    title: 'the vault',
    skin: 'card-vault',
    headArt: 'skin/portsync-topbar.jpg',
    headArtPos: 'center bottom',
    body,
    jewels: false,
    bottom: true
  })

  // re-render on every open — same reason settings.js does (settings.js:551): the six boxes read
  // live state (keys, the sandbox, what is on disk), so a stale panel would quietly lie about them.
  card.addEventListener('oz-card-open', mount)
  return card
}

window.CARD_BUILDERS.vault = buildVault
