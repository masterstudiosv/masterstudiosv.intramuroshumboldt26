/* ═══════════════════════════════════════════════
   PUBLIC.JS — Página pública + sub-páginas
   Intramuros Humboldt 2026
═══════════════════════════════════════════════ */

/* ─── HELPERS ─── */
function smoothTo(id){const el=document.getElementById(id);if(!el)return;const top=el.getBoundingClientRect().top+window.scrollY-72;window.scrollTo({top,behavior:'smooth'});}
function toggleMob(){document.getElementById('mob-nav').classList.toggle('open');}
function closeMob(){document.getElementById('mob-nav').classList.remove('open');}
function fmtDate(d){if(!d||d==='-'||d==='')return'Fecha por confirmar';const[y,m,day]=d.split('-');const ms=['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];return`${parseInt(day)} ${ms[+m-1]} ${y}`;}
function getLogo(){return`<img src="${getLogoPath()}" style="height:32px;border-radius:4px" onerror="this.style.display='none'" alt="Logo">`;}
function getLogoPath(){const d=window.location.pathname;return d.includes('/pages/')?'../logo/logo.png':'logo/logo.png';}
function getBase(p){return window.location.pathname.includes('/pages/')?'../'+p:p;}

/* ─── TOAST ─── */
const Toast={
  show(msg,type='info',dur=3500){
    const icons={success:'✅',error:'❌',info:'ℹ️',warning:'⚠️'};
    const el=document.createElement('div');el.className=`toast ${type}`;
    el.innerHTML=`<span>${icons[type]}</span><span>${msg}</span>`;
    document.getElementById('toast-ct').appendChild(el);
    setTimeout(()=>{el.classList.add('toast-out');setTimeout(()=>el.remove(),300);},dur);
  },
  success(m){this.show(m,'success');},error(m){this.show(m,'error',5000);},info(m){this.show(m,'info');}
};

/* ─── MODAL ─── */
function openModal(html,size=''){
  const box=document.getElementById('modal-box');
  box.className=size||'';
  document.getElementById('modal-cnt').innerHTML=html;
  document.getElementById('modal-bg').classList.add('open');
  document.body.style.overflow='hidden';
}
function closeModal(){
  document.getElementById('modal-bg').classList.remove('open');
  document.getElementById('modal-cnt').innerHTML='';
  document.body.style.overflow='';
}

/* ─── PUB ADMIN ─── */
const PubAdmin={
  PASS:'admin2026',
  isAdmin(){return sessionStorage.getItem('ih_admin')==='1';},
  promptLogin(){
    openModal(`<div class="m-hd"><span class="m-title">ACCESO ADMIN — PÁGINA PÚBLICA</span><button class="m-close" onclick="closeModal()">✕</button></div>
    <div class="m-body">
      <p style="font-size:13px;color:var(--g);font-family:'Inter',sans-serif;margin-bottom:14px">PIN para editar carrusel, avisos y galería sin entrar al sistema completo.</p>
      <div class="ig"><label class="flabel">PIN</label><input class="finput" type="password" id="pub-pin" placeholder="••••••••"/>
      <div id="pub-pin-err" style="display:none;color:var(--r);font-size:12px;margin-top:5px">PIN incorrecto</div></div>
    </div>
    <div class="m-ft"><button class="btn btn-s" onclick="closeModal()">Cancelar</button><button class="btn btn-r" onclick="PubAdmin.tryLogin()">Ingresar</button></div>`,'sm');
    setTimeout(()=>{const i=document.getElementById('pub-pin');if(i){i.focus();i.onkeydown=e=>{if(e.key==='Enter')PubAdmin.tryLogin();};}},100);
  },
  tryLogin(){
    const pin=document.getElementById('pub-pin').value;
    if(pin===this.PASS||pin==='admin2026'||pin==='admin123'){
      sessionStorage.setItem('ih_admin','1');closeModal();this.showUI();Toast.success('Modo edición activado');
    }else{document.getElementById('pub-pin-err').style.display='block';}
  },
  showUI(){
    const r=document.getElementById('admin-ribbon');if(r)r.classList.add('show');
    const ab=document.getElementById('aviso-add-btn');if(ab)ab.style.display='block';
    const gb=document.getElementById('gallery-add-btn');if(gb)gb.style.display='block';
    if(typeof Notices!=='undefined')Notices.render();
    if(typeof Gallery!=='undefined')Gallery.render();
  },
  logout(){
    sessionStorage.removeItem('ih_admin');
    const r=document.getElementById('admin-ribbon');if(r)r.classList.remove('show');
    const ab=document.getElementById('aviso-add-btn');if(ab)ab.style.display='none';
    const gb=document.getElementById('gallery-add-btn');if(gb)gb.style.display='none';
    if(typeof Notices!=='undefined')Notices.render();
    if(typeof Gallery!=='undefined')Gallery.render();
    Toast.info('Sesión de edición cerrada');
  }
};

/* ─── HIGHLIGHT ACTIVE NAV ─── */
function setActiveNav(){
  const path=window.location.pathname;
  document.querySelectorAll('.nav-link').forEach(a=>{
    const href=a.getAttribute('href')||'';
    if(path.endsWith(href)||path.endsWith(href.replace('../',''))){a.classList.add('active');}
  });
}

/* ══════════════════════════════════════════════
   CAROUSEL
══════════════════════════════════════════════ */
const Carousel={
  cur:0,timer:null,
  get(){return DB.getCarousel();},
  render(){
    const slides=this.get();
    const track=document.getElementById('c-track'),dotsEl=document.getElementById('c-dots');
    if(!track)return;
    if(!slides.length){
      track.innerHTML=`<div class="c-slide"><div class="c-placeholder"><div class="c-ph-icon">⚽</div><div class="c-ph-text">INTRAMUROS HUMBOLDT 2026</div>${PubAdmin.isAdmin()?`<button class="btn btn-r" style="margin-top:14px" onclick="Carousel.openAdmin()">+ Agregar slide</button>`:''}</div></div>`;
      if(dotsEl)dotsEl.innerHTML='';return;
    }
    track.innerHTML=slides.map(s=>{
      const hasBg=s.imgUrl&&s.imgUrl.startsWith('data:');
      const bg=hasBg?`<img src="${s.imgUrl}" class="c-bg" alt="${s.titulo||s.title}"/><div class="c-overlay"></div>`
        :`<div style="position:absolute;inset:0;background:linear-gradient(135deg,${s.color||'#E8192C'}28,${s.color||'#E8192C'}06,var(--b4))"></div><div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:140px;opacity:.025">⚽</div>`;
      const title=s.titulo||s.title||'';
      const desc=s.descripcion||s.desc||'';
      const tag=s.tag||'';
      return `<div class="c-slide" style="position:relative">${bg}<div class="c-content">${tag?`<div class="c-tag">${tag}</div>`:''}<div class="c-title">${title}</div>${desc?`<div class="c-desc">${desc}</div>`:''}</div></div>`;
    }).join('');
    if(dotsEl)dotsEl.innerHTML=slides.map((_,i)=>`<div class="dot${i===this.cur?' active':''}" onclick="Carousel.goTo(${i})"></div>`).join('');
    this.goTo(this.cur<slides.length?this.cur:0);
    this.autoplay();
  },
  goTo(idx){
    const s=this.get();if(!s.length)return;
    this.cur=((idx%s.length)+s.length)%s.length;
    const t=document.getElementById('c-track');if(t)t.style.transform=`translateX(-${this.cur*100}%)`;
    document.querySelectorAll('.dot').forEach((d,i)=>d.classList.toggle('active',i===this.cur));
  },
  next(){this.goTo(this.cur+1);this.autoplay();},
  prev(){this.goTo(this.cur-1);this.autoplay();},
  autoplay(){clearInterval(this.timer);this.timer=setInterval(()=>this.next(),5500);},

  openAdmin(){
    const slides=DB.getCarousel();
    openModal(`<div class="m-hd"><span class="m-title">🖼️ CARRUSEL — ADMIN</span><button class="m-close" onclick="closeModal()">✕</button></div>
    <div class="m-body">
      ${slides.length?slides.map((s,i)=>`<div style="display:flex;align-items:center;gap:10px;padding:12px;background:var(--b4);border-radius:8px;margin-bottom:8px">
        <div style="width:52px;height:38px;border-radius:6px;overflow:hidden;flex-shrink:0;background:var(--b5);display:flex;align-items:center;justify-content:center">
          ${s.imgUrl&&s.imgUrl.startsWith('data:')?`<img src="${s.imgUrl}" style="width:100%;height:100%;object-fit:cover">`:`<span style="font-size:18px;opacity:.4">🖼️</span>`}
        </div>
        <div style="flex:1;min-width:0"><div style="font-weight:700;font-size:14px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${s.titulo||s.title}</div><span style="font-size:10px;color:var(--r)">${s.tag||'Sin etiqueta'}</span></div>
        <div style="display:flex;gap:5px"><button class="btn btn-s btn-xs" onclick="Carousel.editSlide('${s.id}')">✏️</button><button class="btn btn-d btn-xs" onclick="Carousel.deleteSlide('${s.id}')">🗑️</button></div>
      </div>`).join(''):'<div class="empty"><div class="empty-ico">🖼️</div><div class="empty-t">Sin slides</div></div>'}
    </div>
    <div class="m-ft"><button class="btn btn-s" onclick="closeModal()">Cerrar</button><button class="btn btn-r" onclick="Carousel.editSlide(null)">+ Agregar Slide</button></div>`);
  },

  editSlide(id){
    const slides=DB.getCarousel();
    const s=id?slides.find(x=>x.id===id)||{}:{titulo:'',descripcion:'',tag:'',imgUrl:'',color:'#E8192C'};
    openModal(`<div class="m-hd"><span class="m-title">${id?'EDITAR':'NUEVO'} SLIDE</span><button class="m-close" onclick="Carousel.openAdmin()">← Volver</button></div>
    <div class="m-body">
      <div class="ig"><label class="flabel">Título *</label><input class="finput" id="sl-t" value="${(s.titulo||s.title||'').replace(/"/g,'&quot;')}" placeholder="TÍTULO EN MAYÚSCULAS..."/></div>
      <div class="ig"><label class="flabel">Descripción</label><textarea class="ftarea" id="sl-d">${s.descripcion||s.desc||''}</textarea></div>
      <div class="ig"><label class="flabel">Etiqueta (badge)</label><input class="finput" id="sl-tag" value="${s.tag||''}" placeholder="Ej: TEMPORADA ACTIVA"/></div>
      <div class="ig"><label class="flabel">Imagen de fondo — JPG/PNG máx 2MB</label>
        <div class="file-box">${s.imgUrl&&s.imgUrl.startsWith('data:')?`<img src="${s.imgUrl}" id="sl-p" style="max-height:100px;margin:0 auto 8px;border-radius:6px"/>`:
        `<div id="sl-p" style="font-size:36px;margin-bottom:6px">🖼️</div>`}
        <div style="font-size:13px;color:var(--g)">Clic para subir imagen</div>
        <input type="file" accept="image/jpeg,image/jpg,image/png" onchange="handleImg(this,'sl-img','sl-p')"/></div>
        <input type="hidden" id="sl-img" value="${s.imgUrl||''}"/></div>
      <div class="ig"><label class="flabel">Color de fondo (sin imagen)</label>
        <input type="color" id="sl-c" value="${s.color||'#E8192C'}" style="width:56px;height:34px;background:none;border:1px solid var(--b5);border-radius:6px;cursor:pointer;padding:2px"/></div>
    </div>
    <div class="m-ft"><button class="btn btn-s" onclick="Carousel.openAdmin()">Cancelar</button><button class="btn btn-r" onclick="Carousel.saveSlide('${id||''}')">💾 Guardar</button></div>`,'sm');
  },

  async saveSlide(id){
    const title=document.getElementById('sl-t').value.trim();
    if(!title){Toast.error('El título es obligatorio');return;}
    const data={titulo:title,descripcion:document.getElementById('sl-d').value.trim(),tag:document.getElementById('sl-tag').value.trim(),imgUrl:document.getElementById('sl-img').value,color:document.getElementById('sl-c').value};
    if(id)data.id=id;
    await DB.saveCarouselSlide(data);
    this.render();Toast.success(`Slide ${id?'actualizado':'agregado'} ✔`);this.openAdmin();
  },

  async deleteSlide(id){
    if(!confirm('¿Eliminar este slide?'))return;
    DB.deleteCarouselSlide(id);this.render();Toast.success('Slide eliminado');this.openAdmin();
  }
};

/* ══════════════════════════════════════════════
   MATCH CARD HTML
══════════════════════════════════════════════ */
function matchCardHTML(p){
  const local=DB.getEquipo(p.localId),visit=DB.getEquipo(p.visitanteId);
  const cat=DB.getCategoria(p.categoriaId),arb=DB.getArbitro(p.arbitroId);
  const isLive=p.estado==='en_juego',isPaused=p.estado==='pausado';
  const stateBadge={en_juego:'<span class="badge badge-live">⚽ EN VIVO</span>',pausado:'<span class="badge badge-y">⏸ PAUSADO</span>',programado:'<span class="badge badge-g">PROGRAMADO</span>',finalizado:'<span class="badge badge-x">FINALIZADO</span>',pendiente:'<span class="badge badge-x">PENDIENTE</span>'}[p.estado]||'';
  const serieTag=p.totalEnSerie>1?`<span class="badge badge-y" style="font-size:10px">⟳ ${p.numEnSerie}/${p.totalEnSerie} ${+p.numEnSerie===1?'IDA':'VUELTA'}</span>`:'';
  const evGoles=DB.getEventosByPartido(p.id).filter(e=>e.tipo==='gol');
  const golesL=evGoles.filter(e=>e.equipoId===p.localId).map(e=>`${(DB.getJugador(e.jugadorId)?.nombre||'?').split(' ')[0]} ${e.minuto}'`).join(', ');
  const golesV=evGoles.filter(e=>e.equipoId===p.visitanteId).map(e=>`${(DB.getJugador(e.jugadorId)?.nombre||'?').split(' ')[0]} ${e.minuto}'`).join(', ');
  const ls=local?.escudo64&&local.escudo64.startsWith('data:')?`<img src="${local.escudo64}" alt="">`:'🛡️';
  const vs=visit?.escudo64&&visit.escudo64.startsWith('data:')?`<img src="${visit.escudo64}" alt="">`:'🛡️';
  return `<div class="match-card${isLive?' live':''}${+p.totalEnSerie>1?' serie-mark':''}">
    <div class="mh"><div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">${stateBadge}${serieTag}<span>${cat?.nombre||'—'}</span></div><span>${p.fecha?fmtDate(p.fecha)+(p.hora?' · '+fmtHora(p.hora):''):'Fecha por confirmar'}</span></div>
    <div class="mb">
      <div class="mt"><div class="t-sh">${ls}</div><div><div class="tn">${local?.nombre||'—'}</div><div class="ts">${golesL||local?.seccion||''}</div></div></div>
      <div class="sc-box"><div class="sc-n">${p.estado==='pendiente'?'vs':`${p.golesLocal} – ${p.golesVisitante}`}</div><div class="sc-m">${isLive||isPaused?`⏱ ${p.minutoActual}'`:p.estado==='finalizado'?'FINAL':'—'}</div></div>
      <div class="mt r"><div class="t-sh">${vs}</div><div><div class="tn">${visit?.nombre||'—'}</div><div class="ts">${golesV||visit?.seccion||''}</div></div></div>
    </div>
    <div class="mf" style="justify-content:space-between;flex-wrap:wrap;gap:6px">
      <span>🟨 ${arb?.nombre||'Árbitro pendiente'}</span>
      <button onclick="showShareModal('⚽ ${local?.nombre||'?'} ${p.estado==='pendiente'?'vs':`${p.golesLocal}-${p.golesVisitante}`} ${visit?.nombre||'?'} · Intramuros Humboldt 2026',window.location.href)" style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);color:var(--w);padding:3px 10px;border-radius:6px;cursor:pointer;font-size:11px">
        📤 Compartir
      </button>
    </div>
  </div>`;
}

/* ══════════════════════════════════════════════
   RENDER FUNCTIONS (used by index + sub-pages)
══════════════════════════════════════════════ */
function renderStatsBar(el){
  if(!el)return;
  const s=DB.getStatsGenerales();
  el.innerHTML=[
    [s.totalGoles,'⚽ GOLES'],
    [s.totalEquipos,'🛡️ EQUIPOS'],
    [s.totalJugadores,'👤 JUGADORES'],
    [s.finalizados,'✅ JUGADOS'],
    [s.programados,'📅 PRÓXIMOS'],
    [s.enJuego||0,'🔴 EN VIVO'],
  ].map(([n,l])=>`<div class="stat-box"><div class="stat-n">${n}</div><div class="stat-l">${l}</div></div>`).join('');
}

function renderPartidos(elId,limit=6){
  const el=document.getElementById(elId);if(!el)return;
  const todos=DB.getPartidos();
  const activos=todos.filter(p=>['en_juego','pausado','programado'].includes(p.estado)).sort((a,b)=>{const o={en_juego:0,pausado:1,programado:2};return(o[a.estado]||3)-(o[b.estado]||3)||(a.fecha||'z').localeCompare(b.fecha||'z');});
  const recientes=todos.filter(p=>p.estado==='finalizado').sort((a,b)=>(b.fecha||'').localeCompare(a.fecha||'')).slice(0,limit);
  if(!activos.length&&!recientes.length){el.innerHTML='<div class="empty"><div class="empty-ico">📅</div><div class="empty-t">Sin partidos registrados</div><div class="empty-s">Los partidos aparecerán cuando el administrador los programe</div></div>';return;}
  const seen=new Set();let html='';
  if(activos.length){
    html+=`<div style="font-size:10px;letter-spacing:2.5px;color:var(--g);font-weight:700;text-transform:uppercase;margin-bottom:10px">PRÓXIMOS / EN JUEGO</div><div class="matches-grid" style="margin-bottom:24px">`;
    activos.slice(0,limit).forEach(p=>{
      if(p.serieId&&!seen.has(p.serieId)){seen.add(p.serieId);DB.getPartidosBySerie(p.serieId).forEach(sp=>html+=matchCardHTML(sp));}
      else if(!p.serieId)html+=matchCardHTML(p);
    });
    html+='</div>';
  }
  if(recientes.length){
    html+=`<div style="font-size:10px;letter-spacing:2.5px;color:var(--g);font-weight:700;text-transform:uppercase;margin-bottom:10px">RESULTADOS RECIENTES</div><div class="matches-grid">${recientes.map(p=>matchCardHTML(p)).join('')}</div>`;
  }
  el.innerHTML=html;
}

function renderSeries(elId){
  const el=document.getElementById(elId);if(!el)return;
  const partidos=DB.getPartidos().filter(p=>p.serieId&&+p.totalEnSerie===2);
  const ids=[...new Set(partidos.map(p=>p.serieId))];
  if(!ids.length){el.innerHTML='<div class="empty"><div class="empty-ico">⟳</div><div class="empty-t">Sin series ida y vuelta</div></div>';return;}
  el.innerHTML=ids.map(sid=>{
    const g=DB.getMarcadorGlobal(sid);if(!g)return'';
    const eqA=DB.getEquipo(g.equipoA),eqB=DB.getEquipo(g.equipoB),cat=DB.getCategoria(g.partidos[0]?.categoriaId);
    const winner=g.golesA>g.golesB?eqA?.nombre:g.golesB>g.golesA?eqB?.nombre:null;
    return `<div class="serie-block">
      <div class="global-bar"><div><div style="font-size:10px;letter-spacing:2px;color:var(--g);text-transform:uppercase;margin-bottom:6px">⟳ GLOBAL · ${cat?.nombre||'—'}</div>
        <div class="global-score"><span style="color:${g.golesA>g.golesB?'var(--y)':'var(--w)'}">${eqA?.nombre||'—'}</span><span style="color:var(--y);margin:0 14px">${g.golesA} — ${g.golesB}</span><span style="color:${g.golesB>g.golesA?'var(--y)':'var(--w)'}">${eqB?.nombre||'—'}</span></div>
      </div><div>${winner?`<span class="badge badge-y">🏆 ${winner}</span>`:`<span class="badge badge-x">⚖️ EMPATE</span>`}</div></div>
      <div class="matches-grid" style="grid-template-columns:1fr 1fr">${g.partidos.map(p=>matchCardHTML(p)).join('')}</div>
    </div>`;
  }).join('');
}

function renderEquipos(elId,catFilter='',limit=0){
  const el=document.getElementById(elId);if(!el)return;
  let equipos=DB.getEquipos().filter(e=>e.estado==='activo');
  if(catFilter)equipos=equipos.filter(e=>e.categoriaId===catFilter);
  if(limit)equipos=equipos.slice(0,limit);
  if(!equipos.length){el.innerHTML='<div class="empty" style="grid-column:1/-1"><div class="empty-ico">🛡️</div><div class="empty-t">Sin equipos</div></div>';return;}
  el.innerHTML=equipos.map(eq=>{
    const cat=DB.getCategoria(eq.categoriaId),jugs=DB.getJugadoresByEquipo(eq.id);
    const pos=DB.getTablaPosiciones(eq.categoriaId).find(t=>t.id===eq.id)||{pj:0,pg:0,pe:0,pp:0,pts:0};
    const sh=eq.escudo64&&eq.escudo64.startsWith('data:')?`<img src="${eq.escudo64}" alt="${eq.nombre}">`:'🛡️';
    return `<div class="team-card" onclick="openTeamProfile('${eq.id}')">
      <div class="tc-h"><div style="display:flex;gap:12px;align-items:center"><div class="tc-shield">${sh}</div><div><div class="tc-name">${eq.nombre}</div><div class="tc-meta">${cat?.nombre||'—'} · Secc. ${eq.seccion}</div><div style="margin-top:4px"><span class="badge badge-x" style="font-size:10px">👤 ${jugs.length} jugadores</span></div></div></div></div>
      <div class="tc-sts">${[['PJ',pos.pj],['PG',pos.pg],['PE',pos.pe],['PP',pos.pp]].map(([l,v])=>`<div><div class="tc-s-n">${v}</div><div class="tc-s-l">${l}</div></div>`).join('')}</div>
      <div class="tc-ft"><span style="font-size:13px;color:var(--g)">Ver plantel →</span><span><span style="font-family:'Bebas Neue',cursive;font-size:22px;color:var(--y)">${pos.pts}</span> <span style="font-size:11px;color:var(--g)">PTS</span></span></div>
    </div>`;
  }).join('');
}

function openTeamProfile(id){
  const eq=DB.getEquipo(id);if(!eq)return;
  const cat=DB.getCategoria(eq.categoriaId),jugs=DB.getJugadoresByEquipo(id);
  const pos=DB.getTablaPosiciones(eq.categoriaId).find(t=>t.id===id)||{pj:0,pg:0,pe:0,pp:0,gf:0,gc:0,dg:0,pts:0};
  const sh=eq.escudo64&&eq.escudo64.startsWith('data:')?`<img src="${eq.escudo64}" style="width:100%;height:100%;object-fit:cover;border-radius:6px">`:'🛡️';
  openModal(`<div class="m-hd">
    <div style="display:flex;align-items:center;gap:12px">
      <div style="width:44px;height:44px;background:var(--b4);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:22px;overflow:hidden">${sh}</div>
      <div><div class="m-title">${eq.nombre}</div><div style="font-size:12px;color:var(--g)">${cat?.nombre||'—'} · Sección ${eq.seccion}</div></div>
    </div><button class="m-close" onclick="closeModal()">✕</button></div>
  <div class="m-body">
    <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:5px;margin-bottom:20px">
      ${[['PJ',pos.pj],['PG',pos.pg],['PE',pos.pe],['PP',pos.pp],['GF',pos.gf||0],['GC',pos.gc||0],['PTS',pos.pts]].map(([l,v])=>`<div style="text-align:center;background:var(--b4);border-radius:6px;padding:8px 3px"><div style="font-family:'Bebas Neue',cursive;font-size:${l==='PTS'?22:17}px;color:${l==='PTS'?'var(--y)':'var(--w)'}">${v}</div><div style="font-size:9px;color:var(--g);letter-spacing:1px">${l}</div></div>`).join('')}
    </div>
    <div style="font-size:10px;letter-spacing:2.5px;color:var(--g);font-weight:700;text-transform:uppercase;margin-bottom:12px">PLANTEL — ${jugs.length} JUGADORES</div>
    <div class="player-grid">
      ${jugs.length?jugs.map(j=>{
        const foto=j.foto64&&j.foto64.startsWith('data:')?`<img src="${j.foto64}" alt="${j.nombre}">`:`<span class="pc-init">${j.nombre[0]}</span>`;
        return`<div class="pc"><div class="pc-photo">${foto}<div class="pc-num">${j.numero}</div></div><div class="pc-body"><div class="pc-name">${j.nombre}</div><div class="pc-pos">${j.posicion||'—'} · ${j.edad} años</div></div><div class="pc-srow"><div class="pc-s"><div class="pc-sv" style="color:var(--y)">${j.goles}</div><div class="pc-sl">⚽</div></div><div class="pc-s"><div class="pc-sv">${j.amarillas}</div><div class="pc-sl">🟨</div></div><div class="pc-s"><div class="pc-sv" style="color:var(--r)">${j.rojas}</div><div class="pc-sl">🟥</div></div></div></div>`;
      }).join(''):'<div style="color:var(--g);text-align:center;padding:20px;grid-column:1/-1">Sin jugadores</div>'}
    </div>
  </div>`,'lg');
}

let _posTab='';
function renderPosiciones(tabsId,tableId){
  const cats=DB.getCategorias();
  const tabsEl=document.getElementById(tabsId),tableEl=document.getElementById(tableId);
  if(!tabsEl||!tableEl)return;
  if(!cats.length){tableEl.innerHTML='<div class="empty"><div class="empty-ico">📋</div><div class="empty-t">Sin categorías</div></div>';return;}
  if(!_posTab)_posTab=cats[0]?.id||'';
  tabsEl.innerHTML=cats.map(c=>`<button class="stab${_posTab===c.id?' active':''}" onclick="_posTab='${c.id}';_renderPosTable('${tableId}')">${c.nombre}</button>`).join('');
  _renderPosTable(tableId);
}

function _renderPosTable(tableId){
  document.querySelectorAll('.stab').forEach(b=>{b.classList.toggle('active',DB.getCategoria(_posTab)?.nombre===b.textContent);});
  const tabla=DB.getTablaPosiciones(_posTab),el=document.getElementById(tableId);
  if(!el)return;
  if(!tabla.length){el.innerHTML='<div class="empty" style="padding:30px"><div class="empty-ico">📋</div><div class="empty-t">Sin partidos finalizados aún</div></div>';return;}
  el.innerHTML=`<table class="st"><thead><tr><th>#</th><th>Equipo</th><th>PJ</th><th>PG</th><th>PE</th><th>PP</th><th>GF</th><th>GC</th><th>DG</th><th>PTS</th></tr></thead><tbody>
  ${tabla.map((t,i)=>`<tr><td><span class="rk ${i===0?'rk1':i===1?'rk2':i===2?'rk3':''}">${i+1}</span></td>
  <td><div style="display:flex;align-items:center;gap:9px"><div style="width:26px;height:26px;background:var(--b5);border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:13px;overflow:hidden">${t.escudo64&&t.escudo64.startsWith('data:')?`<img src="${t.escudo64}" style="width:100%;height:100%;object-fit:cover">`:'🛡️'}</div><div><div style="font-weight:700">${t.nombre}</div><div style="font-size:11px;color:var(--g)">${t.seccion}</div></div></div></td>
  <td>${t.pj}</td><td>${t.pg}</td><td>${t.pe}</td><td>${t.pp}</td><td>${t.gf}</td><td>${t.gc}</td><td style="color:${t.dg>=0?'#22c55e':'var(--r)'}">${t.dg>0?'+':''}${t.dg}</td><td><span style="font-family:'Bebas Neue',cursive;font-size:22px;color:var(--y)">${t.pts}</span></td></tr>`).join('')}
  </tbody></table>`;
}

function renderGoleadores(elId,limit=10){
  const el=document.getElementById(elId);if(!el)return;
  const top=DB.getGoleadores().slice(0,limit);
  if(!top.length){el.innerHTML='<div class="empty"><div class="empty-ico">🥅</div><div class="empty-t">Sin goles registrados</div></div>';return;}
  el.innerHTML=top.map((j,i)=>{
    const eq=DB.getEquipo(j.equipoId),hue=(j.nombre.charCodeAt(0)*7)%360;
    const foto=j.foto64&&j.foto64.startsWith('data:')?`<img src="${j.foto64}" alt="${j.nombre}">`:j.nombre[0];
    return`<div class="scorer-row"><div class="sc-rk ${i===0?'rk1':i===1?'rk2':i===2?'rk3':''}">${i+1}</div><div class="sc-av" style="background:hsl(${hue},45%,30%)">${foto}</div><div class="sc-info"><div class="sc-nm">${j.nombre} <span style="color:var(--g);font-size:11px">#${j.numero}</span></div><div class="sc-tm">${eq?.nombre||'—'} · ${j.posicion||'—'}</div></div><div class="sc-meta"><div class="sc-mi"><div class="sc-mi-n">${j.amarillas}</div><div class="sc-mi-l">🟨</div></div><div class="sc-mi"><div class="sc-mi-n" style="color:var(--r)">${j.rojas}</div><div class="sc-mi-l">🟥</div></div></div><div class="sc-gl">${j.goles}</div></div>`;
  }).join('');
}

