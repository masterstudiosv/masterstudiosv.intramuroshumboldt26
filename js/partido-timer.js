// ============================================================
//  PARTIDO TIMER — Cronómetro completo del partido
//
//  Estados del partido:
//    "programado"     → No ha iniciado
//    "primer_tiempo"  → Corriendo el 1er tiempo
//    "descanso"       → Intermedio
//    "segundo_tiempo" → Corriendo el 2do tiempo
//    "tiempo_extra_1" → Tiempo extra 1er tiempo
//    "tiempo_extra_2" → Tiempo extra 2do tiempo
//    "finalizado"     → Partido terminado
//
//  El árbitro puede:
//    - Configurar duración de cada tiempo (default 30 min)
//    - Agregar tiempo extra en cualquier momento
//    - Ver cronómetro en tiempo real
//    - El minuto de cada evento = minuto actual del partido cuando se registra
// ============================================================

class PartidoTimer {
  constructor(onTick, onStateChange) {
    this.onTick = onTick || (() => {});
    this.onStateChange = onStateChange || (() => {});

    // Estado persistente del partido
    this.partido = null;

    // Cronómetro local
    this._interval = null;
    this._startedAt = null;    // Date.now() cuando el tiempo actual empezó a correr
    this._elapsed = 0;         // segundos acumulados del tiempo actual
    this._running = false;

    // Configuración de tiempos (en minutos)
    this.durPrimerTiempo = 30;
    this.durSegundoTiempo = 30;
    this.extraAcum1 = 0;       // minutos extra acumulados en 1er tiempo
    this.extraAcum2 = 0;       // minutos extra en 2do tiempo

    // Minuto acumulado total del partido (para marcar eventos)
    this._minutosPrimerTiempoJugado = 0;
  }

  // ── Cargar partido existente ─────────────────────────────────
  cargarPartido(partido) {
    this.partido = partido;
    this.durPrimerTiempo  = parseInt(partido.duracion_primer_tiempo)  || CONFIG.opciones.duracionPrimerTiempo;
    this.durSegundoTiempo = parseInt(partido.duracion_segundo_tiempo) || CONFIG.opciones.duracionSegundoTiempo;
    this.extraAcum1 = parseInt(partido.tiempo_extra_1) || 0;
    this.extraAcum2 = parseInt(partido.tiempo_extra_2) || 0;
    this._minutosPrimerTiempoJugado = this.durPrimerTiempo + this.extraAcum1;
    this._running = false;
    this._elapsed = 0;
    this.onStateChange(this.estado);
  }

  get estado() { return this.partido?.estado || "programado"; }
  get minutosTranscurridosActual() { return Math.floor(this._elapsed / 60); }

  // Minuto global del partido (para mostrar en eventos)
  get minutoPartido() {
    const base = this.estado === "segundo_tiempo" || this.estado === "tiempo_extra_2"
      ? this._minutosPrimerTiempoJugado
      : 0;
    return base + this.minutosTranscurridosActual;
  }

  get limiteActual() {
    if (this.estado === "primer_tiempo")  return (this.durPrimerTiempo + this.extraAcum1) * 60;
    if (this.estado === "segundo_tiempo") return (this.durSegundoTiempo + this.extraAcum2) * 60;
    if (this.estado === "tiempo_extra_1") return (this.extraAcum1) * 60;
    if (this.estado === "tiempo_extra_2") return (this.extraAcum2) * 60;
    return 0;
  }

  get tiempoDisplay() {
    const m = String(Math.floor(this._elapsed / 60)).padStart(2, "0");
    const s = String(Math.floor(this._elapsed % 60)).padStart(2, "0");
    return `${m}:${s}`;
  }

