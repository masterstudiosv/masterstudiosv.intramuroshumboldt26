const Router = {
  current: null,
  routes: {
    dashboard:    () => Dashboard.render(),
    partidos:     () => Partidos.render(),
    estadisticas: () => Estadisticas.render(),
    equipos:      () => Equipos.render(),
    categorias:   () => Categorias.render(),
    jugadores:    () => Jugadores.render(),
    arbitros:     () => Arbitros.render(),
    usuarios:     () => Usuarios.render(),
    carrusel:     () => CarruselAdmin.render(),
    avisos:       () => AvisosAdmin.render(),
    galeria:      () => GaleriaAdmin.render(),
    conexion:     () => Conexion.render(),
  },
  accessMap: {
    dashboard:['admin','arbitro','viewer'],  partidos:['admin','arbitro','viewer'],
    estadisticas:['admin','arbitro','viewer'], equipos:['admin','arbitro','viewer'],
    categorias:['admin'], jugadores:['admin'], arbitros:['admin'],
    usuarios:['admin'], carrusel:['admin'], avisos:['admin'],
    galeria:['admin'], conexion:['admin'],
  },
  go(route) {
    const role = Auth.getRole();
    if (!(this.accessMap[route]||[]).includes(role)) { Toast.error('Sin acceso a esta sección.'); return; }
    if (!this.routes[route]) { Toast.error('Ruta no encontrada'); return; }
    this.current = route;
    UI.setActiveNav(route); UI.setPageTitle(this._title(route)); UI.closeSidebar();
    document.getElementById('content-area').innerHTML = `<div class="fade-in">${this._loader()}</div>`;
    setTimeout(() => { try { this.routes[route](); } catch(e) { console.error(e); this._error(e); } }, 50);
  },
  _loader() { return `<div style="display:flex;align-items:center;justify-content:center;padding:60px;gap:12px;color:var(--gray)"><div style="width:20px;height:20px;border:2px solid var(--red);border-top-color:transparent;border-radius:50%;animation:spin .7s linear infinite"></div>Cargando...</div><style>@keyframes spin{to{transform:rotate(360deg)}}</style>`; },
  _error(e) { document.getElementById('content-area').innerHTML = `<div class="empty-state"><div class="empty-icon">❌</div><div class="empty-title">Error</div><div class="empty-sub">${e.message}</div></div>`; },
  _title(r) { return {dashboard:'Dashboard',partidos:'Partidos',estadisticas:'Estadísticas',equipos:'Equipos',categorias:'Categorías',jugadores:'Jugadores',arbitros:'Árbitros',usuarios:'Usuarios',carrusel:'Carrusel Público',avisos:'Avisos del Torneo',galeria:'Galería de Fotos',conexion:'Conexión y Estado'}[r]||r; },
};

const App = {
  async boot() {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');
    UI.renderSidebar(); UI.startClock();
    if (!DB._d || !Object.keys(DB._d).length) {
      try { await DB.load(); } catch(e) { Toast.error('Error cargando datos: ' + e.message); }
    }
    UI.showLiveIndicator(DB.getPartidos().filter(p=>p.estado==='en_juego').length > 0);
    Router.go(Auth.isArbitro() ? 'partidos' : 'dashboard');
  },
  init() {
    if (Auth.getSession()) this.boot();
    document.getElementById('login-pass')?.addEventListener('keydown', e => { if(e.key==='Enter') Auth.login(); });
    document.getElementById('login-user')?.addEventListener('keydown', e => { if(e.key==='Enter') document.getElementById('login-pass')?.focus(); });
  },
};
document.addEventListener('DOMContentLoaded', () => App.init());
