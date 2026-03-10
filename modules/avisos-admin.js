const AvisosAdmin = {
  render() {
    const avisos = DB.getAvisosAll();
    const ico    = { important:'🚨', info:'📌', normal:'📋' };
    const borde  = { important:'var(--red)', info:'var(--yellow)', normal:'var(--black4)' };
    document.getElementById('content-area').innerHTML = `<div class="fade-in">
      <div class="section-header">
        <div><div class="section-title">AVISOS DEL TORNEO</div>
          <div class="section-sub">${avisos.length} avisos — aparecen en la página pública</div></div>
        <button class="btn btn-primary" onclick="AvisosAdmin.form()">+ Nuevo Aviso</button>
      </div>
      ${avisos.length
        ? `<div style="display:flex;flex-direction:column;gap:12px">
            ${avisos.map(n=>`
            <div style="background:var(--black3);border:1px solid var(--black4);border-left:4px solid ${borde[n.tipo]||borde.normal};border-radius:10px;padding:14px 16px;display:flex;align-items:flex-start;gap:12px">
              <span style="font-size:22px;flex-shrink:0">${ico[n.tipo]||'📋'}</span>
              <div style="flex:1;min-width:0">
                <div style="font-weight:700;font-size:15px">${n.titulo||'Sin título'}</div>
                <div style="font-size:12px;color:var(--gray);margin-top:2px">
                  ${n.fecha||'Sin fecha'} ·
                  ${n.activo==='true'||n.activo===true
                    ?'<span style="color:#22c55e">Publicado</span>'
                    :'<span style="color:var(--gray)">Borrador</span>'}
                </div>
                ${n.texto?`<div style="font-size:13px;color:var(--gray);margin-top:6px">${n.texto.slice(0,100)}${n.texto.length>100?'...':''}</div>`:''}
              </div>
              <div style="display:flex;gap:6px;flex-shrink:0">
                <button class="btn btn-secondary btn-sm" onclick="AvisosAdmin.form('${n.id}')">✏️</button>
                <button class="btn btn-sm" style="background:rgba(255,80,80,.1);color:#ff5050" onclick="AvisosAdmin.eliminar('${n.id}')">🗑️</button>
              </div>
            </div>`).join('')}
          </div>`
        : `<div class="empty-state"><div class="empty-icon">📢</div><div class="empty-title">Sin avisos aún</div></div>`}
    </div>`;
  },

  form(id) {
    const n = id ? DB.getAvisosAll().find(a=>a.id===id) : null;
    const hoy = new Date().toISOString().slice(0,10);
    Modal.open(`
      <div class="modal-header">
        <h3 class="modal-title">${n?'✏️ Editar':'➕ Nuevo'} Aviso</h3>
        <button class="modal-close" onclick="Modal.close()">✕</button>
      </div>
      <div class="modal-body">
        <div class="form-group"><label class="form-label">Título *</label>
          <input class="form-input" id="av-t" value="${(n?.titulo||'').replace(/"/g,'&quot;')}" placeholder="Ej: Cambio de fecha — Partido Sub-15"/></div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">Tipo</label>
            <select class="form-input" id="av-tipo">
              <option value="normal"    ${n?.tipo==='normal'    ?'selected':''}>📋 Normal</option>
              <option value="info"      ${n?.tipo==='info'      ?'selected':''}>📌 Informativo</option>
              <option value="important" ${n?.tipo==='important' ?'selected':''}>🚨 Importante</option>
            </select></div>
          <div class="form-group"><label class="form-label">Fecha</label>
            <input class="form-input" type="date" id="av-fecha" value="${n?.fecha||hoy}"/></div>
        </div>
        <div class="form-group"><label class="form-label">Contenido del aviso</label>
          <textarea class="form-input" id="av-texto" rows="5" placeholder="Escribe el aviso aquí...">${n?.texto||''}</textarea></div>
        <div class="form-group">
          <label class="form-label">URL de imagen <span style="color:var(--gray);font-weight:400">(opcional — link de internet)</span></label>
          <input class="form-input" id="av-img" value="${n?.imgUrl||''}" placeholder="https://ejemplo.com/imagen.jpg" oninput="AvisosAdmin._preview(this.value)"/>
          <div id="av-prev-wrap" style="margin-top:8px;${n?.imgUrl&&n.imgUrl.startsWith('http')?'':'display:none'}">
            <img id="av-prev" src="${n?.imgUrl||''}" style="max-height:90px;border-radius:6px;border:1px solid var(--black4)" onerror="document.getElementById('av-prev-wrap').style.display='none'"/>
          </div>
        </div>
        <div class="form-group"><label class="form-label">Visibilidad</label>
          <select class="form-input" id="av-activo">
            <option value="true"  ${n?.activo==='true'||n?.activo===true?'selected':''}>✓ Publicado (visible para todos)</option>
            <option value="false" ${n?.activo==='false'||n?.activo===false?'selected':''}>✗ Borrador (solo admin)</option>
          </select></div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="Modal.close()">Cancelar</button>
        <button id="av-save-btn" class="btn btn-primary" onclick="AvisosAdmin.guardar('${n?.id||''}')">💾 Publicar Aviso</button>
      </div>`);
    setTimeout(()=>document.getElementById('av-t')?.focus(),100);
  },

  _preview(url) {
    const wrap = document.getElementById('av-prev-wrap');
    const img  = document.getElementById('av-prev');
    if (url && url.startsWith('http')) { img.src = url; wrap.style.display = ''; }
    else { wrap.style.display = 'none'; }
  },

  async guardar(id) {
    const titulo = document.getElementById('av-t').value.trim();
    if (!titulo) { Toast.error('El título es obligatorio.'); return; }
    const btn = document.getElementById('av-save-btn');
    btn.textContent = 'Guardando...'; btn.disabled = true;
    try {
      const existing = id ? DB.getAvisosAll().find(x=>x.id===id) : null;
      await DB.saveAviso({
        id: id || ('AVI'+Date.now()),
        tipo:           document.getElementById('av-tipo').value,
        titulo,
        fecha:          document.getElementById('av-fecha').value,
        texto:          document.getElementById('av-texto').value.trim(),
        imgUrl:         document.getElementById('av-img').value.trim(),
        activo:         document.getElementById('av-activo').value,
        fechaCreacion:  existing?.fechaCreacion || new Date().toISOString(),
      });
      Toast.success(`Aviso ${id?'actualizado':'publicado'} ✔`);
      Modal.close(); this.render();
    } catch(e) { Toast.error('Error al guardar: '+e.message); btn.textContent='💾 Publicar Aviso'; btn.disabled=false; }
  },

  async eliminar(id) {
    const n = DB.getAvisosAll().find(x=>x.id===id);
    UI.confirmDialog(`¿Eliminar aviso <b>${n?.titulo}</b>?`, async () => {
      try { await DB.deleteAviso(id); Toast.success('Aviso eliminado.'); AvisosAdmin.render(); }
      catch(e) { Toast.error('Error: '+e.message); }
    });
  },
};
