/**
 * Rutas para la tienda online.
 */

import express from 'express';
import { 
    obtenerProductos, 
    realizarCompra, 
    obtenerProductoPorId 
} from '../controllers/producto.controller.js';

const router = express.Router();

router.get('/', obtenerProductos);
router.get('/:id', obtenerProductoPorId);
router.post('/comprar', realizarCompra);

export default router;
