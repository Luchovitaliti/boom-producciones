// ═══════════════════════════════════════════════════════════
// BOOM GENERAL
// ═══════════════════════════════════════════════════════════
function pgBoom(){
  return`<div class="ptitle">🏠 BOOM General</div><div class="psub">Calendario compartido · Tareas · Brainstorming</div>
  ${makeTabs('bm',[{id:'calendario',l:'Calendario'},{id:'tareas',l:'Tareas del equipo'},{id:'brain',l:'Brainstorming'}],'calendario')}`;
}
function initBoom(){buildCal('bm-calendario');boomLoadTareas();boomLoadBrain();}
function renderBoomCal(){buildCal('bm-calendario');}
function renderBoomTasks(){boomLoadTareas();}
function boomLoadTareas(){
  const el=document.getElementById('bm-tareas');if(!el)return;
  const todos=TASKS.filter(t=>t.vis==='todos');const pend=todos.filter(t=>!t.done);
  let h=`<div style="display:flex;justify-content:flex-end;margin-bottom:.5rem"><button class="btn btnp btnsm" onclick="document.getElementById('m-task').style.display='flex'">+ Tarea</button></div>`;
  h+=`<div class="card"><div class="ctitle">Tareas del equipo (${pend.length} pendientes)</div>`;
  if(!pend.length)h+='<div class="empty">Sin tareas pendientes.</div>';
  else pend.forEach(t=>{h+=`<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border)"><button class="chkbtn" onclick="TASKS.find(x=>x.id===${t.id}).done=true;initBoom()"></button><div style="flex:1"><div style="font-size:13px;font-weight:500">${t.titulo}</div><div style="font-size:11px;color:var(--text2)">${t.area} · ${t.fecha} · ${diasLabel(diffDias(t.fecha))}</div></div></div>`;});
  h+=`</div>`;el.innerHTML=h;
}
function renderIdeas(){boomLoadBrain();}
function boomLoadBrain(){
  const el=document.getElementById('bm-brain');if(!el)return;
  const sorted=[...IDEAS].sort((a,b)=>b.votos-a.votos);
  let h=`<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem"><div><div style="font-size:14px;font-weight:500">Ideas del equipo</div><div style="font-size:12px;color:var(--text2)">Todos pueden proponer. Las mejores suben.</div></div><button class="btn btnp btnsm" onclick="document.getElementById('m-idea').style.display='flex'">+ Idea</button></div>`;
  sorted.forEach(i=>{h+=`<div class="pcard"><div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:.35rem"><div style="display:flex;align-items:center;gap:8px"><span class="badge bgray" style="font-size:10px">${i.cat}</span><span style="font-size:11px;color:var(--text2)">${i.autor} · ${i.fecha}</span></div><div style="display:flex;align-items:center;gap:6px"><button class="btn btnsm ${i.votado?'btnp':''}" onclick="IDEAS.find(x=>x.id===${i.id}).votado=!IDEAS.find(x=>x.id===${i.id}).votado;IDEAS.find(x=>x.id===${i.id}).votos+=IDEAS.find(x=>x.id===${i.id}).votado?1:-1;boomLoadBrain()">${i.votado?'✓':'+'}  ${i.votos}</button><button class="btn btnsm btnd" onclick="IDEAS=IDEAS.filter(x=>x.id!==${i.id});boomLoadBrain()">✕</button></div></div><div style="font-size:13px;line-height:1.5">${i.txt}</div></div>`;});
  el.innerHTML=h;
}
function addIdea(){document.getElementById('m-idea').style.display='flex';}
function saveIdea(){
  const txt=document.getElementById('mi-txt').value.trim();if(!txt){alert('Escribí tu idea.');return;}
  IDEAS.push({id:++niid,txt,cat:document.getElementById('mi-cat').value,autor:CU?.chatName||'Anónimo',fecha:'Hoy',votos:0,votado:false});
  document.getElementById('m-idea').style.display='none';
  if(window._fbOK)window.fbSave.ideas?.();
  boomLoadBrain();
}
function voteIdea(id){
  const idea=IDEAS.find(x=>x.id===id);if(!idea)return;
  idea.votado=!idea.votado;idea.votos+=idea.votado?1:-1;
  if(window._fbOK)window.fbSave.ideas?.();
  boomLoadBrain();
}
function delIdea(id){
  IDEAS=IDEAS.filter(x=>x.id!==id);
  if(window._fbOK)window.fbSave.ideas?.();
  boomLoadBrain();
}