function renderDisciplina(elId,limit=8){
  const el=document.getElementById(elId);if(!el)return;
  const top=DB.getJugadores().filter(j=>j.amarillas>0||j.rojas>0).sort((a,b)=>(+b.rojas*3+ +b.amarillas)-(+a.rojas*3+ +a.amarillas)).slice(0,limit);
  if(!top.length){el.innerHTML='<div class="empty"><div class="empty-ico">🟨</div><div class="empty-t">Sin infracciones</div></div>';return;}
  el.innerHTML=top.map((j,i)=>{
    const eq=DB.getEquipo(j.equipoId),pts=+j.rojas*3+ +j.amarillas;
    const foto=j.foto64&&j.foto64.startsWith('data:')?`<img src="${j.foto64}" alt="${j.nombre}">`:j.nombre[0];
    return`<div class="scorer-row"><div class="sc-rk">${i+1}</div><div class="sc-av" style="background:var(--b5)">${foto}</div><div class="sc-info"><div class="sc-nm">${j.nombre}</div><div class="sc-tm">${eq?.nombre||'—'}</div></div><div class="sc-meta"><div class="sc-mi"><div class="sc-mi-n" style="color:var(--y)">${j.amarillas}</div><div class="sc-mi-l">🟨</div></div><div class="sc-mi"><div class="sc-mi-n" style="color:var(--r)">${j.rojas}</div><div class="sc-mi-l">🟥</div></div></div><div class="sc-gl" style="font-size:18px;color:${pts>=5?'var(--r)':'var(--y)'}">${pts}</div></div>`;
  }).join('');
}

