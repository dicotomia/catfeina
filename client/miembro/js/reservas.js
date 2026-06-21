/**
 * Gestión visual del historial de reservas de visitas y coworking para miembros.
 */

import { obtenerEtiquetaEstado, formatearFechaElegante } from './ui-miembro.js';

const fichaAcceso = localStorage.getItem('token');
const cabecerasApi = { 'Authorization': `Bearer ${fichaAcceso}` };

/**
 * Recupera y renderiza el historial de reservas de servicios del usuario.
 */
export async function obtenerReservas() {
    const contenedor = document.getElementById('contenedor-reservas-detallado');
    if (!contenedor) return;

    try {
        const respuesta = await fetch('/api/usuarios/reservas', { headers: cabecerasApi });
        const reservas = await respuesta.json();
        
        if (reservas.length === 0) {
            contenedor.innerHTML = `
                <div class="p-16 text-center bg-gray-50/50 rounded-[3rem] border border-dashed border-gray-200">
                    <h3 class="text-xl font-black text-gray-500 uppercase">¿Aún no has venido a vernos?</h3>
                    <a href="/reservas/" class="inline-block mt-8 px-10 py-4 bg-principal text-texto-principal font-black text-[10px] uppercase rounded-2xl shadow-lg">
                        Reservar ahora
                    </a>
                </div>`;
            return;
        }

        contenedor.innerHTML = reservas.map(reserva => {
            const esCoworking = reserva.nombre_servicio.toLowerCase().includes('coworking') || 
                                ['nomada', 'grupal', 'diario', 'residente'].includes(reserva.nombre_servicio.toLowerCase());
            const importeTotal = (reserva.precio_hora * reserva.num_personas).toFixed(2);
            const duracionHoras = (reserva.tiempo_minutos / 60).toFixed(1).replace('.0', '');
            
            return `
                <div class="p-8 bg-white border border-gray-100 rounded-[2.5rem] flex flex-col hover:border-principal/30 transition-all group shadow-sm hover:shadow-xl duration-500">
                    <div class="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div class="flex items-center gap-5">
                            <div class="size-16 rounded-3xl bg-gray-50 text-gray-400 flex items-center justify-center group-hover:bg-principal/10 group-hover:text-principal transition-all shadow-inner">
                                <span class="material-symbols-outlined text-3xl font-black">
                                    ${esCoworking ? 'laptop_mac' : 'local_cafe'}
                                </span>
                            </div>
                            <div>
                                <h4 class="text-xl font-black uppercase tracking-tighter leading-none mb-2">
                                    ${reserva.nombre_servicio}
                                </h4>
                                <div class="flex flex-wrap items-center gap-x-4 gap-y-1">
                                    <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                                        <span class="material-symbols-outlined text-xs">calendar_month</span>
                                        ${formatearFechaElegante(reserva.fecha)} • ${reserva.hora_inicio.substring(0,5)}h
                                    </p>
                                    <p class="text-[10px] font-black text-principal/60 uppercase tracking-widest flex items-center gap-1.5">
                                        <span class="material-symbols-outlined text-xs">groups</span>
                                        ${reserva.num_personas} ${reserva.num_personas === 1 ? 'Persona' : 'Personas'}
                                    </p>
                                    <p class="text-[10px] font-black text-principal/60 uppercase tracking-widest flex items-center gap-1.5">
                                        <span class="material-symbols-outlined text-xs">schedule</span>
                                        ${duracionHoras} ${duracionHoras === '1' ? 'Hora' : 'Horas'}
                                    </p>
                                </div>
                                ${reserva.observaciones ? `
                                <div class="mt-4 p-3 bg-gray-50 border-l-2 border-principal/30 rounded-r-xl">
                                    <p class="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                                        <span class="material-symbols-outlined text-[10px]">notes</span> Tus notas
                                    </p>
                                    <p class="text-[10px] text-texto-secundario italic">"${reserva.observaciones}"</p>
                                </div>` : ''}
                            </div>
                        </div>
                        
                        <div class="flex flex-col md:items-end gap-3 w-full md:w-auto border-t md:border-t-0 pt-4 md:pt-0">
                            <div class="flex gap-2 justify-center md:justify-end">
                                ${obtenerEtiquetaEstado(reserva.pagado ? 'Pagado' : 'Pendiente', 'pago')}
                                ${obtenerEtiquetaEstado(reserva.estado_reserva)}
                            </div>
                            <p class="text-3xl font-black text-texto-principal tracking-tighter text-center md:text-right">
                                ${importeTotal}€
                            </p>
                        </div>
                    </div>
                </div>`;
        }).join('');
    } catch (error) {
        console.error("Error al cargar historial de reservas:", error);
    }
}
