/**
 * Gestión del inventario de productos y procesamiento de pedidos.
 */

import baseDeDatos from '../db.js';

export const ProductoModelo = {
    /**
     * Obtiene el listado de productos aplicando filtros de visibilidad y categoría.
     */
    obtenerTodos: async (filtros = {}) => {
        let consultaSql = `
            SELECT P.*, GROUP_CONCAT(PI.url) as urls_galeria 
            FROM Productos P
            LEFT JOIN Producto_Imagenes PI ON P.id_producto = PI.id_producto
            WHERE 1=1
        `;
        const valoresPeticion = [];

        if (filtros.activo !== undefined) {
            consultaSql += ' AND P.activo = ?';
            valoresPeticion.push(filtros.activo);
        }

        if (filtros.categoria && !['Todos', 'todos'].includes(filtros.categoria)) {
            consultaSql += ' AND P.categoria = ?';
            valoresPeticion.push(filtros.categoria);
        }

        consultaSql += ` GROUP BY P.id_producto ORDER BY P.id_producto ASC`;

        const [filas] = await baseDeDatos.query(consultaSql, valoresPeticion);
        return filas.map(normalizarDatosProducto);
    },

    /**
     * Obtiene la información detallada de un producto por su identificador.
     */
    obtenerPorId: async (id) => {
        const consultaSql = `
            SELECT P.*, GROUP_CONCAT(PI.url) as urls_galeria 
            FROM Productos P
            LEFT JOIN Producto_Imagenes PI ON P.id_producto = PI.id_producto
            WHERE P.id_producto = ?
            GROUP BY P.id_producto
        `;
        const [filas] = await baseDeDatos.query(consultaSql, [id]);
        return filas.length > 0 ? normalizarDatosProducto(filas[0]) : null;
    },

    /**
     * Crea un nuevo producto en el catálogo con su galería de imágenes.
     */
    crear: async (datos) => {
        const conexionSql = await baseDeDatos.getConnection();
        try {
            await conexionSql.beginTransaction();

            const camposBd = ['nombre', 'descripcion', 'precio', 'stock', 'categoria', 'imagen_url', 'pedido_online', 'activo'];
            const marcadoresSql = camposBd.map(() => '?').join(', ');
            const valoresInsertar = [
                datos.nombre,
                datos.descripcion,
                datos.precio,
                datos.stock,
                datos.categoria,
                datos.imagen_url,
                datos.pedido_online ? 1 : 0,
                datos.activo !== undefined ? (datos.activo ? 1 : 0) : 1
            ];

            const [resultado] = await conexionSql.query(`INSERT INTO Productos (${camposBd.join(', ')}) VALUES (${marcadoresSql})`, valoresInsertar);
            const idNuevoProducto = resultado.insertId;

            if (datos.galeria && Array.isArray(datos.galeria) && datos.galeria.length > 0) {
                const filasImagenes = datos.galeria.map(url => [idNuevoProducto, url]);
                await conexionSql.query('INSERT INTO Producto_Imagenes (id_producto, url) VALUES ?', [filasImagenes]);
            }

            await conexionSql.commit();
            return idNuevoProducto;
        } catch (error) {
            await conexionSql.rollback();
            throw error;
        } finally {
            conexionSql.release();
        }
    },

    /**
     * Actualiza la información técnica, stock y galería de un producto.
     */
    actualizar: async (id, datos) => {
        const conexionSql = await baseDeDatos.getConnection();
        try {
            await conexionSql.beginTransaction();

            const consultaSql = `
                UPDATE Productos SET 
                    nombre = ?, descripcion = ?, precio = ?, stock = ?, 
                    categoria = ?, imagen_url = ?, pedido_online = ?, activo = ? 
                WHERE id_producto = ?`;
            
            const valoresActualizar = [
                datos.nombre, datos.descripcion, datos.precio, datos.stock,
                datos.categoria, datos.imagen_url, datos.pedido_online ? 1 : 0,
                datos.activo ? 1 : 0, id
            ];

            await conexionSql.query(consultaSql, valoresActualizar);

            if (datos.galeria !== undefined) {
                await conexionSql.query('DELETE FROM Producto_Imagenes WHERE id_producto = ?', [id]);
                if (Array.isArray(datos.galeria) && datos.galeria.length > 0) {
                    const filasImagenes = datos.galeria.map(url => [id, url]);
                    await conexionSql.query('INSERT INTO Producto_Imagenes (id_producto, url) VALUES ?', [filasImagenes]);
                }
            }

            await conexionSql.commit();
            return true;
        } catch (error) {
            await conexionSql.rollback();
            throw error;
        } finally {
            conexionSql.release();
        }
    },

    /**
     * Elimina permanentemente un producto del catálogo.
     */
    eliminar: async (id) => {
        const [resultado] = await baseDeDatos.query('DELETE FROM Productos WHERE id_producto = ?', [id]);
        return resultado.affectedRows > 0;
    },

    /**
     * Registra un pedido de compra actualizando el stock disponible.
     */
    crearPedido: async (idUsuario, articulos, montoTotal) => {
        const conexionSql = await baseDeDatos.getConnection();
        try {
            await conexionSql.beginTransaction();
            const [resultadoPedido] = await conexionSql.query(
                'INSERT INTO Pedidos (id_usuario, total_pago, estado_envio, pagado) VALUES (?, ?, "Preparando", TRUE)',
                [idUsuario, montoTotal]
            );
            const idNuevoPedido = resultadoPedido.insertId;

            for (const item of articulos) {
                await conexionSql.query(
                    'INSERT INTO Pedido_detalle (id_pedido, id_producto, cantidad, precio_unitario) VALUES (?, ?, ?, ?)',
                    [idNuevoPedido, item.id_producto, item.cantidad, item.precio]
                );
                await conexionSql.query(
                    'UPDATE Productos SET stock = stock - ? WHERE id_producto = ?',
                    [item.cantidad, item.id_producto]
                );
            }

            await conexionSql.commit();
            return idNuevoPedido;
        } catch (error) {
            await conexionSql.rollback();
            throw error;
        } finally {
            conexionSql.release();
        }
    }
};

/**
 * Normaliza los datos del producto para su uso en la interfaz.
 */
function normalizarDatosProducto(fila) {
    if (!fila) return null;
    const listaImagenes = fila.urls_galeria ? fila.urls_galeria.split(',') : [];
    return {
        ...fila,
        galeria_urls: fila.urls_galeria || '',
        imagenes_secundarias: listaImagenes,
        galeria: listaImagenes
    };
}
