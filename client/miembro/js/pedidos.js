/**
 * Gestión visual del historial de pedidos y visualización de detalles para miembros.
 */

import { obtenerEtiquetaEstado, formatearFechaElegante } from './ui-miembro.js';
import { lanzarAlerta } from '../../recursos/js/modales.js';

const fichaAcceso = localStorage.getItem('token');
const cabecerasApi = { 
    'Authorization': `Bearer ${fichaAcceso}`, 
    'Content-Type': 'application/json' 
};

/**
 * Recupera y renderiza el listado de pedidos de compra realizados por el usuario.
 */
export async function obtenerPedidos() {
    const contenedor = document.getElementById('contenedor-pedidos-detallado');
    if (!contenedor) return;

    try {
        const respuesta = await fetch('/api/usuarios/pedidos', { headers: cabecerasApi });
        const pedidos = await respuesta.json();
        
        if (pedidos.length === 0) {
            contenedor.innerHTML = `
                <p class="text-center py-20 text-gray-400 font-bold uppercase text-xs">
                    Sin pedidos registrados
                </p>`;
            return;
        }

        contenedor.innerHTML = pedidos.map(pedido => `
            <div class="bg-white border border-gray-100 rounded-[2.5rem] p-8 hover:shadow-2xl transition-all duration-500 group relative overflow-hidden">
                <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 relative z-10">
                    <div class="flex items-center gap-5">
                        <div class="size-16 bg-gray-50 rounded-3xl flex items-center justify-center text-gray-300 group-hover:bg-principal/10 group-hover:text-principal transition-all shadow-inner">
                            <span class="material-symbols-outlined text-4xl">shopping_bag</span>
                        </div>
                        <div>
                            <h4 class="text-2xl font-black tracking-tighter uppercase leading-none mb-2">
                                Pedido #${pedido.id_pedido}
                            </h4>
                            <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <span class="material-symbols-outlined text-xs">history</span>
                                ${formatearFechaElegante(pedido.fecha_pedido)}
                            </p>
                        </div>
                    </div>
                    
                    <div class="flex flex-col md:items-end gap-4 w-full md:w-auto border-t md:border-t-0 pt-6 md:pt-0">
                        <div class="flex flex-wrap gap-2 justify-center md:justify-end">
                            ${obtenerEtiquetaEstado(pedido.pagado ? 'Pagado' : 'Pendiente', 'pago')}
                            ${obtenerEtiquetaEstado(pedido.estado_envio)}
                        </div>
                        <div class="flex items-center gap-6 justify-between w-full md:w-auto">
                            <div class="text-right">
                                <p class="text-3xl font-black text-texto-principal tracking-tighter">
                                    ${parseFloat(pedido.total_pago).toFixed(2)}€
                                </p>
                            </div>
                            <button data-action="ver-pedido" data-id="${pedido.id_pedido}" data-total="${pedido.total_pago}"
                                    class="bg-principal text-texto-principal hover:scale-105 p-4 rounded-2xl transition-all shadow-xl shadow-principal/20">
                                <span class="material-symbols-outlined font-black">visibility</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>`).join('');
    } catch (error) {
        console.error("Error al cargar pedidos:", error);
    }
}

/**
 * Obtiene y visualiza el desglose detallado de los productos de un pedido.
 */
export async function mostrarDetallePedido(idPedido, totalPedido) {
    try {
        const respuesta = await fetch(`/api/usuarios/pedidos/${idPedido}/detalle`, { headers: cabecerasApi });
        const detalles = await respuesta.json();
        
        document.getElementById('detalle-pedido-total').innerText = `${parseFloat(totalPedido).toFixed(2)}€`;
        document.getElementById('detalle-pedido-contenido').innerHTML = detalles.map(articulo => `
            <div class="flex items-center gap-5 p-5 bg-gray-50 rounded-[2rem] border border-gray-100">
                <img src="/recursos/imagenes/${articulo.imagen_url}" 
                     class="size-20 rounded-2xl object-cover shadow-sm border-2 border-white" 
                     onerror="this.src='/recursos/imagenes/logo.webp'">
                <div class="flex-1">
                    <p class="font-black text-texto-principal uppercase tracking-tighter text-sm">
                        ${articulo.producto_nombre}
                    </p>
                    <p class="text-[9px] font-black text-gray-400 uppercase mt-1 tracking-widest">
                        ${articulo.cantidad} unidades x ${parseFloat(articulo.precio_unitario).toFixed(2)}€
                    </p>
                </div>
                <div class="text-right">
                    <p class="text-lg font-black text-principal tracking-tighter">
                        ${(articulo.cantidad * articulo.precio_unitario).toFixed(2)}€
                    </p>
                </div>
            </div>`).join('');
    } catch (error) {
        console.error("Error al cargar detalle del pedido:", error);
    }
}
