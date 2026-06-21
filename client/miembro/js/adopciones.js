/**
 * Gestión visual del estado de las solicitudes de adopción para miembros.
 */

import { obtenerEtiquetaEstado, formatearFechaElegante } from './ui-miembro.js';

const fichaAcceso = localStorage.getItem('token');
const cabecerasApi = { 'Authorization': `Bearer ${fichaAcceso}` };

/**
 * Recupera y renderiza el listado de solicitudes de adopción del usuario.
 */
export async function obtenerAdopciones() {
    const contenedor = document.getElementById('contenedor-adopciones-detallado');
    if (!contenedor) return;

    try {
        const respuesta = await fetch('/api/usuarios/adopciones', { headers: cabecerasApi });
        const solicitudes = await respuesta.json();
        
        if (solicitudes.length === 0) { 
            contenedor.innerHTML = `
                <div class="p-20 text-center text-gray-400 font-bold uppercase text-xs">
                    No has iniciado ningún proceso de adopción
                </div>`; 
            return; 
        }

        contenedor.innerHTML = solicitudes.map(solicitud => {
            return `
                <div class="p-8 bg-white border border-gray-100 rounded-[3rem] hover:shadow-2xl transition-all duration-500 group overflow-hidden relative">
                    <div class="flex flex-col md:flex-row justify-between items-center gap-8 relative z-10">
                        <div class="flex items-center gap-6">
                            <div class="size-20 rounded-[2rem] bg-principal/10 text-principal flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                                <span class="material-symbols-outlined text-4xl font-black">pets</span>
                            </div>
                            <div>
                                <h4 class="text-2xl font-black uppercase tracking-tighter text-texto-principal leading-none mb-2">
                                    Proceso para ${solicitud.nombre_gato}
                                </h4>
                                <p class="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <span class="material-symbols-outlined text-sm">history</span>
                                    Iniciado el ${formatearFechaElegante(solicitud.fecha_solicitud)}
                                </p>
                            </div>
                        </div>
                        <div class="flex flex-col md:items-end gap-4 w-full md:w-auto border-t md:border-t-0 pt-6 md:pt-0">
                            ${obtenerEtiquetaEstado(solicitud.estado)}
                            ${solicitud.pdf_url ? `
                                <a href="${solicitud.pdf_url}" target="_blank" 
                                   class="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-50 text-[10px] font-black uppercase text-gray-400 hover:text-red-500 border border-gray-100 transition-all shadow-sm">
                                    <span class="material-symbols-outlined text-lg">picture_as_pdf</span> 
                                    Ver mi cuestionario
                                </a>` : ''}
                        </div>
                    </div>
                </div>`;
        }).join('');
    } catch (error) {
        console.error("Error al cargar adopciones:", error);
    }
}
