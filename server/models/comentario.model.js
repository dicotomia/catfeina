/**
 * Gestión de almacenamiento y recuperación de comentarios de usuarios.
 */

import baseDeDatos from '../db.js';

export const ComentarioModelo = {
    /**
     * Obtiene los comentarios aprobados por moderación.
     */
    obtenerAprobados: async (limite = 6) => {
        const [filas] = await baseDeDatos.query(`
            SELECT c.*, u.nombre, u.apellidos 
            FROM Comentarios c 
            JOIN Usuarios u ON c.id_usuario = u.id_usuario 
            WHERE c.estado = 'aprobado' 
            ORDER BY c.fecha_comentario DESC 
            LIMIT ?
        `, [limite]);
        return filas;
    },

    /**
     * Registra un nuevo comentario con estado pendiente de moderación.
     */
    crear: async (datos) => {
        const { id_usuario, puntuacion, texto } = datos;
        const [resultado] = await baseDeDatos.query(
            'INSERT INTO Comentarios (id_usuario, puntuacion, texto, estado) VALUES (?, ?, ?, "pendiente")',
            [id_usuario, puntuacion, texto]
        );
        return resultado.insertId;
    }
};
