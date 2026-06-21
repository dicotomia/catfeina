/**
 * Gestión de la tienda online, filtrado de productos solidarios y control del carrito.
 */

import { gestionarCarruselImagen, formatearMoneda } from '../recursos/js/utilidades.js';
import { inicializarEstructuraCarrito, agregarAlCarrito } from '../recursos/js/carrito.js';

let listaProductosEnCache = [];

document.addEventListener('DOMContentLoaded', () => {
    inicializarTienda();
    inicializarEstructuraCarrito();
});

/**
 * Configura los escuchadores de búsqueda, filtrado y acciones de producto.
 */
function inicializarTienda() {
    obtenerProductos();

    const buscador = document.getElementById('input-busqueda-tienda');
    buscador?.addEventListener('input', filtrarPorTexto);

    document.querySelectorAll('.filtro-btn').forEach(boton => {
        boton.addEventListener('click', (e) => gestionarCambioCategoria(e));
    });

    const contenedor = document.getElementById('contenedor-productos');
    contenedor?.addEventListener('click', manejarAccionesProducto);
}

/**
 * Recupera el inventario de productos desde el servidor aplicando filtros si existen.
 */
async function obtenerProductos(categoria = 'Todos') {
    const contenedor = document.getElementById('contenedor-productos');
    if (!contenedor) return;
    
    contenedor.innerHTML = '<div class="col-span-full py-20 text-center"><span class="material-symbols-outlined animate-spin text-4xl text-principal">progress_activity</span></div>';

    try {
        const ruta = categoria === 'Todos' ? '/api/productos' : `/api/productos?categoria=${categoria}`;
        const respuesta = await fetch(ruta);
        listaProductosEnCache = await respuesta.json();
        
        dibujarCatalogo(listaProductosEnCache);
    } catch (error) {
        console.error("[Error] al cargar la tienda:", error.message);
        contenedor.innerHTML = '<p class="col-span-full text-center text-red-500 font-bold uppercase text-xs">Fallo al conectar con la tienda</p>';
    }
}

/**
 * Genera el contenido visual para el catálogo de productos disponibles.
 */
function dibujarCatalogo(productos) {
    const contenedor = document.getElementById('contenedor-productos');
    if (!contenedor) return;
    
    if (productos.length === 0) {
        contenedor.innerHTML = `
            <div class="col-span-full py-20 flex flex-col items-center text-center gap-4 text-gray-400">
                <span class="material-symbols-outlined text-6xl">shopping_basket</span>
                <p class="font-black uppercase text-xs tracking-widest">No hay artículos disponibles</p>
            </div>`;
        return;
    }

    contenedor.innerHTML = productos.map((producto, indice) => {
        const retardoAnimacion = indice * 50;

        const rutaPortada = producto.imagen_url ? `/recursos/imagenes/${producto.imagen_url}` : '/recursos/imagenes/logo.webp';
        
        const galeria = [rutaPortada];
        if (Array.isArray(producto.galeria)) {
            producto.galeria.forEach(url => {
                if (url && url !== producto.imagen_url) galeria.push(`/recursos/imagenes/${url}`);
            });
        }

        const idImagen = `foto-producto-${producto.id_producto}`;

        return `
            <div class="group flex flex-col bg-white dark:bg-[#1a120b] rounded-[2rem] overflow-hidden border border-gray-100 dark:border-gray-800 hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)] transition-all duration-500 hover:-translate-y-2 animate-fade-in-up" style="animation-delay: ${retardoAnimacion}ms;">
                <div class="relative aspect-square overflow-hidden bg-gray-50 dark:bg-black/20 cursor-pointer">
                    
                    <button class="boton-carrusel-atras absolute left-2 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full bg-white/20 backdrop-blur-md text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/40 flex items-center justify-center shadow-lg"
                            data-target="${idImagen}" data-fotos='${JSON.stringify(galeria)}'>
                        <span class="material-symbols-outlined text-sm pointer-events-none">chevron_left</span>
                    </button>
                    <button class="boton-carrusel-adelante absolute right-2 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full bg-white/20 backdrop-blur-md text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/40 flex items-center justify-center shadow-lg"
                            data-target="${idImagen}" data-fotos='${JSON.stringify(galeria)}'>
                        <span class="material-symbols-outlined text-sm pointer-events-none">chevron_right</span>
                    </button>

                    <img id="${idImagen}" 
                         src="${rutaPortada}" 
                         alt="${producto.nombre}"
                         data-index="0"
                         loading="lazy"
                         class="img-producto-click w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-1000" 
                         data-id="${producto.id_producto}"
                         onerror="this.src='/recursos/imagenes/logo.webp'"/>
                    
                    <button class="boton-anadir-carrito absolute bottom-4 right-4 bg-principal p-4 rounded-2xl shadow-xl text-texto-principal hover:bg-texto-principal hover:text-principal transition-all opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 duration-500 ease-out z-20"
                            data-id="${producto.id_producto}">
                        <span class="material-symbols-outlined block text-2xl pointer-events-none">add_shopping_cart</span>
                    </button>
                </div>
                
                <div class="p-6 flex flex-col flex-1 gap-2">
                    <div class="flex justify-between items-start gap-4">
                        <h3 class="text-texto-principal dark:text-white text-lg font-black leading-tight cursor-pointer hover:text-principal transition-colors line-clamp-2 ir-a-detalle" data-id="${producto.id_producto}">${producto.nombre}</h3>
                        <span class="text-principal text-xl font-black">${parseFloat(producto.precio).toFixed(2)}€</span>
                    </div>
                    <p class="text-texto-secundario dark:text-gray-400 text-xs font-medium line-clamp-2 leading-relaxed mb-4">${producto.descripcion}</p>
                    <div class="mt-auto pt-2">
                        <button class="w-full h-12 rounded-2xl bg-fondo-claro dark:bg-[#2c241b] text-texto-principal dark:text-white text-xs font-black uppercase tracking-widest hover:bg-principal hover:text-texto-principal transition-all border border-gray-100 dark:border-white/5 ir-a-detalle" data-id="${producto.id_producto}">Ver Detalles</button>
                    </div>
                </div>
            </div>`;
    }).join('');
}

