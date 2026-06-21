/**
 * Lógica de la página de inicio.
 */

import { gestionarCarruselImagen, formatearMoneda } from './recursos/js/utilidades.js';
import { inicializarEstructuraCarrito } from './recursos/js/carrito.js';
import { lanzarAlerta, validarAccesoUsuario } from './recursos/js/modales.js';

document.addEventListener('DOMContentLoaded', () => {
    inicializarPaginaInicio();
    inicializarEstructuraCarrito();
});

/**
 * Inicializa los componentes de la página de inicio.
 */
async function inicializarPaginaInicio() {
    await Promise.all([
        obtenerGatosDestacados(),
        obtenerComentariosAprobados()
    ]);
    configurarFormularioTestimonio();
    vincularAccionesGlobales();
}

/**
 * Gestiona los eventos de clic para testimonios y modales.
 */
function vincularAccionesGlobales() {
    document.addEventListener('click', (e) => {
        const objetivo = e.target.closest('[data-action]');
        if (!objetivo) return;

        const accion = objetivo.dataset.action;

        switch (accion) {
            case 'slide-testimonios-prev':
                moverTestimonios(-1);
                break;
            case 'slide-testimonios-next':
                moverTestimonios(1);
                break;
            case 'open-testimonial-modal':
                if (validarAccesoUsuario('Para poder compartir tu experiencia en Catfeina, primero debes iniciar sesión.')) {
                    abrirModalTestimonio();
                }
                break;
            case 'close-testimonial-modal':
                cerrarModalTestimonio();
                break;
        }
    });

    // Lógica de puntuación por estrellas
    document.getElementById('selector-estrellas')?.addEventListener('click', (e) => {
        const botonEstrella = e.target.closest('[data-rating]');
        if (botonEstrella) {
            actualizarPuntuacionVisual(parseInt(botonEstrella.dataset.rating));
        }
    });
}

/**
 * Muestra el formulario para añadir un nuevo testimonio.
 */
function abrirModalTestimonio() {
    const modal = document.getElementById('modal-comentario');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        document.body.style.overflow = 'hidden';
    }
}

/**
 * Oculta el formulario de testimonios.
 */
function cerrarModalTestimonio() {
    const modal = document.getElementById('modal-comentario');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        document.body.style.overflow = '';
    }
}

// Gestión de gatos

/**
 * Obtiene y muestra la lista de gatos destacados.
 */
async function obtenerGatosDestacados() {
    const contenedor = document.getElementById('lista-gatos-home');
    if (!contenedor) return;
    
    try {
        const respuesta = await fetch('/api/gatos'); 
        const gatos = await respuesta.json();
        
        if (gatos && gatos.length > 0) {
            dibujarTarjetasGatos(gatos.slice(0, 4), contenedor);
        } else {
            contenedor.innerHTML = '<p class="text-center w-full p-4 text-gray-500 italic">Próximamente nuevos residentes...</p>';
        }
    } catch (error) {
        console.error("[Error] al cargar gatos destacados:", error.message);
    }
}

/**
 * Renderiza las tarjetas de los gatos en el contenedor.
 */
