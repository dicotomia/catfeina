/**
 * Gestión centralizada de las comunicaciones HTTP con la API de administración.
 */

const URL_BASE_ADMIN = '/api/admin';

/**
 * Genera el objeto de cabeceras incluyendo el token de autorización.
 */
const obtenerCabeceras = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}`
});

/**
 * Valida la respuesta del servidor y normaliza el formato de los datos devueltos.
 */
async function procesarRespuesta(respuesta) {
    if (respuesta.status === 401) {
        localStorage.clear();
        window.location.href = '/login';
        return;
    }

    const esJson = respuesta.headers.get('content-type')?.includes('application/json');
    const datos = esJson ? await respuesta.json() : null;

    if (!respuesta.ok) {
        const mensajeError = datos?.mensaje || `Error en la comunicación: ${respuesta.status}`;
        const error = new Error(mensajeError);
        error.estado = respuesta.status;
        error.datos = datos;
        throw error;
    }

    return datos || { exito: true };
}

/**
 * Ejecuta una petición fetch con configuración de seguridad y control de errores.
 */
async function realizarPeticion(ruta, opciones = {}) {
    try {
        const configuracion = {
            ...opciones,
            headers: {
                ...obtenerCabeceras(),
                ...opciones.headers
            }
        };

        const respuesta = await fetch(`${URL_BASE_ADMIN}${ruta}`, configuracion);
        return await procesarRespuesta(respuesta);
    } catch (error) {
        console.error(`[Error de API] en ${ruta}:`, error.message);
        throw error;
    }
}

/**
 * Métodos exportados para interactuar con los recursos de la API.
 */
export const interfazApi = {
    /**
     * Realiza una solicitud de obtención de datos mediante el método GET.
     */
    obtener: (url) => realizarPeticion(url),

    /**
     * Realiza una solicitud de creación de recurso mediante el método POST.
     */
    enviar: (url, cuerpo) => realizarPeticion(url, { 
        method: 'POST', 
        body: JSON.stringify(cuerpo) 
    }),

    /**
     * Realiza una solicitud de modificación de recurso mediante el método PUT.
     */
    actualizar: (url, cuerpo) => realizarPeticion(url, { 
        method: 'PUT', 
        body: JSON.stringify(cuerpo) 
    }),

    /**
     * Realiza una solicitud de eliminación de recurso mediante el método DELETE.
     */
    eliminar: (url) => realizarPeticion(url, { 
        method: 'DELETE' 
    }),
    
    /**
     * Gestiona la subida de archivos binarios utilizando el formato FormData.
     */
    subirArchivo: async (ruta, datosFormulario) => {
        const configuracion = {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${localStorage.getItem('token')}` 
            },
            body: datosFormulario
        };
        const respuesta = await fetch(`${URL_BASE_ADMIN}${ruta}`, configuracion);
        return await procesarRespuesta(respuesta);
    }
};
