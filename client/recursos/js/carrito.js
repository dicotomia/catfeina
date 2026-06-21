/**
 * Gestión del carrito de compras, persistencia en almacenamiento local e interfaz de usuario.
 */

import { procesarPagoCarrito } from './modales.js';

let carritoCache = JSON.parse(localStorage.getItem('carrito')) || [];

/**
 * Actualiza el contador visual de artículos en el botón del carrito.
 */
export function refrescarContador() {
    const totalArticulos = carritoCache.reduce((acumulado, item) => acumulado + item.cantidad, 0);
    const botonFlotante = document.getElementById('floating-carrito-btn');
    const etiquetaContador = document.getElementById('carrito-count');

    if (totalArticulos > 0) {
        if (botonFlotante) {
            botonFlotante.classList.remove('hidden');
            botonFlotante.classList.add('animate-cart-jump');
            setTimeout(() => botonFlotante.classList.remove('animate-cart-jump'), 500);
        }
        if (etiquetaContador) {
            etiquetaContador.innerText = totalArticulos;
        }
    } else {
        if (botonFlotante) {
            botonFlotante.classList.add('hidden');
        }
    }
}

/**
 * Muestra el panel lateral del carrito y bloquea el scroll del cuerpo.
 */
export function desplegarCarrito() {
    const contenedor = document.getElementById('carrito-drawer');
    const capaFondo = document.getElementById('carrito-overlay');
    const panelLateral = document.getElementById('carrito-panel');

    if (!contenedor) return;

    dibujarArticulosCarrito();
    contenedor.classList.remove('invisible');
    document.body.style.overflow = 'hidden';

    requestAnimationFrame(() => {
        if (capaFondo) capaFondo.classList.add('opacity-100');
        if (panelLateral) panelLateral.classList.remove('translate-x-full');
    });
}

/**
 * Oculta el panel lateral del carrito y restaura el scroll del cuerpo.
 */
export function ocultarCarrito() {
    const capaFondo = document.getElementById('carrito-overlay');
    const panelLateral = document.getElementById('carrito-panel');
    const contenedor = document.getElementById('carrito-drawer');

    if (capaFondo) capaFondo.classList.remove('opacity-100');
    if (panelLateral) panelLateral.classList.add('translate-x-full');
    document.body.style.overflow = '';

    setTimeout(() => {
        if (contenedor) contenedor.classList.add('invisible');
    }, 400);
}

/**
 * Renderiza los artículos del carrito y calcula el importe total.
 */
export function dibujarArticulosCarrito() {
    const contenedorItems = document.getElementById('carrito-items');
    const etiquetaTotal = document.getElementById('carrito-total');
    if (!contenedorItems) return;

    if (carritoCache.length === 0) {
        contenedorItems.innerHTML = `
            <div class="flex flex-col items-center justify-center h-full text-center gap-4 text-gray-400">
                <span class="material-symbols-outlined text-6xl">shopping_cart_off</span>
                <p class="text-sm font-bold uppercase tracking-widest">Carrito vacío</p>
            </div>`;
        if (etiquetaTotal) etiquetaTotal.innerText = '0.00 €';
        return;
    }

    let sumaTotal = 0;
    contenedorItems.innerHTML = carritoCache.map(producto => {
        const subtotal = producto.precio * producto.cantidad;
        sumaTotal += subtotal;
        return `
            <div class="flex gap-4 items-center bg-gray-50 dark:bg-black/20 p-4 rounded-2xl border border-gray-100 dark:border-white/5">
                <img src="/recursos/imagenes/${producto.imagen_url}" class="w-16 h-16 object-cover rounded-xl shadow-sm" onerror="this.src='/recursos/imagenes/logo.webp'"/>
                <div class="flex-1 flex flex-col">
                    <h4 class="font-bold text-[10px] text-texto-principal dark:text-white line-clamp-1 uppercase tracking-tighter">${producto.nombre}</h4>
                    <span class="text-principal font-black text-sm">${parseFloat(producto.precio).toFixed(2)}€</span>
                    <div class="flex items-center gap-3 mt-2">
                        <button class="boton-cantidad-menos size-6 flex items-center justify-center border border-gray-200 rounded-lg text-xs hover:bg-gray-100 transition-colors" data-id="${producto.id_producto}">-</button>
                        <span class="text-xs font-black">${producto.cantidad}</span>
                        <button class="boton-cantidad-mas size-6 flex items-center justify-center border border-gray-200 rounded-lg text-xs hover:bg-gray-100 transition-colors" data-id="${producto.id_producto}">+</button>
                    </div>
                </div>
            </div>`;
    }).join('');

    if (etiquetaTotal) {
        etiquetaTotal.innerText = `${sumaTotal.toFixed(2)} €`;
    }

    vincularEventosCantidades();
}

