import baseDeDatos from '../db.js';
import bcrypt from 'bcryptjs';

/**
 * Obtiene las estadísticas de perfil y próxima actividad para el miembro.
 */
export const obtenerEstadisticasMiembro = async (req, res) => {
    const idUsuario = req.user.id;
    try {
        const [filasRol] = await baseDeDatos.query(
            'SELECT r.nombre_rol FROM Usuarios u JOIN Rol r ON u.id_rol = r.id_rol WHERE u.id_usuario = ?',
            [idUsuario]
        );

        const [reservas] = await baseDeDatos.query(
            'SELECT r.*, s.nombre_servicio FROM Reservas r JOIN Servicios s ON r.id_servicio = s.id_servicio WHERE r.id_usuario = ? AND r.fecha >= CURRENT_DATE ORDER BY r.fecha ASC LIMIT 1',
            [idUsuario]
        );
        
        res.json({
            proximaReserva: reservas[0] || null,
            nivel: filasRol[0] ? filasRol[0].nombre_rol : 'Miembro',
            nombre: req.user.nombre
        });
    } catch (error) {
        res.status(500).json({ mensaje: "Error al recuperar las estadísticas del perfil" });
    }
};

/**
 * Obtiene el historial de reservas del usuario ordenado por fecha.
 */
export const obtenerReservasMiembro = async (req, res) => {
    const idUsuario = req.user.id;
    try {
        const [filas] = await baseDeDatos.query(
            `SELECT r.*, s.nombre_servicio, s.precio_hora 
             FROM Reservas r 
             JOIN Servicios s ON r.id_servicio = s.id_servicio 
             WHERE r.id_usuario = ? 
             ORDER BY 
                CASE WHEN r.fecha >= CURRENT_DATE THEN 0 ELSE 1 END,
                CASE WHEN r.fecha >= CURRENT_DATE THEN r.fecha END ASC,
                r.fecha DESC, r.hora_inicio DESC`,
            [idUsuario]
        );
        res.json(filas);
    } catch (error) {
        res.status(500).json({ mensaje: "Error al cargar el historial de reservas" });
    }
};

/**
 * Obtiene la lista de padrinazgos activos del miembro con detalles del gato.
 */
export const obtenerPadrinazgosMiembro = async (req, res) => {
    const idUsuario = req.user.id;
    try {
        const [filas] = await baseDeDatos.query(
            `SELECT p.*, g.nombre_gato, g.imagen_url, g.raza, g.salud, g.historia, g.estado_adopcion
             FROM Padrinazgos p 
             JOIN Gatos g ON p.id_gato = g.id_gato 
             WHERE p.id_usuario = ? 
             ORDER BY p.fecha_inicio DESC`,
            [idUsuario]
        );
        res.json(filas);
    } catch (error) {
        res.status(500).json({ mensaje: "Error al obtener la lista de apadrinamientos" });
    }
};

/**
 * Obtiene los eventos en los que el usuario se ha inscrito.
 */
export const obtenerEventosMiembro = async (req, res) => {
    const idUsuario = req.user.id;
    try {
        const [filas] = await baseDeDatos.query(
            `SELECT e.*, i.fecha_inscripcion, i.num_personas, i.estado_pago 
             FROM Inscripciones_Eventos i 
             JOIN Eventos e ON i.id_evento = e.id_evento 
             WHERE i.id_usuario = ? 
             ORDER BY e.fecha DESC`,
            [idUsuario]
        );
        res.json(filas);
    } catch (error) {
        res.status(500).json({ mensaje: "Error al recuperar los eventos inscritos" });
    }
};

/**
 * Obtiene el historial detallado de pedidos de compra realizados por el miembro.
 */
export const obtenerPedidosMiembro = async (req, res) => {
    const idUsuario = req.user.id;
    try {
        const [pedidos] = await baseDeDatos.query(
            'SELECT * FROM Pedidos WHERE id_usuario = ? ORDER BY fecha_pedido DESC',
            [idUsuario]
        );

        for (let pedido of pedidos) {
            const [articulos] = await baseDeDatos.query(
                `SELECT pd.*, p.nombre, p.imagen_url 
                 FROM Pedido_detalle pd 
                 JOIN Productos p ON pd.id_producto = p.id_producto 
                 WHERE pd.id_pedido = ?`,
                [pedido.id_pedido]
            );
            pedido.articulos = articulos;
        }
        res.json(pedidos);
    } catch (error) {
        res.status(500).json({ mensaje: "Error al cargar el historial de compras" });
    }
};

