/* ════════════════════════════════════════════════
   UI.JS — Utilidades de interfaz
════════════════════════════════════════════════ */
const UI = {
  sidebarOpen: false,

  setPageTitle(title) {
    document.getElementById('page-title').textContent = title;
  },

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
    document.getElementById('sidebar').classList.toggle('open', this.sidebarOpen);
  },

  closeSidebar() {
    this.sidebarOpen = false;
    document.getElementById('sidebar').classList.remove('open');
  },

  setActiveNav(route) {
    document.querySelectorAll('.nav-item').forEach(el => {
      el.classList.toggle('active', el.dataset.route === route);
    });
  },

  renderSidebar() {
    const user = Auth.getSession();
    const isAdmin   = Auth.isAdmin();
    const isArbitro = Auth.isArbitro();

    document.getElementById('sidebar-username').textContent = user?.nombre || 'Usuario';
    document.getElementById('sidebar-role').textContent = { admin:'Administrador', arbitro:'Árbitro', viewer:'Espectador' }[user?.rol] || '';
    document.getElementById('sidebar-avatar').textContent = (user?.nombre || 'U')[0].toUpperCase();

    const nav = document.getElementById('sidebar-nav');
    const items = [
      { section: 'GENERAL' },
      { route:'dashboard',    icon:'⚡', label:'Dashboard',          roles:['admin','arbitro','viewer'] },
      { route:'partidos',     icon:'⚽', label:'Partidos',           roles:['admin','arbitro','viewer'] },
      { route:'estadisticas', icon:'📊', label:'Estadísticas',       roles:['admin','arbitro','viewer'] },
      { route:'equipos',      icon:'🛡️', label:'Equipos',            roles:['admin','arbitro','viewer'] },
      { section: 'ADMINISTRACIÓN', adminOnly: true },
      { route:'categorias',   icon:'🏷️', label:'Categorías',         roles:['admin'] },
      { route:'jugadores',    icon:'👤', label:'Jugadores',           roles:['admin'] },
      { route:'arbitros',     icon:'🟨', label:'Árbitros',            roles:['admin'] },
      { route:'usuarios',     icon:'🔐', label:'Usuarios',            roles:['admin'] },
      { section: 'PÁGINA PÚBLICA', adminOnly: true },
      { route:'carrusel',     icon:'🖼️', label:'Carrusel',            roles:['admin'] },
      { route:'avisos',       icon:'📢', label:'Avisos del Torneo',   roles:['admin'] },
      { route:'galeria',      icon:'📷', label:'Galería de Fotos',    roles:['admin'] },
      { section: 'SISTEMA', adminOnly: true },
      { route:'conexion',     icon:'⚙️', label:'Conexión y Estado',   roles:['admin'] },
    ];

    nav.innerHTML = items.map(item => {
      if (item.section) {
        if (item.adminOnly && !isAdmin) return '';
        return `<div class="nav-section">${item.section}</div>`;
      }
      if (!item.roles.includes(user?.rol)) return '';
      return `<div class="nav-item" data-route="${item.route}" onclick="Router.go('${item.route}')">
        <span class="nav-icon">${item.icon}</span>${item.label}
      </div>`;
    }).join('');
  },

  startClock() {
    const el = document.getElementById('topbar-time');
    const tick = () => {
      const now = new Date();
      el.textContent = now.toLocaleTimeString('es-MX', { hour:'2-digit', minute:'2-digit' });
    };
    tick();
    setInterval(tick, 1000);
  },

  showLiveIndicator(show) {
    document.getElementById('live-indicator').style.display = show ? 'flex' : 'none';
  },

  // Helper: image file → base64
  fileToBase64(file) {
    return new Promise((res, rej) => {
      if (!file) return res('');
      const allowed = ['image/jpeg','image/jpg','image/png'];
      if (!allowed.includes(file.type)) return rej(new Error('Solo se permiten imágenes JPG o PNG'));
      if (file.size > 2 * 1024 * 1024) return rej(new Error('La imagen no debe superar 2MB'));
      const reader = new FileReader();
      reader.onload = e => res(e.target.result);
      reader.onerror = () => rej(new Error('Error al leer el archivo'));
      reader.readAsDataURL(file);
    });
  },

  // Render player avatar (base64 or placeholder)
  playerAvatar(foto64, name = '?', size = 40) {
    if (foto64 && foto64.startsWith('data:')) {
      return `<img src="${foto64}" style="width:${size}px;height:${size}px;border-radius:50%;object-fit:cover;" />`;
    }
    const letter = (name||'?')[0].toUpperCase();
    return `<div style="width:${size}px;height:${size}px;border-radius:50%;background:var(--red);display:flex;align-items:center;justify-content:center;font-family:'Bebas Neue',cursive;font-size:${Math.round(size*0.45)}px;color:white;flex-shrink:0;">${letter}</div>`;
  },

  estadoBadge(estado) {
    const map = {
      finalizado:  ['badge-gray',  'FINALIZADO'],
      en_juego:    ['badge-live',  '⚽ EN JUEGO'],
      pausado:     ['badge-yellow','⏸ PAUSADO'],
      programado:  ['badge-green', 'PROGRAMADO'],
      pendiente:   ['badge-white', 'PENDIENTE'],
      inactivo:    ['badge-gray',  'INACTIVO'],
      activo:      ['badge-green', 'ACTIVO'],
    };
    const [cls, lbl] = map[estado] || ['badge-gray', estado?.toUpperCase() || 'N/A'];
    return `<span class="badge ${cls}">${lbl}</span>`;
  },

  posicionBadge(pos) {
    if (!pos) return '';
    const map = { Portero:'badge-blue', Portera:'badge-blue', Defensa:'badge-green', Mediocampista:'badge-yellow', Delantero:'badge-red', Delantera:'badge-red', Extremo:'badge-white' };
    const cls = map[pos] || 'badge-gray';
    return `<span class="badge ${cls}" style="font-size:10px">${pos}</span>`;
  },

  formatDate(d) {
    if (!d) return '—';
    const [y,m,day] = d.split('-');
    const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    return `${day} ${months[+m-1]} ${y}`;
  },

  confirmDialog(msg, onConfirm, danger = true) {
    Modal.open(`<div class="modal-header"><span class="modal-title">Confirmar</span><button class="modal-close" onclick="Modal.close()">✕</button></div>
    <div class="modal-body">
      <div class="confirm-icon">${danger ? '⚠️' : '❓'}</div>
      <p class="confirm-msg">${msg}</p>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="Modal.close()">Cancelar</button>
      <button class="btn ${danger?'btn-primary':'btn-success'}" onclick="Modal.close();(${onConfirm.toString()})()">Confirmar</button>
    </div>`);
  }
};

