/**
 * Gestión de autenticación y control de acceso mediante tokens JWT.
 */

import jwt from 'jsonwebtoken';

const CLAVE_SECRETA = process.env.JWT_SECRET || 'Catfeina_contra_super_secreta_2026_ana.!';

/**
 * Valida el token de sesión y adjunta los datos del usuario a la petición.
 */
export const verificarToken = (req, res, next) => {
    const cabeceraAutorizacion = req.headers['authorization'];
    const tokenSesion = cabeceraAutorizacion && cabeceraAutorizacion.split(' ')[1];

    if (!tokenSesion) {
        return res.status(401).json({ mensaje: "No se ha proporcionado una credencial de acceso" });
    }

    jwt.verify(tokenSesion, CLAVE_SECRETA, (error, datosUsuario) => {
        if (error) {
            return res.status(403).json({ mensaje: "La sesión ha expirado o el token no es válido" });
        }
        
        req.user = datosUsuario; 
        next();
    });
};

/**
 * Restringe el acceso a usuarios con privilegios de administrador.
 */
export const verificarEsAdministrador = (req, res, next) => {
    if (req.user && req.user.rol === 1) {
        next();
    } else {
        res.status(403).json({ mensaje: "Acceso denegado: se requieren permisos de administración" });
    }
};

/**
 * Restringe el acceso a miembros del personal (administradores o empleados).
 */
export const verificarEsPersonal = (req, res, next) => {
    if (req.user && (req.user.rol === 1 || req.user.rol === 2)) {
        next();
    } else {
        res.status(403).json({ mensaje: "Acceso denegado: esta zona es exclusiva para el personal" });
    }
};
