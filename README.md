# ⚽ Intramuros Humboldt 2026 — Sistema de Gestión Deportiva

Sistema web profesional para gestión de torneos de fútbol intramuros.  
Construido con **HTML5 + TailwindCSS + Vanilla JS** · Compatible con **Vercel** · Base de datos: **Google Sheets**

---

## 🚀 Inicio Rápido

### 1. Ejecutar en modo demo (local)
Abre `index.html` directamente en el navegador — funciona sin configuración.

### 2. Desplegar en Vercel
```bash
# Sube a GitHub, luego en vercel.com:
# New Project → Import → Framework: Other → Deploy
```

### 3. Primer inicio de sesión
El sistema crea un usuario admin inicial al ejecutar `inicializarSistema`.
Cambia la contraseña inmediatamente desde el panel de administración.

> ⚠️ Las credenciales reales **nunca** se publican en el README.

---

## 📁 Estructura del Proyecto

```
intramuros/
├── index.html              ← Entrada principal
├── vercel.json             ← Configuración Vercel
├── css/
│   └── style.css           ← Estilos globales
├── js/
│   ├── config.js           ← ⚙️  EDITAR AQUÍ tus credenciales
│   ├── sheets.js           ← Google Sheets API + datos demo
│   ├── auth.js             ← Autenticación y sesión
│   ├── ui.js               ← UI helpers + Modal + Toast
│   └── router.js           ← SPA Router + App bootstrap
└── modules/
    ├── dashboard.js        ← Panel principal
    ├── categorias.js       ← Gestión de categorías
    ├── equipos.js          ← Gestión de equipos
    ├── jugadores.js        ← Gestión de jugadores
    ├── partidos.js         ← Gestión de partidos + series
    ├── live-match.js       ← Control en vivo del árbitro
    └── estadisticas.js     ← Estadísticas + árbitros + usuarios + setup
```

---

## ⚙️ Configurar Google Sheets

Edita `js/config.js`:

```javascript
const CONFIG = {
  SPREADSHEET_ID: 'tu-id-de-spreadsheet',
  API_KEY:        'tu-api-key-de-google',
  DEMO_MODE:      false,  // ← Cambiar cuando tengas credenciales
};
```

**Pasos completos:** Inicia sesión como admin → Ve a "Configurar Sheets" en el menú lateral.

---

## 🎯 Funcionalidades

### Por Rol:
| Función                          | Admin | Árbitro | Espectador |
|----------------------------------|:-----:|:-------:|:----------:|
| Ver dashboard y estadísticas     | ✅    | ✅      | ✅         |
| Ver equipos, jugadores, partidos | ✅    | ✅      | ✅         |
| Control en vivo (árbitro)        | ✅    | ✅      | ❌         |
| Crear/editar categorías          | ✅    | ❌      | ❌         |
| Registrar equipos y jugadores    | ✅    | ❌      | ❌         |
| Crear partidos y series          | ✅    | ❌      | ❌         |
| Gestionar usuarios               | ✅    | ❌      | ❌         |

### Módulos:
- **Dashboard** — Stats globales, partidos activos, top goleadores
- **Partidos** — Únicos y series ida/vuelta con marcador global automático
- **Control en Vivo** — Timer automático, goles, tarjetas, faltas, cambios
- **Equipos** — Perfil completo con plantel en cards visuales
- **Jugadores** — Fotos subidas desde dispositivo (Base64)
- **Estadísticas** — Tabla de posiciones por categoría, goleadores, disciplina
- **Setup** — Guía integrada para conectar Google Sheets

---

## 🎨 Diseño
Colores: **Negro · Blanco · Rojo · Amarillo**  
Fuentes: Bebas Neue (display) + Rajdhani (UI) + Inter (cuerpo)  
Estilo: Dashboard profesional tipo FIFA/Liga

---

*Desarrollado para Colegio Humboldt · Temporada 2026*
