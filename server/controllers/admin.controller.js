import baseDeDatos from '../db.js';

/**
 * Obtiene las estadísticas globales para el panel de control.
 */
export const obtenerEstadisticas = async (req, res) => {
    try {
        const consultas = [
            baseDeDatos.query('SELECT COUNT(*) as total FROM Gatos'),
            baseDeDatos.query('SELECT COUNT(*) as total FROM Reservas'),
            baseDeDatos.query('SELECT COUNT(*) as total FROM Comentarios'),
            baseDeDatos.query('SELECT COUNT(*) as total FROM Productos'),
            baseDeDatos.query('SELECT COUNT(*) as total FROM Gatos WHERE estado_adopcion = "Adoptado"'),
            baseDeDatos.query('SELECT COUNT(*) as total FROM Solicitudes_adopcion'),
            baseDeDatos.query('SELECT COUNT(*) as total FROM Eventos'),
            baseDeDatos.query('SELECT COUNT(*) as total FROM Inscripciones_Eventos'),
            baseDeDatos.query('SELECT COUNT(*) as total FROM Usuarios'),
            baseDeDatos.query('SELECT COUNT(*) as total FROM Pedidos'),
            baseDeDatos.query('SELECT COUNT(*) as total FROM Padrinazgos WHERE archivado = 0'),
            baseDeDatos.query('SELECT estado_adopcion as estado, COUNT(*) as total FROM Gatos GROUP BY estado_adopcion'),
            baseDeDatos.query('SELECT COUNT(*) as total FROM Gatos WHERE estado_adopcion IN ("En Adopción", "Urgente")'),
            baseDeDatos.query('SELECT COUNT(*) as total FROM Gatos WHERE estado_adopcion = "Urgente"')
        ];

        const resultados = await Promise.all(consultas);
        const nombreAdmin = req.usuario?.nombre || 'Administrador';

        res.json({
            gatos: resultados[0][0][0].total,
            reservas: resultados[1][0][0].total,
            comentarios: resultados[2][0][0].total,
            productos: resultados[3][0][0].total,
            adopciones: resultados[4][0][0].total,
            solicitudes: resultados[5][0][0].total,
            eventos: resultados[6][0][0].total,
            inscripciones: resultados[7][0][0].total,
            usuarios: resultados[8][0][0].total,
            pedidos: resultados[9][0][0].total,
            padrinazgos: resultados[10][0][0].total,
            distribucion_gatos: resultados[11][0],
            buscando: resultados[12][0][0].total,
            urgentes: resultados[13][0][0].total,
            admin: { nombre: nombreAdmin }
        });
    } catch (error) {
        console.error("[Error] obtenerEstadisticas:", error.message);
        res.status(500).json({ mensaje: "Error al recuperar las estadísticas del sistema" });
    }
};

/**
 * Obtiene el listado completo de padrinazgos registrados.
 */
export const obtenerPadrinazgosAdmin = async (req, res) => {
    try {
        const [filas] = await baseDeDatos.query(`
            SELECT p.*, g.nombre_gato, u.nombre as usuario_nombre, u.apellidos as usuario_apellidos, u.email as usuario_email 
            FROM Padrinazgos p 
            JOIN Gatos g ON p.id_gato = g.id_gato 
            JOIN Usuarios u ON p.id_usuario = u.id_usuario 
            ORDER BY p.archivado ASC, p.fecha_inicio DESC
        `);
        res.json(filas);
    } catch (error) {
        res.status(500).json({ mensaje: "Error al obtener la lista de padrinazgos" });
    }
};

/**
 * Actualiza la información de un registro de padrinazgo.
 */
export const actualizarPadrinazgo = async (req, res) => {
    const { id } = req.params;
    const { aportacion_mensual, archivado, fecha_inicio, fecha_fin } = req.body;
    try {
        await baseDeDatos.query(
            'UPDATE Padrinazgos SET aportacion_mensual = ?, archivado = ?, fecha_inicio = ?, fecha_fin = ? WHERE id_padrinazgo = ?', 
            [aportacion_mensual, archivado, fecha_inicio, fecha_fin, id]
        );
        res.json({ mensaje: "Padrinazgo actualizado correctamente" });
    } catch (error) {
        res.status(500).json({ mensaje: "Error al actualizar el padrinazgo" });
    }
};

