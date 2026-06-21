import { GatoModelo } from '../models/gato.model.js';

/**
 * Obtiene el catálogo de gatos con filtros de género, estado y búsqueda.
 */
export const obtenerGatos = async (req, res) => {
    try {
        const { genero, estado, busqueda } = req.query;
        
        const filtros = { 
            activo: 1, 
            genero: genero || 'todos', 
            estado: estado || 'todos'
        };
        
        let michis = await GatoModelo.obtenerTodos(filtros);

        // Filtra los resultados por coincidencia textual
        if (busqueda) {
            const criterio = busqueda.toLowerCase();
            michis = michis.filter(michi => 
                michi.nombre_gato.toLowerCase().includes(criterio) || 
                (michi.raza && michi.raza.toLowerCase().includes(criterio))
            );
        }

        res.json(michis);
    } catch (error) {
        console.error("Error al recuperar michis:", error);
        res.status(500).json({ mensaje: "No se pudo cargar el catálogo de gatos" });
    }
};

/**
 * Obtiene la información detallada de un gato por su identificador.
 */
export const obtenerGatoPorId = async (req, res) => {
    try {
        const michi = await GatoModelo.obtenerPorId(req.params.id);
        if (!michi) return res.status(404).json({ mensaje: "Michi no localizado" });
        res.json(michi);
    } catch (error) {
        res.status(500).json({ mensaje: "Error al consultar la ficha" });
    }
};

/**
 * Lista todos los gatos para el panel de administración.
 */
export const obtenerGatosAdmin = async (req, res) => {
    try {
        const lista = await GatoModelo.obtenerTodos({});
        res.json(lista);
    } catch (error) {
        res.status(500).json({ mensaje: "Error en el listado administrativo" });
    }
};

/**
 * Registra un nuevo gato en el sistema.
 */
export const crearGato = async (req, res) => {
    try {
        const id = await GatoModelo.crear(req.body);
        res.status(201).json({ mensaje: "Nuevo michi registrado", id });
    } catch (error) {
        res.status(500).json({ mensaje: "No se pudo completar el registro" });
    }
};

/**
 * Actualiza los datos de un registro felino.
 */
export const actualizarGato = async (req, res) => {
    const { id } = req.params;
    const datos = req.body;

    try {
        // Gestiona la fecha de adopción según el estado seleccionado
        if (datos.estado_adopcion === 'Adoptado' && !datos.fecha_adopcion) {
            datos.fecha_adopcion = new Date().toISOString().split('T')[0];
        } else if (datos.estado_adopcion !== 'Adoptado') {
            datos.fecha_adopcion = null;
        }

        const exito = await GatoModelo.actualizar(id, datos);
        if (!exito) return res.status(404).json({ mensaje: "No se encontró el michi" });
        
        res.json({ mensaje: "Ficha actualizada correctamente" });
    } catch (error) {
        res.status(500).json({ mensaje: "Error al guardar los cambios" });
    }
};

/**
 * Elimina de forma permanente el registro de un gato.
 */
export const eliminarGato = async (req, res) => {
    try {
        const borrado = await GatoModelo.eliminar(req.params.id);
        if (!borrado) return res.status(404).json({ mensaje: "Michi no encontrado" });
        res.json({ mensaje: "Registro eliminado con éxito" });
    } catch (error) {
        res.status(500).json({ mensaje: "No se pudo borrar el registro" });
    }
};
