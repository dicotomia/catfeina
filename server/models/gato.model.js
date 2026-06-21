/**
 * Gestión de registros y filtros avanzados para el catálogo de gatos.
 */

import baseDeDatos from '../db.js';

export const GatoModelo = {
    /**
     * Obtiene los registros de gatos aplicando los filtros seleccionados.
     */
    obtenerTodos: async (filtros = {}) => {
        let consultaSql = `
            SELECT G.*, GROUP_CONCAT(I.url) as urls_galeria
            FROM Gatos G
            LEFT JOIN Gato_Imagenes I ON G.id_gato = I.id_gato
        `;
        const valoresSql = [];
        const clausulasWhere = [];

        if (filtros.activo !== undefined) {
            clausulasWhere.push('G.activo = ?');
            valoresSql.push(filtros.activo);
        }

        if (filtros.estado && filtros.estado !== 'todos') {
            clausulasWhere.push('G.estado_adopcion = ?');
            valoresSql.push(filtros.estado);
        }

        if (filtros.genero && filtros.genero !== 'todos') {
            clausulasWhere.push('G.sexo = ?');
            valoresSql.push(filtros.genero);
        }

        if (clausulasWhere.length > 0) {
            consultaSql += ' WHERE ' + clausulasWhere.join(' AND ');
        }

        consultaSql += ` GROUP BY G.id_gato ORDER BY G.id_gato ASC`;

        const [filas] = await baseDeDatos.query(consultaSql, valoresSql);
        return filas.map(procesarRegistroGato);
    },

    /**
     * Obtiene la información completa de un gato por su identificador.
     */
    obtenerPorId: async (id) => {
        const consultaSql = `
            SELECT G.*, GROUP_CONCAT(I.url) as urls_galeria 
            FROM Gatos G
            LEFT JOIN Gato_Imagenes I ON G.id_gato = I.id_gato
            WHERE G.id_gato = ?
            GROUP BY G.id_gato
        `;
        const [filas] = await baseDeDatos.query(consultaSql, [id]);
        return filas.length > 0 ? procesarRegistroGato(filas[0]) : null;
    },

    /**
     * Crea un nuevo registro de gato incluyendo su galería de imágenes.
     */
    crear: async (datos) => {
        const conexion = await baseDeDatos.getConnection();
        try {
            await conexion.beginTransaction();
            
            const campos = ['nombre_gato', 'fecha_nacimiento', 'fecha_llegada', 'sexo', 'raza', 'color', 'esterilizado', 'salud', 'historia', 'apto_perros', 'apto_ninos', 'apto_otros_gatos', 'estado_adopcion', 'imagen_url', 'activo'];
            const marcadores = campos.map(() => '?').join(', ');
            const valores = campos.map(c => datos[c]);

            const [resultado] = await conexion.query(`INSERT INTO Gatos (${campos.join(', ')}) VALUES (${marcadores})`, valores);
            const idGato = resultado.insertId;

            if (datos.galeria && Array.isArray(datos.galeria) && datos.galeria.length > 0) {
                const filasImg = datos.galeria.map(url => [idGato, url]);
                await conexion.query('INSERT INTO Gato_Imagenes (id_gato, url) VALUES ?', [filasImg]);
            }

            await conexion.commit();
            return idGato;
        } catch (error) {
            await conexion.rollback();
            throw error;
        } finally {
            conexion.release();
        }
    },

    /**
     * Actualiza la información técnica y la galería de un gato.
     */
    actualizar: async (id, datos) => {
        const conexion = await baseDeDatos.getConnection();
        try {
            await conexion.beginTransaction();

            const campos = ['nombre_gato', 'fecha_nacimiento', 'fecha_llegada', 'sexo', 'raza', 'color', 'esterilizado', 'salud', 'historia', 'apto_perros', 'apto_ninos', 'apto_otros_gatos', 'estado_adopcion', 'imagen_url', 'activo', 'fecha_adopcion'];
            const setSql = campos.map(c => `${c} = ?`).join(', ');
            const valores = campos.map(c => datos[c] === undefined ? null : datos[c]);
            valores.push(id);

            await conexion.query(`UPDATE Gatos SET ${setSql} WHERE id_gato = ?`, valores);

            if (datos.galeria !== undefined) {
                await conexion.query('DELETE FROM Gato_Imagenes WHERE id_gato = ?', [id]);
                if (Array.isArray(datos.galeria) && datos.galeria.length > 0) {
                    const filasImg = datos.galeria.map(url => [id, url]);
                    await conexion.query('INSERT INTO Gato_Imagenes (id_gato, url) VALUES ?', [filasImg]);
                }
            }

            await conexion.commit();
            return true;
        } catch (error) {
            await conexion.rollback();
            throw error;
        } finally {
            conexion.release();
        }
    },

    /**
     * Elimina permanentemente el registro de un gato del sistema.
     */
    eliminar: async (id) => {
        const [resultado] = await baseDeDatos.query('DELETE FROM Gatos WHERE id_gato = ?', [id]);
        return resultado.affectedRows > 0;
    }
};

/**
 * Normaliza los datos del registro para su uso en la interfaz.
 */
function procesarRegistroGato(fila) {
    if (!fila) return null;
    const imagenes = fila.urls_galeria ? fila.urls_galeria.split(',') : [];
    return {
        ...fila,
        galeria_urls: fila.urls_galeria || '', 
        imagenes_secundarias: imagenes,
        galeria: imagenes
    };
}
