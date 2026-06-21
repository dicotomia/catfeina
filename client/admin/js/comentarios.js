/**
 * Gestión de la moderación de comentarios y testimonios en el panel.
 */
import { interfazApi } from './interfaz-api.js';
import * as UI from './ui.js';

/**
 * Obtiene el listado de comentarios pendientes de revisión desde el servidor.
 */
export async function cargarComentarios() {
    try {
        const comentarios = await interfazApi.obtener('/comentarios/pendientes');
        renderizarTablaComentarios(comentarios || []);
    } catch (error) {
        UI.mostrarNotificacion('Error', 'No se pudieron cargar los comentarios');
    }
}

/**
 * Genera el contenido de la tabla para la moderación de comentarios.
 */
function renderizarTablaComentarios(comentarios) {
    UI.renderizarTabla('tabla-comentarios-pendientes', comentarios, comentario => {
        const estrellasHtml = Array(5).fill(0).map((_, indice) => `
            <span class="material-symbols-outlined text-[14px] ${indice < comentario.puntuacion ? 'text-amber-400' : 'text-gray-200'}">
                star
            </span>
        `).join('');

        return `
            <tr class="border-b hover:bg-gray-50/50 transition-colors">
                <td class="p-4">
                    <div class="font-bold text-gray-800">${comentario.nombre} ${comentario.apellidos}</div>
                    <div class="text-[9px] text-gray-400 font-black uppercase tracking-tighter">${UI.formatearFecha(comentario.fecha_comentario)}</div>
                </td>
                <td class="p-4 max-w-xs">
                    <p class="text-xs text-gray-600 italic leading-relaxed line-clamp-2" title="${comentario.texto}">"${comentario.texto}"</p>
                </td>
                <td class="p-4">
                    <div class="flex items-center gap-0.5">${estrellasHtml}</div>
                </td>
                <td class="p-4">
                    <span class="px-2 py-1 rounded-full text-[9px] font-black uppercase border ${UI.obtenerClaseEstado(comentario.estado)}">
                        ${comentario.estado}
                    </span>
                </td>
                <td class="p-4 text-right">
                    <div class="flex justify-end gap-1">
                        <button data-action="moderate" data-type="comentario" data-id="${comentario.id_comentario}" data-estado="aprobado" 
                                class="size-8 flex items-center justify-center text-emerald-500 hover:bg-emerald-50 rounded-full transition-all" title="Aprobar">
                            <span class="material-symbols-outlined text-lg">check_circle</span>
                        </button>
                        <button data-action="moderate" data-type="comentario" data-id="${comentario.id_comentario}" data-estado="rechazado" 
                                class="size-8 flex items-center justify-center text-rose-500 hover:bg-rose-50 rounded-full transition-all" title="Rechazar">
                            <span class="material-symbols-outlined text-lg">cancel</span>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });
}

/**
 * Actualiza el estado de aprobación de un comentario mediante la API.
 */
export async function moderarComentario(id, estado) {
    try {
        await interfazApi.actualizar(`/comentarios/${id}/estado`, { estado });
        UI.mostrarExito(`Comentario marcado como ${estado}`);
        await cargarComentarios();
    } catch (error) {
        UI.mostrarNotificacion('Error', 'No se pudo procesar la moderación');
    }
}
