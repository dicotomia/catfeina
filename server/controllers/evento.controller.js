/**
 * Gestión de consultas y registro de inscripciones a eventos.
 */

import { EventoModelo } from '../models/evento.model.js';

/**
 * Obtiene el listado de actividades programadas según la categoría solicitada.
 */
export const obtenerEventosPublicos = async (req, res) => {
    try {
        const { categoria } = req.query;
        const eventos = await EventoModelo.obtenerTodos(categoria);
        res.json(eventos);
    } catch (error) {
        console.error("[Error] obtenerEventosPublicos:", error.message);
        res.status(500).json({ mensaje: "Error al recuperar la agenda de eventos" });
    }
};

/**
 * Obtiene la información técnica de una actividad específica por su identificador.
 */
export const obtenerEventoPorId = async (req, res) => {
    try {
        const evento = await EventoModelo.obtenerPorId(req.params.id);
        if (!evento) return res.status(404).json({ mensaje: "La actividad solicitada no existe" });
        res.json(evento);
    } catch (error) {
        console.error("[Error] obtenerEventoPorId:", error.message);
        res.status(500).json({ mensaje: "Error al consultar los detalles de la actividad" });
    }
};

/**
 * Tramita la reserva de plaza de un usuario para una actividad.
 */
export const inscribirEnEvento = async (req, res) => {
    try {
        const { id_evento, num_personas, observaciones, estado_pago } = req.body;
        const id_usuario = req.user.id; 

        const idInscripcion = await EventoModelo.inscribir(id_evento, id_usuario, num_personas, observaciones, estado_pago);
        res.status(201).json({ mensaje: "Te has inscrito correctamente en la actividad", id: idInscripcion });
    } catch (error) {
        console.error("[Error] inscribirEnEvento:", error.message);
        res.status(500).json({ mensaje: "No se pudo tramitar tu inscripción en este momento" });
    }
};

/**
 * Obtiene el registro completo de inscripciones para administración.
 */
export const obtenerInscripciones = async (req, res) => {
    try {
        const inscripciones = await EventoModelo.obtenerInscripciones();
        res.json(inscripciones);
    } catch (error) {
        console.error("[Error] obtenerInscripciones:", error.message);
        res.status(500).json({ mensaje: "Error al recuperar las inscripciones de eventos" });
    }
};

/**
 * Registra un nuevo evento en el sistema (Admin).
 */
export const crearEvento = async (req, res) => {
    try {
        const idNuevoEvento = await EventoModelo.crear(req.body);
        res.status(201).json({ mensaje: "Evento registrado satisfactoriamente", id: idNuevoEvento });
    } catch (error) {
        console.error("[Error] crearEvento:", error.message);
        res.status(500).json({ mensaje: "Error al registrar el nuevo evento" });
    }
};

/**
 * Actualiza la información técnica de un evento (Admin).
 */
export const actualizarEvento = async (req, res) => {
    try {
        const exitoActualizacion = await EventoModelo.actualizar(req.params.id, req.body);
        if (!exitoActualizacion) return res.status(404).json({ mensaje: "Evento no encontrado para actualizar" });
        res.json({ mensaje: "Agenda actualizada correctamente" });
    } catch (error) {
        console.error("[Error] actualizarEvento:", error.message);
        res.status(500).json({ mensaje: "Error al actualizar la información del evento" });
    }
};

/**
 * Elimina un evento del sistema (Admin).
 */
export const eliminarEvento = async (req, res) => {
    try {
        const exitoEliminacion = await EventoModelo.eliminar(req.params.id);
        if (!exitoEliminacion) return res.status(404).json({ mensaje: "Evento no encontrado o ya eliminado" });
        res.json({ mensaje: "Evento retirado de la agenda correctamente" });
    } catch (error) {
        console.error("[Error] eliminarEvento:", error.message);
        res.status(500).json({ mensaje: "Error al eliminar el evento" });
    }
};
