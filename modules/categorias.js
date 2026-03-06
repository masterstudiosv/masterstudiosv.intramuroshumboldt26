const Categorias = {
  render() {
    const cats = DB.getCategorias();
    document.getElementById('content-area').innerHTML = `<div class="fade-in">
      <div class="section-header">
        <div><div class="section-title">CATEGORÍAS</div>
          <div class="section-sub">${cats.length} categorías registradas</div></div>
        ${Auth.isAdmin()?`<button class="btn btn-primary" onclick="Categorias.formNueva()">+ Nueva Categoría</button>`:''}
      </div>
      <div class="card"><div class="table-wrap"><table class="data-table">
        <thead><tr><th>#</th><th>Nombre</th><th>Descripción</th><th>Equipos</th><th>Partidos</th><th>Estado</th>${Auth.isAdmin()?'<th>Acciones</th>':''}</tr></thead>
        <tbody>${cats.length ? cats.map((c,i)=>{
          const eqs=DB.getEquiposByCategoria(c.id).length;
          const pts=DB.getPartidosByCategoria(c.id).length;
          return `<tr>
            <td><span class="rank-num">${i+1}</span></td>
            <td><span style="font-family:'Bebas Neue',cursive;font-size:18px">${c.nombre}</span></td>
            <td style="color:var(--gray);font-size:13px">${c.descripcion||'—'}</td>
            <td><strong>${eqs}</strong></td><td><strong>${pts}</strong></td>
            <td>${UI.estadoBadge(c.estado)}</td>
            ${Auth.isAdmin()?`<td>
              <button class="btn btn-sm btn-secondary" onclick="Categorias.formEditar('${c.id}')">✏️</button>
              <button class="btn btn-sm" style="background:rgba(255,80,80,.1);color:#ff5050" onclick="Categorias.toggle('${c.id}')">
                ${c.estado==='activo'?'Desactivar':'Activar'}</button>
            </td>`:''}
          </tr>`;
        }).join('') : `<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--gray)">Sin categorías. Crea la primera.</td></tr>`}
        </tbody>
      </table></div></div></div>`;
  },

  formNueva()     { this._form(null); },
  formEditar(id)  { this._form(DB.getCategoria(id)); },

  _form(cat) {
    Modal.open(`
      <div class="modal-header">
        <h3 class="modal-title">${cat?'✏️ Editar':'➕ Nueva'} Categoría</h3>
        <button class="modal-close" onclick="Modal.close()">✕</button>
      </div>
      <div class="modal-body">
        <div class="form-group"><label class="form-label">Nombre *</label>
          <input class="form-input" id="cat-nombre" value="${cat?.nombre||''}" placeholder="Ej: Sub-15"/></div>
        <div class="form-group"><label class="form-label">Descripción</label>
          <input class="form-input" id="cat-desc" value="${cat?.descripcion||''}" placeholder="Descripción opcional"/></div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="Modal.close()">Cancelar</button>
        <button id="cat-save-btn" class="btn btn-primary" onclick="Categorias.guardar('${cat?.id||''}')">💾 Guardar</button>
      </div>`);
    setTimeout(()=>document.getElementById('cat-nombre')?.focus(),100);
  },

  async guardar(id) {
    const nombre=document.getElementById('cat-nombre').value.trim();
    const desc  =document.getElementById('cat-desc').value.trim();
    if(!nombre){Toast.error('El nombre es obligatorio.');return;}
    const btn=document.getElementById('cat-save-btn');
    btn.textContent='Guardando...'; btn.disabled=true;
    try {
      await DB.saveCategoria({id:id||undefined,nombre,descripcion:desc,estado:'activo'});
      Toast.success(`Categoría ${id?'actualizada':'creada'}.`);
      Modal.close(); this.render();
    } catch(e){ Toast.error('Error: '+e.message); btn.textContent='💾 Guardar'; btn.disabled=false; }
  },

  async toggle(id) {
    try {
      await DB.toggleCategoria(id);
      Toast.info('Estado actualizado.'); this.render();
    } catch(e){ Toast.error('Error: '+e.message); }
  },
};
