const Notices = {
  render(limit = 0){
    const el   = document.getElementById('avisos-wrap'); if (!el) return;
    const list = DB.getAvisos();
    const shown = limit > 0 ? list.slice(0, limit) : list;
    const ico  = { important:'🚨', info:'📌', normal:'📋' };

    if (!shown.length) {
      el.innerHTML = '<div class="empty"><div class="empty-ico">📢</div><div class="empty-t">Sin avisos publicados aún</div></div>';
      return;
    }

    el.innerHTML = shown.map(n => `
      <div class="notice-card ${n.tipo||'normal'}">
        <div class="nc-hd">
          <div class="nc-ico">${ico[n.tipo]||'📋'}</div>
          <div style="flex:1">
            <div class="nc-ttl">${n.titulo||'Sin título'}</div>
            <div class="nc-dt">${n.fecha ? fmtDate(n.fecha) : ''}</div>
          </div>
        </div>
        ${n.texto ? `<div class="nc-body">${n.texto}</div>` : ''}
        ${n.imgUrl && n.imgUrl.startsWith('http') ? `<img src="${n.imgUrl}" class="nc-img" alt="" onerror="this.style.display='none'"/>` : ''}
      </div>`).join('');
  },
};
