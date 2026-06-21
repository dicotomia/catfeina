/**
 * Gestión del proceso de autenticación y registro de usuarios.
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UsuarioModelo } from '../models/usuario.model.js';

const CLAVE_SECRETA = process.env.JWT_SECRET || 'Catfeina_contra_super_secreta_2026_ana.!';

/**
 * Procesa el acceso al sistema mediante validación de credenciales.
 */
export const login = async (req, res) => {
    const { identificador, password } = req.body;

    try {
        const usuario = await UsuarioModelo.buscarPorEmailOUsuario(identificador);
        
        if (!usuario) {
            return res.status(401).json({ mensaje: "Las credenciales introducidas no son correctas" });
        }

        const coinciden = await bcrypt.compare(password, usuario.password).catch(() => false);

        if (!coinciden) {
            return res.status(401).json({ mensaje: "Las credenciales introducidas no son correctas" });
        }

        // Firma del token de sesión con validez de 24 horas
        const token = jwt.sign(
            { id: usuario.id_usuario, rol: usuario.id_rol, nombre: usuario.nombre },
            CLAVE_SECRETA,
            { expiresIn: '24h' }
        );

        res.json({
            mensaje: "Acceso concedido satisfactoriamente",
            token,
            usuario: {
                id: usuario.id_usuario,
                id_usuario: usuario.id_usuario,
                nombre: usuario.nombre,
                apellidos: usuario.apellidos,
                email: usuario.email,
                telefono: usuario.telefono,
                rol: usuario.id_rol
            }
        });

    } catch (error) {
        console.error("[Error] login:", error.message);
        res.status(500).json({ mensaje: "Error interno al intentar iniciar sesión" });
    }
};

/**
 * Registra una nueva cuenta de usuario con contraseña encriptada.
 */
export const registro = async (req, res) => {
    const { nombre, apellidos, email, password, telefono } = req.body;

    try {
        const usuarioExistente = await UsuarioModelo.buscarPorEmailOUsuario(email);
        if (usuarioExistente) {
            return res.status(400).json({ mensaje: "Este correo electrónico ya se encuentra registrado" });
        }

        // Generación del hash de seguridad para la contraseña
        const contrasenaHasheada = await bcrypt.hash(password, 10);
        
        const idNuevoUsuario = await UsuarioModelo.crear({
            nombre,
            apellidos: apellidos || '',
            email,
            telefono: telefono || '',
            password: contrasenaHasheada,
            id_rol: 4 
        });

        const token = jwt.sign(
            { id: idNuevoUsuario, rol: 4, nombre: nombre },
            CLAVE_SECRETA,
            { expiresIn: '24h' }
        );

        res.status(201).json({ 
            mensaje: "Cuenta creada con éxito. ¡Bienvenido/a a la manada!", 
            token,
            usuario: {
                id: idNuevoUsuario,
                id_usuario: idNuevoUsuario, 
                nombre,
                apellidos: apellidos || '',
                email,
                telefono: telefono || '',
                rol: 4,
                id_rol: 4
            }
        });
    } catch (error) {
        console.error("[Error] registro:", error.message);
        res.status(500).json({ mensaje: "Error al intentar crear la cuenta de usuario" });
    }
};
