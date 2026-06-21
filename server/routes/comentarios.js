/**
 * Rutas para la gestión de comentarios y testimonios.
 */

import express from 'express';
import { 
    obtenerComentariosAprobados, 
    enviarComentario 
} from '../controllers/comentario.controller.js';
import { verificarToken } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/aprobados', obtenerComentariosAprobados);
router.post('/enviar', verificarToken, enviarComentario);

export default router;
