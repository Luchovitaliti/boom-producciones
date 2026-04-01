// ═══════════════════════════════════════════════════════════
// CHAT — Canales dinámicos + emojis + gestión de canales
// ═══════════════════════════════════════════════════════════

const CHAT_BASE = [
  {id:'general',  name:'# General',   sec:'General'},
  {id:'ideas',    name:'# Ideas',     sec:'General'},
  {id:'barra',    name:'# Barra',     sec:'Áreas'},
  {id:'cm',       name:'# CM',        sec:'Áreas'},
  {id:'publicas', name:'# Públicas',  sec:'Áreas'},
  {id:'admin',    name:'# Admin',     sec:'Áreas'},
];

const EMOJIS = ['😀','😂','😍','❤️','🔥','💯','👍','🙌','🎉','💪','🚀','✅','⚠️','🍺','🥂',
                '😎','🤩','😭','😅','🤣','🤙','💬','📸','🎵','💥','⚡','🌟','💃','🕺','👏',
                '🙏','😤','🤔','🥳','😴','🫡','💀','🫶','🤞','✌️','🫠','🔊','📢','🎯','🏆'];

function getChatChannels() {
  const evChs = EVENTOS.map((e, i) => ({
    id: 'ev' + i,
    name: '# ' + (e.nombre ? e.nombre.slice(0, 22) : 'Evento ' + (i+1)),
    sec: 'Eventos',
    isEvent: true
  }));
  return [...CHAT_BASE, ...evChs, ...CUSTOM_CHANNELS.map(c => ({...c, sec:'Canales'}))];
}

function syncChatEventChannels() {
  getChatChannels().forEach(ch => {
    if (!CHAT_DATA[ch.id]) CHAT_DATA[ch.id] = {l: ch.name, msgs: []};
    else CHAT_DATA[ch.id].l = ch.name; // Sync name
  });
}

function pgChat() {
  syncChatEventChannels();
  const cn  = CU?.chatName || 'Anónimo';
  const col = AVC[USERS.indexOf(CU) % 8];
  const channels = getChatChannels();
  const isAdmin  = CU?.role === 'Admin Console';

  // Build sidebar sections
  const sections = {};
  channels.forEach(ch => {
    if (!sections[ch.sec]) sections[ch.sec] = [];
    sections[ch.sec].push(ch);
  });

  let sbHtml = '';
  Object.entries(sections).forEach(([sec, chs]) => {
    sbHtml += `<div class="chat-sec">${sec}</div>`;
    chs.forEach(ch => {
      const isDel = isAdmin && ch.sec === 'Canales';
      sbHtml += `<div class="chat-ch" id="ch-${ch.id}" onclick="setCh('${ch.id}')">
        <span>${ch.name}</span>
        ${isDel ? `<span class="chat-ch-del" onclick="event.stopPropagation();deleteChatChannel('${ch.id}')" title="Eliminar">✕</span>` : ''}
      </div>`;
    });
  });

  if (isAdmin) {
    sbHtml += `<button class="chat-add-btn" onclick="document.getElementById('m-chat-channel').style.display='flex'">+ Nuevo canal</button>`;
  }

  return `<div class="ptitle">💬 Chat interno</div>
  <div class="chat-whobox">
    <div class="av" style="background:${col}22;color:${col};width:28px;height:28px;font-size:11px">${ini(cn)}</div>
    <span>Chateando como <strong>${cn}</strong></span>
  </div>
  <div class="chat-wrap">
    <div class="chat-sb" id="chat-sb-list">${sbHtml}</div>
    <div class="chat-main">
      <div class="chat-hdr" id="chat-hdr"># General</div>
      <div class="chat-msgs" id="chat-msgs"></div>
      <div class="chat-inp-area">
        <div class="emoji-panel" id="emoji-panel">
          ${EMOJIS.map(e => `<span class="emoji-item" onclick="insertEmoji('${e}')">${e}</span>`).join('')}
        </div>
        <div class="chat-inp-row">
          <button class="emoji-btn" onclick="toggleEmojiPanel()" title="Emojis">😊</button>
          <input class="chat-inp" id="chat-inp" placeholder="Escribí tu mensaje..."
            onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();sendMsg();}">
          <button class="chat-send" onclick="sendMsg()">Enviar</button>
        </div>
      </div>
    </div>
  </div>`;
}

function initChat() {
  syncChatEventChannels();
  curCh = 'general';
  renderMsgs();
  // Highlight active channel
  document.querySelectorAll('.chat-ch').forEach(el => el.classList.remove('active'));
  document.getElementById('ch-general')?.classList.add('active');
}