/**
 * Elimina de forma permanente un registro de padrinazgo.
 */
export const eliminarPadrinazgo = async (req, res) => {
    try {
        await baseDeDatos.query('DELETE FROM Padrinazgos WHERE id_padrinazgo = ?', [req.params.id]);
        res.json({ mensaje: "Padrinazgo eliminado satisfactoriamente" });
    } catch (error) {
        res.status(500).json({ mensaje: "No se pudo eliminar el padrinazgo" });
    }
};

/**
 * Obtiene todas las reservas de visitas registradas en el sistema.
 */
export const obtenerReservasAdmin = async (req, res) => {
    try {
        const [filas] = await baseDeDatos.query(`
            SELECT r.*, CONCAT(u.nombre, ' ', u.apellidos) as cliente 
            FROM Reservas r 
            JOIN Usuarios u ON r.id_usuario = u.id_usuario 
            ORDER BY r.fecha DESC, r.hora_inicio DESC
        `);
        res.json(filas);
    } catch (error) {
        res.status(500).json({ mensaje: "Error al recuperar las reservas" });
    }
};

/**
 * Actualiza la información técnica y el estado de una reserva.
 */
export const actualizarReserva = async (req, res) => {
    const { id } = req.params;
    const { fecha, hora_inicio, num_personas, estado_reserva, observaciones, pagado } = req.body;
    try {
        await baseDeDatos.query(
            'UPDATE Reservas SET fecha=?, hora_inicio=?, num_personas=?, estado_reserva=?, observaciones=?, pagado=? WHERE id_reserva=?', 
            [fecha, hora_inicio, num_personas, estado_reserva, observaciones, pagado, id]
        );
        res.json({ mensaje: "Reserva actualizada correctamente" });
    } catch (error) {
        res.status(500).json({ mensaje: "Error al intentar actualizar la reserva" });
    }
};

/**
 * Obtiene el listado completo de eventos de la agenda.
 */
export const obtenerEventosAdmin = async (req, res) => {
    try {
        const [filas] = await baseDeDatos.query(`SELECT * FROM Eventos ORDER BY fecha DESC`);
        res.json(filas);
    } catch (error) {
        res.status(500).json({ mensaje: "Error al obtener la lista de eventos" });
    }
};

/**
 * Registra una nueva actividad en la agenda de eventos.
 */
export const crearEvento = async (req, res) => {
    const { titulo, descripcion, fecha, hora, ubicacion, categoria, precio, imagen_url } = req.body;
    try {
        await baseDeDatos.query(
            'INSERT INTO Eventos (titulo, descripcion, fecha, hora, ubicacion, categoria, precio, imagen_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', 
            [titulo, descripcion, fecha, hora, ubicacion, categoria, precio, imagen_url]
        );
        res.status(201).json({ mensaje: "Evento creado correctamente" });
    } catch (error) {
        res.status(500).json({ mensaje: "Error al crear el nuevo evento" });
    }
};

/**
 * Modifica los datos de un evento existente.
 */
export const actualizarEvento = async (req, res) => {
    const { id } = req.params;
    const { titulo, descripcion, fecha, hora, ubicacion, categoria, precio, imagen_url } = req.body;
    try {
        await baseDeDatos.query(
            'UPDATE Eventos SET titulo=?, descripcion=?, fecha=?, hora=?, ubicacion=?, categoria=?, precio=?, imagen_url=? WHERE id_evento=?', 
            [titulo, descripcion, fecha, hora, ubicacion, categoria, precio, imagen_url, id]
        );
        res.json({ mensaje: "Evento actualizado correctamente" });
    } catch (error) {
        res.status(500).json({ mensaje: "Error al actualizar los datos del evento" });
    }
};

/**
 * Elimina definitivamente un evento del sistema.
 */
export const eliminarEvento = async (req, res) => {
    try {
        await baseDeDatos.query('DELETE FROM Eventos WHERE id_evento = ?', [req.params.id]);
        res.json({ mensaje: "Evento eliminado correctamente" });
    } catch (error) {
        res.status(500).json({ mensaje: "No se pudo eliminar el evento solicitado" });
    }
};

/**
 * Obtiene el registro de inscripciones de usuarios a los eventos.
 */
