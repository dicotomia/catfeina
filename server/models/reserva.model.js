/**
 * Gestión de la lógica de negocio para la reserva de servicios.
 */

import baseDeDatos from '../db.js';

const ReservaModelo = {
  /**
   * Crea una nueva reserva vinculada al servicio correspondiente.
   */
  crear: async (datos) => {
    let idServicio = 1; 
    let tiempoEnMinutos = parseInt(datos.tiempo_minutos) || (parseFloat(datos.tiempo_horas) * 60) || 60;

    // Asignación de ID de servicio según el tipo de reserva y plan seleccionado
    if (datos.tipo_reserva === 'coworking') {
      switch (datos.plan) {
        case 'grupal':    idServicio = 3; break;
        case 'diario':    idServicio = 4; tiempoEnMinutos = 480; break;
        case 'residente': idServicio = 5; tiempoEnMinutos = 43200; break; 
        case 'nomada':    idServicio = 2; break;
        default:          idServicio = 2; break;
      }
    } else if (datos.tipo_reserva === 'apadrinar') {
        idServicio = 6;
    }

    const consultaSql = `
      INSERT INTO Reservas (id_usuario, id_servicio, fecha, hora_inicio, num_personas, tiempo_minutos, observaciones, estado_reserva, pagado)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'Confirmada', ?)
    `;

    const valoresSql = [
      datos.id_usuario,
      idServicio,
      datos.fecha || new Date().toISOString().split('T')[0],
      datos.hora || '10:00:00',
      parseInt(datos.num_personas) || 1,
      tiempoEnMinutos,
      `Reserva ${datos.tipo_reserva} - Plan: ${datos.plan || 'Estándar'}`,
      datos.pagado || false
    ];

    const [resultado] = await baseDeDatos.query(consultaSql, valoresSql);
    return resultado.insertId;
  },

  /**
   * Obtiene todas las reservas asociadas a un usuario específico.
   */
  obtenerPorUsuario: async (idUsuario) => {
    const consultaSql = `
      SELECT r.*, s.nombre_servicio 
      FROM Reservas r
      JOIN Servicios s ON r.id_servicio = s.id_servicio
      WHERE r.id_usuario = ?
      ORDER BY r.fecha DESC, r.hora_inicio DESC
    `;
    const [filas] = await baseDeDatos.query(consultaSql, [idUsuario]);
    return filas;
  }
};

export default ReservaModelo;
