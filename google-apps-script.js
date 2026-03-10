/**
 * ══════════════════════════════════════════════════
 *  GOOGLE APPS SCRIPT — Intramuros Humboldt 2026
 *  VERSIÓN SEGURA
 *
 *  INSTRUCCIONES DE CONFIGURACIÓN:
 *  1. Abre tu Google Sheet
 *  2. Extensiones → Apps Script
 *  3. Borra todo y pega este archivo completo
 *  4. Guardar (Ctrl+S)
 *
 *  ── PASO CRÍTICO DE SEGURIDAD ──────────────────
 *  5. En el menú lateral izquierdo de Apps Script,
 *     haz clic en ⚙️ "Configuración del proyecto"
 *     → "Propiedades de script" → "+ Agregar propiedad"
 *     Agrega EXACTAMENTE esto:
 *
 *       Propiedad: WRITE_TOKEN
 *       Valor:     [inventa una clave larga y difícil, ej: "xK9#mP2$wQ7!nR4@hJ6&"]
 *
 *     ⚠️  NUNCA compartas este valor.
 *     ⚠️  NUNCA lo pongas en config.js ni en GitHub.
 *     ⚠️  Sin este token, nadie puede escribir datos.
 *
 *  6. Ejecutar → inicializarSistema (solo la primera vez)
 *  7. Implementar → Nueva implementación
 *     - Tipo: Aplicación web
 *     - Ejecutar como: Yo
 *     - Acceso: Cualquier usuario (incluso anónimos)
 *  8. Copia la URL → pega en js/config.js → APPS_SCRIPT_URL
 * ══════════════════════════════════════════════════
 */

const SS = () => SpreadsheetApp.getActiveSpreadsheet();

/* ─── Token secreto — NUNCA en el cliente ────────
   Se lee de Script Properties (configurado manualmente).
   Si no existe, todas las escrituras son rechazadas.   */
function getWriteToken() {
  return PropertiesService.getScriptProperties().getProperty('WRITE_TOKEN') || '';
}

/* ─── Guard: verificar token antes de escribir ─── */
function requireWriteToken(payload) {
  const expected = getWriteToken();
  if (!expected) throw new Error('No autorizado.');
  if (!payload || payload.wt !== expected) throw new Error('No autorizado.');
}

/* ─── Hojas PÚBLICAS (sin usuarios ni contraseñas) */
const SHEETS = {
  categorias: 'Categorias',
  equipos:    'Equipos',
  jugadores:  'Jugadores',
  arbitros:   'Arbitros',
  partidos:   'Partidos',
  eventos:    'Eventos',
  carousel:   'Carousel',
  avisos:     'Avisos',
  galeria:    'Galeria',
};

const HEADERS = {
  Usuarios:   ['id','usuario','passwordHash','rol','nombre','estado'],
  Categorias: ['id','nombre','descripcion','estado'],
  Equipos:    ['id','categoriaId','nombre','seccion','imgUrl','estado'],
  Jugadores:  ['id','equipoId','nombre','numero','edad','posicion','fotoUrl','goles','amarillas','rojas','faltas','estado'],
  Arbitros:   ['id','usuarioId','nombre','telefono','estado'],
  Partidos:   ['id','serieId','numEnSerie','totalEnSerie','categoriaId','localId','visitanteId','arbitroId','fecha','hora','estado','golesLocal','golesVisitante','minutoActual','notas'],
  Eventos:    ['id','partidoId','tipo','jugadorId','equipoId','minuto','descripcion','timestamp'],
  Carousel:   ['id','titulo','descripcion','tag','imgUrl','color','orden','activo'],
  Avisos:     ['id','tipo','titulo','fecha','texto','imgUrl','activo','fechaCreacion'],
  Galeria:    ['id','titulo','descripcion','imgUrl','destacada','fecha'],
};

/* ─── Respuestas ─────────────────────────────── */
function ok(data) {
  return ContentService
    .createTextOutput(JSON.stringify({ success: true, data: data }))
    .setMimeType(ContentService.MimeType.JSON);
}
function fail(msg) {
  // Siempre mensaje genérico al cliente para no filtrar info interna
  const safe = (msg === 'No autorizado.') ? 'No autorizado.' : 'Error del servidor.';
  return ContentService
    .createTextOutput(JSON.stringify({ success: false, error: safe }))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ─── Hash SHA-256 (nativo en GAS) ─────────────
   Contraseñas NUNCA se guardan en texto plano.    */
function sha256(text) {
  const digest = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    text,
    Utilities.Charset.UTF_8
  );
  return digest.map(function(b){ return ('0' + (b & 0xff).toString(16)).slice(-2); }).join('');
}

