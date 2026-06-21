/**
 * Gestión del catálogo público de gatos, filtros de búsqueda e historias de éxito.
 */

import { gestionarCarruselImagen } from '../recursos/js/utilidades.js';
import { inicializarEstructuraCarrito } from '../recursos/js/carrito.js';

document.addEventListener('DOMContentLoaded', () => {
    arrancarCatalogoMichis();
    inicializarEstructuraCarrito();
});

/**
 * Configura los eventos iniciales y carga los datos de los residentes.
 */
function arrancarCatalogoMichis() {
    cargarGatosFiltrados();
    cargarFinalesFelices();

    ['filtro-genero', 'filtro-estado'].forEach(id => {
        document.getElementById(id)?.addEventListener('change', cargarGatosFiltrados);
    });

    document.getElementById('btn-limpiar')?.addEventListener('click', limpiarBusqueda);
}

/**
 * Restablece los selectores de búsqueda a sus valores iniciales.
 */
function limpiarBusqueda() {
    ['filtro-genero', 'filtro-estado'].forEach(id => {
        const selector = document.getElementById(id);
        if (selector) selector.value = 'todos';
    });
    cargarGatosFiltrados();
}

/**
 * Obtiene los registros de gatos desde el servidor aplicando los filtros activos.
 */
async function cargarGatosFiltrados() {
    const contenedor = document.getElementById('lista-gatos-completa');
    if (!contenedor) return;

    const filtros = new URLSearchParams({
        genero: document.getElementById('filtro-genero')?.value || 'todos',
        estado: document.getElementById('filtro-estado')?.value || 'todos'
    });

    try {
        const respuesta = await fetch(`/api/gatos?${filtros.toString()}`);
        if (!respuesta.ok) throw new Error('Error de comunicación con el servidor');
        
        const michis = await respuesta.json();
        dibujarTarjetasGatos(michis, contenedor);
    } catch (error) {
        console.error("Fallo al filtrar:", error);
        contenedor.innerHTML = `<p class="col-span-full text-center text-red-500 py-10 font-black uppercase text-[10px]">Error al conectar con la base de datos</p>`;
    }
}

/**
 * Genera el marcado HTML para las tarjetas de los gatos disponibles.
 */
function dibujarTarjetasGatos(lista, contenedor) {
    const disponibles = lista.filter(g => g.estado_adopcion !== 'Adoptado');

    if (disponibles.length === 0) {
        contenedor.innerHTML = `
            <div class="col-span-full text-center py-20">
                <span class="material-symbols-outlined text-6xl text-gray-200">search_off</span>
                <p class="text-gray-400 mt-4 text-[10px] font-black uppercase tracking-widest">No hay michis que coincidan con tu búsqueda</p>
            </div>`;
        return;
    }

    contenedor.innerHTML = disponibles.map(michi => {
        const fotoPrincipal = michi.imagen_url ? `/recursos/imagenes/${michi.imagen_url}` : '/recursos/imagenes/logo.webp';
        
        const fotosCarrusel = [fotoPrincipal];
        if (michi.imagenes_secundarias && Array.isArray(michi.imagenes_secundarias)) {
            michi.imagenes_secundarias.forEach(img => fotosCarrusel.push(`/recursos/imagenes/${img}`));
        } else if (michi.galeria_urls) {
            michi.galeria_urls.split(',').forEach(url => fotosCarrusel.push(`/recursos/imagenes/${url.trim()}`));
        }

        const idImagen = `img-michi-${michi.id_gato}`;
        const insignias = generarEtiquetasEstado(michi.estado_adopcion);
        const esMacho = michi.sexo === 'Macho';

        return `
            <article class="group relative flex flex-col bg-white dark:bg-[#1f1b16] rounded-[2.5rem] overflow-hidden border border-gray-100 dark:border-white/5 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
                ${insignias}

                <div class="relative aspect-[4/5] overflow-hidden bg-gray-100 border-b border-gray-50">
                    <button class="boton-carrusel-atras absolute left-2 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full bg-white/20 backdrop-blur-md text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                            data-target="${idImagen}" data-fotos='${JSON.stringify(fotosCarrusel)}'>
                        <span class="material-symbols-outlined text-sm pointer-events-none">chevron_left</span>
                    </button>
                    <button class="boton-carrusel-adelante absolute right-2 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full bg-white/20 backdrop-blur-md text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                            data-target="${idImagen}" data-fotos='${JSON.stringify(fotosCarrusel)}'>
                        <span class="material-symbols-outlined text-sm pointer-events-none">chevron_right</span>
                    </button>

                    <a href="/gatos/perfil.html?id=${michi.id_gato}" class="block w-full h-full">
                        <img id="${idImagen}" src="${fotoPrincipal}" alt="${michi.nombre_gato}" data-index="0" loading="lazy"
                            class="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                            onerror="this.src='/recursos/imagenes/logo.webp'" />
                    </a>
                </div>

                <div class="p-6 flex flex-col flex-1">
                    <div class="flex items-center justify-between mb-2">
                        <h3 class="text-xl font-black text-texto-principal dark:text-white uppercase tracking-tighter">${michi.nombre_gato}</h3>
                        <span class="material-symbols-outlined ${esMacho ? 'text-blue-500' : 'text-pink-500'} font-black text-xl">
                            ${esMacho ? 'male' : 'female'}
                        </span>
                    </div>
                    
                    <p class="text-texto-secundario dark:text-gray-400 text-[11px] font-medium leading-relaxed line-clamp-2 italic">
                        "${michi.historia || 'Esperando a su familia definitiva...'}"
                    </p>
                    
                    <div class="mt-4 pt-3 border-t border-gray-50 dark:border-white/5">
                        <a href="/gatos/perfil.html?id=${michi.id_gato}" class="flex items-center justify-between group/link">
                            <span class="text-[8px] font-black uppercase text-gray-400 tracking-widest group-hover/link:text-principal transition-colors">Ver perfil completo</span>
                            <span class="material-symbols-outlined text-gray-300 text-sm group-hover/link:text-principal group-hover/link:translate-x-1 transition-all">arrow_forward</span>
                        </a>
                    </div>
                </div>
            </article>`;
    }).join('');

    vincularCarruseles(contenedor);
}

