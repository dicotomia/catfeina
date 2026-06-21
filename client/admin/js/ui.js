/**
 * Utilidades de interfaz de usuario, renderizado de componentes y gestión de modales comunes.
 */

const ESTILOS_ESTADOS = {
    'Urgente': 'bg-red-100 text-red-600',
    'En Adopción': 'bg-green-100 text-green-600',
    'Reservado': 'bg-orange-100 text-orange-600',
    'Adoptado': 'bg-blue-100 text-blue-600',
    'Residente VIP': 'bg-purple-100 text-purple-600',
    'Confirmada': 'bg-green-100 text-green-600',
    'Pendiente': 'bg-yellow-100 text-yellow-600',
    'pendiente': 'bg-amber-100 text-amber-600 border-amber-200',
    'aprobado': 'bg-emerald-100 text-emerald-600 border-emerald-200',
    'rechazado': 'bg-rose-100 text-rose-600 border-rose-200',
    'defecto': 'bg-gray-100 text-gray-600'
};

const ESTILOS_ROLES = {
    'Administrador': 'bg-rose-100 text-rose-600 border-rose-200',
    'Empleado': 'bg-blue-100 text-blue-600 border-blue-200',
    'Padrino': 'bg-amber-100 text-amber-600 border-amber-200',
    'Miembro': 'bg-slate-100 text-slate-600 border-slate-200',
    'defecto': 'bg-gray-100 text-gray-600'
};

/**
 * Obtiene las clases CSS correspondientes según el estado de un registro.
 */
export function obtenerClaseEstado(estado) {
    return ESTILOS_ESTADOS[estado] || ESTILOS_ESTADOS['defecto'];
}

/**
 * Obtiene las clases CSS correspondientes según el rol de un usuario.
 */
export function obtenerClaseRol(rol) {
    return ESTILOS_ROLES[rol] || ESTILOS_ROLES['defecto'];
}

/**
 * Obtiene la configuración visual amigable para los distintos estados de un pedido.
 */
export function obtenerInfoEstadoPedido(estado) {
    const configuracionPedidos = {
        'Preparando': { clase: 'bg-amber-100 text-amber-600', icono: 'hourglass_empty', etiqueta: 'Preparando' },
        'Procesando': { clase: 'bg-amber-100 text-amber-600', icono: 'hourglass_empty', etiqueta: 'Preparando' },
        'Listo para recoger': { clase: 'bg-blue-100 text-blue-600', icono: 'package_2', etiqueta: 'Listo para recoger' },
        'Pendiente recoger': { clase: 'bg-blue-100 text-blue-600', icono: 'package_2', etiqueta: 'Listo para recoger' },
        'Entregado': { clase: 'bg-green-100 text-green-600', icono: 'check_circle', etiqueta: 'Entregado' },
        'Cancelado': { clase: 'bg-red-100 text-red-600', icono: 'cancel', etiqueta: 'Cancelado' },
        'Cancelada': { clase: 'bg-red-100 text-red-600', icono: 'cancel', etiqueta: 'Cancelado' }
    };
    return configuracionPedidos[estado] || { clase: 'bg-gray-100 text-gray-600', icono: 'help', etiqueta: estado };
}

/**
 * Cambia la visibilidad de una ventana modal a visible.
 */
export function abrirModal(id) { 
    const elementoModal = document.getElementById(id);
    if (elementoModal) {
        elementoModal.classList.remove('hidden');
    }
}

/**
 * Cambia la visibilidad de una ventana modal a oculta.
 */
export function cerrarModal(id) { 
    const elementoModal = document.getElementById(id);
    if (elementoModal) {
        elementoModal.classList.add('hidden');
    }
}

/**
 * Configura y muestra el modal de retroalimentación tras una operación.
 */
function lanzarNotificacionFeedback(titulo, mensaje, icono, claseEstilo) {
    const contenedorIcono = document.getElementById('feedback-icono-contenedor');
    const elementoIcono = document.getElementById('feedback-icono');
    const elementoTitulo = document.getElementById('feedback-titulo');
    const elementoMensaje = document.getElementById('feedback-mensaje');

    if (contenedorIcono) contenedorIcono.className = `size-20 rounded-full mx-auto mb-6 flex items-center justify-center ${claseEstilo}`;
    if (elementoIcono) elementoIcono.innerText = icono;
    if (elementoTitulo) elementoTitulo.innerText = titulo;
    if (elementoMensaje) elementoMensaje.innerText = mensaje;

    abrirModal('modal-feedback');
}

/**
 * Despliega una notificación de advertencia o error en la interfaz.
 */
export function mostrarNotificacion(titulo, mensaje, tipo = 'error') {
    const estilo = tipo === 'error' ? 'bg-red-100 text-red-500' : 'bg-blue-100 text-blue-500';
    const icono = tipo === 'error' ? 'error' : 'info';
    lanzarNotificacionFeedback(titulo, mensaje, icono, estilo);
}

/**
 * Despliega una notificación de éxito tras completar una acción.
 */
export function mostrarExito(accionRealizada) {
    lanzarNotificacionFeedback('¡Completado!', `Se ha realizado correctamente: ${accionRealizada}`, 'verified', 'bg-green-100 text-green-500');
}

/**
 * Despliega una notificación confirmando la eliminación de un registro.
 */
export function mostrarBorrado(entidadBorrada) {
    lanzarNotificacionFeedback('¡Eliminado!', `Se ha borrado con éxito: ${entidadBorrada}`, 'delete_sweep', 'bg-red-100 text-red-500');
}

/**
 * Muestra un cuadro de diálogo para confirmar acciones permanentes o críticas.
 */
export function confirmarAccion(titulo, mensaje, textoBoton, alConfirmar) {
    const elTitulo = document.getElementById('confirm-titulo');
    const elMensaje = document.getElementById('confirm-mensaje');
    const botonConfirmar = document.getElementById('btn-confirmar-accion');

    if (elTitulo) elTitulo.innerText = titulo;
    if (elMensaje) elMensaje.innerText = mensaje;
    if (botonConfirmar) {
        botonConfirmar.innerText = textoBoton;
        botonConfirmar.onclick = () => {
            cerrarModal('modal-confirmacion');
            alConfirmar();
        };
    }

    abrirModal('modal-confirmacion');
}

/**
 * Pobla un cuerpo de tabla HTML con filas generadas dinámicamente.
 */
export function renderizarTabla(idCuerpo, datos, funcionGenerarFila) {
    const cuerpoTabla = document.getElementById(idCuerpo);
    if (!cuerpoTabla) return;

    if (!datos || datos.length === 0) {
        cuerpoTabla.innerHTML = '<tr><td colspan="100" class="p-8 text-center text-gray-400 italic">No se han encontrado registros</td></tr>';
        return;
    }

    cuerpoTabla.innerHTML = datos.map(funcionGenerarFila).join('');
}

/**
 * Convierte una cadena de fecha en un formato legible localizado para España.
 */
export function formatearFecha(fecha) {
    if (!fecha) return '-';
    return new Date(fecha).toLocaleDateString('es-ES');
}
