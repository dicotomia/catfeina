/**
 * Rutas de autenticación de usuarios.
 */

import express from 'express';
import { login, registro } from '../controllers/auth.controller.js';

const router = express.Router();

router.post('/login', login);
router.post('/registro', registro);

export default router;