/* ══════════════════════════════════════════════
   NOTICES
══════════════════════════════════════════════ */
const Notices={
  render(elId='avisos-wrap'){
    const el=document.getElementById(elId);if(!el)return;
    const notices=DB.getAvisos();
    const isAdmin=PubAdmin.isAdmin();
    const ico={important:'🚨',info:'📌',normal:'📋'};
    if(!notices.length){el.innerHTML='<div class="empty"><div class="empty-ico">📢</div><div class="empty-t">Sin avisos publicados</div></div>';return;}
    el.innerHTML=notices.map((n,i)=>`<div class="notice-card ${n.tipo||'normal'}">
      <div class="nc-hd"><div class="nc-ico">${ico[n.tipo]||'📋'}</div>
        <div style="flex:1"><div class="nc-ttl">${n.titulo}</div><div class="nc-dt">${fmtDate(n.fecha)}</div></div>
        ${isAdmin?`<div style="display:flex;gap:5px;flex-shrink:0"><button class="btn btn-s btn-xs" onclick="Notices.openForm('${n.id}')">✏️</button><button class="btn btn-d btn-xs" onclick="Notices.delete('${n.id}')">🗑️</button></div>`:''}
      </div>
      ${n.texto?`<div class="nc-body">${n.texto}</div>`:''}
      ${n.imgUrl?`<img src="${n.imgUrl}" class="nc-img" alt="${n.titulo}"/>`:''}
    </div>`).join('');
  },

  openForm(id=''){
    const notices=DB.getAvisos();
    const n=id?notices.find(x=>x.id===id)||{}:{tipo:'normal',titulo:'',fecha:new Date().toISOString().slice(0,10),texto:'',imgUrl:''};
    openModal(`<div class="m-hd"><span class="m-title">${id?'EDITAR':'NUEVO'} AVISO</span><button class="m-close" onclick="closeModal()">✕</button></div>
    <div class="m-body">
      <div class="ig"><label class="flabel">Título *</label><input class="finput" id="nc-t" value="${(n.titulo||'').replace(/"/g,'&quot;')}" placeholder="Título del aviso..."/></div>
      <div class="fg"><div class="ig"><label class="flabel">Tipo</label><select class="fselect" id="nc-tipo"><option value="normal" ${n.tipo==='normal'?'selected':''}>📋 Normal</option><option value="info" ${n.tipo==='info'?'selected':''}>📌 Informativo</option><option value="important" ${n.tipo==='important'?'selected':''}>🚨 Importante</option></select></div>
      <div class="ig"><label class="flabel">Fecha</label><input class="finput" type="date" id="nc-fecha" value="${n.fecha||new Date().toISOString().slice(0,10)}"/></div></div>
      <div class="ig"><label class="flabel">Texto</label><textarea class="ftarea" id="nc-texto" style="min-height:100px">${n.texto||''}</textarea></div>
      <div class="ig"><label class="flabel">Imagen opcional — JPG/PNG máx 2MB</label>
        <div class="file-box">${n.imgUrl&&n.imgUrl.startsWith('data:')?`<img src="${n.imgUrl}" id="nc-p" style="max-height:90px;margin:0 auto 8px;border-radius:6px"/>`:
        `<div id="nc-p" style="font-size:30px;margin-bottom:6px">📷</div>`}<div style="font-size:13px;color:var(--g)">Clic para subir imagen</div>
        <input type="file" accept="image/jpeg,image/jpg,image/png" onchange="handleImg(this,'nc-img','nc-p')"/></div>
        <input type="hidden" id="nc-img" value="${n.imgUrl||''}"/></div>
    </div>
    <div class="m-ft"><button class="btn btn-s" onclick="closeModal()">Cancelar</button><button class="btn btn-r" onclick="Notices.save('${id}')">💾 Publicar</button></div>`,'sm');
  },

  async save(id){
    const titulo=document.getElementById('nc-t').value.trim();
    if(!titulo){Toast.error('El título es obligatorio');return;}
    const data={tipo:document.getElementById('nc-tipo').value,titulo,fecha:document.getElementById('nc-fecha').value,texto:document.getElementById('nc-texto').value.trim(),imgUrl:document.getElementById('nc-img').value,activo:'true'};
    if(id)data.id=id;
    await DB.saveAviso(data);
    this.render();Toast.success(`Aviso ${id?'actualizado':'publicado'} ✔`);closeModal();
  },

  async delete(id){
    if(!confirm('¿Eliminar este aviso?'))return;
    DB.deleteAviso(id);this.render();Toast.success('Aviso eliminado');
  }
};

