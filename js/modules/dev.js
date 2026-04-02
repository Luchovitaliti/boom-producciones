// ═══════════════════════════════════════════════════════════
// DEV — Panel de notas / reportes por módulo (solo Admin)
// ═══════════════════════════════════════════════════════════

// Módulos que NO necesitan notas (internos)
const DEV_SKIP = ['perfil','usuarios','dev'];

function pgDev(){
  const modulos = ALL_PAGES.filter(p => !DEV_SKIP.includes(p));
  const total   = NOTAS_MOD.length;
  const hoy     = new Date().toISOString().slice(0,10);
  const hoyN    = NOTAS_MOD.filter(n => (n.ts||'').slice(0,10) === hoy).length;

  let h = `<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:1.5rem">
    <div>
      <div class="ptitle" style="margin:0">🛠 Panel de desarrollo</div>
      <div class="psub">Notas y reportes de usuarios por módulo</div>
    </div>
    <button class="btn btnsm btnd" onclick="devBorrarResueltas()">🗑 Borrar resueltas</button>
  </div>`;

  h += `<div class="mg" style="margin-bottom:1.5rem">
    <div class="met"><div class="ml">Total notas</div><div class="mv">${total}</div></div>
    <div class="met"><div class="ml">Hoy</div><div class="mv">${hoyN}</div></div>
    <div class="met"><div class="ml">Módulos con notas</div><div class="mv">${modulos.filter(m=>NOTAS_MOD.some(n=>n.modulo===m)).length}</div></div>
    <div class="met"><div class="ml">Sin resolver</div><div class="mv neg">${NOTAS_MOD.filter(n=>!n.resuelta).length}</div></div>
  </div>`;

  if(!total){
    h += `<div class="card"><div class="empty">Sin notas registradas todavía. Los usuarios pueden dejar comentarios desde el botón 💬 en cada módulo.</div></div>`;
    return h;
  }

  // Agrupar por módulo
  modulos.forEach(mod => {
    const notas = NOTAS_MOD.filter(n => n.modulo === mod).sort((a,b)=>(b.ts||'').localeCompare(a.ts||''));
    if(!notas.length) return;
    h += `<div class="card" style="margin-bottom:1rem">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:.75rem">
        <div class="ctitle" style="margin:0">${PAGE_ICONS[mod]||''} ${PAGE_LABELS[mod]||mod}</div>
        <span class="badge bgray" style="font-size:11px">${notas.length} nota${notas.length!==1?'s':''}</span>
      </div>`;
    notas.forEach(n => {
      const fecha = n.ts ? new Date(n.ts).toLocaleString('es-AR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}) : '—';
      h += `<div class="dev-nota ${n.resuelta?'dev-nota-ok':''}">
        <div style="display:flex;align-items:flex-start;gap:10px">
          <div style="flex:1">
            <div style="font-size:13px;line-height:1.5;white-space:pre-wrap">${escHtml(n.texto||'')}</div>
            <div style="font-size:11px;color:var(--text3);margin-top:4px">
              👤 <strong>${escHtml(n.user||'?')}</strong> · ${fecha}
              ${n.resuelta?'<span class="badge bok" style="font-size:10px;margin-left:6px">✓ Resuelta</span>':''}
            </div>
          </div>
          <div style="display:flex;gap:4px;flex-shrink:0">
            ${!n.resuelta
              ? `<button class="btn btnsm" style="background:var(--green)22;color:var(--green)" onclick="devMarcarResuelta('${n.id}')">✓</button>`
              : `<button class="btn btnsm" onclick="devDesmarcarResuelta('${n.id}')">↩</button>`}
            <button class="btn btnsm btnd" onclick="devBorrarNota('${n.id}')">✕</button>
          </div>
        </div>
      </div>`;
    });
    h += `</div>`;
  });
  return h;
}

function devMarcarResuelta(id){
  const n = NOTAS_MOD.find(x=>x.id===id);
  if(n){ n.resuelta=true; if(window._fbOK)window.fbSave.notasMod?.(); renderPage('dev'); }
}
function devDesmarcarResuelta(id){
  const n = NOTAS_MOD.find(x=>x.id===id);
  if(n){ n.resuelta=false; if(window._fbOK)window.fbSave.notasMod?.(); renderPage('dev'); }
}
function devBorrarNota(id){
  if(!confirm('¿Eliminar esta nota?')) return;
  const i = NOTAS_MOD.findIndex(x=>x.id===id);
  if(i>=0){ NOTAS_MOD.splice(i,1); if(window._fbOK)window.fbSave.notasMod?.(); renderPage('dev'); }
}
function devBorrarResueltas(){
  if(!confirm('¿Eliminar todas las notas marcadas como resueltas?')) return;
  const antes = NOTAS_MOD.length;
  for(let i=NOTAS_MOD.length-1;i>=0;i--){ if(NOTAS_MOD[i].resuelta) NOTAS_MOD.splice(i,1); }
  if(NOTAS_MOD.length < antes){ if(window._fbOK)window.fbSave.notasMod?.(); }
  renderPage('dev');
}

// ─── Widget flotante de nota (se inyecta en cada módulo) ──
function notaWidgetHtml(modulo){
  const count = NOTAS_MOD.filter(n=>n.modulo===modulo&&!n.resuelta).length;
  return `<div class="nota-widget-btn" onclick="notaAbrirModal('${modulo}')" title="Dejar una nota o comentario">
    💬 Nota${count>0?` <span style="background:var(--red);color:#fff;border-radius:99px;padding:1px 6px;font-size:10px">${count}</span>`:''}
  </div>`;
}

function notaAbrirModal(modulo){
  document.getElementById('m-nota-modulo').textContent = PAGE_LABELS[modulo]||modulo;
  document.getElementById('m-nota-input').value = '';
  document.getElementById('m-nota-input').dataset.modulo = modulo;
  document.getElementById('m-nota').style.display = 'flex';
  setTimeout(()=>document.getElementById('m-nota-input')?.focus(), 80);
}

function notaGuardar(){
  const el  = document.getElementById('m-nota-input');
  const txt = el?.value.trim();
  const mod = el?.dataset.modulo;
  if(!txt){ alert('Escribí algo antes de guardar.'); return; }
  const id = 'n'+(Date.now())+(Math.random()*1000|0);
  NOTAS_MOD.push({
    id,
    modulo: mod,
    texto:  txt,
    user:   CU?.chatName || CU?.user || 'Anónimo',
    ts:     new Date().toISOString(),
    resuelta: false,
  });
  document.getElementById('m-nota').style.display = 'none';
  if(window._fbOK) window.fbSave.notasMod?.();
}

// Helper anti-XSS
function escHtml(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
