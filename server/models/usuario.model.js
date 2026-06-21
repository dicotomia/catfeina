/**
 * Gestión de cuentas de usuario y procesos de autenticación.
 */

import baseDeDatos from '../db.js';

export const UsuarioModelo = {
    /**
     * Localiza un usuario por su dirección de correo electrónico o nombre.
     */
    buscarPorEmailOUsuario: async (terminoBusqueda) => {
        const [filas] = await baseDeDatos.query(
            'SELECT id_usuario, id_rol, nombre, apellidos, email, telefono, password FROM Usuarios WHERE email = ? OR nombre = ?', 
            [terminoBusqueda, terminoBusqueda]
        );
        return filas[0];
    },

    /**
     * Crea un nuevo perfil de usuario en la base de datos.
     */
    crear: async (datos) => {
        const { id_rol, nombre, apellidos, email, telefono, password } = datos;
        const [resultado] = await baseDeDatos.query(
            'INSERT INTO Usuarios (id_rol, nombre, apellidos, email, telefono, password) VALUES (?, ?, ?, ?, ?, ?)',
            [id_rol || 4, nombre, apellidos, email, telefono, password]
        );
        return resultado.insertId;
    }
};