/* ══════════════════════════════════════════════
   GALLERY (Links)
══════════════════════════════════════════════ */
const Gallery={
  KEY:'ih_gallery_v1',
  get(){try{return JSON.parse(localStorage.getItem(this.KEY))||this.defaults();}catch{return this.defaults();}},
  save(d){localStorage.setItem(this.KEY,JSON.stringify(d));},
  defaults(){return[
    {id:'g0',titulo:'Jornada 1 - Bachillerato',url:'https://drive.google.com/drive/folders/your-folder-id',thumb:'',descripcion:'Fotos de los primeros partidos de Bachillerato Masculino.'},
    {id:'g1',titulo:'Categoría Femenino',url:'https://photos.google.com/album/your-album',thumb:'',descripcion:'Álbum del equipo femenino Intramuros 2026.'},
  ];},

  render(elId='gallery-wrap'){
    const el=document.getElementById(elId);if(!el)return;
    const items=this.get(),isAdmin=PubAdmin.isAdmin();
    if(!items.length){el.innerHTML='<div class="empty"><div class="empty-ico">📸</div><div class="empty-t">Sin álbumes</div><div class="empty-s">El administrador puede agregar links de Google Drive o Google Photos</div></div>';return;}
    el.innerHTML=`<div class="gallery-links">${items.map((g,i)=>`<div class="gallery-link-card">
      <div class="gallery-link-thumb">${g.thumb&&g.thumb.startsWith('data:')?`<img src="${g.thumb}" alt="${g.titulo}"/>`:'📸'}</div>
      <div class="gallery-link-body">
        <div class="gallery-link-title">${g.titulo}</div>
        <div class="gallery-link-url">${g.url}</div>
        ${g.descripcion?`<div style="font-size:12px;color:var(--g);font-family:'Inter',sans-serif;margin-top:6px">${g.descripcion}</div>`:''}
        <div style="display:flex;gap:8px;margin-top:12px;align-items:center">
          <a href="${g.url}" target="_blank" class="btn btn-y btn-xs">🔗 Abrir álbum</a>
          ${isAdmin?`<button class="btn btn-s btn-xs" onclick="Gallery.editItem('${g.id}')">✏️</button><button class="btn btn-d btn-xs" onclick="Gallery.deleteItem('${g.id}')">🗑️</button>`:''}
        </div>
      </div>
    </div>`).join('')}</div>`;
  },

  editItem(id){
    const items=this.get(),g=id?items.find(x=>x.id===id)||{}:{titulo:'',url:'',thumb:'',descripcion:''};
    openModal(`<div class="m-hd"><span class="m-title">${id?'EDITAR':'NUEVO'} ÁLBUM</span><button class="m-close" onclick="closeModal()">✕</button></div>
    <div class="m-body">
      <div class="ig"><label class="flabel">Título del álbum *</label><input class="finput" id="gl-t" value="${(g.titulo||'').replace(/"/g,'&quot;')}" placeholder="Ej: Jornada 3 - Sub-17"/></div>
      <div class="ig"><label class="flabel">Link de Google Drive / Google Photos *</label><input class="finput" id="gl-url" value="${g.url||''}" placeholder="https://drive.google.com/drive/folders/..."/></div>
      <div class="ig"><label class="flabel">Descripción</label><textarea class="ftarea" id="gl-desc">${g.descripcion||''}</textarea></div>
      <div class="ig"><label class="flabel">Imagen de portada (opcional)</label>
        <div class="file-box">${g.thumb&&g.thumb.startsWith('data:')?`<img src="${g.thumb}" id="gl-p" style="max-height:90px;margin:0 auto 8px;border-radius:6px"/>`:
        `<div id="gl-p" style="font-size:30px;margin-bottom:6px">📷</div>`}<div style="font-size:13px;color:var(--g)">Clic para subir portada</div>
        <input type="file" accept="image/jpeg,image/jpg,image/png" onchange="handleImg(this,'gl-img','gl-p')"/></div>
        <input type="hidden" id="gl-img" value="${g.thumb||''}"/></div>
    </div>
    <div class="m-ft"><button class="btn btn-s" onclick="closeModal()">Cancelar</button><button class="btn btn-r" onclick="Gallery.saveItem('${id||''}')">💾 Guardar</button></div>`,'sm');
  },

  saveItem(id){
    const titulo=document.getElementById('gl-t').value.trim(),url=document.getElementById('gl-url').value.trim();
    if(!titulo||!url){Toast.error('Título y URL son obligatorios');return;}
    const items=this.get();
    const item={id:id||'g'+Date.now(),titulo,url,descripcion:document.getElementById('gl-desc').value.trim(),thumb:document.getElementById('gl-img').value};
    if(id){const i=items.findIndex(x=>x.id===id);if(i>=0)items[i]=item;}
    else items.unshift(item);
    this.save(items);this.render();Toast.success(`Álbum ${id?'actualizado':'agregado'} ✔`);closeModal();
  },

  deleteItem(id){
    if(!confirm('¿Eliminar este álbum?'))return;
    const items=this.get().filter(x=>x.id!==id);this.save(items);this.render();Toast.success('Álbum eliminado');
  }
};

