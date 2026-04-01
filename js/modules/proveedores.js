// ═══════════════════════════════════════════════════════════
// PROVEEDORES — con editar y eliminar
// ═══════════════════════════════════════════════════════════
function pgProveedores(){
  const cats=[...new Set(PROVEEDORES.map(p=>p.cat))];
  const pend=PROVEEDORES.reduce((a,p)=>a+p.pagado.filter(ok=>!ok).length,0);
  let h=`<div class="ptitle">🤝 Proveedores</div><div class="psub">Base de datos y control de pagos</div>`;
  h+=`<div class="mg"><div class="met"><div class="ml">Proveedores</div><div class="mv">${PROVEEDORES.length}</div></div><div class="met"><div class="ml">Categorías</div><div class="mv">${cats.length}</div></div><div class="met"><div class="ml">Calificación prom.</div><div class="mv">${(PROVEEDORES.reduce((a,p)=>a+p.cal,0)/PROVEEDORES.length).toFixed(1)}★</div></div><div class="met"><div class="ml">Pagos pendientes</div><div class="mv neg">${pend}</div></div></div>`;
  h+=`<div style="display:flex;justify-content:flex-end;margin-bottom:.5rem"><button class="btn btnp btnsm" onclick="openProv(null)">+ Proveedor</button></div>`;
  cats.forEach(cat=>{
    h+=`<div class="card"><div class="ctitle">${cat}</div>`;
    PROVEEDORES.filter(p=>p.cat===cat).forEach((p,i)=>{
      h+=`<div class="pcard"><div style="display:flex;align-items:flex-start;gap:10px">
        <div class="av" style="background:var(--accent)22;color:var(--accent)">${ini(p.n)}</div>
        <div style="flex:1"><div style="font-size:13px;font-weight:500">${p.n}</div>
        <div style="font-size:11px;color:var(--text2)">${p.cont} · ${p.tel}</div>
        <div style="font-size:12px;color:var(--accent);margin-top:2px">${stars(p.cal)}</div></div>
        <div style="display:flex;gap:4px"><button class="btn btnsm" onclick="openProv(${p.id})">Editar</button><button class="btn btnsm btnd" onclick="delProv(${p.id})">Eliminar</button></div>
      </div>
      <div style="font-size:12px;color:var(--text2);margin-top:.5rem;font-style:italic">"${p.obs}"</div>
      <div style="margin-top:.5rem;display:flex;gap:4px;flex-wrap:wrap">${p.eventos.map((ev,i)=>`<span class="badge ${p.pagado[i]?'bok':'bwarn'}" style="font-size:10px">${EV_NOMBRES[ev]} ${p.pagado[i]?'✓':'pendiente'}</span>`).join('')}</div>
      </div>`;
    });
    h+=`</div>`;
  });
  return h;
}
function openProvModal(id){openProv(id);}
function openProv(id){
  editProvId=id;
  const p=id?PROVEEDORES.find(x=>x.id===id):null;
  document.getElementById('m-prov-ttl').textContent=p?'Editar proveedor':'Nuevo proveedor';
  document.getElementById('pv-n').value=p?.n||'';
  document.getElementById('pv-cont').value=p?.cont||'';
  document.getElementById('pv-tel').value=p?.tel||'';
  document.getElementById('pv-cal').value=p?.cal||5;
  document.getElementById('pv-obs').value=p?.obs||'';
  if(p)document.getElementById('pv-cat').value=p.cat;
  document.getElementById('m-prov').style.display='flex';
}
function saveProv(){
  const n=document.getElementById('pv-n').value.trim();if(!n){alert('Ingresá el nombre.');return;}
  const data={n,cat:document.getElementById('pv-cat').value,cont:document.getElementById('pv-cont').value,tel:document.getElementById('pv-tel').value,cal:parseInt(document.getElementById('pv-cal').value),obs:document.getElementById('pv-obs').value};
  if(editProvId){const p=PROVEEDORES.find(x=>x.id===editProvId);if(p)Object.assign(p,data);}
  else PROVEEDORES.push({id:++npvid,...data,eventos:[],pagado:[],montos:[]});
  document.getElementById('m-prov').style.display='none';
  if(window._fbOK)window.fbSave.provs?.();
  renderPage('proveedores');
}
function delProv(id){
  const p=PROVEEDORES.find(x=>x.id===id);
  if(!p)return;
  document.getElementById('m-del-prov-nombre').textContent=p.n;
  document.getElementById('m-del-prov-id').value=id;
  document.getElementById('m-del-prov').style.display='flex';
}
function confirmDelProv(){
  const id=parseInt(document.getElementById('m-del-prov-id').value);
  PROVEEDORES=PROVEEDORES.filter(p=>p.id!==id);
  if(window._fbOK)window.fbSave.provs?.();
  document.getElementById('m-del-prov').style.display='none';
  renderPage('proveedores');
}
