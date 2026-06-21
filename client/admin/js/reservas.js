/**
 * Gestión de reservas de visitas y espacio de coworking en el panel.
 */
import { interfazApi } from './interfaz-api.js';
import * as UI from './ui.js';

let listaReservasEnCache = [];

/**
 * Obtiene el listado completo de reservas desde el servidor.
 */
export async function cargarReservas() {
    try {
        const reservas = await interfazApi.obtener('/reservas');
        listaReservasEnCache = reservas || [];
        renderizarTablaReservas(listaReservasEnCache);
    } catch (error) {
        UI.mostrarNotificacion('Error', 'No se pudieron cargar las reservas');
    }
}

/**
 * Genera el contenido de la tabla para la supervisión de citas y reservas.
 */
function renderizarTablaReservas(reservas) {
    UI.renderizarTabla('lista-reservas-admin', reservas, reserva => `
        <tr class="border-b hover:bg-gray-50/50 transition-colors text-[11px]">
            <td class="p-4 font-bold text-gray-700">${reserva.cliente}</td>
            <td class="p-4 text-gray-600 uppercase font-black tracking-tighter">${reserva.nombre_servicio || 'Cafetería'}</td>
            <td class="p-4 text-gray-500">${UI.formatearFecha(reserva.fecha)} - ${reserva.hora_inicio.substring(0,5)}h</td>
            <td class="p-4 text-center font-bold text-gray-600">${reserva.num_personas}</td>
            <td class="p-4 max-w-[150px]">
                <div class="truncate italic text-gray-400" title="${reserva.observaciones || ''}">
                    ${reserva.observaciones || '-'}
                </div>
            </td>
            <td class="p-4">
                <span class="px-2 py-1 rounded-lg text-[9px] font-black uppercase ${reserva.pagado ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}">
                    ${reserva.pagado ? 'PAGADO' : 'PENDIENTE'}
                </span>
            </td>
            <td class="p-4"><span class="px-3 py-1 rounded-full text-[9px] font-black uppercase ${UI.obtenerClaseEstado(reserva.estado_reserva)}">${reserva.estado_reserva}</span></td>
            <td class="p-4 text-right">
                <button data-action="edit" data-type="reserva" data-id="${reserva.id_reserva || reserva.id}" 
                        class="p-2 text-primary hover:bg-primary/5 rounded-lg transition-all" title="Editar Reserva">
                    <span class="material-symbols-outlined text-xl">edit</span>
                </button>
            </td>
        </tr>
    `);
}

/**
 * Carga la información de una reserva seleccionada en el formulario de edición.
 */
export function prepararEdicionReserva(id) {
    const reserva = listaReservasEnCache.find(r => (r.id_reserva || r.id) == id);
    if (!reserva) return;
    
    document.getElementById('r-id').value = reserva.id_reserva || reserva.id;
    
    if (reserva.fecha) {
        const fechaObj = new Date(reserva.fecha);
        if (!isNaN(fechaObj.getTime())) {
            document.getElementById('r-fecha').value = fechaObj.toISOString().split('T')[0];
        } else if (typeof reserva.fecha === 'string') {
            document.getElementById('r-fecha').value = reserva.fecha.split('T')[0];
        }
    }

    document.getElementById('r-hora').value = reserva.hora_inicio || '';
    document.getElementById('r-personas').value = reserva.num_personas || 0;
    document.getElementById('r-estado').value = reserva.estado_reserva || 'Pendiente';
    document.getElementById('r-pagado').value = reserva.pagado ? "1" : "0";
    document.getElementById('r-observaciones').value = reserva.observaciones || '';
    
    UI.abrirModal('modal-reserva');
}

/**
 * Procesa la actualización de los datos y el estado de una reserva.
 */
export async function manejarEnvioReserva(evento) {
    evento.preventDefault();
    const idReserva = document.getElementById('r-id').value;
    
    const cuerpoPeticion = {
        fecha: document.getElementById('r-fecha').value,
        hora_inicio: document.getElementById('r-hora').value,
        num_personas: document.getElementById('r-personas').value,
        estado_reserva: document.getElementById('r-estado').value,
        observaciones: document.getElementById('r-observaciones').value || '',
        pagado: document.getElementById('r-pagado').value === "1"
    };

    try {
        await interfazApi.actualizar(`/reservas/${idReserva}`, cuerpoPeticion);
        UI.cerrarModal('modal-reserva');
        UI.mostrarExito('Reserva actualizada correctamente');
        await cargarReservas();
    } catch (error) {
        console.error("Error al actualizar reserva:", error);
        UI.mostrarNotificacion('Error', error.message || 'No se pudo actualizar la reserva');
    }
}
