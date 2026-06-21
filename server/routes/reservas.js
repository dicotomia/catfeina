/**
 * Rutas para la gestión de reservas de visitas.
 */

import express from 'express';
import { crearReserva, obtenerMisReservas, cancelarReserva } from '../controllers/reserva.controller.js';
import { verificarToken } from '../middleware/auth.middleware.js';

const router = express.Router();

// Registra una nueva reserva
router.post('/', verificarToken, crearReserva);

// Obtiene las reservas de un usuario específico
router.get('/usuario/:id_usuario', verificarToken, obtenerMisReservas);

// Cancela una reserva existente
router.put('/:id_reserva/cancelar', verificarToken, cancelarReserva);

export default router;
