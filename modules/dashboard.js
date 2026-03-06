/* ════════════════════════════════════════════════
   DASHBOARD.JS — Panel principal
════════════════════════════════════════════════ */
const Dashboard = {
  render() {
    const stats = DB.getStatsGenerales();
    const goleadores = DB.getGoleadores().slice(0, 5);
    const partidos = DB.getPartidos()
      .filter(p => ['programado','en_juego','pausado'].includes(p.estado))
      .slice(0, 4);
    const cats = DB.getCategorias();

    const html = `<div class="fade-in">

      <!-- HERO HEADER -->
      <div style="background:linear-gradient(135deg,var(--black3),var(--black4));border:1px solid var(--black4);border-radius:14px;padding:28px 32px;margin-bottom:24px;position:relative;overflow:hidden;">
        <div style="position:absolute;top:-20px;right:-20px;font-family:'Bebas Neue',cursive;font-size:160px;opacity:0.03;pointer-events:none;line-height:1;">2026</div>
        <div style="position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,var(--red),var(--yellow),var(--red));"></div>
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;">
          <div>
            <div style="font-size:11px;letter-spacing:3px;color:var(--gray);text-transform:uppercase;margin-bottom:6px;">TEMPORADA ACTIVA</div>
            <h1 class="font-display" style="font-size:38px;line-height:1;color:var(--white);">INTRAMUROS HUMBOLDT <span style="color:var(--yellow)">2026</span></h1>
            <p style="font-size:14px;color:var(--gray);margin-top:8px;font-family:'Inter',sans-serif;">Sistema Profesional de Gestión Deportiva · Fútbol</p>
          </div>
          <div style="display:flex;gap:10px;flex-wrap:wrap;">
            ${Auth.isAdmin() ? `<button class="btn btn-primary" onclick="Router.go('partidos')">⚽ Gestionar Partidos</button>` : ''}
            <button class="btn btn-secondary" onclick="Router.go('estadisticas')">📊 Ver Estadísticas</button>
          </div>
        </div>
      </div>

      <!-- STAT CARDS -->
      <div class="grid-stats" style="margin-bottom:24px;">
        ${this._statCard('⚽', stats.totalGoles, 'Goles Totales', 'red')}
        ${this._statCard('🛡️', stats.totalEquipos, 'Equipos Activos', 'yellow')}
        ${this._statCard('👤', stats.totalJugadores, 'Jugadores', 'white')}
        ${this._statCard('🏆', stats.finalizados, 'Partidos Jugados', 'red')}
        ${this._statCard('📅', stats.programados, 'Próximos', 'yellow')}
        ${this._statCard('🟨', stats.totalAmarillas, 'Amarillas', 'white')}
        ${this._statCard('🟥', stats.totalRojas, 'Rojas', 'red')}
        ${this._statCard('🔴', stats.enJuego, 'En Juego', stats.enJuego > 0 ? 'live' : 'gray')}
      </div>

      <!-- MAIN GRID -->
      <div style="display:grid;grid-template-columns:1fr 340px;gap:20px;">

        <!-- PRÓXIMOS PARTIDOS / EN VIVO -->
        <div>
          <div class="section-header">
            <div>
              <div class="section-title">PARTIDOS ACTIVOS</div>
              <div class="section-sub">Programados y en curso</div>
            </div>
            <button class="btn btn-secondary btn-sm" onclick="Router.go('partidos')">Ver todos →</button>
          </div>
          ${partidos.length ? partidos.map(p => this._matchCard(p)).join('') : '<div class="empty-state" style="padding:30px"><div class="empty-icon">📅</div><div class="empty-title">Sin partidos activos</div></div>'}
        </div>

        <!-- SIDEBAR RIGHT -->
        <div style="display:flex;flex-direction:column;gap:20px;">

          <!-- GOLEADORES -->
          <div class="card">
            <div class="card-header">
              <span class="card-title">🥅 TOP GOLEADORES</span>
              <button class="btn btn-secondary btn-xs" onclick="Router.go('estadisticas')">Ver más</button>
            </div>
            <div style="overflow-x:auto;">
              <table class="data-table">
                <thead><tr><th>#</th><th>Jugador</th><th>⚽</th></tr></thead>
                <tbody>
                  ${goleadores.length ? goleadores.map((j,i) => {
                    const eq = DB.getEquipo(j.equipoId);
                    const rankCls = i===0?'rank-1':i===1?'rank-2':i===2?'rank-3':'';
                    return `<tr>
                      <td><span class="rank-num ${rankCls}">${i+1}</span></td>
                      <td>
                        <div style="display:flex;align-items:center;gap:8px;">
                          ${UI.playerAvatar(j.foto64, j.nombre, 28)}
                          <div>
                            <div style="font-size:13px;font-weight:700;">${j.nombre}</div>
                            <div style="font-size:11px;color:var(--gray)">${eq?.nombre||'—'}</div>
                          </div>
                        </div>
                      </td>
                      <td><span style="font-family:'Bebas Neue',cursive;font-size:20px;color:var(--yellow)">${j.goles}</span></td>
                    </tr>`;
                  }).join('') : '<tr><td colspan="3" style="text-align:center;color:var(--gray);padding:20px">Sin datos</td></tr>'}
                </tbody>
              </table>
            </div>
          </div>

          <!-- CATEGORÍAS -->
          <div class="card">
            <div class="card-header"><span class="card-title">🏷️ CATEGORÍAS</span></div>
            <div class="card-body" style="padding:12px;">
              ${cats.map(c => {
                const eqs = DB.getEquiposByCategoria(c.id).filter(e=>e.estado==='activo');
                const pts = DB.getPartidosByCategoria(c.id);
                return `<div onclick="Router.go('estadisticas')" style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;border-radius:8px;cursor:pointer;transition:background 0.2s;margin-bottom:4px;" onmouseover="this.style.background='var(--black4)'" onmouseout="this.style.background='none'">
                  <div>
                    <div style="font-weight:700;font-size:14px">${c.nombre}</div>
                    <div style="font-size:12px;color:var(--gray)">${eqs.length} equipos · ${pts.length} partidos</div>
                  </div>
                  ${UI.estadoBadge(c.estado)}
                </div>`;
              }).join('') || '<div style="color:var(--gray);padding:12px;font-size:13px">Sin categorías</div>'}
            </div>
          </div>

        </div>
      </div>
    </div>`;

    document.getElementById('content-area').innerHTML = html;
  },

  _statCard(icon, value, label, color) {
    const colors = { red:'var(--red)', yellow:'var(--yellow)', white:'var(--white)', live:'var(--red)', gray:'var(--gray2)' };
    const bg = color === 'live' ? 'background:rgba(232,25,44,0.08);border-color:rgba(232,25,44,0.3);' : '';
    return `<div class="stat-card" style="${bg}">
      <div class="stat-card-accent" style="background:${colors[color]||'var(--gray)'}"></div>
      <div class="stat-card-icon">${icon}</div>
      <div class="stat-num" style="color:${color==='live'?'var(--red)':colors[color]}">${value}</div>
      <div class="stat-lbl">${label}</div>
    </div>`;
  },

  _matchCard(p) {
    const local = DB.getEquipo(p.localId);
    const visit = DB.getEquipo(p.visitanteId);
    const arb   = DB.getArbitro(p.arbitroId);
    const cat   = DB.getCategoria(p.categoriaId);
    const isLive = p.estado === 'en_juego';
    const isPaused = p.estado === 'pausado';
    const serieTag = p.totalEnSerie > 1
      ? `<span class="series-tag">⟳ ${p.numEnSerie}/${p.totalEnSerie} · ${p.numEnSerie===1?'IDA':'VUELTA'}</span>` : '';

    return `<div class="match-card ${isLive?'live':''}" style="margin-bottom:12px;">
      <div class="match-header">
        <div style="display:flex;align-items:center;gap:8px;">
          ${UI.estadoBadge(p.estado)}
          ${serieTag}
          <span style="font-size:12px;color:var(--gray)">${cat?.nombre||'—'}</span>
        </div>
        <span style="font-size:12px">${p.fecha ? UI.formatDate(p.fecha)+' '+p.hora : 'Fecha pendiente'}</span>
      </div>
      <div class="match-body">
        <div class="match-team">
          <div class="team-shield">🛡️</div>
          <div><div class="team-name">${local?.nombre||'—'}</div><div class="team-cat">${local?.seccion||''}</div></div>
        </div>
        <div class="match-score">
          <div class="score-nums">${p.estado==='pendiente'?'vs':`${p.golesLocal} - ${p.golesVisitante}`}</div>
          <div class="score-min">${isLive||isPaused ? `⏱ ${p.minutoActual}'` : (p.estado==='finalizado'?'FIN':'—')}</div>
        </div>
        <div class="match-team right">
          <div class="team-shield">🛡️</div>
          <div><div class="team-name">${visit?.nombre||'—'}</div><div class="team-cat">${visit?.seccion||''}</div></div>
        </div>
      </div>
      <div class="match-footer">
        <span style="font-size:12px;color:var(--gray)">🟨 ${arb?.nombre||'Sin árbitro'}</span>
        ${Auth.isArbitro() && ['programado','en_juego','pausado'].includes(p.estado) 
          ? `<button class="btn btn-primary btn-sm" onclick="LiveMatch.open('${p.id}')">⚽ ${isLive?'Continuar':'Iniciar'}</button>`
          : `<button class="btn btn-secondary btn-sm" onclick="Partidos.verDetalle('${p.id}')">Ver detalles →</button>`}
      </div>
    </div>`;
  }
};
