/**
 * Gestión del catálogo de productos e inventario de la tienda en el panel.
 */
import { interfazApi } from './interfaz-api.js';
import * as UI from './ui.js';
import { Validador, mostrarEstadoValidacion } from '../../recursos/js/utilidades.js';

let listaProductosEnCache = [];

/**
 * Obtiene la lista de productos registrados desde el servidor.
 */
export async function cargarProductos() {
    try {
        const productos = await interfazApi.obtener('/productos');
        listaProductosEnCache = productos || [];
        renderizarTablaProductos(listaProductosEnCache);
    } catch (error) {
        UI.mostrarNotificacion('Error', 'No se pudieron cargar los productos');
    }
}

/**
 * Genera el contenido de la tabla para la gestión del inventario.
 */
function renderizarTablaProductos(productos) {
    UI.renderizarTabla('lista-productos-admin', productos, producto => `
        <tr class="border-b hover:bg-gray-50/50 transition-colors">
            <td class="p-4">
                <img src="/recursos/imagenes/${producto.imagen_url || 'logo.webp'}" 
                     class="size-12 rounded-lg object-cover shadow-sm border border-gray-100" 
                     onerror="this.src='/recursos/imagenes/logo.webp'">
            </td>
            <td class="p-4">
                <div class="flex flex-col">
                    <span class="font-bold text-gray-800">${producto.nombre}</span>
                    <span class="text-[10px] text-gray-400 uppercase font-medium">${producto.categoria || 'Sin categoría'}</span>
                </div>
            </td>
            <td class="p-4 font-black text-gray-700">${parseFloat(producto.precio).toFixed(2)}€</td>
            <td class="p-4">
                <span class="px-2 py-1 rounded-lg text-[11px] font-bold ${producto.stock > 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}">
                    ${producto.stock} uds
                </span>
            </td>
            <td class="p-4 text-right">
                <div class="flex justify-end gap-1">
                    <button data-action="edit" data-type="producto" data-id="${producto.id_producto}" 
                            class="p-2 text-blue-400 hover:bg-blue-50 rounded-lg transition-all" title="Editar">
                        <span class="material-symbols-outlined text-xl">edit</span>
                    </button>
                    <button data-action="delete" data-type="producto" data-id="${producto.id_producto}" 
                            class="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-all" title="Eliminar">
                        <span class="material-symbols-outlined text-xl">delete</span>
                    </button>
                </div>
            </td>
        </tr>
    `);
}

/**
 * Gestiona la subida de los archivos de imagen de los productos.
 */
async function procesarSubidaArchivos(idInput) {
    const input = document.getElementById(idInput);
    if (!input?.files?.length) return null;

    const datosFormulario = new FormData();
    Array.from(input.files).forEach(archivo => datosFormulario.append('imagenes', archivo));

    const resultado = await interfazApi.subirArchivo('/upload', datosFormulario);
    return resultado.urls;
}

/**
 * Procesa el envío del formulario para la creación o actualización de un producto.
 */
export async function manejarEnvioProducto(evento) {
    evento.preventDefault();
    const idProducto = document.getElementById('p-id').value;

    const nombre = document.getElementById('p-nombre').value.trim();
    const precio = document.getElementById('p-precio').value;
    const stock = document.getElementById('p-stock').value;
    const descripcion = document.getElementById('p-descripcion').value.trim();

    const nombreOk = Validador.esTextoValido(nombre, 3);
    const precioOk = !isNaN(precio) && parseFloat(precio) > 0;
    const stockOk = stock !== "" && !isNaN(stock) && parseInt(stock) >= 0;
    const descOk = Validador.esTextoValido(descripcion, 10);

    mostrarEstadoValidacion('p-nombre', nombreOk, 'Nombre demasiado corto (mín. 3).');
    mostrarEstadoValidacion('p-precio', precioOk, 'Precio debe ser mayor a 0.');
    mostrarEstadoValidacion('p-stock', stockOk, 'Stock no puede ser negativo.');
    mostrarEstadoValidacion('p-descripcion', descOk, 'Descripción demasiado corta (mín. 10).');

    if (!nombreOk || !precioOk || !stockOk || !descOk) {
        return UI.mostrarNotificacion('Campos incorrectos', 'Revisa la información del producto.', 'error');
    }
    
    try {
        const [urlPrincipalNueva, urlsGaleriaNuevas] = await Promise.all([
            procesarSubidaArchivos('p-archivo-principal'),
            procesarSubidaArchivos('p-archivo-galeria')
        ]);

        const cuerpoPeticion = {
            nombre: document.getElementById('p-nombre').value,
            descripcion: document.getElementById('p-descripcion').value,
            precio: document.getElementById('p-precio').value,
            stock: document.getElementById('p-stock').value,
            categoria: document.getElementById('p-categoria').value,
            activo: document.getElementById('p-activo')?.checked ?? true,
            pedido_online: document.getElementById('p-online')?.checked ?? true
        };

        cuerpoPeticion.imagen_url = urlPrincipalNueva ? urlPrincipalNueva[0] : document.getElementById('p-imagen').value;

        const urlsGaleriaActual = document.getElementById('p-galeria-urls-hidden').value
            .split(',')
            .filter(url => url.trim() !== '');
            
        cuerpoPeticion.galeria = urlsGaleriaNuevas 
            ? [...urlsGaleriaActual, ...urlsGaleriaNuevas] 
            : urlsGaleriaActual;

        if (idProducto) {
            await interfazApi.actualizar(`/productos/${idProducto}`, cuerpoPeticion);
        } else {
            await interfazApi.enviar('/productos', cuerpoPeticion);
        }

        UI.cerrarModal('modal-producto');
        await cargarProductos();
        UI.mostrarExito(idProducto ? 'Producto actualizado' : 'Nuevo producto añadido');
    } catch (error) {
        UI.mostrarNotificacion('Error', error.message);
    }
}

