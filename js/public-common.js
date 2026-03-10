/* ════════════════════════════════════════════════
   PUBLIC-COMMON.JS — Nav, Footer, Modal, Toast,
   Admin mode, helpers compartidos por todas las
   páginas públicas (index + pages/)
════════════════════════════════════════════════ */

const IS_SUBPAGE = location.pathname.includes('/pages/');
const ROOT       = IS_SUBPAGE ? '../' : '';

/* ─── HELPERS ─────────────────────────────────── */
function fmtDate(d){
  if(!d||d==='-'||d==='') return 'Fecha por confirmar';
  // Sanitizar: si llega como Date object o string largo de Date, extraer YYYY-MM-DD
  if(typeof d === 'object' && d instanceof Date) {
    const y=d.getFullYear(), mo=String(d.getMonth()+1).padStart(2,'0'), dy=String(d.getDate()).padStart(2,'0');
    d = y+'-'+mo+'-'+dy;
  }
  if(typeof d === 'string' && d.length > 10) {
    // Podría ser "Fri Jan 02 2026..." — intentar parsear
    const parsed = new Date(d);
    if(!isNaN(parsed.getTime())) {
      const y=parsed.getFullYear(), mo=String(parsed.getMonth()+1).padStart(2,'0'), dy=String(parsed.getDate()).padStart(2,'0');
      d = y+'-'+mo+'-'+dy;
    }
  }
  const parts = d.split('-');
  if(parts.length < 3) return d; // fallback
  const [y,m,day] = parts;
  if(!y||!m||!day||isNaN(+y)||isNaN(+m)||isNaN(+day)) return 'Fecha inválida';
  const ms=['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  return `${+day} ${ms[+m-1]} ${y}`;
}
function fmtHora(h){
  if(!h||h==='-'||h==='') return '';
  // Si llega como Date object
  if(typeof h === 'object' && h instanceof Date) {
    return String(h.getHours()).padStart(2,'0')+':'+String(h.getMinutes()).padStart(2,'0');
  }
  // Si llega como string largo de Date, extraer hora
  if(typeof h === 'string' && h.length > 5) {
    const m = h.match(/(\d{1,2}):(\d{2})/);
    if(m) return m[1].padStart(2,'0')+':'+m[2];
  }
  return h;
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

/* ─── SHARE ─────────────────────────────────── */
// Componente compartible reutilizable para páginas públicas
// Este script va en public-common.js
function showShareModal(text, url) {
  const fullUrl = url || window.location.href;
  const encodedFull = encodeURIComponent(text + ' ' + fullUrl);
  const encodedText = encodeURIComponent(text);
  const encodedUrl  = encodeURIComponent(fullUrl);

  const waIcon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>`;
  const fbIcon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>`;
  const xIcon  = `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`;

  document.getElementById('modal-cnt').innerHTML = `
    <div style="padding:24px;max-width:400px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
        <div style="font-family:'Bebas Neue',cursive;font-size:24px;letter-spacing:1px">📤 COMPARTIR</div>
        <button onclick="closeModal()" style="background:none;border:none;color:var(--w);font-size:22px;cursor:pointer;line-height:1">✕</button>
      </div>
      <div style="font-size:12px;color:var(--g);margin-bottom:20px;font-family:'Inter',sans-serif;line-height:1.5;padding:10px;background:var(--b4);border-radius:8px">${text}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <a href="https://wa.me/?text=${encodedFull}" target="_blank" style="display:flex;align-items:center;justify-content:center;gap:8px;padding:13px;background:#25D366;color:#fff;text-decoration:none;border-radius:12px;font-weight:700;font-size:13px">
          ${waIcon} WhatsApp
        </a>
        <a href="https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}" target="_blank" style="display:flex;align-items:center;justify-content:center;gap:8px;padding:13px;background:#1877F2;color:#fff;text-decoration:none;border-radius:12px;font-weight:700;font-size:13px">
          ${fbIcon} Facebook
        </a>
        <a href="https://twitter.com/intent/tweet?text=${encodedFull}" target="_blank" style="display:flex;align-items:center;justify-content:center;gap:8px;padding:13px;background:#000;color:#fff;text-decoration:none;border-radius:12px;font-weight:700;font-size:13px;border:1px solid #333">
          ${xIcon} X / Twitter
        </a>
        <button id="share-copy-btn" onclick="sharesCopyLink('${fullUrl}')" style="display:flex;align-items:center;justify-content:center;gap:8px;padding:13px;background:var(--b4);color:var(--w);border:1px solid var(--b5);border-radius:12px;font-weight:700;font-size:13px;cursor:pointer">
          🔗 Copiar link
        </button>
      </div>
    </div>`;
  document.getElementById('modal-bg').style.display = 'flex';
}

function sharesCopyLink(url) {
  navigator.clipboard.writeText(url).then(() => {
    const btn = document.getElementById('share-copy-btn');
    if (btn) { btn.textContent = '✅ ¡Copiado!'; btn.style.background='#22c55e'; btn.style.color='#000'; }
    setTimeout(closeModal, 1200);
  }).catch(() => {
    showToast('No se pudo copiar el link', 'error');
  });
}

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
