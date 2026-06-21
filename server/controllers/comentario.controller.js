/**
 * Gestión de la recuperación y registro de comentarios de usuarios.
 */

import { ComentarioModelo } from '../models/comentario.model.js';

/**
 * Obtiene el listado de opiniones aprobadas por moderación.
 */
export const obtenerComentariosAprobados = async (req, res) => {
    try {
        const comentarios = await ComentarioModelo.obtenerAprobados();
        res.json(comentarios);
    } catch (error) {
        console.error("[Error] obtenerComentariosAprobados:", error.message);
        res.status(500).json({ mensaje: "Error al recuperar las opiniones de los usuarios" });
    }
};

/**
 * Registra un nuevo comentario del usuario autenticado.
 */
export const enviarComentario = async (req, res) => {
    let { puntuacion, texto } = req.body;
    const id_usuario = req.user.id;
    
    if (!texto || !puntuacion) {
        return res.status(400).json({ mensaje: "Es necesario incluir una valoración y un mensaje" });
    }

    // Sanitización de etiquetas HTML en el texto recibido
    texto = texto.replace(/<[^>]*>?/gm, '');

    try {
        await ComentarioModelo.crear({ id_usuario, puntuacion, texto });
        res.json({ mensaje: "¡Gracias! Tu mensaje ha sido recibido y será revisado por nuestro equipo." });
    } catch (error) {
        console.error("[Error] enviarComentario:", error.message);
        res.status(500).json({ mensaje: "No se pudo registrar tu comentario en este momento" });
    }
};
