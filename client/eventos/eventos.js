/**
 * Gestión del catálogo de actividades, talleres y charlas con soporte de filtrado.
 */

import { inicializarEstructuraCarrito } from '../recursos/js/carrito.js';

document.addEventListener('DOMContentLoaded', () => {
    inicializarVistaEventos();
    inicializarEstructuraCarrito();
});

/**
 * Inicializa la carga de eventos y vincula los controles de filtrado por categoría.
 */
function inicializarVistaEventos() {
    obtenerEventos();

    document.querySelectorAll('.filtro-btn').forEach(boton => {
        boton.addEventListener('click', (e) => gestionarFiltroCategoria(e));
    });
}

/**
 * Solicita la lista de actividades programadas según la categoría indicada.
 */
async function obtenerEventos(categoria = 'Todos') {
    const contenedor = document.getElementById('contenedor-eventos');
    if (!contenedor) return;

    try {
        const ruta = categoria === 'Todos' ? '/api/eventos' : `/api/eventos?categoria=${categoria}`;
        const respuesta = await fetch(ruta);
        const actividades = await respuesta.json();
        
        const eventosFiltrados = actividades.filter(e => e.categoria !== 'Adopción Exitosa');
        
        dibujarTarjetasEventos(eventosFiltrados, contenedor);
    } catch (error) {
        console.error("[Error] al cargar catálogo de eventos:", error.message);
        contenedor.innerHTML = '<p class="col-span-full text-center text-red-500 font-bold uppercase text-xs">Error al conectar con la agenda</p>';
    }
}

/**
 * Genera el contenido visual de las tarjetas de los eventos programados.
 */
function dibujarTarjetasEventos(eventos, contenedor) {
    if (eventos.length === 0) {
        contenedor.innerHTML = '<p class="col-span-full text-center text-gray-400 italic py-20 uppercase font-black text-xs tracking-widest">No hay actividades programadas en esta categoría.</p>';
        return;
    }

    contenedor.innerHTML = eventos.map(evento => {
        const fechaObj = new Date(evento.fecha);
        const mesCorto = fechaObj.toLocaleString('es-ES', { month: 'short' }).toUpperCase();
        const diaNumero = fechaObj.getDate();
        const precioMonto = parseFloat(evento.precio);
        
        return `
            <article class="flex flex-col overflow-hidden rounded-[3rem] bg-white dark:bg-[#1f1b16] shadow-xl border border-gray-100 dark:border-white/5 group hover:-translate-y-2 transition-all duration-500">
                <div class="relative h-64 w-full overflow-hidden">
                    <div class="absolute top-5 left-5 bg-white/90 dark:bg-[#1f1b16]/90 backdrop-blur-md rounded-2xl p-3 flex flex-col items-center min-w-[60px] z-20 shadow-xl border border-gray-100 dark:border-white/5">
                        <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest">${mesCorto}</span>
                        <span class="text-2xl font-black text-principal leading-none">${diaNumero}</span>
                    </div>

                    <div class="absolute top-5 right-5 bg-principal text-texto-principal rounded-2xl px-4 py-2 flex items-center justify-center z-20 shadow-xl font-black text-xs uppercase tracking-widest shadow-principal/20">
                        ${precioMonto > 0 ? `${precioMonto.toFixed(2)}€` : 'Gratis'}
                    </div>
                    
                    <img src="/recursos/imagenes/${evento.imagen_url || 'logo.webp'}" 
                         loading="lazy"
                         class="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                         onerror="this.src='/recursos/imagenes/logo.webp'">
                    
                    <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-30 transition-opacity"></div>
                    
                    <div class="absolute bottom-5 left-8 right-5">
                        <span class="px-4 py-1.5 bg-principal text-texto-principal text-[9px] font-black rounded-full uppercase tracking-[0.1em] shadow-lg">${evento.categoria}</span>
                    </div>
                </div>

                <div class="flex flex-1 flex-col p-8 md:p-10 gap-4">
                    <div class="flex items-center gap-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        <span class="flex items-center gap-1"><span class="material-symbols-outlined text-sm text-principal">schedule</span> ${evento.hora ? evento.hora.substring(0,5) : 'TODO EL DÍA'}</span>
                        <span class="flex items-center gap-1"><span class="material-symbols-outlined text-sm text-principal">location_on</span> ${evento.ubicacion || 'CATFEINA'}</span>
                    </div>
                    
                    <h3 class="text-2xl font-black text-texto-principal dark:text-white leading-tight group-hover:text-principal transition-colors">${evento.titulo}</h3>
                    <p class="text-sm text-texto-secundario dark:text-gray-400 font-medium leading-relaxed line-clamp-3 italic">"${evento.descripcion_corta || evento.descripcion}"</p>
                    
                    <div class="flex flex-col gap-3 mt-auto pt-4 border-t border-gray-50 dark:border-white/5">
                        <a href="/eventos/detalle.html?id=${evento.id_evento}" class="w-full py-3 rounded-xl border-2 border-principal/20 text-principal hover:bg-principal hover:text-texto-principal text-[10px] font-black uppercase tracking-widest text-center transition-all duration-300">
                            Explorar experiencia
                        </a>
                    </div>
                </div>
            </article>
        `;
    }).join('');
}

/**
 * Actualiza el estado visual de los filtros y recarga la lista de actividades.
 */
function gestionarFiltroCategoria(evento) {
    const botonActivo = evento.currentTarget;
    
    document.querySelectorAll('.filtro-btn').forEach(btn => {
        btn.classList.remove('active', 'bg-principal', 'text-texto-principal');
        btn.classList.add('bg-gray-100', 'dark:bg-white/5', 'text-texto-secundario');
    });
    
    botonActivo.classList.add('active', 'bg-principal', 'text-texto-principal');
    botonActivo.classList.remove('bg-gray-100', 'dark:bg-white/5', 'text-texto-secundario');

    obtenerEventos(botonActivo.innerText.trim());
}