/**
 * Carga los datos de un producto específico en los campos del formulario de edición.
 */
export function prepararEdicionProducto(id) {
    const producto = listaProductosEnCache.find(p => p.id_producto == id);
    if (!producto) return;

    document.getElementById('modal-prod-titulo').innerText = 'Editar Producto';
    document.getElementById('p-id').value = producto.id_producto;
    document.getElementById('p-nombre').value = producto.nombre;
    document.getElementById('p-descripcion').value = producto.descripcion;
    document.getElementById('p-precio').value = producto.precio;
    document.getElementById('p-stock').value = producto.stock;
    document.getElementById('p-categoria').value = producto.categoria;
    
    const urlPortada = producto.imagen_url || 'logo.webp';
    document.getElementById('p-imagen').value = producto.imagen_url || '';
    document.getElementById('p-prev-principal').src = `/recursos/imagenes/${urlPortada}`;
    document.getElementById('txt-imagen-principal-nombre').innerText = producto.imagen_url ? `Archivo: ${producto.imagen_url}` : 'Sin portada';
    
    document.getElementById('p-galeria-urls-hidden').value = producto.galeria_urls || '';
    renderizarMiniaturasGaleria(producto.galeria_urls || '');
    
    UI.abrirModal('modal-producto');
}

/**
 * Limpia y despliega el formulario para el registro de un nuevo producto.
 */
export function abrirModalNuevoProducto() {
    const formulario = document.getElementById('form-producto');
    if (formulario) formulario.reset();
    
    document.getElementById('p-id').value = '';
    document.getElementById('p-imagen').value = '';
    document.getElementById('p-prev-principal').src = '/recursos/imagenes/logo.webp';
    document.getElementById('txt-imagen-principal-nombre').innerText = 'Sin portada';
    document.getElementById('p-galeria-urls-hidden').value = '';
    
    renderizarMiniaturasGaleria('');
    document.getElementById('modal-prod-titulo').innerText = 'Nuevo Producto';
    UI.abrirModal('modal-producto');
}

/**
 * Genera las vistas previas de las fotos de la galería en el modal de producto.
 */
function renderizarMiniaturasGaleria(urlsCadena) {
    const contenedor = document.getElementById('p-galeria-prev');
    if (!contenedor) return;

    if (!urlsCadena?.trim()) {
        contenedor.innerHTML = '<p class="text-[9px] text-gray-400 w-full text-center py-2 italic">Sin fotos en galería</p>';
        return;
    }

    const urls = urlsCadena.split(',').filter(u => u.trim());
    contenedor.innerHTML = urls.map(url => `
        <div class="relative group size-12 shadow-sm rounded-lg overflow-hidden border border-gray-100">
            <img src="/recursos/imagenes/${url}" class="size-full object-cover">
            <button type="button" data-action="eliminar-foto-tienda" data-url="${url}" 
                    class="absolute top-0 right-0 bg-red-500 text-white size-5 flex items-center justify-center rounded-bl-lg opacity-0 group-hover:opacity-100 transition-opacity">
                <span class="material-symbols-outlined text-[12px] font-bold">close</span>
            </button>
        </div>
    `).join('');

    contenedor.querySelectorAll('[data-action="eliminar-foto-tienda"]').forEach(boton => {
        boton.onclick = () => {
            const urlAEliminar = boton.dataset.url;
            const urlsActuales = document.getElementById('p-galeria-urls-hidden').value
                .split(',')
                .filter(u => u !== urlAEliminar && u.trim());
            const nuevoValor = urlsActuales.join(',');
            document.getElementById('p-galeria-urls-hidden').value = nuevoValor;
            renderizarMiniaturasGaleria(nuevoValor);
        };
    });
}

/**
 * Gestiona la previsualización de la imagen principal al seleccionar un archivo local.
 */
document.addEventListener('change', e => {
    if (e.target.id === 'p-archivo-principal') {
        const archivo = e.target.files[0];
        if (archivo) {
            const lector = new FileReader();
            lector.onload = (evento) => {
                document.getElementById('p-prev-principal').src = evento.target.result;
                document.getElementById('txt-imagen-principal-nombre').innerText = `Nueva: ${archivo.name}`;
            };
            lector.readAsDataURL(archivo);
        }
    }
});