/* ─── Leer hoja como array de objetos ─────────── */
function readSheet(name) {
  var sheet = SS().getSheetByName(name);
  if (!sheet || sheet.getLastRow() < 2) return [];
  var rows = sheet.getDataRange().getValues();
  var hdrs = rows[0].map(String);
  return rows.slice(1)
    .filter(function(r){ return r[0] !== '' && r[0] !== null; })
    .map(function(r) {
      var obj = {};
      hdrs.forEach(function(h, i) {
        var val = r[i];
        if (val == null || val === '') {
          obj[h] = '';
        } else if (val instanceof Date) {
          if (val.getFullYear() <= 1900) {
            obj[h] = String(val.getHours()).padStart(2,'0') + ':' + String(val.getMinutes()).padStart(2,'0');
          } else {
            var y  = val.getFullYear();
            var mo = String(val.getMonth()+1).padStart(2,'0');
            var d  = String(val.getDate()).padStart(2,'0');
            obj[h] = y+'-'+mo+'-'+d;
          }
        } else {
          obj[h] = String(val);
        }
      });
      return obj;
    });
}

/* ─── Generar ID único ───────────────────────── */
function genId(prefix) {
  return prefix + Date.now().toString(36).toUpperCase()
       + Math.random().toString(36).slice(2, 5).toUpperCase();
}

/* ─── Buscar fila por ID ─────────────────────── */
function findRowIndex(sheet, id) {
  var vals = sheet.getDataRange().getValues();
  for (var i = 1; i < vals.length; i++) {
    if (String(vals[i][0]) === String(id)) return i + 1;
  }
  return -1;
}

/* ─── Insertar o actualizar fila ──────────────── */
function upsert(sheetName, data) {
  var sheet   = SS().getSheetByName(sheetName);
  if (!sheet) throw new Error('Hoja no encontrada: ' + sheetName);
  var headers = HEADERS[sheetName];
  if (!headers) throw new Error('Headers no definidos: ' + sheetName);

  if (!data.id) data.id = genId(sheetName[0]);
  var row = headers.map(function(h){ return (data[h] !== undefined && data[h] !== null) ? String(data[h]) : ''; });

  var rowIdx = findRowIndex(sheet, data.id);
  if (rowIdx > 0) {
    sheet.getRange(rowIdx, 1, 1, row.length).setValues([row]);
  } else {
    sheet.appendRow(row);
  }
  return { id: data.id };
}

/* ─── Eliminar fila ──────────────────────────── */
function deleteById(sheetName, id) {
  var sheet = SS().getSheetByName(sheetName);
  if (!sheet) return false;
  var rowIdx = findRowIndex(sheet, id);
  if (rowIdx > 0) { sheet.deleteRow(rowIdx); return true; }
  return false;
}

/* ═══════════════════════════════════════════════
   doGet — ÚNICO endpoint
   ─────────────────────────────────────────────
   LECTURAS PÚBLICAS : getAllData, getSheet
     → solo datos no sensibles (usuarios EXCLUIDO)
   LOGIN SERVER-SIDE : action=login
     → verifica hash en servidor, devuelve solo rol/nombre
   ESCRITURAS        : todas requieren wt=WRITE_TOKEN
   ═══════════════════════════════════════════════ */