/**
 * Genera el componente visual de insignia según el estado del gato.
 */
function generarEtiquetasEstado(estado) {
    const base = "px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-[0.2em] shadow-sm";
    
    switch (estado) {
        case 'Reservado':
            return `<div class="absolute top-4 right-4 z-20"><span class="bg-amber-400 text-neutral-900 border border-amber-500/20 ${base}">RESERVADO</span></div>`;
        case 'Urgente':
            return `
                <div class="absolute top-4 left-4 z-20"><span class="bg-red-500 text-white animate-pulse ${base}">URGENTE</span></div>
                <div class="absolute top-4 right-4 z-20"><span class="bg-white text-texto-principal border border-gray-200 ${base}">EN ADOPCIÓN</span></div>`;
        case 'Residente VIP':
            return `<div class="absolute top-4 left-4 z-20"><span class="bg-purple-600 text-white border border-purple-400 ${base}">VIP</span></div>`;
        default:
            return `<div class="absolute top-4 right-4 z-20"><span class="bg-white text-texto-principal border border-gray-200 ${base}">EN ADOPCIÓN</span></div>`;
    }
}

/**
 * Inicializa los controladores de imagen para los carruseles de las tarjetas.
 */
function vincularCarruseles(contenedor) {
    contenedor.addEventListener('click', (evento) => {
        const boton = evento.target.closest('.boton-carrusel-atras, .boton-carrusel-adelante');
        if (!boton) return;

        const idDestino = boton.dataset.target;
        const catalogoFotos = JSON.parse(boton.dataset.fotos);
        const paso = boton.classList.contains('boton-carrusel-adelante') ? 1 : -1;

        gestionarCarruselImagen(idDestino, paso, evento, catalogoFotos);
    });
}

/**
 * Recupera y muestra la galería de gatos que ya han encontrado un hogar.
 */
async function cargarFinalesFelices() {
    const contenedor = document.getElementById('lista-finales-felices');
    if (!contenedor) return;

    try {
        const respuesta = await fetch('/api/gatos?estado=Adoptado');
        const listaMichis = await respuesta.json();
        
        const adoptados = listaMichis
            .filter(g => g.estado_adopcion === 'Adoptado')
            .sort((a, b) => new Date(b.fecha_adopcion || 0) - new Date(a.fecha_adopcion || 0));
        
        if (adoptados.length === 0) {
            contenedor.innerHTML = '<p class="col-span-full text-center text-gray-400 italic">Próximamente compartiremos más historias de éxito.</p>';
            return;
        }

        contenedor.innerHTML = adoptados.slice(0, 4).map(michi => `
            <div class="group relative bg-white dark:bg-[#1f1b16] rounded-[2.5rem] overflow-hidden shadow-sm border border-gray-100 dark:border-white/5 grayscale hover:grayscale-0 transition-all duration-700">
                <div class="absolute top-4 right-4 z-20">
                    <span class="bg-green-500 text-white px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-[0.2em] shadow-lg">ADOPTADO</span>
                </div>
                
                <div class="relative aspect-square overflow-hidden">
                    <img src="/recursos/imagenes/${michi.imagen_url || 'logo.webp'}" class="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110">
                    <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                        <p class="text-white text-xs font-bold italic">"${michi.nombre_gato} ya tiene un sofá definitivo."</p>
                    </div>
                </div>
                
                <div class="p-6 text-center">
                    <h3 class="text-xl font-black text-texto-principal dark:text-white uppercase tracking-tighter">${michi.nombre_gato}</h3>
                </div>
            </div>`).join('');

    } catch (error) {
        console.error("Fallo al cargar finales felices:", error);
    }
}
