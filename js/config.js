// ============================================================
//  INTRAMUROS HUMBOLDT 2026 — CONFIG CENTRAL
//  Edita SOLO este archivo para configurar todo el sistema.
// ============================================================

const CONFIG = {

  // ── 🔗 URL DE TU GOOGLE APPS SCRIPT ─────────────────────────
  //  Pasos:
  //  1. Sube Code.gs a script.google.com
  //  2. Implementar → Nueva implementación → Aplicación Web
  //  3. Copia la URL y pégala aquí
  GAS_URL: "https://script.google.com/macros/s/AKfycbzJu6vmZSYViux1C4e5lX310oBA4zRU_yb_AcjPkHYiO2j8-HwTZVKNJWsjtmiD-eVnyQ/exec",   // Ej: "https://script.google.com/macros/s/AKfycbx.../exec"

  // ── NOMBRE DEL TORNEO ───────────────────────────────────────
  torneo: {
    nombre:    "Intramuros Humboldt",
    año:       "2026",
    subtitulo: "Torneo Deportivo Oficial",
    colegio:   "COED Alejandro de Humboldt",
  },

  // ── COLORES ─────────────────────────────────────────────────
  colores: {
    primario:  "#DC2626",
    acento:    "#FACC15",
  },

  // ── OPCIONES DEL TORNEO ─────────────────────────────────────
  opciones: {
    jugadoresMinimo:       5,
    jugadoresMaximo:       8,
    duracionPrimerTiempo:  30,  // minutos por defecto
    duracionSegundoTiempo: 30,
    puntosGanado:          3,
    puntosEmpate:          1,
    puntosPerdido:         0,
  },

  // ── MODO OFFLINE ────────────────────────────────────────────
  //  true  = usa LocalStorage si GAS_URL no está configurado
  //  false = siempre intenta conectar con GAS (muestra error si falla)
  modoOfflineFallback: true,
};

if (typeof window !== "undefined") window.CONFIG = CONFIG;
