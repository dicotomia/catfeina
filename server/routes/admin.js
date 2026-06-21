/**
 * Rutas de administración para la gestión del panel.
 */

import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { 
    obtenerEventosAdmin, crearEvento, actualizarEvento, eliminarEvento,
    obtenerInscripcionesAdmin, actualizarInscripcion,
    obtenerReservasAdmin, obtenerEstadisticas,
    obtenerComentariosPendientes, actualizarEstadoComentario,
    obtenerAdopcionesAdmin, actualizarSolicitudAdopcion,
    obtenerUsuariosAdmin, obtenerPedidosAdmin, obtenerDetallePedido, actualizarEstadoPedido,
    actualizarUsuario, actualizarReserva, actualizarPedido,
    obtenerPadrinazgosAdmin, actualizarPadrinazgo, eliminarPadrinazgo
} from '../controllers/admin.controller.js';

import { 
    obtenerGatosAdmin, crearGato, actualizarGato, eliminarGato 
} from '../controllers/gato.controller.js';

import { 
    obtenerProductosAdmin, crearProducto, actualizarProducto, eliminarProducto 
} from '../controllers/producto.controller.js';

import { verificarToken, verificarEsPersonal } from '../middleware/auth.middleware.js';

const __nombreArchivo = fileURLToPath(import.meta.url);
const __directorioRaiz = path.dirname(__nombreArchivo);

const router = express.Router();

// Configuración de almacenamiento de imágenes
const rutaImagenes = path.join(__directorioRaiz, '../../client/recursos/imagenes');

const almacenamientoImagenes = multer.diskStorage({
    destination: (req, archivo, callback) => {
        callback(null, rutaImagenes);
    },
    filename: (req, archivo, callback) => {
        const sufijoUnico = Date.now() + '-' + Math.round(Math.random() * 1E9);
        callback(null, archivo.fieldname + '-' + sufijoUnico + path.extname(archivo.originalname));
    }
});

const subirArchivo = multer({ 
    storage: almacenamientoImagenes,
    fileFilter: (req, archivo, callback) => {
        if (archivo.mimetype.startsWith('image/')) {
            callback(null, true);
        } else {
            callback(new Error('Solo se permiten archivos de imagen'));
        }
    }
});

// Middlewares de seguridad global para el panel
router.use(verificarToken, verificarEsPersonal);

// Endpoints administrativos

// Estadísticas del panel
router.get('/stats', obtenerEstadisticas);

// Subida de archivos multimedia
router.post('/upload', subirArchivo.array('imagenes', 10), (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ mensaje: 'No se han recibido archivos para subir' });
    }
    res.json({ urls: req.files.map(f => f.filename) });
});

// Gestión de gatos
router.get('/gatos', obtenerGatosAdmin);
router.post('/gatos', crearGato);
router.put('/gatos/:id', actualizarGato);
router.delete('/gatos/:id', eliminarGato);

// Gestión de productos
router.get('/productos', obtenerProductosAdmin);
router.post('/productos', crearProducto);
router.put('/productos/:id', actualizarProducto);
router.delete('/productos/:id', eliminarProducto);

// Gestión de reservas
router.get('/reservas', obtenerReservasAdmin);
router.put('/reservas/:id', actualizarReserva);

// Gestión de eventos e inscripciones
router.get('/eventos', obtenerEventosAdmin);
router.post('/eventos', crearEvento);
router.put('/eventos/:id', actualizarEvento);
router.delete('/eventos/:id', eliminarEvento);
router.get('/eventos/inscripciones', obtenerInscripcionesAdmin);
router.put('/eventos/inscripciones/:id', actualizarInscripcion);

// Moderación de comentarios
router.get('/comentarios/pendientes', obtenerComentariosPendientes);
router.put('/comentarios/:id/estado', actualizarEstadoComentario);

// Gestión de adopciones
router.get('/adopciones', obtenerAdopcionesAdmin);
router.put('/adopciones/:id', actualizarSolicitudAdopcion);

// Gestión de usuarios
router.get('/usuarios', obtenerUsuariosAdmin);
router.put('/usuarios/:id', actualizarUsuario);

// Gestión de pedidos
router.get('/pedidos', obtenerPedidosAdmin);
router.get('/pedidos/:id/detalle', obtenerDetallePedido);
router.put('/pedidos/:id/estado', actualizarEstadoPedido);
router.put('/pedidos/:id', actualizarPedido);

// Gestión de padrinazgos
router.get('/padrinazgos', obtenerPadrinazgosAdmin);
router.put('/padrinazgos/:id', actualizarPadrinazgo);
router.delete('/padrinazgos/:id', eliminarPadrinazgo);

export default router;
