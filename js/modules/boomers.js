// ═══════════════════════════════════════════════════════════
// BOOMERS — directorio de usuarios
// ═══════════════════════════════════════════════════════════

function pgBoomers() {
  return `<div class="ptitle">👥 Boomers</div><div class="psub">Todos los miembros del equipo</div><div id="boomers-wrap"></div>`;
}

function initBoomers() {
  const el = document.getElementById('boomers-wrap'); if (!el) return;
  const myUid = CU?.uid || CU?.username;
  const list = [...USERS].sort((a, b) => (a.chatName || a.username || '').localeCompare(b.chatName || b.username || ''));
  if (!list.length) { el.innerHTML = `<div class="card"><div class="empty">No hay usuarios registrados.</div></div>`; return; }
  el.innerHTML = `<div class="card" style="padding:8px 0">` +
    list.map((u, i) => {
      const uid = u.uid || u.username;
      const isMe = uid === myUid;
      const medals = u.medals || {};
      const totalMedals = (medals.hero || 0) + (medals.warrior || 0) + (medals.player || 0);
      const medalBadge = totalMedals > 0 ? `<span style="font-size:11px;color:var(--accent);font-weight:600">🏅 ${totalMedals}</span>` : '';
      const igBadge = u.instagram ? `<span style="font-size:10px;color:var(--text3)">@${u.instagram.replace(/^@/, '')}</span>` : '';
      return `<div style="display:flex;align-items:center;gap:12px;padding:10px 16px;cursor:pointer;border-radius:12px;transition:background .12s;-webkit-tap-highlight-color:transparent"
        onclick="event.stopPropagation();${isMe ? "navigate('perfil',false)" : `viewProfile('${uid}')`}">
        ${avatarHtml(u.photoURL || u.photo || '', u.chatName || u.username || '?', i, 44)}
        <div style="flex:1;min-width:0">
          <div style="font-size:14px;font-weight:600;line-height:1.2">${u.chatName || u.username || '—'}${isMe ? ' <span style="font-size:10px;color:var(--text3)">(yo)</span>' : ''}</div>
          <div style="font-size:11px;color:var(--text3);margin-top:2px">${u.role || '—'}</div>
          <div style="display:flex;gap:8px;margin-top:3px;align-items:center">${igBadge}${medalBadge}</div>
        </div>
        <span style="color:var(--text3);font-size:18px">›</span>
      </div>`;
    }).join('') +
  `</div>`;
}
