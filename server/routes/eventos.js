/**
 * Rutas para la gestión de eventos y actividades.
 */

import express from 'express';
import { 
    obtenerEventosPublicos, 
    obtenerEventoPorId, 
    inscribirEnEvento,
    obtenerInscripciones,
    crearEvento,
    actualizarEvento,
    eliminarEvento
} from '../controllers/evento.controller.js';
import { verificarToken } from '../middleware/auth.middleware.js';

const router = express.Router();

// Rutas públicas
router.get('/', obtenerEventosPublicos);
router.get('/:id', obtenerEventoPorId);

// Rutas de usuario registrado
router.post('/inscribir', verificarToken, inscribirEnEvento);

// Rutas administrativas
router.get('/inscripciones', verificarToken, obtenerInscripciones);
router.post('/admin', verificarToken, crearEvento);
router.put('/admin/:id', verificarToken, actualizarEvento);
router.delete('/admin/:id', verificarToken, eliminarEvento);

export default router;
