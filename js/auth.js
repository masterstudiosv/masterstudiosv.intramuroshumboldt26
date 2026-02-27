// AUTH — usa DB como fuente de verdad
const Auth = {
  SESSION_KEY: "ih_session",

  async login(username, password) {
    const user = await DB.login(username, password);
    if (user) {
      sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(user));
      return user;
    }
    return null;
  },

  logout() {
    sessionStorage.removeItem(this.SESSION_KEY);
    window.location.href = "index.html";
  },

  getCurrentUser() {
    const s = sessionStorage.getItem(this.SESSION_KEY);
    return s ? JSON.parse(s) : null;
  },

  isAdmin()   { const u = this.getCurrentUser(); return u && u.role === "admin"; },
  isArbitro() { const u = this.getCurrentUser(); return u && (u.role === "arbitro" || u.role === "admin"); },

  requireAdmin(redirect = true) {
    if (!this.isAdmin()) { if (redirect) window.location.href = "index.html"; return false; }
    return true;
  },
  requireArbitro(redirect = true) {
    if (!this.isArbitro()) { if (redirect) window.location.href = "index.html"; return false; }
    return true;
  },
};

if (typeof window !== "undefined") window.Auth = Auth;
