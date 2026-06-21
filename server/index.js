/**
 * Punto de entrada principal del servidor.
 */

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import compression from 'compression';

// Importación de rutas modulares
import rutasAutenticacion from './routes/auth.js';
import rutasAdministrador from './routes/admin.js';
import rutasUsuarios from './routes/usuarios.js';
import rutasEventos from './routes/eventos.js';
import rutasProductos from './routes/productos.js';
import rutasComentarios from './routes/comentarios.js';
import rutasGatos from './routes/gatos.js';
import rutasReservas from './routes/reservas.js';

const servidor = express();
const PUERTO = process.env.PORT || 3000;
const __nombreArchivo = fileURLToPath(import.meta.url);
const __directorioRaiz = path.dirname(__nombreArchivo);

// Configuración de middlewares

// Comprime las respuestas para optimizar el rendimiento
servidor.use(compression());

// Configura CORS y el procesamiento de JSON
servidor.use(cors());
servidor.use(express.json());

// Registro de rutas de la API

servidor.use('/api/auth', rutasAutenticacion);
servidor.use('/api/admin', rutasAdministrador);
servidor.use('/api/usuarios', rutasUsuarios);
servidor.use('/api/eventos', rutasEventos);
servidor.use('/api/productos', rutasProductos);
servidor.use('/api/comentarios', rutasComentarios);
servidor.use('/api/gatos', rutasGatos);
servidor.use('/api/reservas', rutasReservas);

// Gestión de archivos estáticos

// Sirve el favicon oficial
servidor.get('/favicon.ico', (req, res) => {
    res.sendFile(path.join(__directorioRaiz, '../client/recursos/imagenes/logo-flavicon.svg'));
});

// Sirve los archivos del frontend con caché de 24 horas
servidor.use(express.static(path.join(__directorioRaiz, '../client'), {
    maxAge: 86400000 
}));

// Sirve la carpeta de subidas con caché de 1 hora
servidor.use('/uploads', express.static(path.join(__directorioRaiz, 'uploads'), {
    maxAge: 3600000 
}));

// Inicio del servidor

servidor.listen(PUERTO, () => {
    console.log(`[Servidor] Catfeina activo en el puerto ${PUERTO}`);
});
