import { ProductoModelo } from '../models/producto.model.js';

/**
 * Obtiene el catálogo de productos activos disponibles para el público.
 */
export const obtenerProductos = async (req, res) => {
    try {
        const { categoria } = req.query;
        const productos = await ProductoModelo.obtenerTodos({ 
            categoria: categoria || 'todos',
            activo: 1 
        });
        res.json(productos);
    } catch (error) {
        console.error("[Error] obtenerProductos:", error.message);
        res.status(500).json({ mensaje: "Error al recuperar el catálogo de productos" });
    }
};

/**
 * Obtiene la información técnica detallada de un producto específico.
 */
export const obtenerProductoPorId = async (req, res) => {
    try {
        const producto = await ProductoModelo.obtenerPorId(req.params.id);
        if (!producto) return res.status(404).json({ mensaje: "El producto solicitado no existe" });
        res.json(producto);
    } catch (error) {
        console.error("[Error] obtenerProductoPorId:", error.message);
        res.status(500).json({ mensaje: "Error al consultar los detalles del producto" });
    }
};

/**
 * Registra un pedido de compra y procesa la transacción de los artículos.
 */
export const realizarCompra = async (req, res) => {
    const { id_usuario, items, total } = req.body;
    try {
        const idPedido = await ProductoModelo.crearPedido(id_usuario, items, total);
        res.status(201).json({ 
            mensaje: "Compra procesada con éxito", 
            id_pedido: idPedido 
        });
    } catch (error) {
        console.error("[Error] realizarCompra:", error.message);
        res.status(500).json({ mensaje: "No se pudo completar el proceso de compra" });
    }
};

/**
 * Obtiene el inventario completo para la gestión administrativa.
 */
export const obtenerProductosAdmin = async (req, res) => {
    try {
        const productos = await ProductoModelo.obtenerTodos({});
        res.json(productos);
    } catch (error) {
        console.error("[Error] obtenerProductosAdmin:", error.message);
        res.status(500).json({ mensaje: "Error al cargar el inventario administrativo" });
    }
};

/**
 * Registra un nuevo producto en el catálogo del sistema.
 */
export const crearProducto = async (req, res) => {
    try {
        const idNuevoProducto = await ProductoModelo.crear(req.body);
        res.status(201).json({ mensaje: "Producto registrado correctamente en el sistema", id: idNuevoProducto });
    } catch (error) {
        console.error("[Error] crearProducto:", error.message);
        res.status(500).json({ mensaje: "Error al intentar crear el producto" });
    }
};

/**
 * Actualiza la información técnica y de disponibilidad de un producto.
 */
export const actualizarProducto = async (req, res) => {
    const { id } = req.params;
    const datosActualizados = req.body;

    try {
        // Conversión de tipos para asegurar consistencia en el almacenamiento
        if (datosActualizados.activo !== undefined) {
            datosActualizados.activo = [true, "1", 1].includes(datosActualizados.activo);
        }
        if (datosActualizados.pedido_online !== undefined) {
            datosActualizados.pedido_online = [true, "1", 1].includes(datosActualizados.pedido_online);
        }

        const exitoActualizacion = await ProductoModelo.actualizar(id, datosActualizados);
        if (!exitoActualizacion) return res.status(404).json({ mensaje: "Producto no encontrado para actualizar" });
        
        res.json({ mensaje: "Información del producto actualizada satisfactoriamente" });
    } catch (error) {
        console.error("[Error] actualizarProducto:", error.message);
        res.status(500).json({ mensaje: "Error al guardar las modificaciones del producto" });
    }
};

/**
 * Elimina un producto del catálogo del sistema.
 */
export const eliminarProducto = async (req, res) => {
    try {
        const exitoEliminacion = await ProductoModelo.eliminar(req.params.id);
        if (!exitoEliminacion) return res.status(404).json({ mensaje: "El producto no existe o ya ha sido borrado" });
        res.json({ mensaje: "Producto eliminado del sistema correctamente" });
    } catch (error) {
        console.error("[Error] eliminarProducto:", error.message);
        res.status(500).json({ mensaje: "No se pudo realizar la eliminación del producto" });
    }
};