export const obtenerInscripcionesAdmin = async (req, res) => {
    try {
        const [filas] = await baseDeDatos.query(`
            SELECT i.*, u.nombre, u.apellidos, u.email, e.titulo as evento_titulo, e.fecha as evento_fecha 
            FROM Inscripciones_Eventos i 
            JOIN Usuarios u ON i.id_usuario = u.id_usuario 
            JOIN Eventos e ON i.id_evento = e.id_evento 
            ORDER BY i.fecha_inscripcion DESC
        `);
        res.json(filas);
    } catch (error) {
        res.status(500).json({ mensaje: "Error al recuperar las inscripciones" });
    }
};

/**
 * Actualiza los datos de participación y pago de una inscripción.
 */
export const actualizarInscripcion = async (req, res) => {
    const { id } = req.params;
    const { estado_pago, num_personas, observaciones } = req.body;
    try {
        await baseDeDatos.query(
            'UPDATE Inscripciones_Eventos SET estado_pago = ?, num_personas = ?, observaciones = ? WHERE id_inscripcion = ?', 
            [estado_pago, num_personas, observaciones, id]
        );
        res.json({ mensaje: "Inscripción actualizada correctamente" });
    } catch (error) {
        res.status(500).json({ mensaje: "Error al actualizar la inscripción" });
    }
};

/**
 * Obtiene el listado completo de usuarios registrados y sus roles.
 */
export const obtenerUsuariosAdmin = async (req, res) => {
    try {
        const [filas] = await baseDeDatos.query(`
            SELECT u.*, COALESCE(r.nombre_rol, 'Miembro') as nombre_rol 
            FROM Usuarios u 
            LEFT JOIN Rol r ON u.id_rol = r.id_rol 
            ORDER BY u.id_usuario DESC
        `);
        res.json(filas);
    } catch (error) {
        res.status(500).json({ mensaje: "Error al recuperar la lista de usuarios" });
    }
};

/**
 * Actualiza la información de perfil y asignación de rol de un usuario.
 */
export const actualizarUsuario = async (req, res) => {
    const { id } = req.params;
    const { nombre, apellidos, email, telefono, id_rol } = req.body;
    try {
        await baseDeDatos.query(
            'UPDATE Usuarios SET nombre=?, apellidos=?, email=?, telefono=?, id_rol=? WHERE id_usuario=?', 
            [nombre, apellidos, email, telefono, id_rol, id]
        );
        res.json({ mensaje: "Perfil de usuario actualizado" });
    } catch (error) {
        res.status(500).json({ mensaje: "No se pudieron guardar los cambios del usuario" });
    }
};

/**
 * Obtiene el listado de comentarios sujetos a moderación.
 */
export const obtenerComentariosPendientes = async (req, res) => {
    try {
        const [filas] = await baseDeDatos.query(`
            SELECT c.*, u.nombre, u.apellidos 
            FROM Comentarios c 
            JOIN Usuarios u ON c.id_usuario = u.id_usuario 
            ORDER BY 
                CASE WHEN c.estado = 'pendiente' THEN 1 ELSE 2 END,
                c.fecha_comentario DESC
        `);
        res.json(filas);
    } catch (error) {
        res.status(500).json({ mensaje: "Error al cargar los comentarios pendientes" });
    }
};

/**
 * Establece el estado de aprobación de un comentario de usuario.
 */
export const actualizarEstadoComentario = async (req, res) => {
    const { id } = req.params;
    const { estado } = req.body;
    try {
        await baseDeDatos.query('UPDATE Comentarios SET estado = ? WHERE id_comentario = ?', [estado, id]);
        res.json({ mensaje: `El comentario ha sido ${estado}` });
    } catch (error) {
        res.status(500).json({ mensaje: "No se pudo actualizar el estado del comentario" });
    }
};

/**
 * Obtiene el registro completo de solicitudes de adopción tramitadas.
 */
export const obtenerAdopcionesAdmin = async (req, res) => {
    try {
        const [filas] = await baseDeDatos.query(`
            SELECT s.*, u.nombre as usuario_nombre, u.email as usuario_email, g.nombre_gato as gato_nombre 
            FROM Solicitudes_adopcion s 
            JOIN Usuarios u ON s.id_usuario = u.id_usuario 
            JOIN Gatos g ON s.id_gato = g.id_gato 
            ORDER BY s.fecha_solicitud DESC
        `);
        res.json(filas);
    } catch (error) {
        res.status(500).json({ mensaje: "Error al obtener las solicitudes de adopción" });
    }
};