/**
 * Obtiene la información básica del perfil del usuario autenticado.
 */
export const obtenerPerfilMiembro = async (req, res) => {
    const idUsuario = req.user.id;
    try {
        const [filas] = await baseDeDatos.query(
            'SELECT id_usuario, nombre, apellidos, email, telefono, fecha_registro FROM Usuarios WHERE id_usuario = ?',
            [idUsuario]
        );
        res.json(filas[0]);
    } catch (error) {
        res.status(500).json({ mensaje: "Error al consultar los datos del perfil" });
    }
};

/**
 * Actualiza los datos de contacto del perfil del miembro.
 */
export const actualizarPerfilMiembro = async (req, res) => {
    const idUsuario = req.user.id;
    const { nombre, apellidos, telefono } = req.body;
    try {
        await baseDeDatos.query(
            'UPDATE Usuarios SET nombre = ?, apellidos = ?, telefono = ? WHERE id_usuario = ?',
            [nombre, apellidos, telefono, idUsuario]
        );
        res.json({ mensaje: "Información de perfil actualizada correctamente" });
    } catch (error) {
        res.status(500).json({ mensaje: "No se pudieron guardar los cambios en el perfil" });
    }
};

/**
 * Cambia la contraseña del usuario tras validar la clave actual.
 */
export const cambiarContrasena = async (req, res) => {
    const idUsuario = req.user.id;
    const { contrasenaActual, contrasenaNueva } = req.body;
    try {
        const [filas] = await baseDeDatos.query('SELECT password FROM Usuarios WHERE id_usuario = ?', [idUsuario]);
        const usuario = filas[0];
        
        const coincidencia = await bcrypt.compare(contrasenaActual, usuario.password);
        if (!coincidencia) return res.status(401).json({ mensaje: "La contraseña actual no es válida" });

        const contrasenaHasheada = await bcrypt.hash(contrasenaNueva, 10);
        await baseDeDatos.query('UPDATE Usuarios SET password = ? WHERE id_usuario = ?', [contrasenaHasheada, idUsuario]);
        res.json({ mensaje: "Contraseña actualizada satisfactoriamente" });
    } catch (error) {
        res.status(500).json({ mensaje: "Error al intentar cambiar la contraseña" });
    }
};

/**
 * Registra una solicitud de adopción incluyendo el archivo PDF adjunto.
 */
export const solicitarAdopcionConPDF = async (req, res) => {
    const { id_usuario, id_gato } = req.body;
    const rutaPdf = req.file ? `/uploads/adopciones/${req.file.filename}` : null;
    
    try {
        const [existente] = await baseDeDatos.query(
            'SELECT id_solicitud FROM Solicitudes_adopcion WHERE id_usuario = ? AND id_gato = ? AND estado != "Rechazada"',
            [id_usuario, id_gato]
        );

        if (existente.length > 0) {
            return res.status(400).json({ 
                mensaje: "Ya existe una solicitud activa para este gato." 
            });
        }

        const [resultado] = await baseDeDatos.query(
            `INSERT INTO Solicitudes_adopcion 
            (id_usuario, id_gato, pdf_url, estado) 
            VALUES (?, ?, ?, 'Pendiente')`,
            [id_usuario, id_gato, rutaPdf]
        );
        
        res.status(201).json({ 
            mensaje: "Solicitud recibida. Revisaremos tu cuestionario lo antes posible.", 
            id_solicitud: resultado.insertId 
        });
    } catch (error) {
        res.status(500).json({ mensaje: "Error al procesar la solicitud de adopción" });
    }
};

/**
 * Establece la fecha de finalización de un padrinazgo activo.
 */
export const cancelarPadrinazgoMiembro = async (req, res) => {
    const idUsuario = req.user.id;
    const { id } = req.params;

    try {
        const [resultado] = await baseDeDatos.query(
            `UPDATE Padrinazgos 
             SET fecha_fin = LAST_DAY(CURDATE()) 
             WHERE id_padrinazgo = ? AND id_usuario = ?`,
            [id, idUsuario]
        );

        if (resultado.affectedRows === 0) {
            return res.status(404).json({ mensaje: "No se encontró el apadrinamiento indicado" });
        }

        const [activos] = await baseDeDatos.query(
            `SELECT id_padrinazgo FROM Padrinazgos 
             WHERE id_usuario = ? AND (fecha_fin IS NULL OR fecha_fin > LAST_DAY(CURDATE()))`,
            [idUsuario]
        );

        let nuevoIdRol = null;
        if (activos.length === 0) {
            await baseDeDatos.query('UPDATE Usuarios SET id_rol = 4 WHERE id_usuario = ?', [idUsuario]);
            nuevoIdRol = 4;
        }

        res.json({ 
            mensaje: "Suscripción cancelada. Seguirá activa hasta fin de mes.",
            nuevoIdRol
        });
    } catch (error) {
        res.status(500).json({ mensaje: "Error al cancelar el apadrinamiento" });
    }
};