function dibujarTarjetasGatos(gatos, contenedor) {
    contenedor.innerHTML = gatos.map(gato => {
        const nacimiento = new Date(gato.fecha_nacimiento);
        const hoy = new Date();
        let edad = hoy.getFullYear() - nacimiento.getFullYear();
        let textoEdad = edad <= 0 ? "Cachorro" : `${edad} años`;

        const rutaImagen = gato.imagen_url 
            ? `/recursos/imagenes/${gato.imagen_url}` 
            : '/recursos/imagenes/logo.webp';

        // Galería de imágenes para el carrusel
        const galeriaReal = [rutaImagen];
        if (gato.galeria_urls) {
            gato.galeria_urls.split(',').forEach(url => {
                if (url.trim()) galeriaReal.push(`/recursos/imagenes/${url.trim()}`);
            });
        }

        const idImagen = `foto-gato-${gato.id_gato}`;
        const etiquetas = obtenerEtiquetasEstado(gato.estado_adopcion);

        return `
            <article class="bg-white dark:bg-[#1f1810] rounded-[2rem] shadow-sm overflow-hidden flex flex-col group hover:shadow-xl transition-all duration-500 border border-gray-100 dark:border-white/5 relative">
                <div class="aspect-[4/5] overflow-hidden relative">
                    <!-- Controles del Carrusel -->
                    <button class="boton-carrusel-atras absolute left-2 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full bg-white/20 backdrop-blur-md text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                            data-target="${idImagen}" data-fotos='${JSON.stringify(galeriaReal)}'>
                        <span class="material-symbols-outlined text-sm pointer-events-none">chevron_left</span>
                    </button>
                    <button class="boton-carrusel-adelante absolute right-2 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full bg-white/20 backdrop-blur-md text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                            data-target="${idImagen}" data-fotos='${JSON.stringify(galeriaReal)}'>
                        <span class="material-symbols-outlined text-sm pointer-events-none">chevron_right</span>
                    </button>

                    <a href="/gatos/perfil.html?id=${gato.id_gato}" class="block w-full h-full">
                        <img id="${idImagen}" 
                             src="${rutaImagen}" 
                             alt="Gato ${gato.nombre_gato}"
                             data-index="0"
                             loading="lazy"
                             class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                             onerror="this.src='/recursos/imagenes/logo.webp'">
                    </a>
                    ${etiquetas}
                </div>
                <div class="p-6 flex flex-col flex-1 gap-4 bg-white dark:bg-[#1f1810] relative z-10">
                    <div class="flex justify-between items-start">
                        <div>
                            <h3 class="text-xl font-black text-texto-principal dark:text-white uppercase tracking-tighter">${gato.nombre_gato}</h3>
                            <p class="text-xs text-texto-secundario dark:text-gray-400 font-medium">${textoEdad} • ${gato.personalidad?.split(',')[0] || 'Encantador'}</p>
                        </div>
                        <span class="material-symbols-outlined ${gato.sexo === 'Macho' ? 'text-blue-400' : 'text-pink-400'} text-xl">
                            ${gato.sexo === 'Macho' ? 'male' : 'female'}
                        </span>
                    </div>
                </div>
            </article>`;
    }).join('');

    vincularEventosCarrusel(contenedor);
}

/**
 * Genera el marcado de etiquetas según el estado del gato.
 */
function obtenerEtiquetasEstado(estado) {
    if (estado === 'Reservado') {
        return `<div class="absolute top-3 right-3 bg-yellow-400 text-[#181511] px-3 py-1 rounded-full text-[10px] font-black shadow-sm z-20">RESERVADO</div>`;
    } 
    if (estado === 'Urgente') {
        return `
            <div class="absolute top-3 left-3 bg-red-500 text-white px-3 py-1 rounded-full text-[10px] font-black shadow-sm animate-pulse z-20">URGENTE</div>
            <div class="absolute top-3 right-3 bg-white/90 text-neutral-800 px-3 py-1 rounded-full text-[10px] font-black shadow-sm z-20">EN ADOPCIÓN</div>
        `;
    }
    if (estado === 'Residente VIP') {
        return `<div class="absolute top-3 left-3 bg-purple-600 text-white px-3 py-1 rounded-full text-[10px] font-black shadow-sm border border-purple-400 z-20">VIP</div>`;
    }
    return `<div class="absolute top-3 right-3 bg-white/90 text-neutral-800 px-3 py-1 rounded-full text-[10px] font-black shadow-sm z-20">EN ADOPCIÓN</div>`;
}

/**
 * Inicializa los controladores del carrusel de imágenes.
 */
function vincularEventosCarrusel(contenedor) {
    contenedor.addEventListener('click', (e) => {
        const boton = e.target.closest('.boton-carrusel-atras, .boton-carrusel-adelante');
        if (!boton) return;

        const idImagen = boton.dataset.target;
        const fotos = JSON.parse(boton.dataset.fotos);
        const direccion = boton.classList.contains('boton-carrusel-adelante') ? 1 : -1;

        gestionarCarruselImagen(idImagen, direccion, e, fotos);
    });
}

// Gestión de testimonios

let totalTestimonios = 0;
let indiceTestimonioActual = 0;

/**
 * Obtiene y muestra los comentarios aprobados.
 */
async function obtenerComentariosAprobados() {
    const contenedor = document.getElementById('contenedor-comentarios');
    if (!contenedor) return;

    try {
        const respuesta = await fetch('/api/comentarios/aprobados');
        const testimonios = await respuesta.json();
        
        if (testimonios && testimonios.length > 0) {
            totalTestimonios = testimonios.length;
            dibujarTestimonios(testimonios, contenedor);
            vincularNavegacionTestimonios();
        } else {
            contenedor.innerHTML = '<p class="w-full text-center text-gray-500 italic py-10">Sé el primero en compartir tu experiencia.</p>';
        }
    } catch (error) {
        console.error("[Error] al cargar testimonios:", error.message);
    }
}

/**
 * Renderiza los testimonios en su contenedor.
 */
