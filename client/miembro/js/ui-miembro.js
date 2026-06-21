/**
 * Componentes visuales y formateadores comunes para el área de miembros.
 */

/**
 * Genera el marcado HTML para una etiqueta de estado con su estilo correspondiente.
 */
export function obtenerEtiquetaEstado(texto, tipo = 'ejecucion') {
    const configuracion = {
        'Pagado': 'bg-green-100 text-green-700 border-green-200',
        'Pendiente': 'bg-amber-100 text-amber-700 border-amber-200',
        'Fallido': 'bg-red-100 text-red-700 border-red-200',
        
        'Confirmada': 'bg-blue-100 text-blue-700 border-blue-200',
        'En Proceso': 'bg-indigo-100 text-indigo-700 border-indigo-200',
        'Finalizada': 'bg-gray-100 text-gray-600 border-gray-200',
        'Cancelada': 'bg-red-50 text-red-500 border-red-100',
        'Entregado': 'bg-green-100 text-green-700 border-green-200',
        'Preparando': 'bg-orange-100 text-orange-700 border-orange-200',
        
        'defecto': 'bg-gray-100 text-gray-600 border-gray-200'
    };

    const clases = configuracion[texto] || configuracion['defecto'];
    const icono = tipo === 'pago' ? 'payments' : 'info';

    return `
        <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-wider ${clases}">
            <span class="material-symbols-outlined text-[12px]">${icono}</span>
            ${texto}
        </span>
    `;
}

/**
 * Convierte una fecha en formato ISO a una cadena de texto localizada y amigable.
 */
export function formatearFechaElegante(cadenaFecha) {
    if (!cadenaFecha) return '--';
    const fecha = new Date(cadenaFecha);
    return fecha.toLocaleDateString('es-ES', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
    });
}

/**
 * Inyecta un componente visual de carga en el contenedor indicado.
 */
export function mostrarCargando(idContenedor) {
    const el = document.getElementById(idContenedor);
    if (el) {
        el.innerHTML = `
            <div class="col-span-full py-20 flex flex-col items-center justify-center gap-4 animate-pulse">
                <div class="w-12 h-12 border-4 border-principal border-t-transparent rounded-full animate-spin"></div>
                <p class="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Sincronizando tus datos...</p>
            </div>`;
    }
}