/* ── IMAGE HANDLER (shared) ── */
async function handleImg(input,hiddenId,prevId){
  const file=input.files[0];if(!file)return;
  if(!['image/jpeg','image/jpg','image/png'].includes(file.type)){Toast.error('Solo JPG/PNG');return;}
  if(file.size>2*1024*1024){Toast.error('Máximo 2MB');return;}
  const b64=await new Promise(r=>{const rd=new FileReader();rd.onload=e=>r(e.target.result);rd.readAsDataURL(file);});
  document.getElementById(hiddenId).value=b64;
  const prev=document.getElementById(prevId);
  if(prev){if(prev.tagName==='IMG')prev.src=b64;else prev.outerHTML=`<img src="${b64}" id="${prevId}" style="max-height:100px;margin:0 auto 8px;border-radius:6px"/>`;}
}

/* ── SHARED FOOTER ── */
function renderFooter(elId='site-footer'){
  const el=document.getElementById(elId);if(!el)return;
  const base=window.location.pathname.includes('/pages/')?'../':'';
  el.innerHTML=`<footer><div class="footer-inner">
    <div style="display:flex;align-items:center;gap:12px">
      <img src="${base}logo/logo.png" style="height:40px;opacity:.8" onerror="this.style.display='none'" alt="Logo"/>
      <div><div class="footer-brand">INTRAMUROS HUMBOLDT <span>2026</span></div><div class="footer-copy">Complejo Educativo Alejandro de Humboldt · El Salvador</div></div>
    </div>
    <div class="footer-links">
      <a href="https://coedalejandro.edu.sv" target="_blank" class="footer-link" style="color:var(--y)">🏫 COED Alejandro SV</a>
      <a href="${base}pages/reglas.html" class="footer-link">Reglamento</a>
      <a href="${base}pages/galeria.html" class="footer-link">Galería</a>
      <a href="${base}system.html" class="footer-link">⚙️ Sistema</a>
    </div>
    <div class="footer-copy">© 2026 Colegio Humboldt</div>
  </div></footer>`;
}
