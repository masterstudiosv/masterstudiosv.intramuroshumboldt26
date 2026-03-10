/* ════════════════════════════════════════════════
   SHEETS.JS — Fuente única: Google Apps Script
   Sin cache. Sin localStorage. Todo directo al Sheet.
   
   CORS FIX: GAS bloquea POST desde dominios externos.
   Solución: todo va como GET (lectura Y escritura).
   Los datos de escritura se envían en el parámetro
   "payload" codificado como JSON en la URL.
════════════════════════════════════════════════ */

/* ─── Acciones que requieren WRITE_TOKEN ─────── */
const WRITE_ACTIONS = new Set([
  'login',
  'saveUsuario','deleteUsuario',
  'saveCategoria',
  'saveEquipo','deleteEquipo',
  'saveJugador','deleteJugador','updateStatJugador',
  'saveArbitro','deleteArbitro',
  'savePartido','deletePartido',
  'saveEvento',
  'saveCarouselSlide','deleteCarouselSlide',
  'saveAviso','deleteAviso',
  'saveGaleria','deleteGaleria',
]);

const API = {
  async call(action, data) {
    const params = new URLSearchParams({ action });
    let payload = data ? { ...data } : {};

    // Inyectar WRITE_TOKEN automáticamente en escrituras
    if (WRITE_ACTIONS.has(action) && action !== 'login') {
      payload.wt = CONFIG.WRITE_TOKEN;
    }

    if (Object.keys(payload).length) {
      params.set('payload', JSON.stringify(payload));
    }

    const res = await fetch(
      `${CONFIG.APPS_SCRIPT_URL}?${params.toString()}`,
      { redirect: 'follow' }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Error del servidor');
    return json.data;
  },
};

/* ─── Datos en memoria durante la sesión ─────── */
const DB = {
  _d: {},  // datos en memoria — se cargan al login y se recargan tras cada escritura

  /* Carga todo desde Sheets */
  async load() {
    this._d = await API.call('getAllData');
    return this._d;
  },

  /* Refresca una sola hoja tras escribir */
  async _refresh(sheet) {
    const fresh = await API.call('getSheet', { sheet });
    this._d[sheet] = fresh;
  },

  /* Escribe al servidor y refresca */
  async _save(sheet, action, data) {
    const result = await API.call(action, data);
    await this._refresh(sheet);
    return result;
  },
  async _del(sheet, action, id) {
    await API.call(action, { id });
    await this._refresh(sheet);
  },

  /* ── LECTURA (datos en memoria) ── */
  getSheet(s)  { return this._d[s] || []; },

  // Usuarios ya NO están en memoria local — se verifican server-side en login
  getUsuarios()              { return []; }, // deshabilitado por seguridad
  getUsuario(id)             { return null; },
  getCategorias()            { return this.getSheet('categorias'); },
  getCategoria(id)           { return this.getCategorias().find(c => c.id === id); },
  getCategoriasActivas()     { return this.getCategorias().filter(c => c.estado === 'activo'); },
  getEquipos()               { return this.getSheet('equipos'); },
  getEquipo(id)              { return this.getEquipos().find(e => e.id === id); },
  getEquiposByCategoria(cid) { return this.getEquipos().filter(e => e.categoriaId === cid); },
  getJugadores()             { return this.getSheet('jugadores'); },
  getJugador(id)             { return this.getJugadores().find(j => j.id === id); },
  getJugadoresByEquipo(eid)  { return this.getJugadores().filter(j => j.equipoId === eid && j.estado === 'activo'); },
  getArbitros()              { return this.getSheet('arbitros'); },
  getArbitro(id)             { return this.getArbitros().find(a => a.id === id); },
  getPartidos()              { return this.getSheet('partidos'); },
  getPartido(id)             { return this.getPartidos().find(p => p.id === id); },
  getPartidosBySerie(sid)    { return this.getPartidos().filter(p => p.serieId === sid).sort((a,b)=>+a.numEnSerie-+b.numEnSerie); },
  getPartidosByCategoria(c)  { return this.getPartidos().filter(p => p.categoriaId === c); },
  getEventos()               { return this.getSheet('eventos'); },
  getEventosByPartido(pid)   { return this.getEventos().filter(e => e.partidoId === pid).sort((a,b)=>+a.minuto-+b.minuto); },
  getCarousel()              { return this.getSheet('carousel').filter(s=>s.activo==='true'||s.activo===true).sort((a,b)=>+a.orden-+b.orden); },
  getCarouselAll()           { return this.getSheet('carousel').sort((a,b)=>+a.orden-+b.orden); },
  getAvisos()                { return this.getSheet('avisos').filter(a=>a.activo==='true'||a.activo===true).sort((a,b)=>(b.fecha||'').localeCompare(a.fecha||'')); },
  getAvisosAll()             { return this.getSheet('avisos').sort((a,b)=>(b.fecha||'').localeCompare(a.fecha||'')); },

  /* ── ESCRITURA ── */
  async saveUsuario(d)    { return this._save('usuarios','saveUsuario',d); },
  async deleteUsuario(id) { return this._del('usuarios','deleteUsuario',id); },

  async saveCategoria(d)  { return this._save('categorias','saveCategoria',d); },
  async toggleCategoria(id) {
    const c=this.getCategoria(id); if(!c)return;
    return this._save('categorias','saveCategoria',{...c,estado:c.estado==='activo'?'inactivo':'activo'});
  },

  async saveEquipo(d)     { return this._save('equipos','saveEquipo',d); },
  async toggleEquipo(id) {
    const e=this.getEquipo(id); if(!e)return;
    return this._save('equipos','saveEquipo',{...e,estado:e.estado==='activo'?'inactivo':'activo'});
  },
  async deleteEquipo(id) {
    for(const j of this.getJugadoresByEquipo(id)) await API.call('deleteJugador',{id:j.id});
    await this._del('equipos','deleteEquipo',id);
    await this._refresh('jugadores');
  },

  async saveJugador(d)    { return this._save('jugadores','saveJugador',d); },
  async deleteJugador(id) { return this._del('jugadores','deleteJugador',id); },
  async updateStatJugador(id,stat,delta=1) {
    await API.call('updateStatJugador',{id,stat,delta});
    await this._refresh('jugadores');
  },

  async saveArbitro(d)    { return this._save('arbitros','saveArbitro',d); },
  async deleteArbitro(id) { return this._del('arbitros','deleteArbitro',id); },

  async savePartido(d)    { return this._save('partidos','savePartido',d); },
  async updatePartido(id,upd) {
    const p=this.getPartido(id); if(!p)return;
    return this._save('partidos','savePartido',{...p,...upd});
  },
  async deletePartido(id) { return this._del('partidos','deletePartido',id); },

  async saveEvento(d) {
    d.timestamp=new Date().toISOString();
    const r=await API.call('saveEvento',d);
    await this._refresh('eventos');
    return r;
  },

  async saveCarouselSlide(d) { return this._save('carousel','saveCarouselSlide',d); },
  async deleteCarouselSlide(id){ return this._del('carousel','deleteCarouselSlide',id); },

  async saveAviso(d)      { return this._save('avisos','saveAviso',d); },
  async deleteAviso(id)   { return this._del('avisos','deleteAviso',id); },

  getGaleria()         { return this.getSheet('galeria').sort((a,b)=>(b.fecha||'').localeCompare(a.fecha||'')); },
  async saveGaleria(d)   { return this._save('galeria','saveGaleria',d); },
  async deleteGaleria(id){ return this._del('galeria','deleteGaleria',id); },

  /* ── COMPUTED ── */
  getGoleadores() {
    return this.getJugadores().filter(j=>+j.goles>0).sort((a,b)=>+b.goles-+a.goles);
  },
  getTablaPosiciones(catId) {
    const eqs=this.getEquipos().filter(e=>e.categoriaId===catId);
    const ps=this.getPartidos().filter(p=>p.categoriaId===catId&&p.estado==='finalizado');
    return eqs.map(eq=>{
      let pj=0,pg=0,pe=0,pp=0,gf=0,gc=0;
      ps.forEach(p=>{
        const esl=p.localId===eq.id,esv=p.visitanteId===eq.id;
        if(!esl&&!esv)return; pj++;
        const gl=+p.golesLocal,gv=+p.golesVisitante;
        if(esl){gf+=gl;gc+=gv;gl>gv?pg++:gl===gv?pe++:pp++;}
        if(esv){gf+=gv;gc+=gl;gv>gl?pg++:gv===gl?pe++:pp++;}
      });
      return{...eq,pj,pg,pe,pp,gf,gc,dg:gf-gc,pts:pg*3+pe};
    }).sort((a,b)=>b.pts-a.pts||b.dg-a.dg||b.gf-a.gf);
  },
  getMarcadorGlobal(serieId) {
    const ps=this.getPartidosBySerie(serieId); if(ps.length<2)return null;
    const[p1,p2]=ps;
    return{equipoA:p1.localId,equipoB:p1.visitanteId,
      golesA:+p1.golesLocal+ +p2.golesVisitante,
      golesB:+p1.golesVisitante+ +p2.golesLocal,partidos:ps};
  },
  getStatsGenerales() {
    const p=this.getPartidos(),ev=this.getEventos();
    return{
      totalPartidos:p.length,
      finalizados:p.filter(x=>x.estado==='finalizado').length,
      enJuego:p.filter(x=>x.estado==='en_juego').length,
      programados:p.filter(x=>x.estado==='programado').length,
      pendientes:p.filter(x=>x.estado==='pendiente').length,
      totalEquipos:this.getEquipos().filter(e=>e.estado==='activo').length,
      totalJugadores:this.getJugadores().filter(j=>j.estado==='activo').length,
      totalGoles:ev.filter(e=>e.tipo==='gol').length,
      totalAmarillas:ev.filter(e=>e.tipo==='amarilla').length,
      totalRojas:ev.filter(e=>e.tipo==='roja').length,
    };
  },
};
