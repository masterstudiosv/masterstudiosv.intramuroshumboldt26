// ============================================================
//  DB.js — Capa de abstracción de datos
//  Si GAS_URL está configurado → usa Google Sheets vía Apps Script
//  Si no → usa LocalStorage como fallback offline
// ============================================================

const DB = {

  get gasUrl() {
    return (typeof CONFIG !== "undefined" && CONFIG.GAS_URL) ? CONFIG.GAS_URL.trim() : "";
  },

  get online() {
    return this.gasUrl.length > 0;
  },

  // ── GET ──────────────────────────────────────────────────────
  async get(action, params = {}) {
    if (!this.online) return this._localGet(action, params);
    try {
      const qs = new URLSearchParams({ action, ...params }).toString();
      const res = await fetch(`${this.gasUrl}?${qs}`);
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "Error en GET");
      return json.data ?? json;
    } catch (e) {
      console.warn("[DB] GET falló, fallback local:", e.message);
      if (CONFIG.modoOfflineFallback) return this._localGet(action, params);
      throw e;
    }
  },

  // ── POST ─────────────────────────────────────────────────────
  async post(action, body = {}) {
    if (!this.online) return this._localPost(action, body);
    try {
      const res = await fetch(this.gasUrl, {
        method: "POST",
        headers: { "Content-Type": "text/plain" }, // GAS necesita text/plain para evitar preflight CORS
        body: JSON.stringify({ action, ...body }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "Error en POST");
      return json;
    } catch (e) {
      console.warn("[DB] POST falló, fallback local:", e.message);
      if (CONFIG.modoOfflineFallback) return this._localPost(action, body);
      throw e;
    }
  },

  // ── LOGIN (especial porque devuelve user) ────────────────────
  async login(username, password) {
    if (!this.online) return this._localLogin(username, password);
    try {
      const res = await this.post("login", { username, password });
      return res.user || null;
    } catch (e) {
      if (CONFIG.modoOfflineFallback) return this._localLogin(username, password);
      return null;
    }
  },

  // ════════════════════════════════════════════════════════════
  // FALLBACK LOCAL (LocalStorage) — mismos métodos, sin GAS
  // ════════════════════════════════════════════════════════════
  _localLogin(username, password) {
    const users = JSON.parse(localStorage.getItem("ih_users") || "[]");
    const user = users.find(u => u.username === username && u.password === password && u.activo !== "false");
    if (user) return { id: user.id, username: user.username, role: user.role, name: user.name };
    return null;
  },

  _localGet(action, params) {
    const map = {
      getEquipos:    () => JSON.parse(localStorage.getItem("equipos") || "[]"),
      getJugadores:  () => JSON.parse(localStorage.getItem("jugadores") || "[]"),
      getPartidos:   () => JSON.parse(localStorage.getItem("partidos") || "[]"),
      getEventos:    () => JSON.parse(localStorage.getItem("eventos") || "[]"),
      getCarrusel:   () => JSON.parse(localStorage.getItem("carrusel") || "[]"),
      getAvisos:     () => JSON.parse(localStorage.getItem("avisos") || "[]"),
      getUsuarios:   () => JSON.parse(localStorage.getItem("ih_users") || "[]").map(u => ({...u, password: undefined})),
      getPartidoById:() => { const all = JSON.parse(localStorage.getItem("partidos")||"[]"); return all.find(p=>p.id===params.id)||null; },
      getEventosByPartido: () => JSON.parse(localStorage.getItem("eventos")||"[]").filter(e=>e.partido_id===params.partido_id),
      getJugadoresByEquipo:() => JSON.parse(localStorage.getItem("jugadores")||"[]").filter(j=>j.equipo_id===params.equipo_id),
    };
    return (map[action] ? map[action]() : null);
  },

  _localPost(action, body) {
    const genId = () => "loc_" + Date.now() + "_" + Math.floor(Math.random()*9999);
    const now = new Date().toISOString();

    // ── Helpers ─
    const lsGet = k => JSON.parse(localStorage.getItem(k) || "[]");
    const lsSave = (k,v) => localStorage.setItem(k, JSON.stringify(v));
    const lsAdd = (k, data) => { const all=lsGet(k); const item={...data,id:genId(),createdAt:now}; all.push(item); lsSave(k,all); return {ok:true,id:item.id,data:item}; };
    const lsUpdate = (k,id,data) => { const all=lsGet(k); const i=all.findIndex(r=>r.id===id); if(i<0) return {ok:false,error:"Not found"}; all[i]={...all[i],...data}; lsSave(k,all); return {ok:true,id}; };
    const lsDel = (k,id) => { lsSave(k,lsGet(k).filter(r=>r.id!==id)); return {ok:true,id}; };

    switch(action) {
      // Equipos
      case "addEquipo":    return lsAdd("equipos", body.data);
      case "updateEquipo": return lsUpdate("equipos", body.id, body.data);
      case "deleteEquipo": return lsDel("equipos", body.id);

      // Jugadores
      case "addJugador":   return lsAdd("jugadores", body.data);
      case "updateJugador":return lsUpdate("jugadores", body.id, body.data);
      case "deleteJugador":return lsDel("jugadores", body.id);
      case "bulkSaveJugadores": {
        const {equipo_id, jugadores} = body;
        const all = lsGet("jugadores").filter(j=>j.equipo_id!==equipo_id);
        const saved = jugadores.map(j=>({...j,id:genId(),equipo_id,createdAt:now}));
        lsSave("jugadores",[...all,...saved]);
        return {ok:true,saved:saved.map(j=>j.id)};
      }

      // Partidos
      case "addPartido":    return lsAdd("partidos", body.data);
      case "updatePartido": return lsUpdate("partidos", body.id, body.data);
      case "deletePartido": return lsDel("partidos", body.id);
      case "updateEstadoPartido": {
        const {id, ...data} = body; delete data.action;
        return lsUpdate("partidos", id, data);
      }

      // Eventos
      case "addEvento": {
        const ev = {...body.data, timestamp_real: body.data.timestamp_real||now};
        const r = lsAdd("eventos", ev);
        if(r.ok && body.data.tipo==="gol") this._localRecalcGoles(body.data.partido_id);
        return r;
      }
      case "deleteEvento": {
        const evs=lsGet("eventos"); const ev=evs.find(e=>e.id===body.id);
        const r = lsDel("eventos", body.id);
        if(r.ok && ev && ev.tipo==="gol") this._localRecalcGoles(ev.partido_id);
        return r;
      }

      // Carrusel
      case "addCarrusel":    return lsAdd("carrusel", body.data);
      case "updateCarrusel": return lsUpdate("carrusel", body.id, body.data);
      case "deleteCarrusel": return lsDel("carrusel", body.id);

      // Avisos
      case "addAviso":    return lsAdd("avisos", body.data);
      case "updateAviso": return lsUpdate("avisos", body.id, body.data);
      case "deleteAviso": return lsDel("avisos", body.id);

      // Usuarios
      case "addUsuario": {
        const users = lsGet("ih_users");
        if(users.find(u=>u.username===body.data.username)) return {ok:false,error:"Usuario ya existe"};
        return lsAdd("ih_users", {...body.data, activo:"true"});
      }
      case "updateUsuario": return lsUpdate("ih_users", body.id, body.data);
      case "deleteUsuario": return lsDel("ih_users", body.id);
      case "changePassword": {
        const users=lsGet("ih_users"); const u=users.find(u=>u.id===body.id);
        if(!u) return {ok:false,error:"No encontrado"};
        if(u.password!==body.currentPassword) return {ok:false,error:"Contraseña actual incorrecta"};
        return lsUpdate("ih_users", body.id, {password:body.newPassword});
      }

      // Auth local
      case "login": return {ok:true, user: this._localLogin(body.username, body.password)};

      default: return {ok:false, error:"Acción desconocida: "+action};
    }
  },

  _localRecalcGoles(partidoId) {
    const eventos = JSON.parse(localStorage.getItem("eventos")||"[]").filter(e=>e.partido_id===partidoId&&e.tipo==="gol");
    const partidos = JSON.parse(localStorage.getItem("partidos")||"[]");
    const i = partidos.findIndex(p=>p.id===partidoId);
    if(i<0) return;
    const p = partidos[i];
    partidos[i].goles_local = eventos.filter(e=>e.equipo_id===p.equipo_local_id).length;
    partidos[i].goles_visitante = eventos.filter(e=>e.equipo_id===p.equipo_visitante_id).length;
    localStorage.setItem("partidos",JSON.stringify(partidos));
  },

  // ── Estado de conexión ───────────────────────────────────────
  async ping() {
    if (!this.online) return { connected: false, mode: "offline" };
    try {
      const r = await fetch(`${this.gasUrl}?action=ping`);
      const j = await r.json();
      return { connected: true, mode: "online", ...j };
    } catch(e) {
      return { connected: false, mode: "offline", error: e.message };
    }
  },
};

if (typeof window !== "undefined") window.DB = DB;
