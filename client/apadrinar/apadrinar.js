/**
 * Gestión del programa de apadrinamiento y visualización de gatos con necesidad de apoyo.
 */

import { obtenerUsuarioSesion } from '../recursos/js/utilidades.js';
import { lanzarAlerta } from '../recursos/js/modales.js';
import { inicializarEstructuraCarrito } from '../recursos/js/carrito.js';

document.addEventListener('DOMContentLoaded', () => {
    inicializarVistaApadrinamiento();
    inicializarEstructuraCarrito();
});

/**
 * Inicializa la carga de datos y vincula los eventos de interacción.
 */
function inicializarVistaApadrinamiento() {
    obtenerGatosNecesitados();
    vincularEventosInteraccion();
}

/**
 * Recupera y muestra los gatos que requieren apadrinamiento urgente o preferente.
 */
async function obtenerGatosNecesitados() {
    const contenedor = document.getElementById('contenedor-gatos-padrinos');
    if (!contenedor) return;

    try {
        const respuesta = await fetch('/api/gatos');
        const gatos = await respuesta.json();
        
        const disponibles = gatos
            .filter(g => ['En Adopción', 'Urgente'].includes(g.estado_adopcion))
            .sort((a, b) => new Date(a.fecha_llegada) - new Date(b.fecha_llegada));

        const seleccionados = disponibles.slice(0, 6);

        if (seleccionados.length === 0) {
            contenedor.innerHTML = '<p class="col-span-full text-center text-gray-400 italic py-10">Actualmente todos nuestros michis están cubiertos. ¡Gracias por tu interés!</p>';
            return;
        }

        contenedor.innerHTML = seleccionados.map(gato => `
            <div class="group rounded-[3rem] bg-white dark:bg-[#1f1b16] overflow-hidden shadow-xl border border-gray-100 dark:border-white/5 flex flex-col hover:-translate-y-2 transition-all duration-500">
                <div class="h-64 overflow-hidden relative bg-gray-50 dark:bg-black/20">
                    <img src="/recursos/imagenes/${gato.imagen_url || 'logo.webp'}" 
                         class="size-full object-cover transition-transform duration-1000 group-hover:scale-110" 
                         onerror="this.src='/recursos/imagenes/logo.webp'">
                    ${gato.estado_adopcion === 'Urgente' ? `
                        <span class="absolute top-4 right-4 bg-red-500 text-white text-[8px] font-black px-3 py-1 rounded-full animate-pulse uppercase tracking-widest">Necesidad Urgente</span>
                    ` : ''}
                </div>
                <div class="p-8 flex flex-col flex-1 gap-4 text-center">
                    <h3 class="text-2xl font-black text-texto-principal dark:text-white uppercase tracking-tighter">${gato.nombre_gato}</h3>
                    <p class="text-sm text-texto-secundario dark:text-gray-400 font-medium leading-relaxed line-clamp-3 italic">"${gato.historia || 'Buscando una madrina o padrino que le cambie la vida...'}"</p>
                    <button data-action="apadrinar-gato" data-nombre="${gato.nombre_gato}" data-imagen="${gato.imagen_url}"
                            class="mt-auto w-full py-4 rounded-2xl border-2 border-principal/30 text-principal font-black text-[10px] uppercase tracking-widest hover:bg-principal hover:text-texto-principal transition-all">
                        APADRINAR A ${gato.nombre_gato}
                    </button>
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error("[Error] al cargar gatos para apadrinar:", error.message);
    }
}

/**
 * Escucha los eventos de clic para las acciones de apadrinamiento y acordeones FAQ.
 */
function vincularEventosInteraccion() {
    document.addEventListener('click', (evento) => {
        const objetivo = evento.target;

        const botonApadrinar = objetivo.closest('[data-action="apadrinar-gato"]');
        if (botonApadrinar) {
            iniciarTramiteApadrinar('Amigo', 10, botonApadrinar.dataset.nombre, botonApadrinar.dataset.imagen);
            return;
        }

        const botonPlan = objetivo.closest('[data-action="elegir-plan"]');
        if (botonPlan) {
            iniciarTramiteApadrinar(botonPlan.dataset.plan, botonPlan.dataset.precio);
            return;
        }

        const botonFaq = objetivo.closest('.pregunta-faq');
        if (botonFaq) {
            gestionarDespliegueFAQ(botonFaq);
            return;
        }
    });
}

/**
 * Valida el acceso del usuario y redirige al formulario de tramitación.
 */
function iniciarTramiteApadrinar(plan, precio, nombreGato = '', imagenGato = '') {
    const usuario = obtenerUsuarioSesion();
    
    if (!usuario) {
        localStorage.setItem('url_retorno', window.location.href);
        lanzarAlerta({
            titulo: '¡Hola, humano!',
            mensaje: 'Para poder convertirte en padrino o madrina de nuestros residentes, primero debes iniciar sesión.',
            icono: 'lock',
            textoBoton: 'IR AL LOGIN',
            alConfirmar: () => window.location.href = '/login/'
        });
        return;
    }

    let rutaDestino = `/apadrinar/formulario.html?plan=${plan.toLowerCase()}&precio=${precio}`;
    if (nombreGato) {
        rutaDestino += `&gato=${encodeURIComponent(nombreGato)}`;
    }
    if (imagenGato) {
        rutaDestino += `&imagen=${encodeURIComponent(imagenGato)}`;
    }
    window.location.href = rutaDestino;
}

/**
 * Gestiona la visibilidad de las respuestas en la sección de preguntas frecuentes.
 */
function gestionarDespliegueFAQ(boton) {
    const contenedorRespuesta = boton.nextElementSibling;
    const elementoIcono = boton.querySelector('.material-symbols-outlined');
    
    document.querySelectorAll('.respuesta-faq').forEach(item => {
        if (item !== contenedorRespuesta) {
            item.style.maxHeight = null;
            const iconoAjenos = item.previousElementSibling.querySelector('.material-symbols-outlined');
            if (iconoAjenos) iconoAjenos.style.transform = 'rotate(0deg)';
        }
    });

    if (contenedorRespuesta.style.maxHeight && contenedorRespuesta.style.maxHeight !== "0px") {
        contenedorRespuesta.style.maxHeight = null;
        if (elementoIcono) elementoIcono.style.transform = 'rotate(0deg)';
    } else {
        contenedorRespuesta.style.maxHeight = contenedorRespuesta.scrollHeight + "px";
        if (elementoIcono) elementoIcono.style.transform = 'rotate(180deg)';
    }
}
