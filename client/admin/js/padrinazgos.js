/**
 * Gestión de suscripciones de apadrinamiento y apoyo económico en el panel.
 */
import { interfazApi } from './interfaz-api.js';
import * as UI from './ui.js';

let listaPadrinazgosEnCache = [];

/**
 * Obtiene el listado de padrinazgos activos y archivados desde el servidor.
 */
export async function cargarPadrinazgos() {
    try {
        const padrinazgos = await interfazApi.obtener('/padrinazgos');
        listaPadrinazgosEnCache = padrinazgos || [];
        aplicarFiltroPadrinazgos();
    } catch (error) {
        UI.mostrarNotificacion('Error', 'No se pudieron cargar los padrinazgos');
    }
}

/**
 * Filtra los registros de padrinazgos por el nombre del gato.
 */
export function aplicarFiltroPadrinazgos() {
    const filtro = document.getElementById('filtro-padrinazgo-gato')?.value.toLowerCase() || '';
    
    if (!filtro) {
        renderizarTablaPadrinazgos(listaPadrinazgosEnCache);
        return;
    }

    const filtrados = listaPadrinazgosEnCache.filter(p => 
        p.nombre_gato.toLowerCase().includes(filtro)
    );
    
    renderizarTablaPadrinazgos(filtrados);
}

/**
 * Genera el contenido de la tabla para la gestión de padrinazgos.
 */
function renderizarTablaPadrinazgos(padrinazgos) {
    UI.renderizarTabla('lista-padrinazgos-admin', padrinazgos, padrinazgo => `
        <tr class="hover:bg-gray-50/50 transition-colors border-b last:border-0">
            <td class="p-4">
                <div class="font-bold text-gray-800">${padrinazgo.usuario_nombre} ${padrinazgo.usuario_apellidos}</div>
                <div class="text-xs text-gray-400">${padrinazgo.usuario_email}</div>
            </td>
            <td class="p-4">
                <div class="flex items-center gap-2 font-bold text-primary uppercase">
                    <span class="material-symbols-outlined text-sm">pets</span>
                    ${padrinazgo.nombre_gato}
                </div>
            </td>
            <td class="p-4 text-center font-black text-gray-700">
                ${parseFloat(padrinazgo.aportacion_mensual).toFixed(2)}€
                <div class="text-[8px] font-black text-gray-400 uppercase tracking-widest">al mes</div>
            </td>
            <td class="p-4 text-xs text-gray-500">
                Desde: ${UI.formatearFecha(padrinazgo.fecha_inicio)}<br>
                Hasta: ${padrinazgo.fecha_fin ? UI.formatearFecha(padrinazgo.fecha_fin) : 'Activa'}
            </td>
            <td class="p-4 text-center">
                <span class="px-2 py-1 rounded-lg text-[9px] font-black uppercase ${padrinazgo.archivado ? 'bg-gray-100 text-gray-400' : 'bg-green-50 text-green-600'}">
                    ${padrinazgo.archivado ? 'ARCHIVADO' : 'ACTIVO'}
                </span>
            </td>
            <td class="p-4 text-right">
                <div class="flex justify-end gap-1">
                    <button data-action="edit" data-type="padrinazgo" data-id="${padrinazgo.id_padrinazgo}" 
                            class="p-2 text-primary hover:bg-primary/5 rounded-lg transition-all" title="Editar">
                        <span class="material-symbols-outlined text-xl">edit</span>
                    </button>
                    <button data-action="delete" data-type="padrinazgo" data-id="${padrinazgo.id_padrinazgo}" 
                            class="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Eliminar">
                        <span class="material-symbols-outlined text-xl">delete</span>
                    </button>
                </div>
            </td>
        </tr>
    `);
}

/**
 * Carga la información de un padrinazgo en el formulario de edición.
 */
export function prepararEdicionPadrinazgo(id) {
    const padrinazgo = listaPadrinazgosEnCache.find(p => p.id_padrinazgo == id);
    if (!padrinazgo) return;
    
    document.getElementById('pad-id').value = padrinazgo.id_padrinazgo;
    document.getElementById('pad-cuota').value = padrinazgo.aportacion_mensual;
    document.getElementById('pad-archivado').value = padrinazgo.archivado ? "1" : "0";
    document.getElementById('pad-inicio').value = padrinazgo.fecha_inicio.split('T')[0];
    document.getElementById('pad-fin').value = padrinazgo.fecha_fin ? padrinazgo.fecha_fin.split('T')[0] : '';
    
    UI.abrirModal('modal-padrinazgo');
}

/**
 * Procesa el envío de la actualización de un registro de padrinazgo.
 */
export async function manejarEnvioPadrinazgo(evento) {
    evento.preventDefault();
    const idPadrinazgo = document.getElementById('pad-id').value;
    
    const cuerpoPeticion = {
        aportacion_mensual: document.getElementById('pad-cuota').value,
        archivado: document.getElementById('pad-archivado').value === "1",
        fecha_inicio: document.getElementById('pad-inicio').value,
        fecha_fin: document.getElementById('pad-fin').value || null
    };

    try {
        await interfazApi.actualizar(`/padrinazgos/${idPadrinazgo}`, cuerpoPeticion);
        UI.cerrarModal('modal-padrinazgo');
        await cargarPadrinazgos();
        UI.mostrarExito('Padrinazgo actualizado correctamente');
    } catch (error) {
        UI.mostrarNotificacion('Error', error.message);
    }
}