function doGet(e) {
  try {
    var action  = e.parameter.action;
    var payload = e.parameter.payload ? JSON.parse(e.parameter.payload) : {};

    /* ── LOGIN: verificación server-side ──────────
       El cliente envía hash SHA-256 de la contraseña.
       El servidor compara hashes. NUNCA devuelve
       el hash ni datos de otros usuarios.           */
    if (action === 'login') {
      var usuario      = payload.usuario      || '';
      var passwordHash = payload.passwordHash || '';
      if (!usuario || !passwordHash) return fail('Credenciales incompletas.');

      var usuarios = readSheet('Usuarios');
      var user = null;
      for (var i = 0; i < usuarios.length; i++) {
        if (usuarios[i].usuario === usuario &&
            usuarios[i].passwordHash === passwordHash &&
            (usuarios[i].estado === 'activo' || !usuarios[i].estado)) {
          user = usuarios[i];
          break;
        }
      }

      if (!user) {
        Utilities.sleep(600); // anti-brute-force
        return fail('No autorizado.');
      }

      // Solo devuelve campos seguros — NUNCA el hash
      return ok({ id: user.id, usuario: user.usuario, rol: user.rol, nombre: user.nombre });
    }

    /* ── DATOS PÚBLICOS ──────────────────────────
       Usuarios NUNCA incluido en getAllData         */
    if (action === 'getAllData') {
      var all = {};
      Object.keys(SHEETS).forEach(function(key) {
        all[key] = readSheet(SHEETS[key]);
      });
      return ok(all);
    }

    if (action === 'getSheet') {
      var sheetKey = payload.sheet || e.parameter.sheet;
      if (sheetKey === 'usuarios') return fail('No autorizado.'); // bloqueado explícitamente
      var name = SHEETS[sheetKey];
      if (!name) return fail('No autorizado.');
      return ok(readSheet(name));
    }

    /* ── ESCRITURAS: todas requieren WRITE_TOKEN ── */

    if (action === 'saveUsuario') {
      requireWriteToken(payload);
      // Si llega password en plano (creación), hashear
      if (payload.password) {
        payload.passwordHash = sha256(String(payload.password));
        delete payload.password;
      }
      // Si es edición sin nueva contraseña, preservar hash actual
      if (!payload.passwordHash && payload.id) {
        var existing = readSheet('Usuarios').filter(function(u){ return u.id === payload.id; })[0];
        if (existing) payload.passwordHash = existing.passwordHash;
      }
      return ok(upsert('Usuarios', payload));
    }
    if (action === 'deleteUsuario') {
      requireWriteToken(payload);
      return ok(deleteById('Usuarios', payload.id));
    }

    if (action === 'saveCategoria') {
      requireWriteToken(payload);
      return ok(upsert('Categorias', payload));
    }

    if (action === 'saveEquipo') {
      requireWriteToken(payload);
      return ok(upsert('Equipos', payload));
    }
    if (action === 'deleteEquipo') {
      requireWriteToken(payload);
      return ok(deleteById('Equipos', payload.id));
    }

    if (action === 'saveJugador') {
      requireWriteToken(payload);
      return ok(upsert('Jugadores', payload));
    }
    if (action === 'deleteJugador') {
      requireWriteToken(payload);
      return ok(deleteById('Jugadores', payload.id));
    }
    if (action === 'updateStatJugador') {
      requireWriteToken(payload);
      var jRows = readSheet('Jugadores');
      var jug = null;
      for (var ji = 0; ji < jRows.length; ji++) {
        if (jRows[ji].id === payload.id) { jug = jRows[ji]; break; }
      }
      if (jug) {
        jug[payload.stat] = String((parseFloat(jug[payload.stat]) || 0) + (parseFloat(payload.delta) || 1));
        upsert('Jugadores', jug);
      }
      return ok({ id: payload.id });
    }

    if (action === 'saveArbitro') {
      requireWriteToken(payload);
      return ok(upsert('Arbitros', payload));
    }
    if (action === 'deleteArbitro') {
      requireWriteToken(payload);
      return ok(deleteById('Arbitros', payload.id));
    }

    if (action === 'savePartido') {
      requireWriteToken(payload);
      return ok(upsert('Partidos', payload));
    }
    if (action === 'deletePartido') {
      requireWriteToken(payload);
      return ok(deleteById('Partidos', payload.id));
    }

    if (action === 'saveEvento') {
      requireWriteToken(payload);
      if (!payload.id) payload.id = genId('EV');
      return ok(upsert('Eventos', payload));
    }

    if (action === 'saveCarouselSlide') {
      requireWriteToken(payload);
      return ok(upsert('Carousel', payload));
    }
    if (action === 'deleteCarouselSlide') {
      requireWriteToken(payload);
      return ok(deleteById('Carousel', payload.id));
    }

    if (action === 'saveAviso') {
      requireWriteToken(payload);
      return ok(upsert('Avisos', payload));
    }
    if (action === 'deleteAviso') {
      requireWriteToken(payload);
      return ok(deleteById('Avisos', payload.id));
    }

    if (action === 'saveGaleria') {
      requireWriteToken(payload);
      return ok(upsert('Galeria', payload));
    }
    if (action === 'deleteGaleria') {
      requireWriteToken(payload);
      return ok(deleteById('Galeria', payload.id));
    }

    return fail('No autorizado.');

  } catch (err) {
    Logger.log('ERROR: ' + err.message + '\n' + err.stack);
    if (err.message === 'No autorizado.') return fail('No autorizado.');
    return fail('Error del servidor.');
  }
}

/* ═══════════════════════════════════════════════
   INICIALIZAR SISTEMA (ejecutar UNA sola vez)
   ═══════════════════════════════════════════════ */
