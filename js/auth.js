/* ════════════════════════════════════════════════
   AUTH.JS — Autenticación segura
   ────────────────────────────────────────────────
   Flujo seguro:
   1. Usuario ingresa contraseña en el formulario
   2. El cliente calcula SHA-256 de la contraseña
   3. Se envía SOLO el hash al servidor (nunca el plano)
   4. El servidor compara hash con hash almacenado
   5. El servidor devuelve solo {id, usuario, rol, nombre}
   6. Nunca se almacenan ni transmiten contraseñas en plano
════════════════════════════════════════════════ */

/* ─── SHA-256 nativo en el navegador ─────────── */
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data     = encoder.encode(password);
  const hashBuf  = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

const Auth = {
  SESSION_KEY: 'ih2026_session',
  _loginAttempts: 0,
  _lockUntil: 0,

  async login() {
    const usuario  = document.getElementById('login-user').value.trim();
    const password = document.getElementById('login-pass').value;
    const errEl    = document.getElementById('login-error');
    const btn      = document.getElementById('login-btn');

    errEl.classList.add('hidden');

    if (!usuario || !password) {
      errEl.textContent = 'Ingresa usuario y contraseña.';
      errEl.classList.remove('hidden'); return;
    }

    // Rate limiting en el cliente (no sustituye al del servidor)
    if (Date.now() < this._lockUntil) {
      const seg = Math.ceil((this._lockUntil - Date.now()) / 1000);
      errEl.textContent = `Demasiados intentos. Espera ${seg} segundos.`;
      errEl.classList.remove('hidden'); return;
    }

    btn.textContent = 'Verificando...'; btn.disabled = true;

    try {
      // Hash de la contraseña — el plano NUNCA sale del navegador
      const passwordHash = await hashPassword(password);

      // Login server-side: el servidor verifica el hash
      const result = await API.call('login', { usuario, passwordHash });

      // Éxito — resetear contador de intentos
      this._loginAttempts = 0;
      this._lockUntil = 0;

      // Guardar sesión (solo id, usuario, rol, nombre — sin hash)
      this.setSession(result);
      App.boot();

    } catch(e) {
      document.getElementById('login-pass').value = '';

      this._loginAttempts++;
      // Bloqueo progresivo: 3 intentos → 30s, 5 → 120s
      if (this._loginAttempts >= 5) {
        this._lockUntil = Date.now() + 120000;
        errEl.textContent = 'Demasiados intentos. Bloqueado 2 minutos.';
      } else if (this._loginAttempts >= 3) {
        this._lockUntil = Date.now() + 30000;
        errEl.textContent = 'Credenciales incorrectas. Bloqueado 30 segundos.';
      } else {
        errEl.textContent = 'Usuario o contraseña incorrectos.';
      }
      errEl.classList.remove('hidden');
    } finally {
      btn.textContent = 'INGRESAR AL SISTEMA'; btn.disabled = false;
    }
  },

  logout()      { this.clearSession(); location.reload(); },
  setSession(u) { sessionStorage.setItem(this.SESSION_KEY, JSON.stringify({id:u.id,usuario:u.usuario,rol:u.rol,nombre:u.nombre})); },
  getSession()  { try{return JSON.parse(sessionStorage.getItem(this.SESSION_KEY));}catch{return null;} },
  clearSession(){ sessionStorage.removeItem(this.SESSION_KEY); },
  isLoggedIn()  { return !!this.getSession(); },
  getRole()     { return this.getSession()?.rol || null; },
  isAdmin()     { return this.getRole() === 'admin'; },
  isArbitro()   { return ['admin','arbitro'].includes(this.getRole()); },
  can(a) {
    const p = {admin:['view','manage','live','users'], arbitro:['view','live'], viewer:['view']};
    return (p[this.getRole()]||[]).includes(a);
  },
};
