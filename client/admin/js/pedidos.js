/**
 * Gestión de pedidos y ventas de la tienda online en el panel administrativo.
 */
import { interfazApi } from './interfaz-api.js';
import * as UI from './ui.js';

let listaPedidosEnCache = [];

/**
 * Obtiene el listado de pedidos realizados desde el servidor.
 */
export async function cargarPedidos() {
    try {
        const pedidos = await interfazApi.obtener('/pedidos');
        listaPedidosEnCache = pedidos || [];
        renderizarTablaPedidos(listaPedidosEnCache);
    } catch (error) {
        UI.mostrarNotificacion('Error', 'No se pudieron cargar los pedidos');
    }
}

/**
 * Genera el contenido de la tabla para la supervisión de pedidos.
 */
function renderizarTablaPedidos(pedidos) {
    UI.renderizarTabla('lista-pedidos-admin', pedidos, pedido => {
        const infoEstado = UI.obtenerInfoEstadoPedido(pedido.estado_envio);
        return `
        <tr class="hover:bg-gray-50/50 transition-colors border-b last:border-0">
            <td class="p-4 font-black text-primary italic">#${pedido.id_pedido}</td>
            <td class="p-4">
                <div class="font-bold text-gray-800">${pedido.cliente_nombre} ${pedido.cliente_apellidos}</div>
                <div class="text-xs text-gray-400">${pedido.cliente_email}</div>
            </td>
            <td class="p-4 font-black text-gray-700">${parseFloat(pedido.total_pago).toFixed(2)}€</td>
            <td class="p-4">
                <span class="px-2 py-1 rounded-lg text-[10px] font-black uppercase ${pedido.pagado ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}">
                    ${pedido.pagado ? 'PAGADO' : 'PENDIENTE'}
                </span>
            </td>
            <td class="p-4">
                <span class="px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${infoEstado.clase}">
                    ${infoEstado.etiqueta}
                </span>
            </td>
            <td class="p-4 text-right">
                <div class="flex justify-end gap-1">
                    <button data-action="edit" data-type="pedido" data-id="${pedido.id_pedido}" 
                            class="p-2 text-gray-400 hover:text-primary transition-all" title="Gestionar Pedido">
                        <span class="material-symbols-outlined text-xl">edit</span>
                    </button>
                    <button data-action="view" data-type="pedido" data-id="${pedido.id_pedido}" data-total="${pedido.total_pago}" 
                            class="p-2 text-primary hover:bg-primary/5 rounded-lg transition-all" title="Ver Detalles">
                        <span class="material-symbols-outlined text-xl">visibility</span>
                    </button>
                </div>
            </td>
        </tr>`;
    });
}

/**
 * Carga los datos de un pedido en el formulario de edición de estado y pago.
 */
export function prepararEdicionPedido(id) {
    const pedido = listaPedidosEnCache.find(p => p.id_pedido == id);
    if (!pedido) return;
    
    document.getElementById('pe-id').value = pedido.id_pedido;
    document.getElementById('pe-total').value = pedido.total_pago;
    document.getElementById('pe-pagado').value = pedido.pagado ? "1" : "0";
    document.getElementById('pe-estado').value = pedido.estado_envio;
    document.getElementById('pe-direccion').value = pedido.direccion_envio || '';
    
    UI.abrirModal('modal-pedido-edit');
}

/**
 * Obtiene y visualiza el desglose de productos de un pedido específico.
 */
export async function verDetallePedido(id, total) {
    try {
        const detalles = await interfazApi.obtener(`/pedidos/${id}/detalle`);
        const contenedor = document.getElementById('detalle-pedido-contenido');
        const etiquetaTotal = document.getElementById('detalle-pedido-total');
        
        if (etiquetaTotal) etiquetaTotal.innerText = `${parseFloat(total).toFixed(2)}€`;
        
        if (contenedor) {
            contenedor.innerHTML = detalles.map(detalle => `
                <div class="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <img src="/recursos/imagenes/${detalle.imagen_url}" class="size-16 rounded-xl object-cover shadow-sm" alt="${detalle.producto_nombre}">
                    <div class="flex-1">
                        <p class="font-bold text-gray-800 leading-tight">${detalle.producto_nombre}</p>
                        <p class="text-xs text-gray-400 uppercase font-black tracking-widest mt-1">${detalle.cantidad} uds x ${parseFloat(detalle.precio_unitario).toFixed(2)}€</p>
                    </div>
                    <div class="text-right">
                        <p class="font-black text-primary">${(detalle.cantidad * detalle.precio_unitario).toFixed(2)}€</p>
                    </div>
                </div>
            `).join('');
        }
        UI.abrirModal('modal-detalle-pedido');
    } catch (error) {
        UI.mostrarNotificacion('Error', 'No se pudieron obtener los detalles del pedido');
    }
}

/**
 * Procesa la actualización de la información logística y financiera de un pedido.
 */
export async function manejarEnvioPedido(evento) {
    evento.preventDefault();
    const idPedido = document.getElementById('pe-id').value;
    
    const cuerpoPeticion = {
        total_pago: document.getElementById('pe-total').value,
        pagado: document.getElementById('pe-pagado').value === "1",
        estado_envio: document.getElementById('pe-estado').value,
        direccion_envio: document.getElementById('pe-direccion').value
    };

    try {
        await interfazApi.actualizar(`/pedidos/${idPedido}`, cuerpoPeticion);
        UI.cerrarModal('modal-pedido-edit');
        await cargarPedidos();
        UI.mostrarExito('Pedido actualizado correctamente');
    } catch (error) {
        UI.mostrarNotificacion('Error', error.message);
    }
}