/**
 * Transfiere la suscripción de apadrinamiento de un gato a otro.
 */
export const transferirPadrinazgoMiembro = async (req, res) => {
    const idUsuario = req.user.id;
    const { id_padrinazgo_origen, nombre_nuevo_gato } = req.body;

    try {
        const [origen] = await baseDeDatos.query(
            'SELECT transferido_a, aportacion_mensual FROM Padrinazgos WHERE id_padrinazgo = ? AND id_usuario = ?',
            [id_padrinazgo_origen, idUsuario]
        );

        if (origen.length === 0) return res.status(404).json({ mensaje: "Apadrinamiento original no encontrado" });
        if (origen[0].transferido_a) return res.status(400).json({ mensaje: "Esta suscripción ya ha sido transferida." });

        const [filasGato] = await baseDeDatos.query('SELECT id_gato FROM Gatos WHERE nombre_gato = ?', [nombre_nuevo_gato]);
        if (filasGato.length === 0) return res.status(404).json({ mensaje: "El gato receptor no está registrado" });
        const idNuevoGato = filasGato[0].id_gato;

        const [resultado] = await baseDeDatos.query(
            'INSERT INTO Padrinazgos (id_usuario, id_gato, aportacion_mensual, fecha_inicio) VALUES (?, ?, ?, CURDATE())',
            [idUsuario, idNuevoGato, origen[0].aportacion_mensual]
        );
        
        await baseDeDatos.query(
            'UPDATE Padrinazgos SET transferido_a = ?, fecha_fin = CURDATE() WHERE id_padrinazgo = ?',
            [resultado.insertId, id_padrinazgo_origen]
        );

        res.json({ mensaje: `¡Transferencia completada! Ahora apoyas a ${nombre_nuevo_gato}.` });
    } catch (error) {
        res.status(500).json({ mensaje: "Error al realizar la transferencia de apoyo" });
    }
};

/**
 * Marca un padrinazgo histórico como archivado para el usuario.
 */
export const archivarPadrinazgoMiembro = async (req, res) => {
    const idUsuario = req.user.id;
    const { id } = req.params;

    try {
        const [resultado] = await baseDeDatos.query(
            'UPDATE Padrinazgos SET archivado = TRUE WHERE id_padrinazgo = ? AND id_usuario = ?',
            [id, idUsuario]
        );

        if (resultado.affectedRows === 0) return res.status(404).json({ mensaje: "Registro no encontrado" });

        res.json({ mensaje: "¡Guardado en tu historial!" });
    } catch (error) {
        res.status(500).json({ mensaje: "Error al archivar el recuerdo" });
    }
};

/**
 * Obtiene el listado de solicitudes de adopción enviadas por el miembro.
 */
export const obtenerAdopcionesMiembro = async (req, res) => {
    const idUsuario = req.user.id;
    try {
        const [filas] = await baseDeDatos.query(
            `SELECT s.*, g.nombre_gato 
             FROM Solicitudes_adopcion s 
             JOIN Gatos g ON s.id_gato = g.id_gato 
             WHERE s.id_usuario = ? 
             ORDER BY s.fecha_solicitud DESC`,
            [idUsuario]
        );
        res.json(filas);
    } catch (error) {
        res.status(500).json({ mensaje: "Error al consultar tus solicitudes de adopción" });
    }
};

/**
 * Obtiene el desglose detallado de los artículos de un pedido del miembro.
 */
export const obtenerDetallePedidoMiembro = async (req, res) => {
    const idUsuario = req.user.id;
    const { id } = req.params;
    try {
        const [filas] = await baseDeDatos.query(`
            SELECT pd.*, pr.nombre as producto_nombre, pr.imagen_url
            FROM Pedido_detalle pd
            JOIN Productos pr ON pd.id_producto = pr.id_producto
            JOIN Pedidos p ON pd.id_pedido = p.id_pedido
            WHERE pd.id_pedido = ? AND p.id_usuario = ?
        `, [id, idUsuario]);
        res.json(filas);
    } catch (error) { 
        res.status(500).json({ mensaje: "Error al recuperar los detalles de la compra" }); 
    }
};