function setCh(ch) {
  curCh = ch;
  document.querySelectorAll('.chat-ch').forEach(el => el.classList.remove('active'));
  document.getElementById('ch-' + ch)?.classList.add('active');
  const lbl = CHAT_DATA[ch]?.l || '#' + ch;
  document.getElementById('chat-hdr').textContent = lbl;
  renderMsgs();
  // Close emoji panel
  const ep = document.getElementById('emoji-panel');
  if (ep) ep.classList.remove('open');
}

function switchChannel(ch) { setCh(ch); }

function renderMsgs() {
  const msgs = CHAT_DATA[curCh]?.msgs || [];
  const el = document.getElementById('chat-msgs');
  if (!el) return;
  const me = CU?.chatName || 'Anónimo';
  el.innerHTML = msgs.length ? msgs.map(m => {
    const isMe = m.u === me;
    const idx  = USERS.findIndex(u => u.chatName === m.u);
    const col  = idx >= 0 ? AVC[idx % 8] : '#888';
    const photo= idx >= 0 ? USERS[idx].photo : '';
    return `<div class="msg ${isMe ? 'mine' : 'other'}">
      <div class="msg-av" style="background:${col}22;color:${col}">
        ${photo ? `<img src="${photo}" style="width:100%;height:100%;object-fit:cover">` : ini(m.u)}
      </div>
      <div class="msg-body">
        ${!isMe ? `<div class="msg-sender">${m.u}</div>` : ''}
        <div class="msg-bub">${m.t}</div>
        <div class="msg-meta">${m.ts}hs</div>
      </div>
    </div>`;
  }).join('') : `<div class="empty">Sin mensajes en este canal. ¡Sé el primero! 💬</div>`;
  el.scrollTop = el.scrollHeight;
}

function sendMsg() {
  const inp = document.getElementById('chat-inp');
  const t = inp.value.trim();
  if (!t) return;
  const now = new Date();
  const ts = now.getHours().toString().padStart(2,'0') + ':' + now.getMinutes().toString().padStart(2,'0');
  const me = CU?.chatName || 'Anónimo';
  if (!CHAT_DATA[curCh]) CHAT_DATA[curCh] = {l: '#' + curCh, msgs: []};
  CHAT_DATA[curCh].msgs.push({u: me, t, ts});
  inp.value = '';
  renderMsgs();
  if (window._fbOK) window.fbSave.chat?.(curCh);
  // Close emoji panel
  const ep = document.getElementById('emoji-panel');
  if (ep) ep.classList.remove('open');
}

function toggleEmojiPanel() {
  const ep = document.getElementById('emoji-panel');
  if (ep) ep.classList.toggle('open');
}

function insertEmoji(e) {
  const inp = document.getElementById('chat-inp');
  if (!inp) return;
  const pos = inp.selectionStart;
  inp.value = inp.value.slice(0, pos) + e + inp.value.slice(pos);
  inp.selectionStart = inp.selectionEnd = pos + e.length;
  inp.focus();
  document.getElementById('emoji-panel')?.classList.remove('open');
}

// Close emoji panel when clicking outside
document.addEventListener('click', function(e) {
  if (!e.target.closest('.chat-inp-area')) {
    document.getElementById('emoji-panel')?.classList.remove('open');
  }
});

// ── GESTIÓN DE CANALES ──
function openAddChannel() {
  document.getElementById('ch-name-inp').value = '';
  document.getElementById('m-chat-channel').style.display = 'flex';
}

function saveNewChannel() {
  const name = document.getElementById('ch-name-inp').value.trim();
  if (!name) { alert('Ingresá un nombre para el canal.'); return; }
  const id = 'custom_' + Date.now();
  CUSTOM_CHANNELS.push({id, name: '# ' + name});
  CHAT_DATA[id] = {l: '# ' + name, msgs: []};
  if (window._fbOK) window.fbSave.customChannels?.();
  document.getElementById('m-chat-channel').style.display = 'none';
  // Setup listener for new channel
  if (window._fbOK && typeof fbListenChannel === 'function') fbListenChannel(id);
  renderPage('chat');
  setTimeout(() => setCh(id), 100);
}

function deleteChatChannel(id) {
  if (!confirm('¿Eliminar este canal? Se perderán todos sus mensajes.')) return;
  CUSTOM_CHANNELS = CUSTOM_CHANNELS.filter(c => c.id !== id);
  delete CHAT_DATA[id];
  if (window._fbOK) window.fbSave.customChannels?.();
  if (curCh === id) curCh = 'general';
  renderPage('chat');
}