  get estadoLabel() {
    const labels = {
      programado:     "Sin iniciar",
      primer_tiempo:  "1er Tiempo",
      descanso:       "Descanso",
      segundo_tiempo: "2do Tiempo",
      tiempo_extra_1: "T. Extra 1",
      tiempo_extra_2: "T. Extra 2",
      finalizado:     "Finalizado",
    };
    return labels[this.estado] || this.estado;
  }

  // ── Acciones del árbitro ─────────────────────────────────────

  async iniciarPrimerTiempo() {
    if (this.estado !== "programado") return;
    this._iniciarCronometro();
    await this._cambiarEstado("primer_tiempo", { inicio_timestamp: new Date().toISOString() });
  }

  async pausar_irDescanso() {
    if (this.estado !== "primer_tiempo") return;
    this._pausarCronometro();
    this._minutosPrimerTiempoJugado = this.durPrimerTiempo + this.extraAcum1;
    await this._cambiarEstado("descanso", {
      duracion_primer_tiempo: Math.ceil(this._elapsed / 60), // guarda cuánto realmente se jugó
      tiempo_extra_1: this.extraAcum1,
    });
    this._elapsed = 0;
  }

  async iniciarSegundoTiempo() {
    if (this.estado !== "descanso") return;
    this._iniciarCronometro();
    await this._cambiarEstado("segundo_tiempo");
  }

  async finalizarPartido() {
    if (this.estado !== "segundo_tiempo" && this.estado !== "tiempo_extra_2") return;
    this._pausarCronometro();
    await this._cambiarEstado("finalizado", {
      fin_timestamp: new Date().toISOString(),
      duracion_segundo_tiempo: Math.ceil(this._elapsed / 60),
      tiempo_extra_2: this.extraAcum2,
    });
    this._elapsed = 0;
  }

  // Agregar tiempo extra al tiempo actual
  async agregarTiempoExtra(minutos) {
    minutos = parseInt(minutos) || 1;
    if (this.estado === "primer_tiempo") {
      this.extraAcum1 += minutos;
      await this._cambiarEstado("primer_tiempo", { tiempo_extra_1: this.extraAcum1 });
    } else if (this.estado === "segundo_tiempo") {
      this.extraAcum2 += minutos;
      await this._cambiarEstado("segundo_tiempo", { tiempo_extra_2: this.extraAcum2 });
    }
  }

  // Cambiar duración antes de iniciar
  setDuraciones(pt, st) {
    this.durPrimerTiempo  = parseInt(pt) || 30;
    this.durSegundoTiempo = parseInt(st) || 30;
  }

  // ── CRONÓMETRO interno ───────────────────────────────────────
  _iniciarCronometro() {
    if (this._running) return;
    this._running = true;
    this._startedAt = Date.now() - (this._elapsed * 1000);
    this._interval = setInterval(() => {
      this._elapsed = Math.floor((Date.now() - this._startedAt) / 1000);
      this.onTick({
        display:       this.tiempoDisplay,
        minutoPartido: this.minutoPartido,
        estado:        this.estado,
        estadoLabel:   this.estadoLabel,
        elapsed:       this._elapsed,
        limite:        this.limiteActual,
        extraAcum1:    this.extraAcum1,
        extraAcum2:    this.extraAcum2,
      });
    }, 1000);
  }

  _pausarCronometro() {
    if (!this._running) return;
    this._running = false;
    clearInterval(this._interval);
    this._interval = null;
    this._elapsed = Math.floor((Date.now() - this._startedAt) / 1000);
  }

  // ── Persistir estado ─────────────────────────────────────────
  async _cambiarEstado(nuevoEstado, extraData = {}) {
    if (!this.partido) return;
    const data = { estado: nuevoEstado, ...extraData };
    await DB.post("updateEstadoPartido", { id: this.partido.id, ...data });
    this.partido = { ...this.partido, ...data };
    this.onStateChange(nuevoEstado);
  }

  destroy() {
    if (this._interval) clearInterval(this._interval);
  }
}

if (typeof window !== "undefined") window.PartidoTimer = PartidoTimer;
