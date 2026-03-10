/* ════════════════════════════════════════════════
   PARTIDOS.JS — Gestión de Partidos
════════════════════════════════════════════════ */
const Partidos = {
  _filter: { cat: '', estado: '' },

  render() {
    const cats = DB.getCategorias();
    let partidos = DB.getPartidos();
    if (this._filter.cat) partidos = partidos.filter(p => p.categoriaId === this._filter.cat);
    if (this._filter.estado) partidos = partidos.filter(p => p.estado === this._filter.estado);
    const order = { en_juego:0, pausado:1, programado:2, pendiente:3, finalizado:4 };
    partidos.sort((a,b) => (order[a.estado]||5)-(order[b.estado]||5) || (a.fecha||'z').localeCompare(b.fecha||'z'));

    const html = `<div class="fade-in">
      <div class="section-header">
        <div><div class="section-title">PARTIDOS</div><div class="section-sub">${partidos.length} partidos</div></div>
        ${Auth.isAdmin()?`<button class="btn btn-primary" onclick="Partidos.formNuevo()">+ Crear Partido</button>`:''}
      </div>
      <div style="display:flex;gap:12px;margin-bottom:20px;flex-wrap:wrap">
        <select class="form-select" style="width:200px" onchange="Partidos._filter.cat=this.value;Partidos.render()">
          <option value="">Todas las categorías</option>
          ${cats.map(c=>`<option value="${c.id}" ${this._filter.cat===c.id?'selected':''}>${c.nombre}</option>`).join('')}
        </select>
        <select class="form-select" style="width:170px" onchange="Partidos._filter.estado=this.value;Partidos.render()">
          <option value="">Todos los estados</option>
          ${['en_juego','pausado','programado','pendiente','finalizado'].map(e=>`<option value="${e}" ${this._filter.estado===e?'selected':''}>${e.replace('_',' ').toUpperCase()}</option>`).join('')}
        </select>
      </div>
      <div>
        ${partidos.length ? this._groupBySerie(partidos) : '<div class="empty-state"><div class="empty-icon">⚽</div><div class="empty-title">No hay partidos</div><div class="empty-sub">Crea el primer partido del torneo</div></div>'}
      </div>
    </div>`;
    document.getElementById('content-area').innerHTML = html;
  },

  _groupBySerie(partidos) {
    const rendered = new Set(); let html = '';
    partidos.forEach(p => {
      if (p.serieId && !rendered.has(p.serieId)) {
        rendered.add(p.serieId);
        html += this._serieBlock(DB.getPartidosBySerie(p.serieId));
      } else if (!p.serieId) { html += this._matchCard(p); }
    });
    return html;
  },

  _serieBlock(partidos) {
    const global = DB.getMarcadorGlobal ? DB.getMarcadorGlobal(partidos[0]?.serieId) : null;
    const eqA = global ? DB.getEquipo(global.equipoA) : null;
    const eqB = global ? DB.getEquipo(global.equipoB) : null;
    let globalHtml = '';
    if (global) {
      globalHtml = `<div style="background:rgba(255,215,0,0.06);border:1px solid rgba(255,215,0,0.2);border-radius:8px;padding:10px 16px;margin-bottom:10px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">
        <div style="font-size:13px;color:var(--gray);letter-spacing:1px">⟳ GLOBAL · SERIE IDA Y VUELTA</div>
        <div style="font-family:'Bebas Neue',cursive;font-size:20px">
          <span style="color:${global.golesA>global.golesB?'var(--yellow)':'var(--white)'}">${eqA?.nombre||'—'}</span>
          <span style="color:var(--yellow);margin:0 10px">${global.golesA} – ${global.golesB}</span>
          <span style="color:${global.golesB>global.golesA?'var(--yellow)':'var(--white)'}">${eqB?.nombre||'—'}</span>
        </div>
      </div>`;
    }
    return `<div style="border:1px solid rgba(255,215,0,0.15);border-radius:12px;padding:14px;margin-bottom:16px;background:rgba(255,215,0,0.02)">
      ${globalHtml}${partidos.map(p => this._matchCard(p, true)).join('')}
    </div>`;
  },

  _matchCard(p, inSerie = false) {
    const local = DB.getEquipo(p.localId);
    const visit = DB.getEquipo(p.visitanteId);
    const arb   = DB.getArbitro(p.arbitroId);
    const cat   = DB.getCategoria(p.categoriaId);
    const isLive = p.estado === 'en_juego', isPaused = p.estado === 'pausado';
    const serieTag = p.totalEnSerie > 1
      ? `<span class="series-tag">PARTIDO ${p.numEnSerie}/${p.totalEnSerie} · ${p.numEnSerie===1?'IDA':'VUELTA'}</span>` : '';
    const eventos = DB.getEventosByPartido(p.id).filter(e => e.tipo === 'gol');
    const golesL = eventos.filter(e=>e.equipoId===p.localId).map(e=>`${DB.getJugador(e.jugadorId)?.nombre||'?'} ${e.minuto}'`).join(', ');
    const golesV = eventos.filter(e=>e.equipoId===p.visitanteId).map(e=>`${DB.getJugador(e.jugadorId)?.nombre||'?'} ${e.minuto}'`).join(', ');

    // Botones de acción
    const adminBtns = Auth.isAdmin() ? `
      <button class="btn btn-secondary btn-sm" onclick="Partidos.formEditar('${p.id}')">✏️ Editar</button>
      ${p.estado !== 'finalizado' ? `<button class="btn btn-primary btn-sm" onclick="Partidos.subirResultado('${p.id}')">📊 Subir Resultado</button>` : ''}
      ${p.estado === 'finalizado' ? `<button class="btn btn-secondary btn-sm" onclick="Partidos.editarResultado('${p.id}')">✏️ Resultado</button>` : ''}
      <button class="btn btn-danger btn-sm" onclick="Partidos.eliminar('${p.id}')">🗑️</button>` : '';

    const arbBtns = Auth.isArbitro() && ['programado','en_juego','pausado'].includes(p.estado)
      ? `<button class="btn btn-primary btn-sm" onclick="LiveMatch.open('${p.id}')">⚽ ${isLive||isPaused?'Control':'Iniciar'}</button>` : '';

    return `<div class="match-card ${isLive?'live':''}" style="margin-bottom:${inSerie?'8':'12'}px">
      <div class="match-header">
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
          ${UI.estadoBadge(p.estado)}${serieTag}
          <span style="font-size:12px;color:var(--gray)">${cat?.nombre||'—'}</span>
        </div>
        <span style="font-size:12px;color:var(--gray)">${p.fecha ? UI.formatDate(p.fecha)+' · '+UI.formatHora(p.hora) : 'Fecha pendiente'}</span>
      </div>
      <div class="match-body">
        <div class="match-team">
          <div class="team-shield">🛡️</div>
          <div><div class="team-name">${local?.nombre||'—'}</div><div style="font-size:11px;color:var(--gray)">${golesL}</div></div>
        </div>
        <div class="match-score">
          <div class="score-nums">${p.estado==='pendiente'?'vs':`${p.golesLocal} – ${p.golesVisitante}`}</div>
          <div style="font-size:11px;color:var(--gray)">${isLive||isPaused?`⏱ ${p.minutoActual}'`:p.estado==='finalizado'?'FIN':'—'}</div>
        </div>
        <div class="match-team right">
          <div style="text-align:right"><div class="team-name">${visit?.nombre||'—'}</div><div style="font-size:11px;color:var(--gray)">${golesV}</div></div>
          <div class="team-shield">🛡️</div>
        </div>
      </div>
      <div class="match-footer">
        <span style="font-size:12px;color:var(--gray)">🟨 ${arb?.nombre||'Sin árbitro'}</span>
        <div style="display:flex;gap:6px;flex-wrap:wrap">
          <button class="btn btn-secondary btn-sm" onclick="Partidos.verDetalle('${p.id}')">👁️ Detalle</button>
          ${adminBtns}${arbBtns}
        </div>
      </div>
    </div>`;
  },

  verDetalle(id) {
    const p = DB.getPartido(id); if (!p) return;
    const local = DB.getEquipo(p.localId), visit = DB.getEquipo(p.visitanteId);
    const arb = DB.getArbitro(p.arbitroId), cat = DB.getCategoria(p.categoriaId);
    const eventos = DB.getEventosByPartido(id);
    const icons = { gol:'⚽', amarilla:'🟨', roja:'🟥', falta:'🚩', cambio_sale:'↕️', cambio_entra:'↕️' };
    Modal.open(`
      <div class="modal-header"><span class="modal-title">DETALLE DEL PARTIDO</span><button class="modal-close" onclick="Modal.close()">✕</button></div>
      <div class="modal-body">
        <div style="background:var(--black4);border-radius:10px;padding:20px;text-align:center;margin-bottom:20px">
          <div style="font-size:12px;color:var(--gray);letter-spacing:2px;margin-bottom:10px">${cat?.nombre||'—'} · ${p.fecha?UI.formatDate(p.fecha)+' '+UI.formatHora(p.hora):'Fecha pendiente'}</div>
          <div style="display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:16px">
            <div><div style="font-family:'Bebas Neue',cursive;font-size:22px">${local?.nombre||'—'}</div></div>
            <div style="padding:10px 20px;background:var(--black);border-radius:8px">
              <div style="font-family:'Bebas Neue',cursive;font-size:40px;line-height:1">${p.estado==='pendiente'?'vs':`${p.golesLocal} – ${p.golesVisitante}`}</div>
              <div style="text-align:center">${UI.estadoBadge(p.estado)}</div>
            </div>
            <div><div style="font-family:'Bebas Neue',cursive;font-size:22px">${visit?.nombre||'—'}</div></div>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px">
          <div style="background:var(--black4);border-radius:8px;padding:12px">
            <div style="font-size:11px;color:var(--gray);letter-spacing:1px">ÁRBITRO</div>
            <div style="font-weight:700">${arb?.nombre||'No asignado'}</div>
          </div>
          <div style="background:var(--black4);border-radius:8px;padding:12px">
            <div style="font-size:11px;color:var(--gray);letter-spacing:1px">MINUTO</div>
            <div style="font-family:'Bebas Neue',cursive;font-size:22px">${p.minutoActual||0}'</div>
          </div>
        </div>
        <div class="divider-label">EVENTOS DEL PARTIDO</div>
        <div style="max-height:250px;overflow-y:auto">
          ${eventos.length ? eventos.map(e => {
            const j = DB.getJugador(e.jugadorId);
            return `<div class="event-item">
              <div class="event-min">${e.minuto}'</div>
              <div class="event-icon">${icons[e.tipo]||'•'}</div>
              <div class="event-desc"><div style="font-weight:600">${e.descripcion}</div><div class="event-team">${DB.getEquipo(e.equipoId)?.nombre||'—'}</div></div>
            </div>`;
          }).join('') : '<div style="color:var(--gray);text-align:center;padding:20px">Sin eventos</div>'}
        </div>
        ${p.notas?`<div style="margin-top:12px;background:var(--black4);border-radius:8px;padding:12px;font-size:13px;color:var(--gray)">📝 ${p.notas}</div>`:''}
      </div>`, 'modal-lg');
  },

  formNuevo() { this._form(null); },
  formEditar(id) { this._form(DB.getPartido(id)); },

  _form(p) {
    const cats = DB.getCategoriasActivas();
    const arbitros = DB.getArbitros().filter(a=>a.estado==='activo');
    const equipos  = DB.getEquipos().filter(e=>e.estado==='activo');
    Modal.open(`
      <div class="modal-header"><span class="modal-title">${p?'EDITAR':'NUEVO'} PARTIDO</span><button class="modal-close" onclick="Modal.close()">✕</button></div>
      <div class="modal-body">
        ${!p?`<div style="background:rgba(255,215,0,0.06);border:1px solid rgba(255,215,0,0.2);border-radius:8px;padding:14px;margin-bottom:16px">
          <div style="font-weight:700;margin-bottom:8px">Tipo de enfrentamiento</div>
          <div style="display:flex;gap:12px">
            <label style="cursor:pointer"><input type="radio" name="tipo-partido" value="unico" id="tipo-unico" checked onchange="Partidos._onTipoChange()"> Partido único</label>
            <label style="cursor:pointer"><input type="radio" name="tipo-partido" value="serie" id="tipo-serie" onchange="Partidos._onTipoChange()"> Ida y vuelta</label>
          </div>
          <div id="serie-info" class="hidden" style="margin-top:8px;font-size:13px;color:var(--yellow)">⟳ Se crearán 2 partidos vinculados automáticamente</div>
        </div>`:''}
        <div class="form-grid">
          <div class="input-group form-full"><label>Categoría *</label>
            <select class="form-select" id="p-cat" onchange="Partidos._loadEquipos()">
              <option value="">Seleccionar...</option>
              ${cats.map(c=>`<option value="${c.id}" ${p?.categoriaId===c.id?'selected':''}>${c.nombre}</option>`).join('')}
            </select></div>
          <div class="input-group"><label>Equipo Local *</label>
            <select class="form-select" id="p-local">
              <option value="">Seleccionar...</option>
              ${equipos.map(e=>`<option value="${e.id}" ${p?.localId===e.id?'selected':''}>${e.nombre}</option>`).join('')}
            </select></div>
          <div class="input-group"><label>Equipo Visitante *</label>
            <select class="form-select" id="p-visit">
              <option value="">Seleccionar...</option>
              ${equipos.map(e=>`<option value="${e.id}" ${p?.visitanteId===e.id?'selected':''}>${e.nombre}</option>`).join('')}
            </select></div>
          <div class="input-group form-full"><label>Árbitro</label>
            <select class="form-select" id="p-arb">
              <option value="">Sin árbitro</option>
              ${arbitros.map(a=>`<option value="${a.id}" ${p?.arbitroId===a.id?'selected':''}>${a.nombre}</option>`).join('')}
            </select></div>
          <div class="input-group"><label>Fecha</label>
            <input class="form-input" type="date" id="p-fecha" value="${p?.fecha||''}" /></div>
          <div class="input-group"><label>Hora</label>
            <input class="form-input" type="time" id="p-hora" value="${p?.hora||''}" /></div>
          <div class="input-group form-full"><label>Notas</label>
            <input class="form-input" id="p-notas" value="${p?.notas||''}" placeholder="Observaciones..." /></div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="Modal.close()">Cancelar</button>
        <button class="btn btn-primary" onclick="Partidos.guardar('${p?.id||''}')">💾 Guardar</button>
      </div>`);
  },

  _onTipoChange() {
    const isSerie = document.getElementById('tipo-serie')?.checked;
    document.getElementById('serie-info')?.classList.toggle('hidden', !isSerie);
  },

  _loadEquipos() {
    const catId = document.getElementById('p-cat').value;
    const equipos = catId ? DB.getEquiposByCategoria(catId) : DB.getEquipos().filter(e=>e.estado==='activo');
    const opts = `<option value="">Seleccionar...</option>${equipos.map(e=>`<option value="${e.id}">${e.nombre}</option>`).join('')}`;
    document.getElementById('p-local').innerHTML = opts;
    document.getElementById('p-visit').innerHTML = opts;
  },

  async guardar(id) {
    const catId   = document.getElementById('p-cat').value;
    const localId = document.getElementById('p-local').value;
    const visitId = document.getElementById('p-visit').value;
    const arbId   = document.getElementById('p-arb').value;
    const fecha   = document.getElementById('p-fecha').value;
    const hora    = document.getElementById('p-hora').value;
    const notas   = document.getElementById('p-notas').value.trim();

    if (!catId||!localId||!visitId) { Toast.error('Categoría, equipo local y visitante son obligatorios.'); return; }
    if (localId === visitId) { Toast.error('El equipo local y visitante deben ser diferentes.'); return; }

    const isSerie = !id && document.getElementById('tipo-serie')?.checked;
    const estado  = fecha ? 'programado' : 'pendiente';

    try {
      if (isSerie) {
        const serieId = 'S' + Date.now();
        await DB.savePartido({ serieId, numEnSerie:1, totalEnSerie:2, categoriaId:catId, localId, visitanteId:visitId, arbitroId:arbId, fecha, hora, estado, notas:'Partido Ida', golesLocal:0, golesVisitante:0, minutoActual:0 });
        await DB.savePartido({ serieId, numEnSerie:2, totalEnSerie:2, categoriaId:catId, localId:visitId, visitanteId:localId, arbitroId:arbId, fecha:'', hora:'', estado:'pendiente', notas:'Partido Vuelta', golesLocal:0, golesVisitante:0, minutoActual:0 });
        Toast.success('Serie de ida y vuelta creada. 2 partidos registrados.');
      } else {
        await DB.savePartido({ id:id||undefined, serieId:'', numEnSerie:1, totalEnSerie:1, categoriaId:catId, localId, visitanteId:visitId, arbitroId:arbId, fecha, hora, estado, notas, golesLocal:0, golesVisitante:0, minutoActual:0 });
        Toast.success(`Partido ${id?'actualizado':'creado'}.`);
      }
      Modal.close(); this.render();
    } catch(e) { Toast.error('Error: '+e.message); }
  },

  // Subir resultado sin jugar en vivo (admin)
  subirResultado(id) {
    const p = DB.getPartido(id);
    const local = DB.getEquipo(p.localId), visit = DB.getEquipo(p.visitanteId);
    Modal.open(`
      <div class="modal-header"><span class="modal-title">📊 SUBIR RESULTADO</span><button class="modal-close" onclick="Modal.close()">✕</button></div>
      <div class="modal-body">
        <div style="text-align:center;margin-bottom:16px">
          <div style="font-size:13px;color:var(--gray)">Ingresa el resultado final del partido</div>
          <div style="font-family:'Bebas Neue',cursive;font-size:18px;margin-top:6px">${local?.nombre||'—'} vs ${visit?.nombre||'—'}</div>
        </div>
        <div style="display:grid;grid-template-columns:1fr auto 1fr;gap:12px;align-items:center;margin-bottom:16px">
          <div class="input-group"><label style="text-align:center">${local?.nombre||'Local'}</label>
            <input class="form-input" type="number" id="res-local" value="${p.golesLocal||0}" min="0" style="font-family:'Bebas Neue',cursive;font-size:32px;text-align:center;padding:12px" /></div>
          <div style="font-family:'Bebas Neue',cursive;font-size:28px;margin-top:22px;color:var(--gray)">—</div>
          <div class="input-group"><label style="text-align:center">${visit?.nombre||'Visitante'}</label>
            <input class="form-input" type="number" id="res-visit" value="${p.golesVisitante||0}" min="0" style="font-family:'Bebas Neue',cursive;font-size:32px;text-align:center;padding:12px" /></div>
        </div>
        <div class="input-group"><label>Minutos jugados</label>
          <input class="form-input" type="number" id="res-minuto" value="${p.minutoActual||40}" min="1" max="120" /></div>
        <div class="input-group"><label>Notas del partido</label>
          <input class="form-input" id="res-notas" value="${p.notas||''}" placeholder="Observaciones opcionales..." /></div>
        <div style="background:rgba(255,215,0,0.06);border:1px solid rgba(255,215,0,0.2);border-radius:8px;padding:12px;font-size:13px;color:var(--gray);margin-top:8px">
          ⚠️ El partido quedará marcado como <strong style="color:var(--white)">FINALIZADO</strong>. Para registrar goles y eventos individuales, usa el control en vivo.
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="Modal.close()">Cancelar</button>
        <button class="btn btn-primary" onclick="Partidos.guardarResultadoFinal('${id}')">✅ Finalizar Partido</button>
      </div>`, 'modal-sm');
  },

  async guardarResultadoFinal(id) {
    const gl = parseInt(document.getElementById('res-local').value)||0;
    const gv = parseInt(document.getElementById('res-visit').value)||0;
    const min = parseInt(document.getElementById('res-minuto').value)||40;
    const notas = document.getElementById('res-notas').value.trim();
    try {
      await DB.updatePartido(id, { golesLocal:gl, golesVisitante:gv, minutoActual:min, notas, estado:'finalizado', fechaHoraFin:new Date().toISOString() });
      Toast.success('Resultado guardado. Partido finalizado.');
      Modal.close(); this.render();
    } catch(e) { Toast.error('Error: '+e.message); }
  },

  editarResultado(id) {
    const p = DB.getPartido(id);
    const local = DB.getEquipo(p.localId), visit = DB.getEquipo(p.visitanteId);
    Modal.open(`
      <div class="modal-header"><span class="modal-title">EDITAR RESULTADO</span><button class="modal-close" onclick="Modal.close()">✕</button></div>
      <div class="modal-body">
        <div style="display:grid;grid-template-columns:1fr auto 1fr;gap:12px;align-items:center">
          <div class="input-group"><label>${local?.nombre||'Local'}</label>
            <input class="form-input" type="number" id="res-local" value="${p.golesLocal}" min="0" style="font-family:'Bebas Neue',cursive;font-size:28px;text-align:center" /></div>
          <div style="font-family:'Bebas Neue',cursive;font-size:24px;margin-top:20px">—</div>
          <div class="input-group"><label>${visit?.nombre||'Visitante'}</label>
            <input class="form-input" type="number" id="res-visit" value="${p.golesVisitante}" min="0" style="font-family:'Bebas Neue',cursive;font-size:28px;text-align:center" /></div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="Modal.close()">Cancelar</button>
        <button class="btn btn-primary" onclick="Partidos.guardarResultado('${id}')">💾 Guardar</button>
      </div>`, 'modal-sm');
  },

  async guardarResultado(id) {
    const gl = parseInt(document.getElementById('res-local').value)||0;
    const gv = parseInt(document.getElementById('res-visit').value)||0;
    try {
      await DB.updatePartido(id, { golesLocal:gl, golesVisitante:gv });
      Toast.success('Resultado actualizado.');
      Modal.close(); this.render();
    } catch(e) { Toast.error('Error: '+e.message); }
  },

  eliminar(id) {
    const p = DB.getPartido(id);
    const local = DB.getEquipo(p?.localId), visit = DB.getEquipo(p?.visitanteId);
    UI.confirmDialog(`¿Eliminar el partido <b>${local?.nombre||'?'} vs ${visit?.nombre||'?'}</b>?`, async () => {
      try { await DB.deletePartido(id); Toast.success('Partido eliminado.'); Partidos.render(); }
      catch(e) { Toast.error('Error: '+e.message); }
    });
  }
};
