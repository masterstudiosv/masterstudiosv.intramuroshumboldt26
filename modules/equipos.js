/* ════════════════════════════════════════════════
   EQUIPOS.JS — Gestión de Equipos
════════════════════════════════════════════════ */
const Equipos = {
  _filter: { cat: '', search: '' },

  render() {
    const cats = DB.getCategoriasActivas();
    let equipos = DB.getEquipos();
    if (this._filter.cat) equipos = equipos.filter(e => e.categoriaId === this._filter.cat);
    if (this._filter.search) {
      const q = this._filter.search.toLowerCase();
      equipos = equipos.filter(e => (e.nombre||'').toLowerCase().includes(q) || (e.seccion||'').toLowerCase().includes(q));
    }
    const html = `<div class="fade-in">
      <div class="section-header">
        <div><div class="section-title">EQUIPOS</div><div class="section-sub">${equipos.length} equipos</div></div>
        ${Auth.isAdmin()?`<div style="display:flex;gap:8px">
          <button class="btn btn-secondary" onclick="Equipos.formMasivo()">📋 Registrar Varios</button>
          <button class="btn btn-primary" onclick="Equipos.formNuevo()">+ Registrar Equipo</button>
        </div>`:''}
      </div>
      <div style="display:flex;gap:12px;margin-bottom:20px;flex-wrap:wrap;">
        <div class="search-bar" style="flex:1;min-width:200px;">
          <span class="search-icon">🔍</span>
          <input placeholder="Buscar equipo o sección..." value="${this._filter.search}" onchange="Equipos._filter.search=this.value;Equipos.render()" />
        </div>
        <select class="form-select" style="width:200px" onchange="Equipos._filter.cat=this.value;Equipos.render()">
          <option value="">Todas las categorías</option>
          ${cats.map(c => `<option value="${c.id}" ${this._filter.cat===c.id?'selected':''}>${c.nombre}</option>`).join('')}
        </select>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px;">
        ${equipos.length ? equipos.map(e => this._teamCard(e)).join('')
          : `<div class="empty-state" style="grid-column:1/-1;"><div class="empty-icon">🛡️</div><div class="empty-title">No hay equipos</div><div class="empty-sub">Registra el primer equipo del torneo</div></div>`}
      </div></div>`;
    document.getElementById('content-area').innerHTML = html;
  },

  formMasivo() {
    const cats = DB.getCategoriasActivas();
    const catOpts = cats.map(c=>'<option value="'+c.id+'">'+c.nombre+'</option>').join('');
    Modal.open(
      '<div class="modal-header"><span class="modal-title">📋 REGISTRO MASIVO</span><button class="modal-close" onclick="Modal.close()">✕</button></div>' +
      '<div class="modal-body">' +
        '<div style="background:rgba(255,215,0,0.06);border:1px solid rgba(255,215,0,0.2);border-radius:8px;padding:12px;margin-bottom:16px;font-size:13px;color:var(--gray)">' +
          '💡 Un equipo por línea: <strong style="color:var(--white)">Nombre, Sección</strong> (sección opcional)<br>Ej: Los Tigres, 3A' +
        '</div>' +
        '<div class="input-group"><label>Categoría para todos *</label>' +
          '<select class="form-select" id="masivo-cat"><option value="">Seleccionar...</option>' + catOpts + '</select>' +
        '</div>' +
        '<div class="input-group"><label>Lista de Equipos *</label>' +
          '<textarea class="form-input" id="masivo-lista" rows="8" placeholder="Los Tigres, 3A&#10;Águilas FC, 5B&#10;Real Madrid" style="resize:vertical;font-size:13px;line-height:1.6"></textarea>' +
          '<div style="font-size:11px;color:var(--gray);margin-top:4px">Un equipo por línea. Sección opcional.</div>' +
        '</div>' +
        '<div id="masivo-preview" style="display:none;margin-top:12px"><div id="masivo-preview-list"></div></div>' +
      '</div>' +
      '<div class="modal-footer">' +
        '<button class="btn btn-secondary" onclick="Equipos._previsualizarMasivo()">👁️ Previsualizar</button>' +
        '<button class="btn btn-secondary" onclick="Modal.close()">Cancelar</button>' +
        '<button class="btn btn-primary" onclick="Equipos.guardarMasivo()">💾 Registrar Todos</button>' +
      '</div>', 'modal-sm');
  },

  _previsualizarMasivo() {
    const lista = document.getElementById('masivo-lista').value.trim();
    if (!lista) return;
    const lineas = lista.split('\n').map(l=>l.trim()).filter(l=>l);
    const prev = document.getElementById('masivo-preview');
    const list = document.getElementById('masivo-preview-list');
    prev.style.display = 'block';
    list.innerHTML = lineas.map((l,i) => {
      const parts = l.split(',').map(p=>p.trim());
      const nombre = parts[0]||'', sec = parts[1]||'';
      return `<div style="display:flex;align-items:center;gap:8px;padding:6px 10px;background:var(--black4);border-radius:6px;margin-bottom:4px">
        <span style="font-size:14px;color:var(--yellow);font-weight:700">${i+1}</span>
        <div><div style="font-weight:700;font-size:13px">${nombre}</div>
        <div style="font-size:11px;color:var(--gray)">${sec?'Sección: '+sec:'Sin sección'}</div></div>
      </div>`;
    }).join('');
  },

  async guardarMasivo() {
    const catId = document.getElementById('masivo-cat').value;
    const lista = document.getElementById('masivo-lista').value.trim();
    if (!catId) { Toast.error('Selecciona una categoría.'); return; }
    if (!lista) { Toast.error('Ingresa al menos un equipo.'); return; }
    const lineas = lista.split('\n').map(l=>l.trim()).filter(l=>l);
    if (!lineas.length) { Toast.error('No se encontraron equipos válidos.'); return; }
    const btn = document.querySelector('.modal-footer .btn-primary');
    if (btn) { btn.textContent = 'Guardando...'; btn.disabled = true; }
    let saved = 0, errs = 0;
    for (const linea of lineas) {
      const parts = linea.split(',').map(p=>p.trim());
      const nombre = parts[0], seccion = parts[1]||'';
      if (!nombre) continue;
      try {
        await DB.saveEquipo({ categoriaId:catId, seccion, nombre, imgUrl:'', estado:'activo' });
        saved++;
      } catch(e) { errs++; console.error('Error equipo "'+nombre+'":', e); }
    }
    Toast.success(saved+' equipos registrados'+(errs?' ('+errs+' errores)':'')+'.');
    Modal.close(); this.render();
  },


  _teamCard(eq) {
    const cat = DB.getCategoria(eq.categoriaId);
    const jugs = DB.getJugadoresByEquipo(eq.id);
    const parts = DB.getPartidos().filter(p => (p.localId===eq.id||p.visitanteId===eq.id) && p.estado==='finalizado');
    let pg=0,pe=0,pp=0;
    parts.forEach(p => {
      const l=p.localId===eq.id, gm=l?p.golesLocal:p.golesVisitante, gc=l?p.golesVisitante:p.golesLocal;
      if(gm>gc)pg++; else if(gm===gc)pe++; else pp++;
    });
    const shield = eq.imgUrl&&eq.imgUrl.startsWith('http')
      ? `<img src="${eq.imgUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:8px" onerror="this.parentElement.innerHTML='🛡️'"/>` : '🛡️';
    return `<div class="card" style="cursor:pointer;transition:transform 0.2s;" onclick="Equipos.verPerfil('${eq.id}')" onmouseover="this.style.transform='translateY(-3px)'" onmouseout="this.style.transform=''">
      <div style="padding:20px;border-bottom:1px solid var(--black4)">
        <div style="display:flex;align-items:center;gap:14px;">
          <div style="width:56px;height:56px;border-radius:10px;background:var(--black4);display:flex;align-items:center;justify-content:center;font-size:26px;flex-shrink:0">${shield}</div>
          <div style="flex:1;min-width:0">
            <div style="font-family:'Bebas Neue',cursive;font-size:20px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${eq.nombre}</div>
            <div style="font-size:12px;color:var(--gray)">${cat?.nombre||'—'} · Secc. ${eq.seccion}</div>
            <div style="margin-top:4px">${UI.estadoBadge(eq.estado)}</div>
          </div>
        </div>
      </div>
      <div style="padding:14px 20px;display:grid;grid-template-columns:repeat(4,1fr);text-align:center;border-bottom:1px solid var(--black4)">
        ${[['PJ',parts.length],['PG',pg],['PE',pe],['PP',pp]].map(([l,v])=>`<div><div style="font-family:'Bebas Neue',cursive;font-size:20px">${v}</div><div style="font-size:10px;color:var(--gray)">${l}</div></div>`).join('')}
      </div>
      <div style="padding:12px 20px;display:flex;align-items:center;justify-content:space-between">
        <span style="font-size:13px;color:var(--gray)">👤 ${jugs.length} jugadores</span>
        <div style="display:flex;align-items:center;gap:6px">
          <span style="font-size:12px;color:var(--gray)">PTS</span>
          <span style="font-family:'Bebas Neue',cursive;font-size:22px;color:var(--yellow)">${pg*3+pe}</span>
        </div>
      </div>
      ${Auth.isAdmin()?`<div style="padding:8px 12px;border-top:1px solid var(--black4);display:flex;gap:6px" onclick="event.stopPropagation()">
        <button class="btn btn-secondary btn-xs" onclick="Equipos.formEditar('${eq.id}')">✏️ Editar</button>
        <button class="btn btn-xs ${eq.estado==='activo'?'btn-danger':'btn-success'}" onclick="Equipos.toggle('${eq.id}')">${eq.estado==='activo'?'Desactivar':'Activar'}</button>
        <button class="btn btn-xs btn-danger" onclick="Equipos.eliminar('${eq.id}')">🗑️</button>
      </div>`:''}
    </div>`;
  },

  verPerfil(id) {
    const eq = DB.getEquipo(id); if (!eq) return;
    const cat = DB.getCategoria(eq.categoriaId);
    const jugs = DB.getJugadoresByEquipo(id);
    const parts = DB.getPartidos().filter(p => (p.localId===id||p.visitanteId===id) && p.estado==='finalizado');
    let pg=0,pe=0,pp=0,gf=0,gc=0;
    parts.forEach(p => {
      const l=p.localId===id; gf+=l?p.golesLocal:p.golesVisitante; gc+=l?p.golesVisitante:p.golesLocal;
      const gm=l?p.golesLocal:p.golesVisitante, gco=l?p.golesVisitante:p.golesLocal;
      if(gm>gco)pg++; else if(gm===gco)pe++; else pp++;
    });
    const shield = eq.imgUrl&&eq.imgUrl.startsWith('http')
      ? `<img src="${eq.imgUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:10px" onerror="this.style.display='none'"/>` : '🛡️';
    Modal.open(`
      <div class="modal-header"><span class="modal-title">PERFIL DEL EQUIPO</span><button class="modal-close" onclick="Modal.close()">✕</button></div>
      <div class="modal-body">
        <div style="background:var(--black4);border-radius:10px;padding:20px;margin-bottom:20px">
          <div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap">
            <div style="width:72px;height:72px;border-radius:12px;background:var(--black);display:flex;align-items:center;justify-content:center;font-size:36px;flex-shrink:0">${shield}</div>
            <div>
              <h2 style="margin:0;font-family:'Bebas Neue',cursive;font-size:28px">${eq.nombre}</h2>
              <div style="font-size:13px;color:var(--gray)">${cat?.nombre||'—'} · Sección ${eq.seccion}</div>
              <div style="display:flex;gap:14px;margin-top:10px;flex-wrap:wrap">
                ${[['PJ',parts.length],['PG',pg],['PE',pe],['PP',pp],['GF',gf],['GC',gc],['PTS',pg*3+pe]].map(([l,v])=>
                  `<div><div style="font-family:'Bebas Neue',cursive;font-size:22px;color:${l==='PTS'?'var(--yellow)':'var(--white)'}">${v}</div><div style="font-size:10px;color:var(--gray)">${l}</div></div>`
                ).join('')}
              </div>
            </div>
          </div>
        </div>
        <div class="divider-label">PLANTEL (${jugs.length} jugadores)</div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:10px">
          ${jugs.map(j => {
            const foto = j.fotoUrl&&j.fotoUrl.startsWith('http')
              ? `<img src="${j.fotoUrl}" style="width:100%;height:100%;object-fit:cover" onerror="this.style.display='none'"/>`
              : `<div style="font-family:'Bebas Neue',cursive;font-size:40px;color:var(--black5)">${(j.nombre||'?')[0]}</div>`;
            return `<div class="card" style="text-align:center;padding:12px">
              <div style="height:70px;background:var(--black4);border-radius:6px;margin-bottom:8px;display:flex;align-items:center;justify-content:center;overflow:hidden">${foto}</div>
              <div style="font-family:'Bebas Neue',cursive;font-size:22px;color:var(--yellow)">#${j.numero}</div>
              <div style="font-weight:700;font-size:13px">${j.nombre}</div>
              <div style="font-size:11px;color:var(--gray)">${j.posicion||'—'}</div>
              <div style="display:flex;justify-content:center;gap:8px;margin-top:6px;font-size:11px">
                <span>⚽${j.goles||0}</span><span>🟨${j.amarillas||0}</span><span>🟥${j.rojas||0}</span>
              </div>
            </div>`;
          }).join('') || '<div style="color:var(--gray);padding:20px;text-align:center;grid-column:1/-1">Sin jugadores</div>'}
        </div>
      </div>`, 'modal-lg');
  },

  formNuevo() { this._form(null); },
  formEditar(id) { this._form(DB.getEquipo(id)); },

  _form(eq) {
    const cats = DB.getCategoriasActivas();
    Modal.open(`
      <div class="modal-header"><span class="modal-title">${eq?'EDITAR':'NUEVO'} EQUIPO</span><button class="modal-close" onclick="Modal.close()">✕</button></div>
      <div class="modal-body">
        <div class="form-grid">
          <div class="input-group"><label>Categoría *</label>
            <select class="form-select" id="eq-cat">
              <option value="">Seleccionar...</option>
              ${cats.map(c=>`<option value="${c.id}" ${eq?.categoriaId===c.id?'selected':''}>${c.nombre}</option>`).join('')}
            </select></div>
          <div class="input-group"><label>Sección <span style="font-weight:400;color:var(--gray)">(opcional)</span></label>
            <input class="form-input" id="eq-sec" value="${eq?.seccion||''}" placeholder="Ej: 3A, 5B... (opcional)" /></div>
          <div class="input-group form-full"><label>Nombre del Equipo *</label>
            <input class="form-input" id="eq-nombre" value="${eq?.nombre||''}" placeholder="Ej: Los Tigres..." /></div>
          <div class="input-group form-full"><label>URL del Escudo</label>
            <input class="form-input" id="eq-imgurl" placeholder="https://i.imgur.com/tu-escudo.png" value="${eq?.imgUrl||''}" oninput="Equipos._preview(this.value)"/>
            <div id="eq-shield-wrap" style="margin-top:6px;display:${eq?.imgUrl&&eq.imgUrl.startsWith('http')?'block':'none'}">
              <img id="eq-shield-preview" src="${eq?.imgUrl||''}" style="max-height:70px;border-radius:6px;border:1px solid var(--black4)" onerror="this.parentElement.style.display='none'"/>
            </div>
            <div style="font-size:11px;color:var(--gray);margin-top:4px">💡 Usa <a href="https://imgur.com" target="_blank" style="color:var(--yellow)">imgur.com</a> → clic derecho → "Copiar dirección de imagen"</div>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="Modal.close()">Cancelar</button>
        <button class="btn btn-primary" onclick="Equipos.guardar('${eq?.id||''}')">💾 Guardar Equipo</button>
      </div>`, 'modal-sm');
  },

  _preview(url) {
    const wrap = document.getElementById('eq-shield-wrap');
    const img  = document.getElementById('eq-shield-preview');
    if (url&&url.startsWith('http')) { if(img)img.src=url; if(wrap)wrap.style.display='block'; }
    else { if(wrap)wrap.style.display='none'; }
  },

  async guardar(id) {
    const cat    = document.getElementById('eq-cat').value;
    const sec    = document.getElementById('eq-sec').value.trim();
    const nombre = document.getElementById('eq-nombre').value.trim();
    const imgUrl = document.getElementById('eq-imgurl').value.trim();
    if (!cat||!nombre) { Toast.error('Categoría y nombre son obligatorios.'); return; }
    try {
      await DB.saveEquipo({ id:id||undefined, categoriaId:cat, seccion:sec, nombre, imgUrl, estado:'activo' });
      Toast.success(`Equipo ${id?'actualizado':'registrado'}.`);
      Modal.close(); this.render();
    } catch(e) { Toast.error('Error: '+e.message); }
  },

  async toggle(id) {
    try { await DB.toggleEquipo(id); Toast.info('Estado actualizado.'); this.render(); }
    catch(e) { Toast.error('Error: '+e.message); }
  },

  eliminar(id) {
    const eq = DB.getEquipo(id);
    UI.confirmDialog(`¿Eliminar el equipo <b>${eq?.nombre}</b>?`, async () => {
      try { await DB.deleteEquipo(id); Toast.success('Equipo eliminado.'); Equipos.render(); }
      catch(e) { Toast.error('Error: '+e.message); }
    });
  }
};
