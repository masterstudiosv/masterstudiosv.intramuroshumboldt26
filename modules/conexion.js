/* ════════════════════════════════════════════════
   CONEXION.JS — Estado de conexión y resumen
   del sistema. Muestra si el Sheet está conectado
   y cuántos registros hay en cada hoja.
════════════════════════════════════════════════ */
const Conexion = {
  async render() {
    const el = document.getElementById('content-area');
    el.innerHTML = `<div class="fade-in">
      <div class="section-header">
        <div><div class="section-title">⚙️ CONEXIÓN AL SISTEMA</div>
          <div class="section-sub">Estado de Google Sheets y datos registrados</div></div>
        <button class="btn btn-primary" onclick="Conexion.render()">🔄 Verificar</button>
      </div>
      <div id="cx-status">
        <div style="display:flex;align-items:center;gap:12px;padding:20px;background:var(--black3);border-radius:10px;margin-bottom:20px">
          <div style="width:12px;height:12px;border-radius:50%;background:var(--yellow);animation:pulse 1s infinite"></div>
          <span style="color:var(--gray)">Verificando conexión con Google Sheets...</span>
        </div>
      </div>
    </div><style>@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}</style>`;

    try {
      const start = Date.now();
      await DB.load();
      const ms = Date.now() - start;

      const stats = [
        { key:'usuarios',   label:'Usuarios',    icon:'🔐' },
        { key:'categorias', label:'Categorías',   icon:'🏷️' },
        { key:'equipos',    label:'Equipos',      icon:'🛡️' },
        { key:'jugadores',  label:'Jugadores',    icon:'👤' },
        { key:'arbitros',   label:'Árbitros',     icon:'🟨' },
        { key:'partidos',   label:'Partidos',     icon:'⚽' },
        { key:'eventos',    label:'Eventos',      icon:'📋' },
        { key:'carousel',   label:'Slides Carrusel', icon:'🖼️' },
        { key:'avisos',     label:'Avisos',       icon:'📢' },
      ];

      document.getElementById('cx-status').innerHTML = `
        <!-- Conexión OK -->
        <div style="display:flex;align-items:center;gap:14px;padding:20px 24px;background:rgba(34,197,94,.08);border:1px solid rgba(34,197,94,.2);border-radius:10px;margin-bottom:24px">
          <div style="width:14px;height:14px;border-radius:50%;background:#22c55e;flex-shrink:0"></div>
          <div>
            <div style="font-weight:700;color:#22c55e;font-size:15px">✅ Conexión exitosa</div>
            <div style="font-size:12px;color:var(--gray);margin-top:3px">
              Google Apps Script responde · Tiempo: <strong>${ms}ms</strong> ·
              URL: <span style="font-family:monospace;font-size:11px">${CONFIG.APPS_SCRIPT_URL.slice(0,60)}...</span>
            </div>
          </div>
        </div>

        <!-- Info del Sheet -->
        <div style="background:var(--black3);border:1px solid var(--black4);border-radius:10px;padding:20px;margin-bottom:20px">
          <div style="font-family:'Bebas Neue',cursive;font-size:18px;margin-bottom:14px;letter-spacing:1px">📊 GOOGLE SPREADSHEET</div>
          <div style="display:flex;flex-direction:column;gap:8px">
            <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--black4)">
              <span style="color:var(--gray);font-size:13px">ID del Spreadsheet</span>
              <span style="font-family:monospace;font-size:12px;color:var(--yellow)">${CONFIG.SPREADSHEET_ID||'No configurado'}</span>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0">
              <span style="color:var(--gray);font-size:13px">Enlace directo</span>
              <a href="https://docs.google.com/spreadsheets/d/${CONFIG.SPREADSHEET_ID}" target="_blank"
                style="color:var(--yellow);font-size:13px;text-decoration:none">
                🔗 Abrir Google Sheets →
              </a>
            </div>
          </div>
        </div>

        <!-- Conteo por hoja -->
        <div style="background:var(--black3);border:1px solid var(--black4);border-radius:10px;padding:20px;margin-bottom:20px">
          <div style="font-family:'Bebas Neue',cursive;font-size:18px;margin-bottom:14px;letter-spacing:1px">📋 DATOS EN EL SISTEMA</div>
          <div class="grid-stats">
            ${stats.map(s=>{
              const n = DB.getSheet(s.key).length;
              return `<div style="background:var(--black4);border-radius:8px;padding:14px;text-align:center">
                <div style="font-size:22px;margin-bottom:6px">${s.icon}</div>
                <div style="font-family:'Bebas Neue',cursive;font-size:28px;color:${n>0?'var(--yellow)':'var(--gray)'}">${n}</div>
                <div style="font-size:11px;color:var(--gray);margin-top:2px">${s.label}</div>
              </div>`;
            }).join('')}
          </div>
        </div>

        <!-- Usuario actual -->
        <div style="background:var(--black3);border:1px solid var(--black4);border-radius:10px;padding:20px">
          <div style="font-family:'Bebas Neue',cursive;font-size:18px;margin-bottom:14px;letter-spacing:1px">👤 SESIÓN ACTUAL</div>
          <div style="display:flex;flex-direction:column;gap:8px">
            ${[
              ['Usuario',   Auth.getSession()?.usuario || '—'],
              ['Nombre',    Auth.getSession()?.nombre  || '—'],
              ['Rol',       {admin:'Administrador',arbitro:'Árbitro',viewer:'Espectador'}[Auth.getRole()]||'—'],
              ['ID sesión', Auth.getSession()?.id       || '—'],
            ].map(([k,v])=>`
              <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid var(--black4)">
                <span style="color:var(--gray);font-size:13px">${k}</span>
                <span style="font-size:13px;font-weight:600">${v}</span>
              </div>`).join('')}
          </div>
        </div>`;

    } catch(e) {
      document.getElementById('cx-status').innerHTML = `
        <div style="display:flex;align-items:flex-start;gap:14px;padding:20px 24px;background:rgba(232,25,44,.08);border:1px solid rgba(232,25,44,.25);border-radius:10px">
          <div style="width:14px;height:14px;border-radius:50%;background:var(--red);flex-shrink:0;margin-top:3px"></div>
          <div>
            <div style="font-weight:700;color:var(--red);font-size:15px">❌ Error de conexión</div>
            <div style="font-size:13px;color:var(--gray);margin-top:6px">${e.message}</div>
            <div style="font-size:12px;color:var(--gray);margin-top:10px;line-height:1.6">
              <b>Posibles causas:</b><br>
              1. La URL del Apps Script no es correcta en <code>js/config.js</code><br>
              2. El script no está implementado como "Aplicación web"<br>
              3. El acceso no está configurado como "Cualquier usuario"<br>
              4. Necesitas hacer una nueva implementación tras modificar el script
            </div>
            <div style="margin-top:12px">
              <a href="https://docs.google.com/spreadsheets/d/${CONFIG.SPREADSHEET_ID||''}" target="_blank"
                class="btn btn-secondary btn-sm">🔗 Abrir Google Sheets</a>
            </div>
          </div>
        </div>`;
    }
  },
};
