/* ════════════════════════════════════════════════
   PUBLIC-COMMON.JS — Nav, Footer, Modal, Toast,
   Admin mode, helpers compartidos por todas las
   páginas públicas (index + pages/)
════════════════════════════════════════════════ */

const IS_SUBPAGE = location.pathname.includes('/pages/');
const ROOT       = IS_SUBPAGE ? '../' : '';

/* ─── HELPERS ─────────────────────────────────── */
function fmtDate(d){
  if(!d) return 'Fecha por confirmar';
  const [y,m,day]=d.split('-');
  const ms=['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  return `${+day} ${ms[+m-1]} ${y}`;
}
function toggleMob(){ document.getElementById('mob-nav').classList.toggle('open'); }
function closeMob() { document.getElementById('mob-nav').classList.remove('open'); }

/* ─── TOAST ───────────────────────────────────── */
const Toast = {
  show(msg, type='info', dur=3500){
    const icons={success:'✅',error:'❌',info:'ℹ️',warning:'⚠️'};
    const el=document.createElement('div');
    el.className=`toast ${type}`;
    el.innerHTML=`<span>${icons[type]||'ℹ️'}</span><span>${msg}</span>`;
    document.getElementById('toast-ct').appendChild(el);
    setTimeout(()=>{el.classList.add('toast-out');setTimeout(()=>el.remove(),300);},dur);
  },
  success(m){ this.show(m,'success'); },
  error(m)  { this.show(m,'error',5000); },
  info(m)   { this.show(m,'info'); },
};

/* ─── MODAL ───────────────────────────────────── */
function openModal(html, size=''){
  const box=document.getElementById('modal-box');
  box.className=size||'';
  document.getElementById('modal-cnt').innerHTML=html;
  document.getElementById('modal-bg').style.display='flex';
  document.body.style.overflow='hidden';
}
function closeModal(){
  document.getElementById('modal-bg').style.display='none';
  document.getElementById('modal-cnt').innerHTML='';
  document.body.style.overflow='';
}

/* ─── ADMIN (modo edición de página pública) ─────
   Un solo login — usa las mismas credenciales del sistema.
   La sesión se guarda en sessionStorage.
   El admin del sistema (rol=admin) puede:
     - Gestionar carrusel
     - Gestionar avisos
   Acceso: clic en "Admin" en el footer, o URL#admin
─────────────────────────────────────────────── */
const PubAdmin = {
  KEY: 'ih2026_pub_admin',

  isAdmin(){ return sessionStorage.getItem(this.KEY)==='1'; },

  async promptLogin(){
    openModal(`
      <div class="m-hd">
        <div style="display:flex;align-items:center;gap:10px">
          <div style="width:36px;height:36px;background:var(--r);border-radius:7px;display:flex;align-items:center;justify-content:center;font-size:18px">🔑</div>
          <div><div class="m-title">ACCESO ADMINISTRADOR</div>
          <div style="font-size:12px;color:var(--g)">Mismas credenciales del sistema de gestión</div></div>
        </div>
        <button class="m-close" onclick="closeModal()">✕</button>
      </div>
      <div class="m-body">
        <div class="ig"><label class="flabel">Usuario</label>
          <input class="finput" id="pa-user" placeholder="admin" autocomplete="username"/></div>
        <div class="ig"><label class="flabel">Contraseña</label>
          <input class="finput" type="password" id="pa-pass" placeholder="••••••••" autocomplete="current-password"/></div>
        <div id="pa-err" style="display:none;color:var(--r);font-size:13px;margin-top:-6px;font-family:'Inter',sans-serif"></div>
      </div>
      <div class="m-ft">
        <button class="btn btn-s" onclick="closeModal()">Cancelar</button>
        <button id="pa-btn" class="btn btn-r" onclick="PubAdmin.tryLogin()">Ingresar</button>
      </div>`,'sm');
    setTimeout(()=>document.getElementById('pa-user')?.focus(),100);
    document.getElementById('pa-pass')?.addEventListener('keydown',e=>{ if(e.key==='Enter') PubAdmin.tryLogin(); });
  },

  async tryLogin(){
    const user=document.getElementById('pa-user').value.trim();
    const pass=document.getElementById('pa-pass').value;
    const errEl=document.getElementById('pa-err');
    const btn=document.getElementById('pa-btn');
    if(!user||!pass){ errEl.textContent='Completa los campos.'; errEl.style.display='block'; return; }
    btn.textContent='Verificando...'; btn.disabled=true; errEl.style.display='none';
    try {
      await DB.load();
      const u=DB.getUsuarioByCredentials(user,pass);
      if(u && u.rol==='admin'){
        sessionStorage.setItem(this.KEY,'1');
        closeModal();
        this.showUI();
        Toast.success('Modo edición activado');
      } else {
        errEl.textContent='Credenciales incorrectas o sin permisos de admin.';
        errEl.style.display='block';
        document.getElementById('pa-pass').value='';
      }
    } catch(e) {
      errEl.textContent='Error de conexión: '+e.message;
      errEl.style.display='block';
    } finally {
      btn.textContent='Ingresar'; btn.disabled=false;
    }
  },

  showUI(){
    const ribbon=document.getElementById('admin-ribbon');
    if(ribbon) ribbon.style.display='block';
    document.getElementById('aviso-add-btn')?.style && (document.getElementById('aviso-add-btn').style.display='flex');
    Notices?.render?.();
    Carousel?.render?.();
  },

  logout(){
    sessionStorage.removeItem(this.KEY);
    const ribbon=document.getElementById('admin-ribbon');
    if(ribbon) ribbon.style.display='none';
    document.getElementById('aviso-add-btn')?.style && (document.getElementById('aviso-add-btn').style.display='none');
    Notices?.render?.();
    Toast.info('Sesión de edición cerrada');
  },
};

/* ─── NAV ─────────────────────────────────────── */
function buildNav(){
  const logoHtml=`<div class="nav-logo"><img src="${ROOT}logo/logo.png" alt="Logo"
    onerror="this.parentElement.outerHTML='<div class=nav-logo-fb>IH</div>'" /></div>`;
  const cur=location.pathname.split('/').pop()||'index.html';
  const pages=[
    {href:IS_SUBPAGE?'../index.html':'index.html',   label:'🏠 Inicio',       key:'index.html'},
    {href:`${IS_SUBPAGE?'':'pages/'}partidos.html`,  label:'⚽ Partidos',      key:'partidos.html'},
    {href:`${IS_SUBPAGE?'':'pages/'}equipos.html`,   label:'🛡️ Equipos',      key:'equipos.html'},
    {href:`${IS_SUBPAGE?'':'pages/'}posiciones.html`,label:'📋 Posiciones',    key:'posiciones.html'},
    {href:`${IS_SUBPAGE?'':'pages/'}goleadores.html`,label:'🥅 Goleadores',    key:'goleadores.html'},
    {href: `${IS_SUBPAGE?'':'pages/'}galeria.html`,  label:'📸 Galería',       key:'galeria.html'},
    {href:`${IS_SUBPAGE?'':'pages/'}reglas.html`,    label:'📖 Reglas',        key:'reglas.html'},
    {href:`${IS_SUBPAGE?'':'pages/'}avisos.html`,    label:'📢 Avisos',        key:'avisos.html'},
  ];
  const sysHref=`${ROOT}system.html`;
  document.getElementById('topnav').innerHTML=`
    <div class="nav-brand" onclick="location.href='${IS_SUBPAGE?'../index.html':'index.html'}'">
      ${logoHtml}
      <div><div class="brand-top">INTRAMUROS HUMBOLDT</div><div class="brand-sub">Fútbol Sala 2026</div></div>
    </div>
    <div class="nav-links">${pages.map(p=>`<a href="${p.href}" class="nav-link${cur===p.key?' active':''}">${p.label}</a>`).join('')}</div>
    <div class="nav-right">
      <button class="mob-btn" onclick="toggleMob()">☰</button>
    </div>`;
  document.getElementById('mob-nav').innerHTML=pages.map(p=>
    `<a href="${p.href}" class="nav-link${cur===p.key?' active':''}">${p.label}</a>`
  ).join('')+``;
}

/* ─── FOOTER ──────────────────────────────────── */
function buildFooter(){
  const sysHref=`${ROOT}system.html`;
  const base=IS_SUBPAGE?'../':'';
  document.getElementById('page-footer').innerHTML=`
    <div class="footer-inner">
      <div>
        <div class="footer-brand">INTRAMUROS HUMBOLDT <span>2026</span></div>
        <div class="footer-copy">Complejo Educativo Alejandro de Humboldt · Fútbol Sala</div>
      </div>
      <div class="footer-links">
        <a href="${base}pages/reglas.html" class="footer-link">Reglamento</a>
        <a href="${base}pages/avisos.html" class="footer-link">Avisos</a>
        <a href="https://masterstudiosv.vercel.app/" target="_blank" class="footer-link" style="color:var(--g)">Colaboración</a>
      </div>
      <div class="footer-copy">© 2026 Complejo Educativo Alejandro de Humboldt</div>
    </div>`;
}

/* ─── MATCH CARD ──────────────────────────────── */
function matchCardHTML(p){
  const local=DB.getEquipo(p.localId),visit=DB.getEquipo(p.visitanteId);
  const cat=DB.getCategoria(p.categoriaId),arb=DB.getArbitro(p.arbitroId);
  const isLive=p.estado==='en_juego',isPaused=p.estado==='pausado';
  const badge={
    en_juego:'<span class="badge badge-live">⚽ EN VIVO</span>',
    pausado:'<span class="badge badge-y">⏸ PAUSADO</span>',
    programado:'<span class="badge badge-g">PROGRAMADO</span>',
    finalizado:'<span class="badge badge-x">FINALIZADO</span>',
    pendiente:'<span class="badge badge-x">PENDIENTE</span>',
  }[p.estado]||'';
  const serieTag=+p.totalEnSerie>1
    ?`<span class="badge badge-y" style="font-size:10px">⟳ ${p.numEnSerie}/${p.totalEnSerie} ${+p.numEnSerie===1?'IDA':'VUELTA'}</span>`:'';
  const evGoles=DB.getEventosByPartido(p.id).filter(e=>e.tipo==='gol');
  const gL=evGoles.filter(e=>e.equipoId===p.localId).map(e=>`${(DB.getJugador(e.jugadorId)?.nombre||'?').split(' ')[0]} ${e.minuto}'`).join(', ');
  const gV=evGoles.filter(e=>e.equipoId===p.visitanteId).map(e=>`${(DB.getJugador(e.jugadorId)?.nombre||'?').split(' ')[0]} ${e.minuto}'`).join(', ');
  const shL=local?.escudo64?.startsWith('data:')?`<img src="${local.escudo64}" alt="">`:'🛡️';
  const shV=visit?.escudo64?.startsWith('data:')?`<img src="${visit.escudo64}" alt="">`:'🛡️';
  return `<div class="match-card${isLive?' live':''}${+p.totalEnSerie>1?' serie-mark':''}">
    <div class="mh">
      <div style="display:flex;align-items:center;gap:5px;flex-wrap:wrap">${badge}${serieTag}<span>${cat?.nombre||'—'}</span></div>
      <span>${p.fecha?fmtDate(p.fecha)+(p.hora?' · '+p.hora:''):'Sin fecha'}</span>
    </div>
    <div class="mb">
      <div class="mt"><div class="t-sh">${shL}</div>
        <div><div class="tn">${local?.nombre||'—'}</div><div class="tsub">${gL||local?.seccion||''}</div></div></div>
      <div class="sc-box">
        <div class="sc-n">${p.estado==='pendiente'?'vs':`${p.golesLocal} – ${p.golesVisitante}`}</div>
        <div class="sc-m">${isLive||isPaused?`⏱ ${p.minutoActual}'`:p.estado==='finalizado'?'FINAL':'—'}</div>
      </div>
      <div class="mt r"><div class="t-sh">${shV}</div>
        <div><div class="tn">${visit?.nombre||'—'}</div><div class="tsub">${gV||visit?.seccion||''}</div></div></div>
    </div>
    <div class="mf"><span>🟨 ${arb?.nombre||'Árbitro TBD'}</span>
      <span style="color:var(--g2)">${local?.seccion||''} vs ${visit?.seccion||''}</span></div>
  </div>`;
}

/* ─── SERIES ──────────────────────────────────── */
function seriesHTML(seriesIds){
  if(!seriesIds.length) return '<div class="empty"><div class="empty-ico">⟳</div><div class="empty-t">Sin series</div></div>';
  return seriesIds.map(sid=>{
    const g=DB.getMarcadorGlobal(sid); if(!g)return'';
    const eqA=DB.getEquipo(g.equipoA),eqB=DB.getEquipo(g.equipoB);
    const cat=DB.getCategoria(g.partidos[0]?.categoriaId);
    const winner=g.golesA>g.golesB?eqA?.nombre:g.golesB>g.golesA?eqB?.nombre:null;
    const p1=g.partidos[0],p2=g.partidos[1];
    const status=p1?.estado==='finalizado'&&p2?.estado==='finalizado'?'SERIE FINALIZADA':
      p1?.estado==='finalizado'?'IDA JUGADA · VUELTA PENDIENTE':'PENDIENTE';
    return `<div class="serie-block">
      <div class="global-bar">
        <div><div style="font-size:10px;letter-spacing:2px;color:var(--g);text-transform:uppercase;margin-bottom:6px">⟳ GLOBAL · ${cat?.nombre||'—'} · ${status}</div>
          <div class="global-score">
            <span style="color:${g.golesA>g.golesB?'var(--y)':'var(--w)'}">${eqA?.nombre||'—'}</span>
            <span style="color:var(--y);margin:0 14px">${g.golesA} — ${g.golesB}</span>
            <span style="color:${g.golesB>g.golesA?'var(--y)':'var(--w)'}">${eqB?.nombre||'—'}</span>
          </div></div>
        <div>${winner?`<span class="badge badge-y">🏆 Líder: ${winner}</span>`:`<span class="badge badge-x">⚖️ EMPATE</span>`}</div>
      </div>
      <div class="matches-grid" style="grid-template-columns:1fr 1fr">
        ${g.partidos.map(p=>matchCardHTML(p)).join('')}
      </div>
    </div>`;
  }).join('');
}

/* ─── INIT ────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', async ()=>{
  buildNav();
  buildFooter();
  // Cargar datos desde Sheets primero
  try { await DB.load(); } catch(e){ console.warn('Carga inicial:', e.message); }
  // Activar modo admin si ya tiene sesión
  if(PubAdmin.isAdmin()) PubAdmin.showUI();
  // Abrir login admin si viene con #admin en URL
  if(location.hash==='#admin') PubAdmin.promptLogin();
  document.getElementById('modal-bg')?.addEventListener('click',e=>{
    if(e.target===document.getElementById('modal-bg')) closeModal();
  });
  // Disparar evento para que cada página inicialice su contenido
  document.dispatchEvent(new Event('data-ready'));
});