function inicializarSistema() {
  var ss = SS();
  var ui = SpreadsheetApp.getUi();

  var wt = PropertiesService.getScriptProperties().getProperty('WRITE_TOKEN');
  if (!wt) {
    ui.alert(
      '⚠️  CONFIGURACIÓN REQUERIDA\n\n' +
      'Antes de continuar debes configurar el WRITE_TOKEN:\n\n' +
      '1. Menú lateral → ⚙️ Configuración del proyecto\n' +
      '2. Sección "Propiedades de script"\n' +
      '3. Clic en "+ Agregar propiedad"\n' +
      '4. Propiedad: WRITE_TOKEN\n' +
      '   Valor: [una clave larga y única, ej: xK9#mP2$wQ7]\n\n' +
      'Luego vuelve a ejecutar inicializarSistema.'
    );
    return;
  }

  Object.keys(HEADERS).forEach(function(name) {
    var headers = HEADERS[name];
    var sheet = ss.getSheetByName(name);
    if (!sheet) sheet = ss.insertSheet(name);
    var hr = sheet.getRange(1, 1, 1, headers.length);
    hr.setValues([headers]);
    hr.setBackground('#1a1a1a').setFontColor('#ffffff').setFontWeight('bold');
    sheet.setFrozenRows(1);
    sheet.setColumnWidth(1, 160);
  });

  // Ocultar y proteger la hoja Usuarios
  var usuSheet = ss.getSheetByName('Usuarios');
  if (usuSheet) {
    usuSheet.hideSheet();
    if (usuSheet.getLastRow() <= 1) {
      usuSheet.appendRow(['U001', 'admin', sha256('admin2026'), 'admin', 'Administrador', 'activo']);
    }
  }

  ['Sheet1','Hoja 1','Hoja1'].forEach(function(n) {
    var s = ss.getSheetByName(n);
    if (s && ss.getSheets().length > 1) try { ss.deleteSheet(s); } catch(e) {}
  });

  ui.alert(
    '✅  Sistema inicializado y SEGURO\n\n' +
    '• Contraseñas guardadas como hash SHA-256\n' +
    '• Hoja Usuarios oculta\n' +
    '• WRITE_TOKEN activo\n\n' +
    'Ahora implementa como aplicación web:\n' +
    '→ Implementar → Nueva implementación\n' +
    '→ Tipo: Aplicación web\n' +
    '→ Ejecutar como: Yo\n' +
    '→ Acceso: Cualquier usuario\n\n' +
    'Usuario inicial: admin / admin2026\n' +
    '(Cambia esta contraseña inmediatamente)'
  );
}

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('⚽ Intramuros 2026')
    .addItem('🚀 Inicializar (primera vez)', 'inicializarSistema')
    .addItem('📊 Ver resumen', 'verResumen')
    .addItem('🔑 Cambiar contraseña', 'cambiarPasswordUI')
    .addToUi();
}

function verResumen() {
  var u = readSheet('Usuarios').length;
  var e = readSheet('Equipos').filter(function(x){ return x.estado === 'activo'; }).length;
  var j = readSheet('Jugadores').filter(function(x){ return x.estado === 'activo'; }).length;
  var p = readSheet('Partidos');
  SpreadsheetApp.getUi().alert(
    '📊 RESUMEN\n\nUsuarios: ' + u +
    '\nEquipos activos: ' + e +
    '\nJugadores: ' + j +
    '\nPartidos: ' + p.length +
    ' (' + p.filter(function(x){ return x.estado === 'finalizado'; }).length + ' finalizados)'
  );
}

function cambiarPasswordUI() {
  var ui = SpreadsheetApp.getUi();
  var r1 = ui.prompt('Usuario:', ui.ButtonSet.OK_CANCEL);
  if (r1.getSelectedButton() !== ui.Button.OK) return;
  var r2 = ui.prompt('Nueva contraseña:', ui.ButtonSet.OK_CANCEL);
  if (r2.getSelectedButton() !== ui.Button.OK) return;

  var uname  = r1.getResponseText().trim();
  var newPass = r2.getResponseText().trim();
  if (!uname || !newPass) { ui.alert('Datos incompletos.'); return; }

  var usuarios = readSheet('Usuarios');
  var user = null;
  for (var i = 0; i < usuarios.length; i++) {
    if (usuarios[i].usuario === uname) { user = usuarios[i]; break; }
  }
  if (!user) { ui.alert('Usuario no encontrado.'); return; }

  user.passwordHash = sha256(newPass);
  upsert('Usuarios', user);
  ui.alert('✅ Contraseña actualizada para: ' + uname);
}
