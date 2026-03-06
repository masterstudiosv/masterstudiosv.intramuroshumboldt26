/* ════════════════════════════════════════════════
   ARBITROS.JS
════════════════════════════════════════════════ */
const Arbitros = {
  render() {
    const arbitros = DB.getArbitros();
    const html = `<div class="fade-in">
      <div class="section-header">
        <div><div class="section-title">ÁRBITROS</div><div class="section-sub">${arbitros.length} árbitros registrados</div></div>
        ${Auth.isAdmin()?`<button class="btn btn-primary" onclick="Arbitros.formNuevo()">+ Registrar Árbitro</button>`:''}
      </div>
      <div class="grid-3">
        ${arbitros.map(a => {
          const user = DB.getUsuario(a.usuarioId);
          const parts = DB.getPartidos().filter(p=>p.arbitroId===a.id);
          return `<div class="card">
            <div style="padding:20px;text-align:center">
              <div style="width:60px;height:60px;border-radius:50%;background:var(--yellow);color:var(--black);font-family:'Bebas Neue',cursive;font-size:28px;display:flex;align-items:center;justify-content:center;margin:0 auto 12px">${(a.nombre||'?')[0]}</div>
              <div style="font-family:'Bebas Neue',cursive;font-size:20px">${a.nombre}</div>
              <div style="font-size:12px;color:var(--gray);margin-top:4px">${a.telefono||'Sin teléfono'}</div>
              <div style="margin-top:8px">${UI.estadoBadge(a.estado)}</div>
              ${user?`<div style="font-size:12px;color:var(--gray);margin-top:6px">Usuario: @${user.usuario}</div>`:''}
            </div>
            <div style="padding:12px 20px;border-top:1px solid var(--black4);display:flex;align-items:center;justify-content:space-between">
              <span style="font-size:13px;color:var(--gray)">📅 ${parts.length} partidos</span>
              ${Auth.isAdmin()?`<div style="display:flex;gap:6px">
                <button class="btn btn-secondary btn-xs" onclick="Arbitros.formEditar('${a.id}')">✏️</button>
                <button class="btn btn-danger btn-xs" onclick="Arbitros.eliminar('${a.id}')">🗑️</button>
              </div>`:''}
            </div>
          </div>`;
        }).join('') || '<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">🟨</div><div class="empty-title">Sin árbitros</div></div>'}
      </div>
    </div>`;
    document.getElementById('content-area').innerHTML = html;
  },

  formNuevo() { this._form(null); },
  formEditar(id) { this._form(DB.getArbitro(id)); },

  _form(a) {
    const usuarios = DB.getUsuarios().filter(u => u.rol === 'arbitro');
    Modal.open(`
      <div class="modal-header"><span class="modal-title">${a?'EDITAR':'NUEVO'} ÁRBITRO</span><button class="modal-close" onclick="Modal.close()">✕</button></div>
      <div class="modal-body">
        <div class="input-group"><label>Nombre Completo *</label><input class="form-input" id="arb-nombre" value="${a?.nombre||''}" placeholder="Nombre del árbitro..." /></div>
        <div class="input-group"><label>Teléfono</label><input class="form-input" id="arb-tel" value="${a?.telefono||''}" placeholder="555-0000" /></div>
        <div class="input-group"><label>Usuario del Sistema (opcional)</label>
          <select class="form-select" id="arb-usuario">
            <option value="">Sin usuario vinculado</option>
            ${usuarios.map(u=>`<option value="${u.id}" ${a?.usuarioId===u.id?'selected':''}>${u.nombre} (@${u.usuario})</option>`).join('')}
          </select></div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="Modal.close()">Cancelar</button>
        <button class="btn btn-primary" onclick="Arbitros.guardar('${a?.id||''}')">💾 Guardar</button>
      </div>`, 'modal-sm');
  },

  async guardar(id) {
    const nombre = document.getElementById('arb-nombre').value.trim();
    const tel    = document.getElementById('arb-tel').value.trim();
    const userId = document.getElementById('arb-usuario').value;
    if (!nombre) { Toast.error('El nombre es obligatorio.'); return; }
    try {
      await DB.saveArbitro({ id:id||undefined, nombre, telefono:tel, usuarioId:userId, estado:'activo' });
      Toast.success(`Árbitro ${id?'actualizado':'registrado'}.`);
      Modal.close(); this.render();
    } catch(e) { Toast.error('Error: '+e.message); }
  },

  eliminar(id) {
    const a = DB.getArbitro(id);
    UI.confirmDialog(`¿Eliminar árbitro <b>${a?.nombre}</b>?`, async () => {
      try { await DB.deleteArbitro(id); Toast.success('Árbitro eliminado.'); Arbitros.render(); }
      catch(e) { Toast.error('Error: '+e.message); }
    });
  }
};