/* ════════════════════════════════════════════════
   MODAL.JS
════════════════════════════════════════════════ */
const Modal = {
  open(html, size = '') {
    const box = document.getElementById('modal-box');
    box.className = `modal-box ${size}`;
    document.getElementById('modal-content').innerHTML = html;
    document.getElementById('modal-overlay').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  },
  close() {
    document.getElementById('modal-overlay').classList.add('hidden');
    document.getElementById('modal-content').innerHTML = '';
    document.body.style.overflow = '';
  },
  closeOnOverlay(e) {
    if (e.target === document.getElementById('modal-overlay')) this.close();
  }
};

/* ════════════════════════════════════════════════
   TOAST.JS
════════════════════════════════════════════════ */
const Toast = {
  show(msg, type = 'info', duration = 3500) {
    const icons = { success:'✅', error:'❌', warning:'⚠️', info:'ℹ️' };
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.innerHTML = `<span>${icons[type]||'ℹ️'}</span><span>${msg}</span>`;
    document.getElementById('toast-container').appendChild(el);
    setTimeout(() => {
      el.classList.add('toast-out');
      setTimeout(() => el.remove(), 300);
    }, duration);
  },
  success(m) { this.show(m,'success'); },
  error(m)   { this.show(m,'error',5000); },
  warning(m) { this.show(m,'warning'); },
  info(m)    { this.show(m,'info'); },
};
