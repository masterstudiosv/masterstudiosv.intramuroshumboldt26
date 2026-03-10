/* ════════════════════════════════════════════════
   LIVE-MATCH.JS — Control en Vivo del Árbitro
════════════════════════════════════════════════ */
const LiveMatch = {
  _partidoId: null,
  _timer: null,
  _minuto: 0,
  _estado: null,
  _jugLocal: [],
  _jugVisit: [],
  _localId: null,
  _visitId: null,

  open(id) {
    const p = DB.getPartido(id);
    if (!p) { Toast.error('Partido no encontrado.'); return; }
    this._partidoId = id;
    this._minuto = p.minutoActual || 0;
    this._estado = p.estado;
    this._render();
  },

  _render() {
    const p = DB.getPartido(this._partidoId); if (!p) return;
    const local = DB.getEquipo(p.localId), visit = DB.getEquipo(p.visitanteId);
    const cat   = DB.getCategoria(p.categoriaId);
    const jugLocal = DB.getJugadoresByEquipo(p.localId);
    const jugVisit = DB.getJugadoresByEquipo(p.visitanteId);
    const eventos  = DB.getEventosByPartido(p.id);
    this._jugLocal = jugLocal; this._jugVisit = jugVisit;
    this._localId = p.localId; this._visitId = p.visitanteId;

    const jugOpts = (jugs, equipoId) => jugs.map(j => `<option value="${j.id}" data-equipo="${equipoId}">${j.numero} · ${j.nombre}</option>`).join('');

    Modal.open(`
      <div class="modal-header">
        <div>
          <span class="modal-title">⚽ CONTROL EN VIVO</span>
          <div style="font-size:12px;color:var(--gray)">${cat?.nombre||'—'} ${p.totalEnSerie>1?'· Partido '+p.numEnSerie+'/'+p.totalEnSerie:''}</div>
        </div>
        <button class="modal-close" onclick="LiveMatch._stop();Modal.close()">✕</button>
      </div>
      <div class="modal-body" style="padding:0">
        <div class="live-scoreboard">
          <div class="live-teams">
            <div style="text-align:right">
              <div class="live-team-name">${local?.nombre||'—'}</div>
              <div style="font-size:12px;color:var(--gray)">${local?.seccion||''}</div>
            </div>
            <div>
              <div class="live-score-box" id="lm-score">${p.golesLocal} – ${p.golesVisitante}</div>
              <div style="text-align:center">
                <span class="live-time-box ${this._estado==='pausado'?'paused':''}" id="lm-time">${this._minuto}'</span>
              </div>
            </div>
            <div style="text-align:left">
              <div class="live-team-name">${visit?.nombre||'—'}</div>
              <div style="font-size:12px;color:var(--gray)">${visit?.seccion||''}</div>
            </div>
          </div>
        </div>
        <div class="live-controls">
          ${this._estado !== 'en_juego'
            ? `<button class="btn btn-success" onclick="LiveMatch.iniciar()">▶ ${this._estado==='pausado'?'REANUDAR':'INICIAR'} PARTIDO</button>`
            : `<button class="btn btn-yellow" onclick="LiveMatch.pausar()">⏸ PAUSAR</button>`}
          ${this._estado==='en_juego'||this._estado==='pausado'
            ? `<button class="btn btn-danger" onclick="LiveMatch.confirmarFinalizar()">🏁 FINALIZAR</button>` : ''}
        </div>
        <div style="padding:16px;border-bottom:1px solid var(--black4)">
          <div style="font-size:11px;letter-spacing:2px;color:var(--gray);margin-bottom:12px;font-weight:700">REGISTRAR EVENTO</div>
          <div class="form-grid">
            <div class="input-group"><label>Tipo de Evento</label>
              <select class="form-select" id="ev-tipo" onchange="LiveMatch._onEvTipoChange()">
                <option value="gol">⚽ Gol</option>
                <option value="amarilla">🟨 Tarjeta Amarilla</option>
                <option value="roja">🟥 Tarjeta Roja</option>
                <option value="falta">🚩 Falta</option>
                <option value="cambio">↕️ Cambio</option>
              </select></div>
            <div class="input-group"><label>Equipo</label>
              <select class="form-select" id="ev-equipo" onchange="LiveMatch._onEquipoChange()">
                <option value="${p.localId}">${local?.nombre}</option>
                <option value="${p.visitanteId}">${visit?.nombre}</option>
              </select></div>
            <div class="input-group" id="ev-jug-wrap"><label>Jugador</label>
              <select class="form-select" id="ev-jugador">
                <option value="">Seleccionar jugador...</option>
                ${jugOpts(jugLocal, p.localId)}
              </select></div>
            <div class="input-group" id="ev-jug-sale-wrap" style="display:none"><label>Jugador Sale</label>
              <select class="form-select" id="ev-jug-sale">
                <option value="">Seleccionar...</option>${jugOpts(jugLocal, p.localId)}
              </select></div>
            <div class="input-group" id="ev-jug-entra-wrap" style="display:none"><label>Jugador Entra</label>
              <select class="form-select" id="ev-jug-entra">
                <option value="">Seleccionar...</option>${jugOpts(jugLocal, p.localId)}
              </select></div>
          </div>
          <button class="btn btn-primary" onclick="LiveMatch.registrarEvento()" ${this._estado!=='en_juego'?'disabled style="opacity:0.5"':''}>
            + Registrar Evento (min ${this._minuto}')
          </button>
          ${this._estado!=='en_juego'?'<span style="font-size:12px;color:var(--gray);margin-left:10px">Inicia el partido para registrar eventos</span>':''}
        </div>
        <div style="padding:16px">
          <div style="font-size:11px;letter-spacing:2px;color:var(--gray);margin-bottom:10px;font-weight:700">EVENTOS (${eventos.length})</div>
          <div class="event-list" id="lm-event-list">${this._renderEventos(eventos)}</div>
        </div>
      </div>`, 'modal-lg');
    if (this._estado === 'en_juego') this._startTimer();
  },

  _renderEventos(eventos) {
    if (!eventos.length) return '<div style="color:var(--gray);text-align:center;padding:20px">Sin eventos aún</div>';
    const icons = { gol:'⚽', amarilla:'🟨', roja:'🟥', falta:'🚩', cambio_sale:'↕', cambio_entra:'↕' };
    return [...eventos].reverse().map(e => {
      const eq = DB.getEquipo(e.equipoId);
      return `<div class="event-item">
        <div class="event-min">${e.minuto}'</div>
        <div class="event-icon">${icons[e.tipo]||'•'}</div>
        <div class="event-desc"><div style="font-weight:700">${e.descripcion}</div><div class="event-team">${eq?.nombre||'—'}</div></div>
      </div>`;
    }).join('');
  },

  _onEvTipoChange() {
    const tipo = document.getElementById('ev-tipo')?.value;
    const isCambio = tipo === 'cambio';
    document.getElementById('ev-jug-wrap').style.display = isCambio ? 'none' : '';
    document.getElementById('ev-jug-sale-wrap').style.display = isCambio ? '' : 'none';
    document.getElementById('ev-jug-entra-wrap').style.display = isCambio ? '' : 'none';
  },

  _onEquipoChange() {
    const equipoId = document.getElementById('ev-equipo')?.value;
    const jugs = equipoId === this._localId ? this._jugLocal : this._jugVisit;
    const opts = `<option value="">Seleccionar...</option>${jugs.map(j=>`<option value="${j.id}">${j.numero} · ${j.nombre}</option>`).join('')}`;
    ['ev-jugador','ev-jug-sale','ev-jug-entra'].forEach(id => { const el=document.getElementById(id); if(el)el.innerHTML=opts; });
  },

  async iniciar() {
    try {
      await DB.updatePartido(this._partidoId, { estado:'en_juego', fechaHoraInicio:new Date().toISOString() });
      this._estado = 'en_juego';
      this._startTimer();
      UI.showLiveIndicator(true);
      Toast.success('¡Partido iniciado!');
      this._render();
    } catch(e) { Toast.error('Error: '+e.message); }
  },

  async pausar() {
    this._stop();
    try {
      await DB.updatePartido(this._partidoId, { estado:'pausado', minutoActual:this._minuto });
      this._estado = 'pausado';
      Toast.warning('Partido pausado.');
      this._render();
    } catch(e) { Toast.error('Error: '+e.message); }
  },

  confirmarFinalizar() {
    UI.confirmDialog('¿Finalizar el partido? Esta acción no se puede deshacer.', async () => {
      LiveMatch._stop();
      try {
        await DB.updatePartido(LiveMatch._partidoId, { estado:'finalizado', minutoActual:LiveMatch._minuto, fechaHoraFin:new Date().toISOString() });
        const enVivo = DB.getPartidos().filter(p=>p.estado==='en_juego');
        UI.showLiveIndicator(enVivo.length > 0);
        Toast.success('¡Partido finalizado!');
        Modal.close();
        Router.go('partidos');
      } catch(e) { Toast.error('Error: '+e.message); }
    });
  },

  _startTimer() {
    this._stop();
    this._timer = setInterval(async () => {
      this._minuto++;
      try { await DB.updatePartido(this._partidoId, { minutoActual: this._minuto }); } catch(e) {}
      const timeEl = document.getElementById('lm-time');
      if (timeEl) timeEl.textContent = `${this._minuto}'`;
      const btnEl = document.querySelector('#modal-content .btn-primary[onclick*="registrarEvento"]');
      if (btnEl) btnEl.textContent = `+ Registrar Evento (min ${this._minuto}')`;
    }, 60000); // 60 segundos = 1 minuto real. Para demo usar 3000
  },

  _stop() { if (this._timer) { clearInterval(this._timer); this._timer = null; } },

  async registrarEvento() {
    if (this._estado !== 'en_juego') { Toast.warning('Inicia el partido primero.'); return; }
    const tipo    = document.getElementById('ev-tipo').value;
    const equipoId = document.getElementById('ev-equipo').value;
    const isCambio = tipo === 'cambio';

    try {
      if (isCambio) {
        const jSaleId  = document.getElementById('ev-jug-sale').value;
        const jEntraId = document.getElementById('ev-jug-entra').value;
        if (!jSaleId||!jEntraId) { Toast.error('Selecciona ambos jugadores.'); return; }
        const jSale = DB.getJugador(jSaleId), jEntra = DB.getJugador(jEntraId);
        await DB.saveEvento({ partidoId:this._partidoId, tipo:'cambio_sale',  jugadorId:jSaleId,  equipoId, minuto:this._minuto, descripcion:`Sale: ${jSale?.nombre}` });
        await DB.saveEvento({ partidoId:this._partidoId, tipo:'cambio_entra', jugadorId:jEntraId, equipoId, minuto:this._minuto, descripcion:`Entra: ${jEntra?.nombre}` });
        Toast.success(`Cambio: Sale ${jSale?.nombre}, Entra ${jEntra?.nombre}`);
      } else {
        const jugadorId = document.getElementById('ev-jugador').value;
        if (!jugadorId) { Toast.error('Selecciona un jugador.'); return; }
        const j = DB.getJugador(jugadorId);
        const p = DB.getPartido(this._partidoId);
        const descs = { gol:`Gol de ${j?.nombre}`, amarilla:`Amarilla a ${j?.nombre}`, roja:`Roja a ${j?.nombre}`, falta:`Falta de ${j?.nombre}` };
        await DB.saveEvento({ partidoId:this._partidoId, tipo, jugadorId, equipoId, minuto:this._minuto, descripcion:descs[tipo]||tipo });

        if (tipo === 'gol') {
          const isLocal = equipoId === p.localId;
          await DB.updatePartido(this._partidoId, { golesLocal:p.golesLocal+(isLocal?1:0), golesVisitante:p.golesVisitante+(isLocal?0:1) });
          if (DB.updateStatJugador) await DB.updateStatJugador(jugadorId, 'goles');
          const updated = DB.getPartido(this._partidoId);
          const scoreEl = document.getElementById('lm-score');
          if (scoreEl) scoreEl.textContent = `${updated.golesLocal} – ${updated.golesVisitante}`;
          Toast.success(`⚽ GOL de ${j?.nombre} (min ${this._minuto}')`);
        } else if (tipo === 'amarilla') {
          if (DB.updateStatJugador) await DB.updateStatJugador(jugadorId, 'amarillas');
          const amarillas = DB.getEventosByPartido(this._partidoId).filter(e=>e.tipo==='amarilla'&&e.jugadorId===jugadorId).length;
          if (amarillas >= 2) {
            await DB.saveEvento({ partidoId:this._partidoId, tipo:'roja', jugadorId, equipoId, minuto:this._minuto, descripcion:`Roja (2da amarilla): ${j?.nombre}` });
            if (DB.updateStatJugador) await DB.updateStatJugador(jugadorId, 'rojas');
            Toast.warning(`🟥 Doble amarilla → EXPULSADO ${j?.nombre}`);
          } else Toast.info(`🟨 Amarilla a ${j?.nombre}`);
        } else if (tipo === 'roja') {
          if (DB.updateStatJugador) await DB.updateStatJugador(jugadorId, 'rojas');
          Toast.warning(`🟥 Expulsado ${j?.nombre}`);
        } else if (tipo === 'falta') {
          if (DB.updateStatJugador) await DB.updateStatJugador(jugadorId, 'faltas');
          Toast.info(`🚩 Falta de ${j?.nombre}`);
        }
      }
      const eventos = DB.getEventosByPartido(this._partidoId);
      const listEl = document.getElementById('lm-event-list');
      if (listEl) listEl.innerHTML = this._renderEventos(eventos);
    } catch(e) { Toast.error('Error registrando evento: '+e.message); }
  }
};
