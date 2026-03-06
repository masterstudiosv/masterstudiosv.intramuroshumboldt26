const CarruselAdmin = {
  render() {
    const slides = DB.getCarouselAll();
    document.getElementById('content-area').innerHTML = `<div class="fade-in">
      <div class="section-header">
        <div><div class="section-title">CARRUSEL</div>
          <div class="section-sub">${slides.length} slides — aparecen en la portada pública</div></div>
        <button class="btn btn-primary" onclick="CarruselAdmin.form()">+ Nuevo Slide</button>
      </div>
      ${slides.length ? `<div class="grid-3">${slides.map(s=>`
        <div class="card" style="overflow:hidden">
          <div style="height:130px;background:${s.color||'var(--red)'};position:relative;overflow:hidden">
            ${s.imgUrl&&s.imgUrl.startsWith('http') ? `<img src="${s.imgUrl}" style="width:100%;height:100%;object-fit:cover" onerror="this.style.display='none'">` : ''}
            <div style="position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,.7),transparent);display:flex;align-items:flex-end;padding:10px">
              <span style="font-family:'Bebas Neue',cursive;font-size:16px;color:#fff">${s.titulo||''}</span>
            </div>
            <div style="position:absolute;top:8px;right:8px">
              ${s.activo==='true'||s.activo===true
                ?'<span style="background:rgba(34,197,94,.9);color:#fff;font-size:10px;padding:2px 7px;border-radius:3px;font-weight:700">ACTIVO</span>'
                :'<span style="background:rgba(0,0,0,.7);color:#888;font-size:10px;padding:2px 7px;border-radius:3px">OCULTO</span>'}
            </div>
          </div>
          <div style="padding:12px">
            ${s.tag?`<span style="font-size:10px;background:rgba(232,25,44,.12);color:var(--red);padding:2px 8px;border-radius:3px;letter-spacing:1px">${s.tag}</span>`:''}
            ${s.descripcion?`<div style="font-size:12px;color:var(--gray);margin-top:6px">${s.descripcion.slice(0,70)}${s.descripcion.length>70?'...':''}</div>`:''}
          </div>
          <div style="padding:8px 12px;border-top:1px solid var(--black4);display:flex;gap:6px">
            <button class="btn btn-secondary btn-sm" onclick="CarruselAdmin.form('${s.id}')">✏️ Editar</button>
            <button class="btn btn-sm" style="background:rgba(255,80,80,.1);color:#ff5050" onclick="CarruselAdmin.eliminar('${s.id}')">🗑️</button>
          </div>
        </div>`).join('')}</div>`
      : `<div class="empty-state"><div class="empty-icon">🖼️</div><div class="empty-title">Sin slides</div></div>`}
    </div>`;
  },

  form(id) {
    const all = DB.getCarouselAll();
    const s   = id ? all.find(x=>x.id===id) : null;
    Modal.open(`
      <div class="modal-header">
        <h3 class="modal-title">${s?'✏️ Editar':'➕ Nuevo'} Slide</h3>
        <button class="modal-close" onclick="Modal.close()">✕</button>
      </div>
      <div class="modal-body">
        <div class="form-group"><label class="form-label">Título *</label>
          <input class="form-input" id="sl-t" value="${(s?.titulo||'').replace(/"/g,'&quot;')}" placeholder="Ej: INTRAMUROS 2026"/></div>
        <div class="form-group"><label class="form-label">Descripción</label>
          <textarea class="form-input" id="sl-d" rows="3" placeholder="Texto descriptivo del slide...">${s?.descripcion||''}</textarea></div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">Etiqueta (badge)</label>
            <input class="form-input" id="sl-tag" value="${s?.tag||''}" placeholder="Ej: TEMPORADA ACTIVA"/></div>
          <div class="form-group"><label class="form-label">Color de fondo</label>
            <input type="color" class="form-input" id="sl-c" value="${s?.color||'#E8192C'}" style="height:42px;cursor:pointer;padding:4px"/></div>
        </div>
        <div class="form-group">
          <label class="form-label">URL de imagen <span style="color:var(--gray);font-weight:400">(pega un link de imagen de internet)</span></label>
          <input class="form-input" id="sl-img" value="${s?.imgUrl||''}" placeholder="https://ejemplo.com/imagen.jpg" oninput="CarruselAdmin._preview(this.value)"/>
          <div id="sl-prev-wrap" style="margin-top:8px;${s?.imgUrl&&s.imgUrl.startsWith('http')?'':'display:none'}">
            <img id="sl-prev" src="${s?.imgUrl||''}" style="max-height:100px;border-radius:6px;border:1px solid var(--black4)" onerror="document.getElementById('sl-prev-wrap').style.display='none'"/>
          </div>
          <div style="font-size:11px;color:var(--gray);margin-top:5px">💡 Tip: usa <a href="https://imgur.com" target="_blank" style="color:var(--yellow)">imgur.com</a> o <a href="https://postimages.org" target="_blank" style="color:var(--yellow)">postimages.org</a> para subir y obtener un link</div>
        </div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">Orden</label>
            <input type="number" class="form-input" id="sl-orden" value="${s?.orden||all.length+1}" min="1"/></div>
          <div class="form-group"><label class="form-label">Visibilidad</label>
            <select class="form-input" id="sl-activo">
              <option value="true"  ${s?.activo==='true'||s?.activo===true?'selected':''}>✓ Visible</option>
              <option value="false" ${s?.activo==='false'||s?.activo===false?'selected':''}>✗ Oculto</option>
            </select></div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="Modal.close()">Cancelar</button>
        <button id="sl-save-btn" class="btn btn-primary" onclick="CarruselAdmin.guardar('${s?.id||''}')">💾 Guardar Slide</button>
      </div>`);
    setTimeout(()=>document.getElementById('sl-t')?.focus(),100);
  },

  _preview(url) {
    const wrap = document.getElementById('sl-prev-wrap');
    const img  = document.getElementById('sl-prev');
    if (url && url.startsWith('http')) {
      img.src = url; wrap.style.display = '';
    } else { wrap.style.display = 'none'; }
  },

  async guardar(id) {
    const titulo = document.getElementById('sl-t').value.trim();
    if (!titulo) { Toast.error('El título es obligatorio.'); return; }
    const btn = document.getElementById('sl-save-btn');
    btn.textContent = 'Guardando...'; btn.disabled = true;
    try {
      const all = DB.getCarouselAll();
      const existing = id ? all.find(x=>x.id===id) : null;
      await DB.saveCarouselSlide({
        ...(existing||{}),
        id: id || ('CAR'+Date.now()),
        titulo,
        descripcion: document.getElementById('sl-d').value.trim(),
        tag:         document.getElementById('sl-tag').value.trim(),
        color:       document.getElementById('sl-c').value,
        imgUrl:      document.getElementById('sl-img').value.trim(),
        orden:       document.getElementById('sl-orden').value || (all.length+1),
        activo:      document.getElementById('sl-activo').value,
      });
      Toast.success(`Slide ${id?'actualizado':'creado'} ✔`);
      Modal.close(); this.render();
    } catch(e) { Toast.error('Error: '+e.message); btn.textContent='💾 Guardar Slide'; btn.disabled=false; }
  },

  async eliminar(id) {
    const s = DB.getCarouselAll().find(x=>x.id===id);
    UI.confirmDialog(`¿Eliminar slide <b>${s?.titulo}</b>?`, async () => {
      try { await DB.deleteCarouselSlide(id); Toast.success('Slide eliminado.'); CarruselAdmin.render(); }
      catch(e) { Toast.error('Error: '+e.message); }
    });
  },
};
