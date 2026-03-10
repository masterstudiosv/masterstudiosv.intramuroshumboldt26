/* ════════════════════════════════════════════════
   CONFIG.EXAMPLE.JS — Plantilla de configuración
   ════════════════════════════════════════════════
   INSTRUCCIONES:
   1. Copia este archivo y renómbralo a: config.js
   2. Rellena los valores reales
   3. config.js está en .gitignore y NO va a GitHub
   4. Este archivo (config.example.js) SÍ va a GitHub
      porque no tiene valores reales
════════════════════════════════════════════════ */
const CONFIG = {

  /* URL de tu Google Apps Script (implementación web) */
  APPS_SCRIPT_URL: 'https://script.google.com/macros/s/XXXXXXXXXX/exec',

  /* Token secreto — debe coincidir EXACTAMENTE con
     el WRITE_TOKEN configurado en Script Properties del GAS */
  WRITE_TOKEN: 'TU_TOKEN_SECRETO_AQUI',

  /* Datos del torneo */
  APP_NAME:      'Intramuros Humboldt 2026',
  SCHOOL_NAME:   'Complejo Educativo Alejandro de Humboldt',
  SEASON:        '2026',
  MIN_JUGADORES: 5,
  MAX_JUGADORES: 8,
};