/* ════════════════════════════════════════════════
   USUARIOS.JS
════════════════════════════════════════════════ */
const Usuarios = {
  render() {
    const usuarios = DB.getUsuarios();
    const html = `<div class="fade-in">
      <div class="section-header">
        <div><div class="section-title">USUARIOS</div><div class="section-sub">${usuarios.length} usuarios</div></div>
        ${Auth.isAdmin()?`<button class="btn btn-primary" onclick="Usuarios.formNuevo()">+ Nuevo Usuario</button>`:''}
      </div>
      <div class="card">
        <div class="table-wrap">
          <table class="data-table">
            <thead><tr><th>Usuario</th><th>Nombre</th><th>Rol</th><th>Estado</th><th>Acciones</th></tr></thead>
            <tbody>
              ${usuarios.map(u => {
                const roleLabels = { admin:'👑 Admin', arbitro:'🟨 Árbitro', viewer:'👁️ Espectador' };
                return `<tr>
                  <td><span style="font-family:'Bebas Neue',cursive;font-size:16px">@${u.usuario}</span></td>
                  <td>${u.nombre}</td>
                  <td><span class="badge ${u.rol==='admin'?'badge-red':u.rol==='arbitro'?'badge-yellow':'badge-gray'}">${roleLabels[u.rol]||u.rol}</span></td>
                  <td>${UI.estadoBadge(u.estado)}</td>
                  <td><div style="display:flex;gap:6px">
                    ${Auth.isAdmin()?`<button class="btn btn-secondary btn-xs" onclick="Usuarios.formEditar('${u.id}')">✏️</button>`:''}
                    ${Auth.isAdmin()&&u.id !== Auth.getSession()?.id ? `<button class="btn btn-danger btn-xs" onclick="Usuarios.eliminar('${u.id}')">🗑️</button>` : ''}
                  </div></td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>`;
    document.getElementById('content-area').innerHTML = html;
  },

  formNuevo() { this._form(null); },
  formEditar(id) { this._form(DB.getUsuario(id)); },

  _form(u) {
    Modal.open(`
      <div class="modal-header"><span class="modal-title">${u?'EDITAR':'NUEVO'} USUARIO</span><button class="modal-close" onclick="Modal.close()">✕</button></div>
      <div class="modal-body">
        <div class="form-grid">
          <div class="input-group"><label>Usuario *</label><input class="form-input" id="usr-user" value="${u?.usuario||''}" placeholder="nombre_usuario" /></div>
          <div class="input-group"><label>Nombre Completo *</label><input class="form-input" id="usr-nombre" value="${u?.nombre||''}" placeholder="Nombre y apellidos" /></div>
          <div class="input-group"><label>Contraseña ${u?'(vacío = no cambiar)':' *'}</label><input class="form-input" type="password" id="usr-pass" placeholder="••••••••" /></div>
          <div class="input-group"><label>Rol *</label>
            <select class="form-select" id="usr-rol">
              <option value="viewer" ${u?.rol==='viewer'?'selected':''}>👁️ Espectador</option>
              <option value="arbitro" ${u?.rol==='arbitro'?'selected':''}>🟨 Árbitro</option>
              <option value="admin" ${u?.rol==='admin'?'selected':''}>👑 Administrador</option>
            </select></div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="Modal.close()">Cancelar</button>
        <button class="btn btn-primary" onclick="Usuarios.guardar('${u?.id||''}')">💾 Guardar</button>
      </div>`, 'modal-sm');
  },

  async guardar(id) {
    const usuario = document.getElementById('usr-user').value.trim();
    const nombre  = document.getElementById('usr-nombre').value.trim();
    const pass    = document.getElementById('usr-pass').value;
    const rol     = document.getElementById('usr-rol').value;
    if (!usuario||!nombre) { Toast.error('Usuario y nombre son obligatorios.'); return; }
    if (!id && !pass) { Toast.error('La contraseña es obligatoria para nuevos usuarios.'); return; }
    const existing = DB.getUsuarios().find(u => u.usuario === usuario && u.id !== id);
    if (existing) { Toast.error('Ese nombre de usuario ya está en uso.'); return; }
    const data = { id:id||undefined, usuario, nombre, rol, estado:'activo' };
    if (pass) data.password = pass;
    try {
      await DB.saveUsuario(data);
      Toast.success(`Usuario ${id?'actualizado':'creado'}.`);
      Modal.close(); this.render();
    } catch(e) { Toast.error('Error: '+e.message); }
  },

  eliminar(id) {
    const u = DB.getUsuario(id);
    UI.confirmDialog(`¿Eliminar usuario <b>@${u?.usuario}</b>?`, async () => {
      try { await DB.deleteUsuario(id); Toast.success('Usuario eliminado.'); Usuarios.render(); }
      catch(e) { Toast.error('Error: '+e.message); }
    });
  }
};

/* ════════════════════════════════════════════════
   ESTADISTICAS.JS
════════════════════════════════════════════════ */
const Estadisticas = {
  _tab: 'tabla',

  render() {
    const cats = DB.getCategorias();
    const goleadores = DB.getGoleadores ? DB.getGoleadores() : DB.getJugadores().sort((a,b)=>(b.goles||0)-(a.goles||0));
    const stats = DB.getStatsGenerales ? DB.getStatsGenerales() : this._calcStats();

    const html = `<div class="fade-in">
      <div class="section-header">
        <div><div class="section-title">ESTADÍSTICAS</div><div class="section-sub">Temporada 2026</div></div>
      </div>
      <div class="grid-stats" style="margin-bottom:24px">
        ${[['⚽',stats.totalGoles||0,'Goles','var(--yellow)'],
           ['🟨',stats.totalAmarillas||0,'Amarillas','var(--yellow)'],
           ['🟥',stats.totalRojas||0,'Rojas','var(--red)'],
           ['🏆',stats.finalizados||0,'Partidos Jugados','var(--white)'],
           ['👤',stats.totalJugadores||0,'Jugadores','var(--white)'],
           ['🛡️',stats.totalEquipos||0,'Equipos','var(--white)']
        ].map(([icon,val,lbl,color])=>`<div class="stat-card">
          <div class="stat-card-accent" style="background:${color}"></div>
          <div class="stat-card-icon">${icon}</div>
          <div class="stat-num" style="color:${color}">${val}</div>
          <div class="stat-lbl">${lbl}</div>
        </div>`).join('')}
      </div>
      <div class="tab-bar">
        ${[['tabla','📋 Tabla de Posiciones'],['goleadores','🥅 Goleadores'],['disciplina','🟨 Disciplina']].map(
          ([id,lbl])=>`<button class="tab-btn ${this._tab===id?'active':''}" onclick="Estadisticas._tab='${id}';Estadisticas.render()">${lbl}</button>`
        ).join('')}
      </div>
      ${this._tab === 'tabla' ? this._renderTabla(cats) : ''}
      ${this._tab === 'goleadores' ? this._renderGoleadores(goleadores) : ''}
      ${this._tab === 'disciplina' ? this._renderDisciplina() : ''}
    </div>`;
    document.getElementById('content-area').innerHTML = html;
  },

  _calcStats() {
    const partidos = DB.getPartidos();
    const jugadores = DB.getJugadores();
    return {
      totalGoles: jugadores.reduce((s,j)=>s+(j.goles||0),0),
      totalAmarillas: jugadores.reduce((s,j)=>s+(j.amarillas||0),0),
      totalRojas: jugadores.reduce((s,j)=>s+(j.rojas||0),0),
      finalizados: partidos.filter(p=>p.estado==='finalizado').length,
      totalJugadores: jugadores.length,
      totalEquipos: DB.getEquipos().length
    };
  },

  _renderTabla(cats) {
    return cats.map(cat => {
      const tabla = DB.getTablaPosiciones ? DB.getTablaPosiciones(cat.id) : this._calcTabla(cat.id);
      if (!tabla.length) return '';
      return `<div style="margin-bottom:24px">
        <div style="font-family:'Bebas Neue',cursive;font-size:20px;margin-bottom:12px;color:var(--yellow)">${cat.nombre}</div>
        <div class="card"><div class="table-wrap"><table class="data-table">
          <thead><tr><th>#</th><th>Equipo</th><th>PJ</th><th>PG</th><th>PE</th><th>PP</th><th>GF</th><th>GC</th><th>DG</th><th>PTS</th></tr></thead>
          <tbody>
            ${tabla.map((e,i) => `<tr>
              <td><span class="rank-num ${i===0?'rank-1':i===1?'rank-2':i===2?'rank-3':''}">${i+1}</span></td>
              <td><div style="display:flex;align-items:center;gap:10px">
                <div style="width:28px;height:28px;background:var(--black5);border-radius:4px;display:flex;align-items:center;justify-content:center">🛡️</div>
                <div><div style="font-weight:700">${e.nombre}</div><div style="font-size:11px;color:var(--gray)">${e.seccion}</div></div>
              </div></td>
              <td>${e.pj}</td><td>${e.pg}</td><td>${e.pe}</td><td>${e.pp}</td>
              <td>${e.gf}</td><td>${e.gc}</td>
              <td style="color:${e.dg>=0?'var(--success)':'var(--red)'}">${e.dg>0?'+':''}${e.dg}</td>
              <td><span style="font-family:'Bebas Neue',cursive;font-size:20px;color:var(--yellow)">${e.pts}</span></td>
            </tr>`).join('')}
          </tbody>
        </table></div></div>
      </div>`;
    }).join('');
  },

  _calcTabla(catId) {
    const equipos = DB.getEquiposByCategoria(catId);
    return equipos.map(eq => {
      const parts = DB.getPartidos().filter(p => (p.localId===eq.id||p.visitanteId===eq.id) && p.estado==='finalizado');
      let pg=0,pe=0,pp=0,gf=0,gc=0;
      parts.forEach(p => {
        const l=p.localId===eq.id;
        gf+=l?p.golesLocal:p.golesVisitante; gc+=l?p.golesVisitante:p.golesLocal;
        const gm=l?p.golesLocal:p.golesVisitante, gco=l?p.golesVisitante:p.golesLocal;
        if(gm>gco)pg++; else if(gm===gco)pe++; else pp++;
      });
      return { ...eq, pj:parts.length, pg, pe, pp, gf, gc, dg:gf-gc, pts:pg*3+pe };
    }).sort((a,b)=>b.pts-a.pts||b.dg-a.dg||b.gf-a.gf);
  },

  _renderGoleadores(goleadores) {
    return `<div class="card"><div class="table-wrap"><table class="data-table">
      <thead><tr><th>#</th><th>Jugador</th><th>Equipo</th><th>Categoría</th><th>⚽</th><th>🟨</th><th>🟥</th></tr></thead>
      <tbody>
        ${goleadores.filter(j=>(j.goles||0)>0).map((j,i) => {
          const eq = DB.getEquipo(j.equipoId);
          const cat = DB.getCategoria(eq?.categoriaId);
          return `<tr>
            <td><span class="rank-num ${i===0?'rank-1':i===1?'rank-2':i===2?'rank-3':''}">${i+1}</span></td>
            <td><div style="display:flex;align-items:center;gap:10px">
              <div style="width:32px;height:32px;border-radius:50%;background:var(--black5);display:flex;align-items:center;justify-content:center;font-weight:700">${(j.nombre||'?')[0]}</div>
              <div><div style="font-weight:700">${j.nombre}</div><div style="font-size:11px;color:var(--gray)">#${j.numero} · ${j.posicion||'—'}</div></div>
            </div></td>
            <td>${eq?.nombre||'—'}</td><td>${cat?.nombre||'—'}</td>
            <td><span style="font-family:'Bebas Neue',cursive;font-size:22px;color:var(--yellow)">${j.goles||0}</span></td>
            <td>${j.amarillas||0}</td>
            <td style="color:var(--red)">${j.rojas||0}</td>
          </tr>`;
        }).join('') || '<tr><td colspan="7" style="text-align:center;padding:30px;color:var(--gray)">Sin goles registrados</td></tr>'}
      </tbody>
    </table></div></div>`;
  },

  _renderDisciplina() {
    const jugadores = DB.getJugadores()
      .filter(j => (j.amarillas||0) > 0 || (j.rojas||0) > 0)
      .sort((a,b) => ((b.rojas||0)*3+(b.amarillas||0)) - ((a.rojas||0)*3+(a.amarillas||0)));
    return `<div class="card"><div class="table-wrap"><table class="data-table">
      <thead><tr><th>#</th><th>Jugador</th><th>Equipo</th><th>🟨</th><th>🟥</th><th>🚩</th><th>Pts</th></tr></thead>
      <tbody>
        ${jugadores.map((j,i) => {
          const eq = DB.getEquipo(j.equipoId);
          const pts = (j.rojas||0)*3+(j.amarillas||0);
          return `<tr>
            <td>${i+1}</td>
            <td><span style="font-weight:700">${j.nombre}</span></td>
            <td style="color:var(--gray)">${eq?.nombre||'—'}</td>
            <td><span style="font-family:'Bebas Neue',cursive;font-size:20px;color:var(--yellow)">${j.amarillas||0}</span></td>
            <td><span style="font-family:'Bebas Neue',cursive;font-size:20px;color:var(--red)">${j.rojas||0}</span></td>
            <td>${j.faltas||0}</td>
            <td><span class="badge ${pts>=5?'badge-red':pts>=3?'badge-yellow':'badge-gray'}">${pts}</span></td>
          </tr>`;
        }).join('') || '<tr><td colspan="7" style="text-align:center;padding:30px;color:var(--gray)">Sin registros</td></tr>'}
      </tbody>
    </table></div></div>`;
  }
};
