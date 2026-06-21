/**
 * Gestión visual del detalle de productos y control de cantidades para la compra.
 */

import { inicializarEstructuraCarrito, agregarAlCarrito } from '../recursos/js/carrito.js';

let productoEnMemoria = null;
let cantidadParaComprar = 1;

document.addEventListener('DOMContentLoaded', () => {
    inicializarVistaDetalle();
    inicializarEstructuraCarrito();
});

/**
 * Inicializa la página obteniendo el identificador del producto de la URL.
 */
function inicializarVistaDetalle() {
    const parametros = new URLSearchParams(window.location.search);
    const idProducto = parametros.get('id');

    if (!idProducto) {
        window.location.href = '/tienda/'; 
        return;
    }

    recuperarInformacionProducto(idProducto);
    vincularEventosInteraccion();
}

/**
 * Obtiene la información técnica del artículo desde el servidor.
 */
async function recuperarInformacionProducto(id) {
    try {
        const respuesta = await fetch(`/api/productos/${id}`);
        if (!respuesta.ok) throw new Error('El producto no existe');
        
        productoEnMemoria = await respuesta.json();
        dibujarFichaProducto(productoEnMemoria);
    } catch (error) {
        console.error("[Error] al cargar detalle de producto:", error.message);
        asignarTexto('prod-nombre', "Producto no encontrado");
    }
}

/**
 * Distribuye los datos del producto en los diferentes elementos de la interfaz.
 */
function dibujarFichaProducto(producto) {
    asignarTexto('meta-titulo', `${producto.nombre} | Catfeina`);
    asignarTexto('breadcrumb-nombre', producto.nombre);
    asignarTexto('prod-nombre', producto.nombre);
    asignarTexto('prod-precio', `${parseFloat(producto.precio).toFixed(2)} €`);
    asignarTexto('prod-descripcion', producto.descripcion);
    asignarTexto('prod-categoria', producto.categoria);

    configurarGaleriaVisual(producto);
}

/**
 * Inicializa el visor principal de imágenes y la lista de miniaturas interactivas.
 */
function configurarGaleriaVisual(producto) {
    const visorPrincipal = document.getElementById('img-principal');
    const contenedorMiniaturas = document.getElementById('galeria-thumbnails');
    if (!visorPrincipal || !contenedorMiniaturas) return;

    const rutaPortada = producto.imagen_url ? `/recursos/imagenes/${producto.imagen_url}` : '/recursos/imagenes/logo.webp';
    visorPrincipal.src = rutaPortada;

    const fotos = [rutaPortada];
    if (Array.isArray(producto.galeria)) {
        producto.galeria.forEach(url => {
            if (url && url !== producto.imagen_url) {
                fotos.push(`/recursos/imagenes/${url}`);
            }
        });
    }

    contenedorMiniaturas.innerHTML = fotos.map((src, indice) => `
        <button class="miniatura-producto size-20 rounded-2xl overflow-hidden border-2 transition-all flex-shrink-0 ${indice === 0 ? 'border-principal shadow-md scale-105' : 'border-transparent opacity-60 hover:opacity-100'}"
                data-src="${src}">
            <img src="${src}" class="size-full object-cover" onerror="this.src='/recursos/imagenes/logo.webp'">
        </button>
    `).join('');

    contenedorMiniaturas.addEventListener('click', (e) => {
        const boton = e.target.closest('.miniatura-producto');
        if (!boton) return;

        visorPrincipal.src = boton.dataset.src;
        document.querySelectorAll('.miniatura-producto').forEach(b => {
            b.classList.remove('border-principal', 'shadow-md', 'scale-105');
            b.classList.add('border-transparent', 'opacity-60');
        });
        boton.classList.add('border-principal', 'shadow-md', 'scale-105');
        boton.classList.remove('opacity-60');
    });
}

/**
 * Vincula los controladores para la modificación de cantidades y adición al carrito.
 */
function vincularEventosInteraccion() {
    const btnMenos = document.getElementById('btn-menos');
    const btnMas = document.getElementById('btn-mas');
    const btnComprar = document.getElementById('btn-anadir-detalle');

    btnMenos?.addEventListener('click', () => modificarCantidad(-1));
    btnMas?.addEventListener('click', () => modificarCantidad(1));
    
    btnComprar?.addEventListener('click', () => {
        if (productoEnMemoria) {
            agregarAlCarrito(productoEnMemoria, cantidadParaComprar);
        }
    });
}

/**
 * Actualiza el contador local de unidades para el producto seleccionado.
 */
function modificarCantidad(cambio) {
    cantidadParaComprar += cambio;
    if (cantidadParaComprar < 1) cantidadParaComprar = 1;
    asignarTexto('compra-cantidad', cantidadParaComprar);
}

/**
 * Asigna el valor de texto a un elemento del DOM mediante su identificador.
 */
function asignarTexto(id, valor) {
    const el = document.getElementById(id);
    if (el) el.innerText = valor || '--';
}