/**
 * Gestiona el veredicto de una solicitud de adopción y actualiza el estado del gato.
 */
export const actualizarSolicitudAdopcion = async (req, res) => {
    const { id } = req.params;
    const { estado, motivo_decision } = req.body;
    try {
        const [solicitud] = await baseDeDatos.query('SELECT id_gato FROM Solicitudes_adopcion WHERE id_solicitud = ?', [id]);
        if (solicitud.length === 0) return res.status(404).json({ mensaje: "Solicitud no encontrada" });
        
        const id_gato = solicitud[0].id_gato;
        await baseDeDatos.query('UPDATE Solicitudes_adopcion SET estado = ?, motivo_decision = ? WHERE id_solicitud = ?', [estado, motivo_decision, id]);
        
        // Sincroniza el estado del gato según la resolución de la solicitud
        if (estado === 'En Proceso') {
            await baseDeDatos.query('UPDATE Gatos SET estado_adopcion = "Reservado" WHERE id_gato = ?', [id_gato]);
        } else if (estado === 'Aceptada') {
            await baseDeDatos.query('UPDATE Gatos SET estado_adopcion = "Adoptado", fecha_adopcion = CURDATE() WHERE id_gato = ?', [id_gato]);
        } else if (estado === 'Rechazada') {
            await baseDeDatos.query(
                'UPDATE Gatos SET estado_adopcion = "En Adopción", fecha_adopcion = NULL WHERE id_gato = ? AND estado_adopcion IN ("Reservado", "Adoptado")', 
                [id_gato]
            );
        }
        
        res.json({ mensaje: "Solicitud de adopción gestionada correctamente" });
    } catch (error) {
        res.status(500).json({ mensaje: "Error al procesar la decisión de adopción" });
    }
};

/**
 * Obtiene el listado de pedidos realizados en la tienda online.
 */
export const obtenerPedidosAdmin = async (req, res) => {
    try {
        const [filas] = await baseDeDatos.query(`
            SELECT p.*, u.nombre as cliente_nombre, u.apellidos as cliente_apellidos, u.email as cliente_email 
            FROM Pedidos p 
            JOIN Usuarios u ON p.id_usuario = u.id_usuario 
            ORDER BY p.fecha_pedido DESC
        `);
        res.json(filas);
    } catch (error) {
        res.status(500).json({ mensaje: "Error al recuperar la lista de pedidos" });
    }
};

/**
 * Modifica la información general de facturación y envío de un pedido.
 */
export const actualizarPedido = async (req, res) => {
    const { id } = req.params;
    const { total_pago, pagado, estado_envio, direccion_envio } = req.body;
    try {
        await baseDeDatos.query(
            'UPDATE Pedidos SET total_pago=?, pagado=?, estado_envio=?, direccion_envio=? WHERE id_pedido=?', 
            [total_pago, pagado, estado_envio, direccion_envio, id]
        );
        res.json({ mensaje: "Pedido actualizado satisfactoriamente" });
    } catch (error) {
        res.status(500).json({ mensaje: "Error al actualizar el pedido" });
    }
};

/**
 * Actualiza exclusivamente el estado logístico de un pedido.
 */
export const actualizarEstadoPedido = async (req, res) => {
    const { id } = req.params;
    const { estado_envio } = req.body;
    try {
        await baseDeDatos.query('UPDATE Pedidos SET estado_envio = ? WHERE id_pedido = ?', [estado_envio, id]);
        res.json({ mensaje: "Estado del envío actualizado" });
    } catch (error) {
        res.status(500).json({ mensaje: "No se pudo cambiar el estado del envío" });
    }
};

/**
 * Obtiene el desglose detallado de los productos incluidos en un pedido.
 */
export const obtenerDetallePedido = async (req, res) => {
    const { id } = req.params;
    try {
        const [filas] = await baseDeDatos.query(`
            SELECT dp.*, p.nombre as producto_nombre, p.imagen_url 
            FROM Pedido_detalle dp 
            JOIN Productos p ON dp.id_producto = p.id_producto 
            WHERE dp.id_pedido = ?
        `, [id]);
        res.json(filas);
    } catch (error) {
        res.status(500).json({ mensaje: "Error al recuperar los detalles del pedido" });
    }
};
