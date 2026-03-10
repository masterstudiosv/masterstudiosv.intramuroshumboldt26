/* ════════════════════════════════════════════════
   JUGADORES.JS — Gestión de Jugadores
════════════════════════════════════════════════ */
const Jugadores = {
  _filter: { equipo: '', cat: '' },

  render() {
    const cats = DB.getCategoriasActivas();
    let jugadores = DB.getJugadores().filter(j => j.estado === 'activo');
    if (this._filter.cat) {
      const eqs = DB.getEquiposByCategoria(this._filter.cat).map(e => e.id);
      jugadores = jugadores.filter(j => eqs.includes(j.equipoId));
    }
    if (this._filter.equipo) jugadores = jugadores.filter(j => j.equipoId === this._filter.equipo);
    const equiposOpts = this._filter.cat ? DB.getEquiposByCategoria(this._filter.cat) : DB.getEquipos();

    const html = `<div class="fade-in">
      <div class="section-header">
        <div><div class="section-title">JUGADORES</div><div class="section-sub">${jugadores.length} jugadores activos</div></div>
        ${Auth.isAdmin()?`<button class="btn btn-primary" onclick="Jugadores.formNuevo()">+ Registrar Jugador</button>`:''}
      </div>
      <div style="display:flex;gap:12px;margin-bottom:20px;flex-wrap:wrap">
        <select class="form-select" style="width:200px" onchange="Jugadores._filter.cat=this.value;Jugadores._filter.equipo='';Jugadores.render()">
          <option value="">Todas las categorías</option>
          ${cats.map(c=>`<option value="${c.id}" ${this._filter.cat===c.id?'selected':''}>${c.nombre}</option>`).join('')}
        </select>
        <select class="form-select" style="width:220px" onchange="Jugadores._filter.equipo=this.value;Jugadores.render()">
          <option value="">Todos los equipos</option>
          ${equiposOpts.map(e=>`<option value="${e.id}" ${this._filter.equipo===e.id?'selected':''}>${e.nombre}</option>`).join('')}
        </select>
      </div>
      <div class="card">
        <div class="table-wrap">
          <table class="data-table">
            <thead><tr><th>#</th><th>Jugador</th><th>Equipo</th><th>Pos</th><th>Edad</th><th>⚽</th><th>🟨</th><th>🟥</th><th>Acciones</th></tr></thead>
            <tbody>
              ${jugadores.map(j => {
                const eq = DB.getEquipo(j.equipoId);
                const foto = j.fotoUrl&&j.fotoUrl.startsWith('http')
                  ? `<img src="${j.fotoUrl}" style="width:32px;height:32px;border-radius:50%;object-fit:cover" onerror="this.style.display='none'"/>`
                  : `<div style="width:32px;height:32px;border-radius:50%;background:var(--black5);display:flex;align-items:center;justify-content:center;font-weight:700">${(j.nombre||'?')[0]}</div>`;
                return `<tr>
                  <td><span style="font-family:'Bebas Neue',cursive;font-size:18px;color:var(--yellow)">${j.numero}</span></td>
                  <td><div style="display:flex;align-items:center;gap:10px">${foto}<span style="font-weight:700">${j.nombre}</span></div></td>
                  <td style="color:var(--gray)">${eq?.nombre||'—'}</td>
                  <td>${j.posicion||'—'}</td>
                  <td>${j.edad}</td>
                  <td><b>${j.goles||0}</b></td>
                  <td>${j.amarillas||0}</td>
                  <td style="color:var(--red)">${j.rojas||0}</td>
                  <td>${Auth.isAdmin()?`<div style="display:flex;gap:4px">
                    <button class="btn btn-secondary btn-xs" onclick="Jugadores.formEditar('${j.id}')">✏️</button>
                    <button class="btn btn-danger btn-xs" onclick="Jugadores.eliminar('${j.id}')">🗑️</button>
                  </div>`:'—'}</td>
                </tr>`;
              }).join('') || '<tr><td colspan="9" style="text-align:center;padding:30px;color:var(--gray)">No hay jugadores</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    </div>`;
    document.getElementById('content-area').innerHTML = html;
  },

  formNuevo() { this._form(null); },
  formEditar(id) { this._form(DB.getJugador(id)); },

  _form(j) {
    const equipos = DB.getEquipos().filter(e => e.estado === 'activo');
    Modal.open(`
      <div class="modal-header"><span class="modal-title">${j?'EDITAR':'NUEVO'} JUGADOR</span><button class="modal-close" onclick="Modal.close()">✕</button></div>
      <div class="modal-body">
        <div class="form-grid">
          <div class="input-group form-full"><label>Equipo *</label>
            <select class="form-select" id="jug-equipo">
              <option value="">Seleccionar equipo...</option>
              ${equipos.map(e=>`<option value="${e.id}" ${j?.equipoId===e.id?'selected':''}>${e.nombre}</option>`).join('')}
            </select></div>
          <div class="input-group form-full"><label>Nombre Completo *</label>
            <input class="form-input" id="jug-nombre" value="${j?.nombre||''}" placeholder="Nombre del jugador..." /></div>
          <div class="input-group"><label>Número de Camiseta *</label>
            <input class="form-input" type="number" id="jug-numero" value="${j?.numero||''}" min="0" max="99" /></div>
          <div class="input-group"><label>Edad *</label>
            <input class="form-input" type="number" id="jug-edad" value="${j?.edad||''}" min="10" max="25" /></div>
          <div class="input-group"><label>Posición</label>
            <select class="form-select" id="jug-pos">
              ${['Portero','Defensa','Mediocampista','Delantero'].map(p=>`<option value="${p}" ${j?.posicion===p?'selected':''}>${p}</option>`).join('')}
            </select></div>
          <div class="input-group"><label>URL de Foto</label>
            <input class="form-input" id="jug-fotourl" placeholder="https://i.imgur.com/foto.jpg" value="${j?.fotoUrl||''}" oninput="Jugadores._preview(this.value)"/>
            <div id="jug-foto-wrap" style="margin-top:6px;display:${j?.fotoUrl&&j.fotoUrl.startsWith('http')?'block':'none'}">
              <img id="jug-foto-prev" src="${j?.fotoUrl||''}" style="height:60px;width:60px;border-radius:50%;object-fit:cover;border:2px solid var(--black4)" onerror="this.parentElement.style.display='none'"/>
            </div>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="Modal.close()">Cancelar</button>
        <button class="btn btn-primary" onclick="Jugadores.guardar('${j?.id||''}')">💾 Guardar Jugador</button>
      </div>`, 'modal-sm');
  },

  _preview(url) {
    const wrap = document.getElementById('jug-foto-wrap');
    const img  = document.getElementById('jug-foto-prev');
    if (url&&url.startsWith('http')) { if(img)img.src=url; if(wrap)wrap.style.display='block'; }
    else { if(wrap)wrap.style.display='none'; }
  },

  async guardar(id) {
    const equipoId = document.getElementById('jug-equipo').value;
    const nombre   = document.getElementById('jug-nombre').value.trim();
    const numero   = parseInt(document.getElementById('jug-numero').value);
    const edad     = parseInt(document.getElementById('jug-edad').value);
    const posicion = document.getElementById('jug-pos').value;
    const fotoUrl  = document.getElementById('jug-fotourl').value.trim();

    if (!equipoId) { Toast.error('Selecciona un equipo.'); return; }
    if (!nombre)   { Toast.error('El nombre es obligatorio.'); return; }
    if (isNaN(numero)||numero<0||numero>99) { Toast.error('Número de camiseta inválido (0-99).'); return; }
    if (isNaN(edad)||edad<10||edad>25) { Toast.error('Edad inválida (10-25).'); return; }

    const existentes = DB.getJugadoresByEquipo(equipoId).filter(j => j.id !== id);
    if (existentes.some(j => j.numero === numero)) {
      Toast.error(`El número ${numero} ya está en uso en este equipo.`); return;
    }
    if (!id && existentes.length >= (CONFIG.MAX_JUGADORES||20)) {
      Toast.error(`Un equipo puede tener máximo ${CONFIG.MAX_JUGADORES||20} jugadores.`); return;
    }

    try {
      await DB.saveJugador({ id:id||undefined, equipoId, nombre, numero, edad, posicion, fotoUrl,
        goles:0, amarillas:0, rojas:0, faltas:0, estado:'activo' });
      Toast.success(`Jugador ${id?'actualizado':'registrado'}.`);
      Modal.close(); this.render();
    } catch(e) { Toast.error('Error: '+e.message); }
  },

  eliminar(id) {
    const j = DB.getJugador(id);
    UI.confirmDialog(`¿Eliminar al jugador <b>${j?.nombre}</b>?`, async () => {
      try { await DB.deleteJugador(id); Toast.success('Jugador eliminado.'); Jugadores.render(); }
      catch(e) { Toast.error('Error: '+e.message); }
    });
  }
};
