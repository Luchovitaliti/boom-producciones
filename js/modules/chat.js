// ═══════════════════════════════════════════════════════════
// CHAT — Subcollections + XSS-safe rendering + emojis
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

// ─── Unread tracking via localStorage ───
function _chatLastReadKey(ch) { return 'chat_lr_' + (CU?.uid||'x') + '_' + ch; }

function chatMarkRead(ch) {
  try { localStorage.setItem(_chatLastReadKey(ch), Date.now().toString()); } catch(e) {}
}

function chatGetUnread(ch) {
  const msgs = CHAT_DATA[ch]?.msgs || [];
  if (!msgs.length) return 0;
  let lr = 0;
  try { lr = parseInt(localStorage.getItem(_chatLastReadKey(ch))) || 0; } catch(e) {}
  if (!lr) return msgs.length; // never opened = all unread
  return msgs.filter(m => {
    if (m.timestamp && m.timestamp.toDate) return m.timestamp.toDate().getTime() > lr;
    return false; // legacy msgs without server timestamp: not counted
  }).length;
}

function chatGetTotalUnread() {
  return Object.keys(CHAT_DATA).reduce((a, ch) => a + chatGetUnread(ch), 0);
}

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
    else CHAT_DATA[ch.id].l = ch.name;
  });
}

function pgChat() {
  syncChatEventChannels();
  const cn  = CU?.chatName || 'Anónimo';
  const col = AVC[USERS.indexOf(CU) % 8];
  const channels = getChatChannels();
  const isAdmin  = CU?.role === 'Admin Console';

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
      const unr = chatGetUnread(ch.id);
      sbHtml += `<div class="chat-ch" id="ch-${ch.id}" onclick="setCh('${ch.id}')">
        <span>${ch.name}</span>
        ${unr > 0 ? `<span class="chat-unread-badge">${unr > 99 ? '99+' : unr}</span>` : ''}
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
    <span>Chateando como <strong>${_escChat(cn)}</strong></span>
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

// ─── XSS-safe text escaping ───
function _escChat(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function initChat() {
  syncChatEventChannels();
  curCh = 'general';
  chatMarkRead(curCh);
  if (window.fbListenActiveChannel) window.fbListenActiveChannel(curCh);
  renderMsgs();
  document.querySelectorAll('.chat-ch').forEach(el => el.classList.remove('active'));
  document.getElementById('ch-general')?.classList.add('active');
}

function setCh(ch) {
  curCh = ch;
  chatMarkRead(ch);
  // Switch listener to new channel
  if (window.fbListenActiveChannel) window.fbListenActiveChannel(ch);
  document.querySelectorAll('.chat-ch').forEach(el => el.classList.remove('active'));
  document.getElementById('ch-' + ch)?.classList.add('active');
  const lbl = CHAT_DATA[ch]?.l || '#' + ch;
  document.getElementById('chat-hdr').textContent = lbl;
  renderMsgs();
  const ep = document.getElementById('emoji-panel');
  if (ep) ep.classList.remove('open');
}

function switchChannel(ch) { setCh(ch); }

// ─── XSS-safe rendering using DOM API ───
function renderMsgs() {
  const msgs = CHAT_DATA[curCh]?.msgs || [];
  const el = document.getElementById('chat-msgs');
  if (!el) return;
  const me = CU?.chatName || 'Anónimo';

  // Clear previous content safely
  el.innerHTML = '';

  if (!msgs.length) {
    el.innerHTML = `<div class="empty">Sin mensajes en este canal. ¡Sé el primero! 💬</div>`;
    return;
  }

  msgs.forEach(m => {
    const sender = m.u || 'Anónimo';
    const isMe = sender === me;
    const idx = USERS.findIndex(u => u.chatName === sender);
    const col = idx >= 0 ? AVC[idx % 8] : '#888';
    const photoSrc = idx >= 0 ? (USERS[idx].photoURL || USERS[idx].photo) : '';

    // Build message using DOM to prevent XSS
    const msgDiv = document.createElement('div');
    msgDiv.className = 'msg ' + (isMe ? 'mine' : 'other');

    const avDiv = document.createElement('div');
    avDiv.className = 'msg-av';
    avDiv.style.cssText = `background:${col}22;color:${col}`;
    if (photoSrc) {
      const img = document.createElement('img');
      img.src = photoSrc;
      img.style.cssText = 'width:100%;height:100%;object-fit:cover';
      avDiv.appendChild(img);
    } else {
      avDiv.textContent = ini(sender);
    }

    const bodyDiv = document.createElement('div');
    bodyDiv.className = 'msg-body';

    if (!isMe) {
      const senderDiv = document.createElement('div');
      senderDiv.className = 'msg-sender';
      senderDiv.textContent = sender;
      bodyDiv.appendChild(senderDiv);
    }

    const bubDiv = document.createElement('div');
    bubDiv.className = 'msg-bub';
    bubDiv.textContent = m.t || m.text || '';
    bodyDiv.appendChild(bubDiv);

    const metaDiv = document.createElement('div');
    metaDiv.className = 'msg-meta';
    // Handle both legacy ts string and Firestore Timestamp
    let timeStr = m.ts || '';
    if (m.timestamp && m.timestamp.toDate) {
      const d = m.timestamp.toDate();
      timeStr = d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0');
    }
    metaDiv.textContent = timeStr + 'hs';
    bodyDiv.appendChild(metaDiv);

    msgDiv.appendChild(avDiv);
    msgDiv.appendChild(bodyDiv);
    el.appendChild(msgDiv);
  });

  el.scrollTop = el.scrollHeight;
}

async function sendMsg() {
  const inp = document.getElementById('chat-inp');
  const t = inp.value.trim();
  if (!t) return;
  const now = new Date();
  const ts = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
  const me = CU?.chatName || 'Anónimo';

  inp.value = '';

  // Send to Firestore subcollection
  if (window._fbOK && window.fbSave?.chatMsg) {
    try {
      await window.fbSave.chatMsg(curCh, {
        u: me,
        t: t,
        ts: ts,
        uid: CU?.uid || '',
      });
    } catch(e) {
      console.error('Error sending message:', e);
      // Fallback: add locally
      if (!CHAT_DATA[curCh]) CHAT_DATA[curCh] = {l: '#' + curCh, msgs: []};
      CHAT_DATA[curCh].msgs.push({u: me, t, ts});
      renderMsgs();
    }
  } else {
    if (!CHAT_DATA[curCh]) CHAT_DATA[curCh] = {l: '#' + curCh, msgs: []};
    CHAT_DATA[curCh].msgs.push({u: me, t, ts});
    renderMsgs();
  }

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
  renderPage('chat');
  setTimeout(() => setCh(id), 100);
}

function deleteChatChannel(id) {
  if (!confirm('¿Eliminar este canal? Se perderán todos sus mensajes.')) return;
  CUSTOM_CHANNELS = CUSTOM_CHANNELS.filter(c => c.id !== id);
  delete CHAT_DATA[id];
  // Unsubscribe listener
  if (window._chatUnsubs && window._chatUnsubs[id]) {
    window._chatUnsubs[id]();
    delete window._chatUnsubs[id];
  }
  if (window._fbOK) window.fbSave.customChannels?.();
  if (curCh === id) curCh = 'general';
  renderPage('chat');
}
