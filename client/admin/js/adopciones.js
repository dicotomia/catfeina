/**
 * Gestión de solicitudes de adopción y seguimiento de procesos en el panel.
 */
import { interfazApi } from './interfaz-api.js';
import * as UI from './ui.js';

let listaAdopcionesEnCache = [];

/**
 * Carga las solicitudes de adopción desde el servidor e inicializa los filtros.
 */
export async function cargarAdopciones() {
    try {
        const solicitudes = await interfazApi.obtener('/adopciones');
        listaAdopcionesEnCache = solicitudes || [];
        
        const filtroEstado = document.getElementById('filtro-adopcion-estado');
        const filtroGato = document.getElementById('filtro-adopcion-gato');
        if (filtroEstado) filtroEstado.onchange = aplicarFiltrosAdopciones;
        if (filtroGato) filtroGato.oninput = aplicarFiltrosAdopciones;

        renderizarTablaAdopciones(listaAdopcionesEnCache);
    } catch (error) {
        UI.mostrarNotificacion('Error', 'No se pudieron cargar las adopciones');
    }
}

/**
 * Genera el contenido de la tabla de solicitudes de adopción.
 */
function renderizarTablaAdopciones(solicitudes) {
    UI.renderizarTabla('lista-adopciones-admin', solicitudes, solicitud => `
        <tr class="hover:bg-gray-50/50 transition-colors border-b last:border-0">
            <td class="p-4">
                <div class="font-bold text-gray-800">${solicitud.usuario_nombre}</div>
                <div class="text-xs text-gray-400">${solicitud.usuario_email}</div>
            </td>
            <td class="p-4">
                <div class="font-bold text-primary">${solicitud.gato_nombre}</div>
            </td>
            <td class="p-4 text-sm text-gray-500">
                ${UI.formatearFecha(solicitud.fecha_solicitud)}
            </td>
            <td class="p-4">
                <span class="px-3 py-1 rounded-full text-[10px] font-black uppercase ${UI.obtenerClaseEstado(solicitud.estado)}">
                    ${solicitud.estado}
                </span>
            </td>
            <td class="p-4">
                ${solicitud.pdf_url ? `
                    <a href="${solicitud.pdf_url}" target="_blank" class="flex items-center gap-2 text-red-500 hover:text-red-700 font-bold text-xs transition-colors">
                        <span class="material-symbols-outlined text-sm">picture_as_pdf</span> VER CUESTIONARIO
                    </a>
                ` : '<span class="text-gray-300 text-xs italic">Sin PDF</span>'}
            </td>
            <td class="p-4 text-right">
                <button data-action="edit" data-type="adopcion" data-id="${solicitud.id_solicitud}" 
                        class="p-2 text-primary hover:bg-primary/5 rounded-lg transition-all" title="Gestionar Solicitud">
                    <span class="material-symbols-outlined text-xl">settings_applications</span>
                </button>
            </td>
        </tr>
    `);
}

/**
 * Filtra la lista de solicitudes de adopción por estado y nombre del gato.
 */
function aplicarFiltrosAdopciones() {
    const estado = document.getElementById('filtro-adopcion-estado').value;
    const gato = document.getElementById('filtro-adopcion-gato').value.toLowerCase();

    const filtrados = listaAdopcionesEnCache.filter(solicitud => {
        const coincideEstado = estado === 'Todos' || solicitud.estado === estado;
        const coincideGato = solicitud.gato_nombre.toLowerCase().includes(gato);
        return coincideEstado && coincideGato;
    });

    renderizarTablaAdopciones(filtrados);
}

/**
 * Carga los datos de una solicitud específica en el formulario de gestión.
 */
export function prepararGestionAdopcion(id) {
    const solicitud = listaAdopcionesEnCache.find(s => s.id_solicitud == id);
    if (!solicitud) return;

    document.getElementById('adop-id').value = solicitud.id_solicitud;
    document.getElementById('adop-estado').value = solicitud.estado;
    document.getElementById('adop-motivo').value = solicitud.motivo_decision || '';
    
    UI.abrirModal('modal-adopcion');
}

/**
 * Procesa el envío de la actualización del estado de una solicitud de adopción.
 */
export async function manejarEnvioAdopcion(evento) {
    evento.preventDefault();
    const idSolicitud = document.getElementById('adop-id').value;
    
    const cuerpoPeticion = {
        estado: document.getElementById('adop-estado').value,
        motivo_decision: document.getElementById('adop-motivo').value
    };

    try {
        await interfazApi.actualizar(`/adopciones/${idSolicitud}`, cuerpoPeticion);
        UI.cerrarModal('modal-adopcion');
        await cargarAdopciones();
        UI.mostrarExito('Solicitud procesada correctamente');
    } catch (error) {
        UI.mostrarNotificacion('Error', error.message || 'No se pudo actualizar la solicitud');
    }
}
