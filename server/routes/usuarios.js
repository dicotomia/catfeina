/**
 * Rutas para la gestión del perfil de usuario y acciones de miembro.
 */

import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { 
    obtenerEstadisticasMiembro, 
    obtenerReservasMiembro, 
    obtenerPadrinazgosMiembro,
    obtenerPedidosMiembro, 
    obtenerPerfilMiembro, 
    actualizarPerfilMiembro, 
    cambiarContrasena,
    obtenerEventosMiembro,
    obtenerAdopcionesMiembro,
    obtenerDetallePedidoMiembro,
    solicitarAdopcionConPDF,
    cancelarPadrinazgoMiembro,
    transferirPadrinazgoMiembro,
    archivarPadrinazgoMiembro
} from '../controllers/usuario.controller.js';
import { verificarToken } from '../middleware/auth.middleware.js';

const rutaArchivoActual = fileURLToPath(import.meta.url);
const directorioActual = path.dirname(rutaArchivoActual);

const enrutador = express.Router();

// Configuración de almacenamiento para solicitudes de adopción en PDF
const configuracionAlmacenamiento = multer.diskStorage({
    destination: (req, archivo, callback) => {
        const rutaDestino = path.join(directorioActual, '../uploads/adopciones/');
        callback(null, rutaDestino);
    },
    filename: (req, archivo, callback) => {
        const marcaTiempo = Date.now();
        callback(null, `adopcion-${marcaTiempo}.pdf`);
    }
});
const gestorSubida = multer({ storage: configuracionAlmacenamiento });

// Middlewares de seguridad
enrutador.use(verificarToken);

// Consultas de datos del miembro
enrutador.get('/stats', obtenerEstadisticasMiembro);
enrutador.get('/reservas', obtenerReservasMiembro);
enrutador.get('/eventos', obtenerEventosMiembro);
enrutador.get('/adopciones', obtenerAdopcionesMiembro);
enrutador.get('/padrinazgos', obtenerPadrinazgosMiembro);
enrutador.get('/pedidos', obtenerPedidosMiembro);
enrutador.get('/pedidos/:id/detalle', obtenerDetallePedidoMiembro);
enrutador.get('/perfil', obtenerPerfilMiembro);

// Actualización de datos del perfil
enrutador.put('/perfil', actualizarPerfilMiembro);
enrutador.put('/perfil/password', cambiarContrasena);

// Acciones de negocio del miembro
enrutador.post('/adoptar-pdf', gestorSubida.single('pdf'), solicitarAdopcionConPDF);
enrutador.put('/padrinazgos/:id/cancelar', cancelarPadrinazgoMiembro);
enrutador.post('/padrinazgos/transferir', transferirPadrinazgoMiembro);
enrutador.put('/padrinazgos/:id/archivar', archivarPadrinazgoMiembro);

export default enrutador;
