/**
 * Gestión visual de las inscripciones a eventos y talleres para miembros.
 */

import { obtenerEtiquetaEstado, formatearFechaElegante } from './ui-miembro.js';

const fichaAcceso = localStorage.getItem('token');
const cabecerasApi = { 'Authorization': `Bearer ${fichaAcceso}` };

/**
 * Recupera y renderiza el listado de actividades en las que participa el usuario.
 */
export async function obtenerEventos() {
    const contenedor = document.getElementById('contenedor-eventos-detallado');
    if (!contenedor) return;

    try {
        const respuesta = await fetch('/api/usuarios/eventos', { headers: cabecerasApi });
        const inscripciones = await respuesta.json();
        
        if (inscripciones.length === 0) {
            contenedor.innerHTML = `
                <p class="text-center py-20 text-gray-400 font-bold uppercase text-xs">
                    No te has apuntado a ningún evento todavía
                </p>`;
            return;
        }

        contenedor.innerHTML = inscripciones.map(evento => `
            <div class="p-8 bg-white border border-gray-100 rounded-[2.5rem] flex flex-col md:flex-row items-center gap-8 group hover:border-purple-200 transition-all shadow-sm hover:shadow-xl duration-500">
                <div class="w-full md:w-48 h-32 overflow-hidden rounded-3xl shadow-inner bg-gray-50 flex-shrink-0">
                    <img src="/recursos/imagenes/${evento.imagen_url}" 
                         class="size-full object-cover transition-transform duration-1000 group-hover:scale-110" 
                         onerror="this.src='/recursos/imagenes/logo.webp'">
                </div>
                
                <div class="flex-1 text-center md:text-left">
                    <h4 class="text-2xl font-black uppercase tracking-tighter text-texto-principal mb-2 leading-none">
                        ${evento.titulo}
                    </h4>
                    <p class="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-4 flex items-center justify-center md:justify-start gap-2">
                        <span class="material-symbols-outlined text-sm">event</span>
                        ${formatearFechaElegante(evento.fecha)}
                    </p>
                    <div class="flex flex-wrap gap-2 justify-center md:justify-start">
                        <span class="px-3 py-1 bg-purple-50 text-purple-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-purple-100">
                            ${evento.num_personas} Plazas
                        </span>
                        ${obtenerEtiquetaEstado(evento.estado_pago, 'pago')}
                    </div>
                </div>
                
                <div class="w-full md:w-auto">
                    <a href="/eventos/detalle.html?id=${evento.id_evento}" 
                       class="block w-full px-8 py-4 bg-gray-50 text-gray-400 hover:bg-principal hover:text-texto-principal rounded-2xl text-[10px] font-black uppercase tracking-widest text-center transition-all">
                        Ver Actividad
                    </a>
                </div>
            </div>`).join('');
    } catch (error) {
        console.error("Error al cargar eventos:", error);
    }
}
