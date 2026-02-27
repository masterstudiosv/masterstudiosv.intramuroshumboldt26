// STATS — todas las estadísticas computadas en cliente
const Stats = {
  // Calcula goles, amarillas, rojas, faltas de un jugador
  jugador(equipoId, numeroJugador, eventos) {
    const evs = eventos.filter(e => e.equipo_id === equipoId && String(e.numero_jugador) === String(numeroJugador));
    return {
      goles:     evs.filter(e => e.tipo === "gol").length,
      amarillas: evs.filter(e => e.tipo === "amarilla").length,
      rojas:     evs.filter(e => e.tipo === "roja").length,
      faltas:    evs.filter(e => e.tipo === "falta").length,
    };
  },

  suspendido(equipoId, numero, eventos) {
    return eventos.some(e => e.equipo_id === equipoId && String(e.numero_jugador) === String(numero) && e.tipo === "roja");
  },

  equipo(equipoId, partidos) {
    let g = 0, em = 0, p = 0, gf = 0, gc = 0;
    partidos.filter(pt => pt.estado === "finalizado" && (pt.equipo_local_id === equipoId || pt.equipo_visitante_id === equipoId)).forEach(pt => {
      const local = pt.equipo_local_id === equipoId;
      const F = local ? parseInt(pt.goles_local || 0) : parseInt(pt.goles_visitante || 0);
      const C = local ? parseInt(pt.goles_visitante || 0) : parseInt(pt.goles_local || 0);
      gf += F; gc += C;
      if (F > C) g++; else if (F < C) p++; else em++;
    });
    return { ganados: g, empatados: em, perdidos: p, golesFavor: gf, golesContra: gc, puntos: g * 3 + em, jugados: g + em + p };
  },

  posiciones(equipos, partidos) {
    return equipos
      .map(e => ({ ...e, stats: this.equipo(e.id, partidos) }))
      .sort((a, b) => b.stats.puntos - a.stats.puntos || (b.stats.golesFavor - b.stats.golesContra) - (a.stats.golesFavor - a.stats.golesContra));
  },

  topGoleadores(jugadores, equipos, eventos, limit = 10) {
    const eqMap = Object.fromEntries(equipos.map(e => [e.id, e]));
    return jugadores
      .map(j => {
        const eq = eqMap[j.equipo_id] || {};
        return { ...j, equipoNombre: eq.nombre || "", equipoSeccion: eq.seccion || "", stats: this.jugador(j.equipo_id, j.numero, eventos) };
      })
      .sort((a, b) => b.stats.goles - a.stats.goles)
      .slice(0, limit);
  },

  resumen(equipos, jugadores, partidos, eventos) {
    return {
      totalEquipos:    equipos.length,
      totalJugadores:  jugadores.length,
      totalPartidos:   partidos.length,
      partidosJugados: partidos.filter(p => p.estado === "finalizado").length,
      totalGoles:      eventos.filter(e => e.tipo === "gol").length,
      totalAmarillas:  eventos.filter(e => e.tipo === "amarilla").length,
      totalRojas:      eventos.filter(e => e.tipo === "roja").length,
    };
  },
};

if (typeof window !== "undefined") window.Stats = Stats;
