/**
 * Rutas para el catálogo público de gatos.
 */

import express from 'express';
import { obtenerGatos, obtenerGatoPorId } from '../controllers/gato.controller.js';

const router = express.Router();

// Obtiene el listado general con filtros
router.get('/', obtenerGatos);

// Obtiene la ficha técnica por identificador
router.get('/:id', obtenerGatoPorId);

export default router;
