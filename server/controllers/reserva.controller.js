import baseDeDatos from '../db.js';
import ReservaModelo from '../models/reserva.model.js';

/**
 * Registra una nueva reserva de visita o solicitud de apadrinamiento.
 */
export const crearReserva = async (req, res) => {
    try {
        const { fecha, hora, tipo_reserva, plan, num_personas, nombre_gato, pagado } = req.body;
        const idUsuario = req.user.id;

        if (!idUsuario || !tipo_reserva) {
            return res.status(400).json({ mensaje: "Identificación de usuario o trámite no válida." });
        }

        // Validación de fecha y hora futura para reservas presenciales
        if (tipo_reserva !== 'apadrinar') {
            const momentoReserva = new Date(`${fecha}T${hora}`);
            const momentoActual = new Date();

            if (momentoReserva <= momentoActual) {
                return res.status(400).json({ 
                    mensaje: "No es posible reservar en una fecha u hora que ya ha pasado." 
                });
            }
        }

        // Gestión de solicitudes de apadrinamiento
        if (tipo_reserva === 'apadrinar') {
            const cuotas = { curioso: 5, amigo: 10, protector: 25 };
            const aportacionMensual = cuotas[plan] || 10;

            const [gatos] = await baseDeDatos.query('SELECT id_gato FROM Gatos WHERE nombre_gato = ?', [nombre_gato]);
            if (gatos.length === 0) return res.status(404).json({ mensaje: "Gato no localizado." });

            const idGato = gatos[0].id_gato;

            const [existente] = await baseDeDatos.query(
                'SELECT id_padrinazgo FROM Padrinazgos WHERE id_usuario = ? AND id_gato = ? AND (fecha_fin IS NULL OR fecha_fin > CURDATE())',
                [idUsuario, idGato]
            );

            if (existente.length > 0) {
                return res.status(400).json({ mensaje: "Ya colaboras activamente con este michi." });
            }

            await baseDeDatos.query(
                'INSERT INTO Padrinazgos (id_usuario, id_gato, aportacion_mensual, fecha_inicio) VALUES (?, ?, ?, CURDATE())',
                [idUsuario, idGato, aportacionMensual]
            );

            await baseDeDatos.query('UPDATE Usuarios SET id_rol = 3 WHERE id_usuario = ?', [idUsuario]);

            return res.status(201).json({ 
                mensaje: `¡Felicidades! Ahora eres el padrino de ${nombre_gato}.`, 
                nuevoRol: 3 
            });
        }

        // Gestión de reservas de visita a la cafetería
        const idNuevaReserva = await ReservaModelo.crear({
            id_usuario: idUsuario,
            fecha,
            hora,
            tipo_reserva,
            plan,
            num_personas,
            pagado: pagado || false
        });

        res.status(201).json({ 
            id: idNuevaReserva, 
            mensaje: "Reserva confirmada. ¡Te esperamos!" 
        });

    } catch (error) {
        console.error("Error al procesar reserva:", error);
        res.status(500).json({ mensaje: "Error interno al registrar la solicitud." });
    }
};

/**
 * Establece el estado de una reserva como cancelada.
 */
export const cancelarReserva = async (req, res) => {
    try {
        const { id_reserva } = req.params;
        const idUsuario = req.user.id;

        const [resultado] = await baseDeDatos.query(
            "UPDATE Reservas SET estado_reserva = 'Cancelada' WHERE id_reserva = ? AND id_usuario = ?",
            [id_reserva, idUsuario]
        );

        if (resultado.affectedRows === 0) {
            return res.status(404).json({ mensaje: "Reserva no encontrada o sin permisos." });
        }

        res.json({ mensaje: "La reserva ha sido cancelada correctamente." });
    } catch (error) {
        res.status(500).json({ mensaje: "No se pudo procesar la cancelación." });
    }
};

/**
 * Obtiene el historial de reservas de un usuario específico.
 */
export const obtenerMisReservas = async (req, res) => {
    try {
        const { id_usuario } = req.params;
        const reservas = await ReservaModelo.obtenerPorUsuario(id_usuario);
        res.json(reservas);
    } catch (error) {
        res.status(500).json({ mensaje: "Error al recuperar el historial." });
    }
};