function dibujarTestimonios(testimonios, contenedor) {
    contenedor.innerHTML = testimonios.map(t => {
        let estrellas = '';
        for (let i = 1; i <= 5; i++) {
            const rellena = i <= t.puntuacion ? "[font-variation-settings:'FILL'_1]" : "";
            estrellas += `<span class="material-symbols-outlined text-sm ${rellena}">star</span>`;
        }

        return `
            <div class="w-full md:w-[calc(33.33%-1.33rem)] flex-shrink-0 bg-white dark:bg-[#1f1810] p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 relative">
                <span class="material-symbols-outlined absolute top-6 right-6 text-principal/20 text-5xl">format_quote</span>
                <div class="flex items-center gap-4 mb-4">
                    <div class="w-12 h-12 rounded-full bg-principal/10 flex items-center justify-center font-bold text-principal border border-principal/20 uppercase">
                        ${t.nombre[0]}${t.apellidos[0]}
                    </div>
                    <div>
                        <p class="font-bold text-texto-principal dark:text-white">${t.nombre} ${t.apellidos}</p>
                        <div class="flex text-principal text-sm">${estrellas}</div>
                    </div>
                </div>
                <p class="text-texto-secundario dark:text-gray-400 italic relative z-10 text-sm">"${t.texto}"</p>
            </div>`;
    }).join('');
}

/**
 * Gestiona la navegación del carrusel de testimonios.
 */
function vincularNavegacionTestimonios() {
    const btnAtras = document.querySelector('[data-action="slide-testimonios-prev"]');
    const btnSig = document.querySelector('[data-action="slide-testimonios-next"]');

    btnAtras?.addEventListener('click', () => moverTestimonios(-1));
    btnSig?.addEventListener('click', () => moverTestimonios(1));
}

/**
 * Desplaza el carrusel de testimonios en la dirección indicada.
 */
function moverTestimonios(direccion) {
    const contenedor = document.getElementById('contenedor-comentarios');
    const visibles = window.innerWidth >= 768 ? 3 : 1;
    const maximo = Math.max(0, totalTestimonios - visibles);
    
    indiceTestimonioActual += direccion;
    
    if (indiceTestimonioActual < 0) indiceTestimonioActual = maximo;
    if (indiceTestimonioActual > maximo) indiceTestimonioActual = 0;
    
    const desplazamiento = indiceTestimonioActual * (100 / visibles);
    contenedor.style.transform = `translateX(-${desplazamiento}%)`;
}

/**
 * Configura el envío del formulario de testimonios.
 */
function configurarFormularioTestimonio() {
    const formulario = document.getElementById('form-nuevo-comentario');
    if (!formulario) return;

    // Gestión de puntuación visual por estrellas
    const botonesEstrellas = document.querySelectorAll('.star-btn');
    botonesEstrellas.forEach((boton, indice) => {
        boton.addEventListener('click', () => actualizarPuntuacionVisual(indice + 1));
    });

    formulario.addEventListener('submit', async (e) => {
        e.preventDefault();
        const datos = {
            puntuacion: document.getElementById('input-rating').value,
            texto: formulario.querySelector('textarea').value
        };

        try {
            const respuesta = await fetch('/api/comentarios/enviar', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(datos)
            });

            if (respuesta.ok) {
                cerrarModalTestimonio();
                lanzarAlerta({
                    titulo: '¡Mensaje recibido!',
                    mensaje: 'Gracias por compartir tu experiencia. Tu comentario pasará por moderación y aparecerá en la web muy pronto.',
                    icono: 'verified',
                    textoBoton: 'GENIAL'
                });
                formulario.reset();
                actualizarPuntuacionVisual(5);
            } else {
                const error = await respuesta.json();
                throw new Error(error.mensaje || 'No se pudo enviar el mensaje');
            }
        } catch (error) {
            console.error("Error al enviar comentario:", error.message);
            lanzarAlerta({
                titulo: '¡Ups! Algo falló',
                mensaje: error.message,
                icono: 'error',
                textoBoton: 'REINTENTAR'
            });
        }
    });
}

/**
 * Actualiza la representación visual de las estrellas de puntuación.
 */
function actualizarPuntuacionVisual(valor) {
    document.getElementById('input-rating').value = valor;
    const estrellas = document.querySelectorAll('.star-btn .material-symbols-outlined');
    estrellas.forEach((estrella, i) => {
        if (i < valor) {
            estrella.style.fontVariationSettings = "'FILL' 1";
            estrella.classList.add('text-principal');
        } else {
            estrella.style.fontVariationSettings = "'FILL' 0";
            estrella.classList.remove('text-principal');
        }
    });
}
