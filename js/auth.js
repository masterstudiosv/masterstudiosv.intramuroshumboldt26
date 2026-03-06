const Auth = {
  SESSION_KEY: 'ih2026_session',

  async login() {
    const usuario  = document.getElementById('login-user').value.trim();
    const password = document.getElementById('login-pass').value;
    const errEl    = document.getElementById('login-error');
    const btn      = document.getElementById('login-btn');
    if (!usuario || !password) {
      errEl.textContent = 'Ingresa usuario y contraseña.';
      errEl.classList.remove('hidden'); return;
    }
    btn.textContent = 'Conectando...'; btn.disabled = true;
    errEl.classList.add('hidden');
    try {
      await DB.load();  // Carga TODOS los datos desde el Sheet
      const user = DB.getUsuarioByCredentials(usuario, password);
      if (!user) {
        errEl.textContent = 'Usuario o contraseña incorrectos.';
        errEl.classList.remove('hidden');
        document.getElementById('login-pass').value = '';
        return;
      }
      this.setSession(user);
      App.boot();
    } catch(e) {
      errEl.textContent = 'Error de conexión: ' + e.message;
      errEl.classList.remove('hidden');
    } finally {
      btn.textContent = 'INGRESAR AL SISTEMA'; btn.disabled = false;
    }
  },

  logout()        { this.clearSession(); location.reload(); },
  setSession(u)   { sessionStorage.setItem(this.SESSION_KEY, JSON.stringify({id:u.id,usuario:u.usuario,rol:u.rol,nombre:u.nombre})); },
  getSession()    { try{return JSON.parse(sessionStorage.getItem(this.SESSION_KEY));}catch{return null;} },
  clearSession()  { sessionStorage.removeItem(this.SESSION_KEY); },
  isLoggedIn()    { return !!this.getSession(); },
  getRole()       { return this.getSession()?.rol || null; },
  isAdmin()       { return this.getRole() === 'admin'; },
  isArbitro()     { return ['admin','arbitro'].includes(this.getRole()); },
  can(a) {
    const p = {admin:['view','manage','live','users'], arbitro:['view','live'], viewer:['view']};
    return (p[this.getRole()]||[]).includes(a);
  },
};
