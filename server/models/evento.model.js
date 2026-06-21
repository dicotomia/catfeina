/**
 * Gestión de la agenda de eventos y registro de inscripciones.
 */

import baseDeDatos from '../db.js';

export const EventoModelo = {
    /**
     * Obtiene todos los eventos con opción de filtrado por categoría.
     */
    obtenerTodos: async (categoria) => {
        let consultaSql = 'SELECT * FROM Eventos WHERE 1=1';
        let valoresPeticion = [];
        
        if (categoria && categoria !== 'Todos') {
            consultaSql += ' AND categoria = ?';
            valoresPeticion.push(categoria);
        }
        
        consultaSql += ' ORDER BY fecha DESC';
        const [filas] = await baseDeDatos.query(consultaSql, valoresPeticion);
        return filas;
    },

    /**
     * Obtiene la información de un evento específico por su identificador.
     */
    obtenerPorId: async (id) => {
        const [filas] = await baseDeDatos.query('SELECT * FROM Eventos WHERE id_evento = ?', [id]);
        return filas[0];
    },

    /**
     * Registra la inscripción de un usuario en un evento.
     */
    inscribir: async (idEvento, idUsuario, numPersonas, observaciones, estadoPago = 'Pendiente') => {
        const [resultado] = await baseDeDatos.query(
            'INSERT INTO Inscripciones_Eventos (id_evento, id_usuario, num_personas, observaciones, estado_pago) VALUES (?, ?, ?, ?, ?)',
            [idEvento, idUsuario, numPersonas || 1, observaciones || '', estadoPago]
        );
        return resultado.insertId;
    },

    /**
     * Obtiene el listado completo de inscripciones registradas en todos los eventos (Admin).
     */
    obtenerInscripciones: async () => {
        const consultaSql = `
            SELECT IE.*, E.titulo as nombre_evento, U.nombre, U.apellidos, U.email 
            FROM Inscripciones_Eventos IE
            JOIN Eventos E ON IE.id_evento = E.id_evento
            JOIN Usuarios U ON IE.id_usuario = U.id_usuario
            ORDER BY IE.fecha_inscripcion DESC
        `;
        const [filas] = await baseDeDatos.query(consultaSql);
        return filas;
    },

    /**
     * Registra un nuevo evento en el sistema (Admin).
     */
    crear: async (datos) => {
        const camposBd = ['titulo', 'descripcion', 'fecha', 'hora', 'ubicacion', 'categoria', 'precio', 'imagen_url', 'activo'];
        const marcadoresSql = camposBd.map(() => '?').join(', ');
        const valoresInsertar = [
            datos.titulo, datos.descripcion, datos.fecha, datos.hora,
            datos.ubicacion, datos.categoria, datos.precio || 0,
            datos.imagen_url, datos.activo !== undefined ? (datos.activo ? 1 : 0) : 1
        ];

        const [resultado] = await baseDeDatos.query(`INSERT INTO Eventos (${camposBd.join(', ')}) VALUES (${marcadoresSql})`, valoresInsertar);
        return resultado.insertId;
    },

    /**
     * Actualiza la información de un evento existente (Admin).
     */
    actualizar: async (id, datos) => {
        const consultaSql = `
            UPDATE Eventos SET 
                titulo = ?, descripcion = ?, fecha = ?, hora = ?, 
                ubicacion = ?, categoria = ?, precio = ?, imagen_url = ?, activo = ? 
            WHERE id_evento = ?`;
        
        const valoresActualizar = [
            datos.titulo, datos.descripcion, datos.fecha, datos.hora,
            datos.ubicacion, datos.categoria, datos.precio,
            datos.imagen_url, datos.activo ? 1 : 0, id
        ];

        const [resultado] = await baseDeDatos.query(consultaSql, valoresActualizar);
        return resultado.affectedRows > 0;
    },

    /**
     * Elimina permanentemente un evento del sistema (Admin).
     */
    eliminar: async (id) => {
        const [resultado] = await baseDeDatos.query('DELETE FROM Eventos WHERE id_evento = ?', [id]);
        return resultado.affectedRows > 0;
    }
};