/**
 * Actualiza la cantidad de un producto en el carrito o lo elimina si es menor a uno.
 */
function actualizarCantidad(idProducto, delta) {
    const item = carritoCache.find(i => i.id_producto === idProducto);
    if (item) {
        item.cantidad += delta;
        if (item.cantidad <= 0) {
            carritoCache = carritoCache.filter(i => i.id_producto !== idProducto);
        }
    }
    localStorage.setItem('carrito', JSON.stringify(carritoCache));
    refrescarContador();
    dibujarArticulosCarrito();
}

/**
 * Asigna los controladores de eventos a los botones de incremento y decremento.
 */
function vincularEventosCantidades() {
    document.querySelectorAll('.boton-cantidad-menos').forEach(btn => {
        btn.onclick = () => actualizarCantidad(parseInt(btn.dataset.id), -1);
    });
    document.querySelectorAll('.boton-cantidad-mas').forEach(btn => {
        btn.onclick = () => actualizarCantidad(parseInt(btn.dataset.id), 1);
    });
}

/**
 * Agrega un nuevo producto al carrito o incrementa su cantidad si ya existe.
 */
export function agregarAlCarrito(producto, cantidad = 1) {
    const carrito = JSON.parse(localStorage.getItem('carrito')) || [];
    const itemEnCarrito = carrito.find(item => item.id_producto === producto.id_producto);
    
    if (itemEnCarrito) {
        itemEnCarrito.cantidad += cantidad;
    } else {
        carrito.push({ ...producto, cantidad });
    }

    localStorage.setItem('carrito', JSON.stringify(carrito));
    carritoCache = carrito; 
    
    refrescarContador();
    
    if (!document.getElementById('carrito-drawer').classList.contains('invisible')) {
        dibujarArticulosCarrito();
    }
}

/**
 * Inyecta la estructura del carrito y el botón flotante en el documento.
 */
export function inicializarEstructuraCarrito() {
    if (document.getElementById('carrito-drawer')) return;

    const estructuraHtml = `
        <div id="carrito-drawer" class="fixed inset-0 z-[150] invisible">
            <div id="carrito-overlay" class="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 transition-opacity duration-300"></div>
            <div id="carrito-panel" class="absolute top-0 right-0 h-screen w-full max-w-md bg-white dark:bg-[#1a120b] shadow-[-20px_0_50px_rgba(0,0,0,0.2)] translate-x-full transition-transform duration-500 ease-out flex flex-col">
                <div class="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between shrink-0">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 bg-principal/10 rounded-full flex items-center justify-center">
                            <span class="material-symbols-outlined text-principal">shopping_bag</span>
                        </div>
                        <h3 class="text-xl font-black text-texto-principal dark:text-white uppercase tracking-tighter">Tu Pedido</h3>
                    </div>
                    <button id="btn-cerrar-carrito" class="w-10 h-10 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors group">
                        <span class="material-symbols-outlined text-gray-400 group-hover:text-texto-principal">close</span>
                    </button>
                </div>
                <div id="carrito-items" class="flex-1 overflow-y-auto p-6 flex flex-col gap-6 no-scrollbar"></div>
                <div class="p-6 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-black/20 flex flex-col gap-4 shrink-0">
                    <div class="flex justify-between items-center text-lg font-black italic">
                        <span>TOTAL:</span>
                        <span id="carrito-total" class="text-principal">0.00 €</span>
                    </div>
                    <button id="btn-procesar-pago" class="w-full h-14 bg-principal text-texto-principal font-black text-xs rounded-2xl hover:brightness-95 transition-all shadow-lg flex items-center justify-center gap-3 uppercase tracking-widest">
                        FINALIZAR COMPRA
                        <span class="material-symbols-outlined">payments</span>
                    </button>
                </div>
            </div>
        </div>

        <button id="floating-carrito-btn" class="fixed bottom-8 right-8 z-[140] w-16 h-16 bg-principal text-texto-principal rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform active:scale-95 group hidden">
            <span class="material-symbols-outlined text-3xl">shopping_cart</span>
            <div id="carrito-count" class="absolute -top-1 -right-1 bg-texto-principal text-principal text-[10px] font-black w-6 h-6 rounded-full border-2 border-principal flex items-center justify-center">0</div>
        </button>
    `;
    
    document.body.insertAdjacentHTML('beforeend', estructuraHtml);
    
    document.getElementById('btn-cerrar-carrito')?.addEventListener('click', ocultarCarrito);
    document.getElementById('floating-carrito-btn')?.addEventListener('click', desplegarCarrito);
    document.getElementById('btn-procesar-pago')?.addEventListener('click', procesarPagoCarrito);
    document.getElementById('carrito-overlay')?.addEventListener('click', ocultarCarrito);

    refrescarContador();
}
