// ═══════════════════════════════════════════════════════════
// CM
// ═══════════════════════════════════════════════════════════
function pgCM(){
  return`<div class="ptitle">📅 Módulo CM</div><div class="psub">Calendario de contenido y tareas</div>
  ${makeTabs('cm',[{id:'calendario',l:'Calendario'},{id:'lista',l:'Lista de contenido'},{id:'tareas',l:'Tareas'}],'calendario')}`;
}
function initCM(){buildCal('cm-calendario');cmLoadLista();cmLoadTareas();}
function buildCal(containerId){
  const el=document.getElementById(containerId);if(!el)return;
  const mN=['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const dN=['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
  const firstDay=new Date(calYear,calMonth,1);const lastDay=new Date(calYear,calMonth+1,0);
  const pe=EVENTOS.filter(e=>e.fecha&&diffDias(e.fecha)>=0).sort((a,b)=>diffDias(a.fecha)-diffDias(b.fecha))[0];
  let h='';
  if(pe)h+=`<div class="cdbox"><div><div style="font-size:11px;color:var(--text3)">Próximo evento</div><div style="font-size:13px;font-weight:500">${pe.nombre}</div></div><div style="text-align:right"><div class="cdval">${diffDias(pe.fecha)}</div><div style="font-size:11px;color:var(--text3)">días</div></div></div>`;
  h+=`<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:.75rem"><button class="calnav" onclick="calGo(-1,'${containerId}')">‹</button><span style="font-size:14px;font-weight:500">${mN[calMonth]} ${calYear}</span><button class="calnav" onclick="calGo(1,'${containerId}')">›</button></div>`;
  h+=`<div style="display:flex;justify-content:flex-end;gap:6px;margin-bottom:.5rem"><button class="btn btnp btnsm" onclick="document.getElementById('m-post').style.display='flex'">+ Publicación</button><button class="btn btnsm" onclick="document.getElementById('m-task').style.display='flex'">+ Tarea</button></div>`;
  h+=`<div class="calgrid">${dN.map(d=>`<div class="caldhdr">${d}</div>`).join('')}`;
  const cells=[];
  for(let i=0;i<firstDay.getDay();i++)cells.push(null);
  for(let d=1;d<=lastDay.getDate();d++)cells.push(new Date(calYear,calMonth,d));
  while(cells.length%7!==0)cells.push(null);
  const evDates=EVENTOS.filter(e=>e.fecha).map(e=>e.fecha);
  cells.forEach(cell=>{
    if(!cell){h+=`<div class="calday otherm"></div>`;return;}
    const ds=dateStr(cell);const isHoy=ds===dateStr(HOY);const isEv=evDates.includes(ds);
    const postsDay=POSTS.filter(p=>p.fecha===ds);const tasksDay=TASKS.filter(t=>t.fecha===ds&&!t.done);
    let cls='calday'+(isHoy?' today':'')+(isEv?' evday':'');
    h+=`<div class="${cls}" onclick="calClickDay('${ds}')"><div class="caldayn">${cell.getDate()}</div>`;
    if(isEv)h+=`<div class="calevt ce-evento">🎉 Evento</div>`;
    postsDay.slice(0,2).forEach(p=>h+=`<div class="calevt ${RED_CLS[p.red]}">${RED_LABEL[p.red]}</div>`);
    if(postsDay.length>2)h+=`<div style="font-size:9px;color:var(--text3)">+${postsDay.length-2} más</div>`;
    tasksDay.slice(0,1).forEach(t=>h+=`<div class="calevt ce-task">⚡${t.titulo.slice(0,12)}</div>`);
    h+=`</div>`;
  });
  h+=`</div>`;
  el.innerHTML=h;
}
function calGo(dir,containerId){calMonth+=dir;if(calMonth>11){calMonth=0;calYear++;}else if(calMonth<0){calMonth=11;calYear--;}buildCal(containerId);}
function calClickDay(ds){
  // Mostrar modal de día con contenido + opciones de agregar
  document.getElementById('m-cal-day').style.display='flex';
  document.getElementById('m-cal-day-fecha').textContent=ds;
  const postsDay=POSTS.filter(p=>p.fecha===ds).sort((a,b)=>a.hora.localeCompare(b.hora));
  const tasksDay=TASKS.filter(t=>t.fecha===ds);
  const evDay=EVENTOS.find(e=>e.fecha===ds);
  let h='';
  if(evDay) h+=`<div class="abox agreen"><div class="sem semg"></div><div><strong>🎉 Evento: ${evDay.nombre}</strong></div></div>`;
  if(postsDay.length){h+=`<div class="ctitle" style="margin-top:.5rem">Publicaciones (${postsDay.length})</div>`;postsDay.forEach(p=>{h+=`<div style="display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid var(--border)"><span class="badge bgray" style="font-size:10px">${RED_LABEL[p.red]}</span><div style="flex:1;font-size:12px">${p.tipo}: ${p.desc}</div><span style="font-size:11px;color:var(--text2)">${p.hora}</span><button class="btn btnsm btnd" onclick="POSTS=POSTS.filter(x=>x.id!==${p.id});if(window._fbOK)window.fbSave.posts?.();calClickDay('${ds}');buildCal(document.querySelector('.calgrid')?'cm-calendario':'bm-calendario')">✕</button></div>`;}); }
  if(tasksDay.length){h+=`<div class="ctitle" style="margin-top:.5rem">Tareas (${tasksDay.length})</div>`;tasksDay.forEach(t=>{h+=`<div style="display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid var(--border)"><div style="flex:1;font-size:12px">${t.titulo} <span style="color:var(--text2)">(${t.area})</span></div><button class="btn btnsm btnd" onclick="TASKS=TASKS.filter(x=>x.id!==${t.id});if(window._fbOK)window.fbSave.tasks?.();calClickDay('${ds}')">✕</button></div>`;}); }
  if(!postsDay.length&&!tasksDay.length&&!evDay) h+='<div class="empty" style="padding:1rem">Sin contenido este día.</div>';
  document.getElementById('m-cal-day-content').innerHTML=h;
  // Set date in add modals
  document.getElementById('mpost-f').value=ds;
  document.getElementById('mt-fecha').value=ds;
}
function cmLoadLista(){
  const el=document.getElementById('cm-lista');if(!el)return;
  const sorted=[...POSTS].sort((a,b)=>a.fecha.localeCompare(b.fecha));
  const prox=sorted.filter(p=>diffDias(p.fecha)>=0);const hist=sorted.filter(p=>diffDias(p.fecha)<0);
  let h=`<div style="display:flex;justify-content:flex-end;margin-bottom:.5rem"><button class="btn btnp btnsm" onclick="document.getElementById('m-post').style.display='flex'">+ Publicación</button></div>`;
  h+=`<div class="mg"><div class="met"><div class="ml">Total programadas</div><div class="mv">${POSTS.length}</div></div><div class="met"><div class="ml">Próximas</div><div class="mv">${prox.length}</div></div><div class="met"><div class="ml">Publicadas</div><div class="mv pos">${hist.length}</div></div></div>`;
  h+=`<div class="card"><div class="ctitle">Próximas publicaciones</div>`;
  if(!prox.length)h+='<div class="empty">Sin publicaciones próximas.</div>';
  else prox.forEach(p=>{h+=`<div style="display:flex;align-items:center;gap:10px;padding:7px 0;border-bottom:1px solid var(--border)"><div style="min-width:48px;text-align:right;font-size:11px;color:var(--text2)">${p.fecha.slice(5).replace('-','/')}</div><span class="badge ${RED_CLS[p.red]==='ce-ig'?'bvip':RED_CLS[p.red]==='ce-reel'?'bdanger':RED_CLS[p.red]==='ce-tiktok'?'bok':'bgray'}">${RED_LABEL[p.red]}</span><div style="flex:1;font-size:13px">${p.tipo} <span style="color:var(--text2)">· ${p.desc.slice(0,40)}</span></div><span class="badge bgray" style="font-size:10px">${diasLabel(diffDias(p.fecha))}</span><button class="btn btnsm btnd" onclick="POSTS=POSTS.filter(x=>x.id!==${p.id});initCM()">✕</button></div>`;});
  h+=`</div></div>`;
  el.innerHTML=h;
}
function cmLoadTareas(){
  const el=document.getElementById('cm-tareas');if(!el)return;
  const pend=TASKS.filter(t=>!t.done);const hechas=TASKS.filter(t=>t.done);
  let h=`<div style="display:flex;justify-content:flex-end;margin-bottom:.5rem"><button class="btn btnp btnsm" onclick="document.getElementById('m-task').style.display='flex'">+ Tarea</button></div>`;
  h+=`<div class="mg"><div class="met"><div class="ml">Pendientes</div><div class="mv ${pend.length?'neg':''}">${pend.length}</div></div><div class="met"><div class="ml">Completadas</div><div class="mv pos">${hechas.length}</div></div></div>`;
  h+=`<div class="card"><div class="ctitle">Pendientes</div>`;
  if(!pend.length)h+='<div class="empty">Sin tareas pendientes. 🎉</div>';
  else pend.forEach(t=>{h+=`<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border)"><button class="chkbtn" onclick="TASKS.find(x=>x.id===${t.id}).done=true;initCM()"></button><div style="flex:1"><div style="font-size:13px;font-weight:500">${t.titulo}</div><div style="font-size:11px;color:var(--text2)">${t.area} · ${t.fecha} · ${diasLabel(diffDias(t.fecha))}</div></div><button class="btn btnsm btnd" onclick="TASKS=TASKS.filter(x=>x.id!==${t.id});initCM()">✕</button></div>`;});
  h+=`</div>`;
  if(hechas.length){h+=`<div class="card"><div class="ctitle">Completadas</div>`;hechas.forEach(t=>{h+=`<div style="display:flex;align-items:center;gap:10px;padding:7px 0;border-bottom:1px solid var(--border)"><button class="chkbtn on" onclick="TASKS.find(x=>x.id===${t.id}).done=false;initCM()">✓</button><div style="flex:1;opacity:.5;text-decoration:line-through"><div style="font-size:13px;font-weight:500">${t.titulo}</div><div style="font-size:11px;color:var(--text2)">${t.area}</div></div></div>`;});h+=`</div>`;}
  el.innerHTML=h;
}
function addPost(){document.getElementById('m-post').style.display='flex';}
function savePost(){
  const f=document.getElementById('mpost-f').value;if(!f){alert('Seleccioná una fecha.');return;}
  POSTS.push({id:++npid,fecha:f,hora:document.getElementById('mpost-h').value,red:document.getElementById('mpost-red').value,tipo:document.getElementById('mpost-tipo').value,desc:document.getElementById('mpost-desc').value});
  document.getElementById('m-post').style.display='none';
  if(window._fbOK)window.fbSave.posts?.();
  if(curPage==='cm')initCM();else if(curPage==='boom')initBoom();
}
function addTask(){document.getElementById('m-task').style.display='flex';}
function saveTask(){
  const titulo=document.getElementById('mt-titulo').value.trim();const fecha=document.getElementById('mt-fecha').value;if(!titulo||!fecha){alert('Completá título y fecha.');return;}
  TASKS.push({id:++ntid,titulo,fecha,hora:document.getElementById('mt-hora').value,aviso:parseInt(document.getElementById('mt-aviso').value),area:document.getElementById('mt-area').value,vis:document.getElementById('mt-vis').value,done:false});
  document.getElementById('m-task').style.display='none';
  if(window._fbOK)window.fbSave.tasks?.();
  if(curPage==='cm')initCM();else if(curPage==='boom')initBoom();
}
function toggleTask(id){
  const t=TASKS.find(x=>x.id===id);if(t)t.done=!t.done;
  if(window._fbOK)window.fbSave.tasks?.();
  if(curPage==='cm')initCM();else if(curPage==='boom')initBoom();
}
function renderTasks(){if(curPage==='cm')cmLoadTareas();}
function renderPosts(){if(curPage==='cm')cmLoadLista();}
function renderCal(containerId){buildCal(containerId||'cm-calendario');}
function cmClick(ds){calClickDay(ds);}
