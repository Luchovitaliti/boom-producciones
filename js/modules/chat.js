// ═══════════════════════════════════════════════════════════
// CHAT — sin selector de usuario, usa el usuario logueado
// ═══════════════════════════════════════════════════════════
function pgChat(){
  const cn=CU?.chatName||'Anónimo';
  const col=AVC[USERS.indexOf(CU)%8];
  return`<div class="ptitle">💬 Chat interno</div>
  <div class="chat-whobox"><div class="av" style="background:${col}22;color:${col};width:28px;height:28px;font-size:11px">${ini(cn)}</div><span>Chateando como <strong>${cn}</strong></span></div>
  <div class="chat-wrap">
    <div class="chat-sb">
      <div class="chat-sec">General</div>
      <div class="chat-ch active" id="ch-general" onclick="setCh('general')"># General</div>
      <div class="chat-ch" id="ch-ideas" onclick="setCh('ideas')"># Ideas</div>
      <div class="chat-sec">Áreas</div>
      <div class="chat-ch" id="ch-barra" onclick="setCh('barra')"># Barra</div>
      <div class="chat-ch" id="ch-cm" onclick="setCh('cm')"># CM</div>
      <div class="chat-ch" id="ch-publicas" onclick="setCh('publicas')"># Públicas</div>
      <div class="chat-ch" id="ch-admin" onclick="setCh('admin')"># Admin</div>
      <div class="chat-sec">Eventos</div>
      <div class="chat-ch" id="ch-ev0" onclick="setCh('ev0')"># Sunset 15 Mar</div>
      <div class="chat-ch" id="ch-ev1" onclick="setCh('ev1')"># Sunset 22 Mar</div>
      <div class="chat-ch" id="ch-ev2" onclick="setCh('ev2')"># Fiesta 5 Abr</div>
    </div>
    <div class="chat-main">
      <div class="chat-hdr" id="chat-hdr"># General</div>
      <div class="chat-msgs" id="chat-msgs"></div>
      <div class="chat-inp-row">
        <input class="chat-inp" id="chat-inp" placeholder="Escribí tu mensaje..." onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();sendMsg();}">
        <button class="chat-send" onclick="sendMsg()">Enviar</button>
      </div>
    </div>
  </div>`;
}
function initChat(){curCh='general';renderMsgs();}
function setCh(ch){
  curCh=ch;
  document.querySelectorAll('.chat-ch').forEach(el=>el.classList.remove('active'));
  document.getElementById('ch-'+ch)?.classList.add('active');
  document.getElementById('chat-hdr').textContent=CHAT_DATA[ch]?.l||'#'+ch;
  renderMsgs();
}
function switchChannel(ch){setCh(ch);}
function renderMsgs(){
  const msgs=CHAT_DATA[curCh]?.msgs||[];const el=document.getElementById('chat-msgs');if(!el)return;
  const me=CU?.chatName||'Anónimo';
  el.innerHTML=msgs.map(m=>{
    const isMe=m.u===me;const idx=USERS.findIndex(u=>u.chatName===m.u);const col=idx>=0?AVC[idx%8]:'#888';const photo=idx>=0?USERS[idx].photo:'';
    return`<div class="msg ${isMe?'mine':'other'}"><div class="msg-av" style="background:${col}22;color:${col}">${photo?`<img src="${photo}" style="width:100%;height:100%;object-fit:cover">`:ini(m.u)}</div><div class="msg-body">${!isMe?`<div class="msg-sender">${m.u}</div>`:''}<div class="msg-bub">${m.t}</div><div class="msg-meta">${m.ts}hs</div></div></div>`;
  }).join('');
  el.scrollTop=el.scrollHeight;
}
function sendMsg(){
  const inp=document.getElementById('chat-inp');const t=inp.value.trim();if(!t)return;
  const now=new Date();const ts=now.getHours().toString().padStart(2,'0')+':'+now.getMinutes().toString().padStart(2,'0');
  const me=CU?.chatName||'Anónimo';
  if(!CHAT_DATA[curCh])CHAT_DATA[curCh]={l:'#'+curCh,msgs:[]};
  CHAT_DATA[curCh].msgs.push({u:me,t,ts});inp.value='';renderMsgs();
  if(window._fbOK)window.fbSave.chat?.(curCh);
}
