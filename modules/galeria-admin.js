/* ════════════════════════════════════════════════
   GALERIA-ADMIN.JS — Gestión de Galería de Fotos
════════════════════════════════════════════════ */
const GaleriaAdmin = {
  render() {
    const fotos = DB.getGaleria ? DB.getGaleria() : [];
    const html = `<div class="fade-in">
      <div class="section-header">
        <div><div class="section-title">GALERÍA DE FOTOS</div><div class="section-sub">${fotos.length} fotos publicadas</div></div>
        <button class="btn btn-primary" onclick="GaleriaAdmin.formNuevo()">+ Agregar Foto</button>
      </div>

      <div style="background:rgba(255,215,0,0.06);border:1px solid rgba(255,215,0,0.2);border-radius:8px;padding:14px;margin-bottom:20px;font-size:13px">
        💡 <strong>Cómo agregar fotos:</strong> Sube tus imágenes a <a href="https://imgur.com" target="_blank" style="color:var(--yellow)">imgur.com</a> o <a href="https://postimages.org" target="_blank" style="color:var(--yellow)">postimages.org</a>, luego copia el link directo y pégalo aquí.
      </div>

      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:16px">
        ${fotos.length ? fotos.map(f => `
          <div class="card" style="overflow:hidden">
            <div style="height:150px;background:var(--black4);overflow:hidden;position:relative">
              <img src="${f.url}" style="width:100%;height:100%;object-fit:cover" onerror="this.parentElement.innerHTML='<div style=text-align:center;padding:40px;color:var(--gray)>🖼️<br>Sin imagen</div>'"/>
              ${f.destacada?'<span style="position:absolute;top:8px;right:8px;background:var(--yellow);color:var(--black);padding:2px 8px;border-radius:4px;font-size:11px;font-weight:700">⭐</span>':''}
            </div>
            <div style="padding:12px">
              <div style="font-weight:700;font-size:14px;margin-bottom:4px">${f.titulo||'Sin título'}</div>
              <div style="font-size:12px;color:var(--gray);margin-bottom:10px">${f.descripcion||''}</div>
              <div style="display:flex;gap:6px;flex-wrap:wrap">
                <button class="btn btn-secondary btn-xs" onclick="GaleriaAdmin.formEditar('${f.id}')">✏️ Editar</button>
                <button class="btn btn-xs ${f.destacada?'btn-yellow':'btn-secondary'}" onclick="GaleriaAdmin.toggleDestacada('${f.id}')">${f.destacada?'⭐ Quitar':'⭐ Destacar'}</button>
                <button class="btn btn-danger btn-xs" onclick="GaleriaAdmin.eliminar('${f.id}')">🗑️</button>
              </div>
            </div>
          </div>`) .join('')
          : `<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">🖼️</div><div class="empty-title">Sin fotos en la galería</div><div class="empty-sub">Agrega la primera foto del torneo</div></div>`}
      </div>
    </div>`;
    document.getElementById('content-area').innerHTML = html;
  },

  formNuevo() { this._form(null); },
  formEditar(id) {
    const fotos = DB.getGaleria ? DB.getGaleria() : [];
    this._form(fotos.find(f => f.id === id) || null);
  },

  _form(f) {
    Modal.open(`
      <div class="modal-header"><span class="modal-title">${f?'EDITAR':'NUEVA'} FOTO</span><button class="modal-close" onclick="Modal.close()">✕</button></div>
      <div class="modal-body">
        <div class="input-group"><label>URL de la Imagen *</label>
          <input class="form-input" id="gal-url" placeholder="https://i.imgur.com/tu-foto.jpg" value="${f?.url||''}" oninput="GaleriaAdmin._preview(this.value)"/>
          <div id="gal-preview-wrap" style="margin-top:8px;display:${f?.url?'block':'none'}">
            <img id="gal-preview" src="${f?.url||''}" style="max-height:180px;border-radius:8px;max-width:100%;border:1px solid var(--black4)" onerror="this.parentElement.style.display='none'"/>
          </div>
          <div style="font-size:11px;color:var(--gray);margin-top:4px">💡 Usa <a href="https://imgur.com" target="_blank" style="color:var(--yellow)">imgur.com</a> → clic derecho → "Copiar dirección de imagen"</div>
        </div>
        <div class="input-group"><label>Título</label>
          <input class="form-input" id="gal-titulo" value="${f?.titulo||''}" placeholder="Ej: Final de Categoría Sub-15..." /></div>
        <div class="input-group"><label>Descripción</label>
          <input class="form-input" id="gal-desc" value="${f?.descripcion||''}" placeholder="Descripción opcional..." /></div>
        <div class="input-group">
          <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
            <input type="checkbox" id="gal-dest" ${f?.destacada?'checked':''} style="width:16px;height:16px">
            ⭐ Foto destacada (aparece primero en la galería pública)
          </label>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="Modal.close()">Cancelar</button>
        <button class="btn btn-primary" onclick="GaleriaAdmin.guardar('${f?.id||''}')">💾 Guardar</button>
      </div>`, 'modal-sm');
  },

  _preview(url) {
    const wrap = document.getElementById('gal-preview-wrap');
    const img  = document.getElementById('gal-preview');
    if (url&&url.startsWith('http')) { if(img)img.src=url; if(wrap)wrap.style.display='block'; }
    else { if(wrap)wrap.style.display='none'; }
  },

  async guardar(id) {
    const url       = document.getElementById('gal-url').value.trim();
    const titulo    = document.getElementById('gal-titulo').value.trim();
    const descripcion = document.getElementById('gal-desc').value.trim();
    const destacada = document.getElementById('gal-dest').checked;
    if (!url||!url.startsWith('http')) { Toast.error('Ingresa una URL válida (debe empezar con http).'); return; }
    try {
      await DB.saveGaleria({ id:id||undefined, url, titulo, descripcion, destacada, fecha:new Date().toISOString().split('T')[0] });
      Toast.success(`Foto ${id?'actualizada':'agregada'} correctamente.`);
      Modal.close(); this.render();
    } catch(e) { Toast.error('Error: '+e.message); }
  },

  async toggleDestacada(id) {
    const fotos = DB.getGaleria ? DB.getGaleria() : [];
    const f = fotos.find(x=>x.id===id);
    if (!f) return;
    try {
      await DB.saveGaleria({ ...f, destacada: !f.destacada });
      Toast.info('Foto actualizada.'); this.render();
    } catch(e) { Toast.error('Error: '+e.message); }
  },

  eliminar(id) {
    UI.confirmDialog('¿Eliminar esta foto de la galería?', async () => {
      try {
        if (DB.deleteGaleria) await DB.deleteGaleria(id);
        Toast.success('Foto eliminada.'); GaleriaAdmin.render();
      } catch(e) { Toast.error('Error: '+e.message); }
    });
  }
};