/**
 * Gestiona los clics dentro del catálogo delegando acciones a los módulos de carrito o navegación.
 */
function manejarAccionesProducto(e) {
    const objetivo = e.target;
    
    const botonCarrusel = objetivo.closest('.boton-carrusel-atras, .boton-carrusel-adelante');
    if (botonCarrusel) {
        const idImg = botonCarrusel.dataset.target;
        const fotos = JSON.parse(botonCarrusel.dataset.fotos);
        const dir = botonCarrusel.classList.contains('boton-carrusel-adelante') ? 1 : -1;
        gestionarCarruselImagen(idImg, dir, e, fotos);
        return;
    }

    const botonCarrito = objetivo.closest('.boton-anadir-carrito');
    if (botonCarrito) {
        e.stopPropagation();
        const id = parseInt(botonCarrito.dataset.id);
        const producto = listaProductosEnCache.find(p => p.id_producto === id);
        if (producto) {
            agregarAlCarrito(producto);
            lanzarNotificacionEmergente(`¡${producto.nombre} añadido al carrito!`);
        }
        return;
    }

    const irADetalle = objetivo.closest('.ir-a-detalle, .img-producto-click');
    if (irADetalle) {
        window.location.href = `/tienda/detalle.html?id=${irADetalle.dataset.id}`;
    }
}

/**
 * Filtra el catálogo de productos basándose en la coincidencia textual con la búsqueda.
 */
function filtrarPorTexto(e) {
    const consulta = e.target.value.toLowerCase().trim();
    if (!consulta) {
        dibujarCatalogo(listaProductosEnCache);
        return;
    }
    const filtrados = listaProductosEnCache.filter(p => 
        p.nombre.toLowerCase().includes(consulta) || 
        p.descripcion.toLowerCase().includes(consulta) ||
        p.categoria.toLowerCase().includes(consulta)
    );
    dibujarCatalogo(filtrados);
}

/**
 * Actualiza el estado visual de los filtros y recarga el inventario por categoría.
 */
function gestionarCambioCategoria(evento) {
    const botonActivo = evento.currentTarget;
    document.querySelectorAll('.filtro-btn').forEach(btn => {
        btn.classList.remove('bg-texto-principal', 'text-white', 'dark:bg-white', 'dark:text-texto-principal', 'shadow-md');
        btn.classList.add('bg-white', 'dark:bg-[#2c241b]', 'text-texto-principal', 'dark:text-white');
    });
    
    botonActivo.classList.add('bg-texto-principal', 'text-white', 'dark:bg-white', 'dark:text-texto-principal', 'shadow-md');
    botonActivo.classList.remove('bg-white', 'dark:bg-[#2c241b]', 'dark:text-white');

    obtenerProductos(botonActivo.innerText.trim());
}

/**
 * Genera y muestra una notificación visual efímera en pantalla.
 */
function lanzarNotificacionEmergente(mensaje, tipo = 'exito') {
    const contenedor = document.getElementById('toast-container');
    if (!contenedor) return;
    
    const toast = document.createElement('div');
    toast.className = "flex items-center gap-3 px-6 py-4 rounded-2xl shadow-xl border bg-white dark:bg-gray-900 border-principal text-texto-principal dark:text-white animate-joy";
    
    toast.innerHTML = `
        <span class="material-symbols-outlined text-principal">check_circle</span>
        <p class="text-sm font-bold">${mensaje}</p>
    `;
    
    contenedor.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-20px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
