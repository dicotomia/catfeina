/**
 * Gestión de suscripciones de apadrinamiento, transferencias y visualización de impacto para miembros.
 */

import { obtenerEtiquetaEstado, formatearFechaElegante } from './ui-miembro.js';
import { lanzarAlerta } from '../../recursos/js/modales.js';

const fichaAcceso = localStorage.getItem('token');
const cabecerasApi = { 
    'Authorization': `Bearer ${fichaAcceso}`, 
    'Content-Type': 'application/json' 
};

let idPadrinazgoOrigen = null;
let historialPadrinazgos = [];

/**
 * Coordina la carga de datos y el renderizado de la sección de apadrinamientos.
 */
export async function gestionarPadrinazgos() {
    const contenedorActivos = document.getElementById('contenedor-padrinazgos');
    const etiquetaTotal = document.getElementById('stat-padrinos-total');
    if (!contenedorActivos) return;

    try {
        const respuesta = await fetch('/api/usuarios/padrinazgos', { headers: cabecerasApi });
        const padrinazgos = await respuesta.json();
        historialPadrinazgos = padrinazgos;

        if (etiquetaTotal) {
            const vidasSalvadas = [...new Set(padrinazgos.map(p => p.id_gato))].length;
            etiquetaTotal.innerText = vidasSalvadas;
        }

        const activos = padrinazgos.filter(p => !p.archivado);
        const recuerdos = padrinazgos.filter(p => p.archivado);

        renderizarPadrinazgosActivos(activos, contenedorActivos);
        renderizarListaRecuerdos(recuerdos);

    } catch (error) {
        console.error("Error en gestión de padrinazgos:", error);
    }
}

/**
 * Genera el HTML para los apadrinamientos activos del usuario.
 */
function renderizarPadrinazgosActivos(activos, contenedor) {
    if (activos.length === 0) {
        contenedor.innerHTML = `
            <div class="col-span-full py-20 text-center text-gray-400 font-bold uppercase text-xs italic">
                Aún no apadrinas a ningún michi
            </div>`;
        return;
    }

    const fechaHoy = new Date();
    fechaHoy.setHours(0, 0, 0, 0);

    contenedor.innerHTML = activos.map(padrinazgo => {
        const finSuscripcion = padrinazgo.fecha_fin ? new Date(padrinazgo.fecha_fin) : null;
        const estaFinalizado = finSuscripcion !== null && finSuscripcion < fechaHoy;
        const estaEnPreaviso = finSuscripcion !== null && finSuscripcion >= fechaHoy;
        const esAdoptado = (padrinazgo.estado_adopcion === 'Adoptado') && !estaFinalizado;
        const yaTransferido = padrinazgo.transferido_a !== null;
        
        let textoEstado = `Suscripción Activa`;
        let estiloTarjeta = "bg-white";

        if (estaFinalizado) {
            textoEstado = `Ayuda Finalizada`;
            estiloTarjeta = "bg-gray-50 opacity-70";
        } else if (estaEnPreaviso) {
            textoEstado = `Activo hasta ${finSuscripcion.toLocaleDateString()}`;
        } else if (esAdoptado) {
            textoEstado = `¡ADOPTADO!`;
            estiloTarjeta = "bg-green-50/30 border-green-200";
        }

        let htmlAcciones = "";
        if (esAdoptado && !yaTransferido) {
            htmlAcciones = `
                <button data-action="transferir-ayuda" data-id="${padrinazgo.id_padrinazgo}" 
                        class="bg-principal text-texto-principal px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest hover:scale-105 shadow-lg shadow-principal/20 flex items-center gap-2">
                    AYUDAR A OTRO <span class="material-symbols-outlined text-xs">arrow_forward</span>
                </button>`;
        } else if (estaFinalizado || estaEnPreaviso || esAdoptado) {
            htmlAcciones = `
                <button data-action="finalizar-ayuda" data-id="${padrinazgo.id_padrinazgo}"
                        class="text-[9px] font-black text-gray-400 hover:text-green-600 uppercase tracking-widest transition-colors flex items-center gap-1">
                    <span class="material-symbols-outlined text-xs">auto_stories</span> Archivar
                </button>`;
        } else {
            htmlAcciones = `
                <button data-action="cancelar-ayuda" data-id="${padrinazgo.id_padrinazgo}" data-nombre="${padrinazgo.nombre_gato}"
                        class="text-[9px] font-black text-red-400 hover:text-red-600 uppercase tracking-widest flex items-center transition-colors">
                    Cancelar ayuda
                </button>`;
        }

        return `
            <div class="flex flex-col ${estiloTarjeta} border rounded-[3rem] overflow-hidden hover:shadow-2xl transition-all duration-500 group">
                <div class="flex h-40 cursor-pointer" data-action="ver-ficha-mich" data-id="${padrinazgo.id_gato}">
                    <div class="w-40 overflow-hidden bg-gray-50 shadow-inner">
                        <img src="/recursos/imagenes/${padrinazgo.imagen_url}" 
                             class="size-full object-cover group-hover:scale-110 transition-all duration-1000" 
                             onerror="this.src='/recursos/imagenes/logo.webp'">
                    </div>
                    <div class="p-8 flex-1 flex flex-col justify-center">
                        <div class="mb-2">
                            <span class="px-3 py-1 rounded-lg bg-principal/10 text-principal text-[8px] font-black uppercase tracking-widest">
                                ${textoEstado}
                            </span>
                        </div>
                        <h4 class="text-3xl font-black tracking-tighter uppercase text-texto-principal leading-none mb-2">
                            ${padrinazgo.nombre_gato}
                        </h4>
                        <div class="flex items-center gap-1 text-[9px] font-bold text-gray-400 uppercase mt-2 group-hover:text-principal transition-colors">
                            Ver ficha completa <span class="material-symbols-outlined text-xs">arrow_forward</span>
                        </div>
                    </div>
                </div>
                <div class="px-8 py-5 bg-gray-50/50 border-t border-gray-100 flex justify-between items-center relative overflow-hidden">
                    <div class="flex flex-col">
                        <span class="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Aportación</span>
                        <span class="text-xl font-black text-texto-principal tracking-tighter">
                            ${parseFloat(padrinazgo.aportacion_mensual).toFixed(2)}€<span class="text-[10px] opacity-40">/mes</span>
                        </span>
                    </div>
                    ${htmlAcciones}
                </div>
            </div>`;
    }).join('');
}

/**
 * Renderiza la lista de gatos cuya vida ha sido apoyada anteriormente por el usuario.
 */
function renderizarListaRecuerdos(recuerdos) {
    const seccionRecuerdos = document.getElementById('seccion-recuerdos');
    const contenedorLista = document.getElementById('lista-recuerdos');
    if (!contenedorLista) return;

    if (recuerdos.length > 0) {
        seccionRecuerdos?.classList.remove('hidden');
        contenedorLista.innerHTML = recuerdos.map(recuerdo => `
            <div class="bg-white border border-gray-100 p-5 rounded-[2.5rem] flex items-center gap-5 opacity-80 grayscale hover:grayscale-0 hover:opacity-100 transition-all cursor-pointer shadow-sm hover:shadow-lg"
                 data-action="ver-ficha-mich" data-id="${recuerdo.id_gato}">
                <img src="/recursos/imagenes/${recuerdo.imagen_url}" 
                     class="size-16 rounded-[1.5rem] object-cover shadow-sm border-2 border-white" 
                     onerror="this.src='/recursos/imagenes/logo.webp'">
                <div>
                    <h4 class="text-sm font-black uppercase tracking-tighter text-texto-principal">
                        ${recuerdo.nombre_gato}
                    </h4>
                    <p class="text-[9px] font-black text-green-600 uppercase tracking-widest mt-0.5 flex items-center gap-1">
                        Vida salvada <span class="material-symbols-outlined text-[10px]">auto_awesome</span>
                    </p>
                </div>
            </div>`).join('');
    }
}

/**
 * Abre el modal para seleccionar un nuevo gato al transferir una ayuda.
 */
export async function lanzarSeleccionNuevoAhijado(idOriginal) {
    idPadrinazgoOrigen = idOriginal;
    const contenedor = document.getElementById('lista-gatos-disponibles');
    if (!contenedor) return;

    contenedor.innerHTML = `
        <div class="col-span-full py-10 text-center">
            <div class="w-8 h-8 border-4 border-principal border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p class="text-[10px] font-black uppercase text-gray-400">Buscando residentes...</p>
        </div>`;
    
    document.getElementById('modal-seleccion-ahijado')?.classList.replace('hidden', 'flex');

    try {
        const respuesta = await fetch('/api/gatos');
        const gatos = await respuesta.json();
        const idsApadrinados = historialPadrinazgos.map(p => p.id_gato);
        const disponibles = gatos.filter(g => 
            ['En Adopción', 'Urgente'].includes(g.estado_adopcion) && !idsApadrinados.includes(g.id_gato)
        );
        
        if (disponibles.length === 0) { 
            contenedor.innerHTML = `
                <p class="col-span-full text-center text-gray-400 italic py-10 px-6">
                    Todos los gatos están cubiertos. ¡Gracias!
                </p>`; 
            return; 
        }

        contenedor.innerHTML = disponibles.map(gato => `
            <button data-action="confirmar-traspaso" data-nombre="${gato.nombre_gato}"
                    class="group flex flex-col items-center gap-4 p-6 rounded-[2.5rem] hover:bg-principal/10 transition-all border border-transparent hover:border-principal/20">
                <div class="size-24 rounded-[2rem] overflow-hidden shadow-xl group-hover:scale-110 transition-transform border-2 border-white">
                    <img src="/recursos/imagenes/${gato.imagen_url || 'logo.webp'}" 
                         class="size-full object-cover" 
                         onerror="this.src='/recursos/imagenes/logo.webp'">
                </div>
                <span class="text-[11px] font-black uppercase tracking-widest text-texto-principal">
                    ${gato.nombre_gato}
                </span>
            </button>`).join('');

        contenedor.querySelectorAll('[data-action="confirmar-traspaso"]').forEach(boton => {
            boton.onclick = () => procesarTraspasoApoyo(boton.dataset.nombre);
        });
    } catch (error) { 
        console.error("Error al buscar gatos disponibles:", error); 
    }
}

/**
 * Tramita la transferencia de la colaboración mensual hacia un nuevo gato.
 */
async function procesarTraspasoApoyo(nombreGato) {
    lanzarAlerta({
        titulo: `¿Apoyar a ${nombreGato}?`,
        mensaje: `Transferiremos tu colaboración mensual para ayudar a este nuevo residente.`,
        icono: 'volunteer_activism', 
        confirmar: true, 
        textoBoton: 'SÍ, TRANSFERIR',
        alConfirmar: async () => {
            try {
                const respuesta = await fetch('/api/usuarios/padrinazgos/transferir', { 
                    method: 'POST', 
                    headers: cabecerasApi, 
                    body: JSON.stringify({ 
                        id_padrinazgo_origen: idPadrinazgoOrigen, 
                        nombre_nuevo_gato: nombreGato 
                    }) 
                });
                if (respuesta.ok) { 
                    document.getElementById('modal-seleccion-ahijado')?.classList.replace('flex', 'hidden');
                    lanzarAlerta({ 
                        titulo: '¡Transferido!', 
                        mensaje: `Ahora eres el padrino de ${nombreGato}.`, 
                        icono: 'verified', 
                        alConfirmar: gestionarPadrinazgos 
                    }); 
                }
            } catch (error) { 
                console.error("Error al transferir apoyo:", error); 
            }
        }
    });
}

/**
 * Marca una ayuda finalizada como archivada en el historial del usuario.
 */
export async function ejecutarArchivado(idPadrinazgo) {
    try {
        const respuesta = await fetch(`/api/usuarios/padrinazgos/${idPadrinazgo}/archivar`, { 
            method: 'PUT', 
            headers: cabecerasApi 
        });
        if (respuesta.ok) {
            lanzarAlerta({ 
                titulo: '¡Archivado!', 
                mensaje: 'Guardado en tu historial de vidas salvadas.', 
                icono: 'auto_stories', 
                alConfirmar: gestionarPadrinazgos 
            });
        }
    } catch (error) { 
        console.error("Error al archivar:", error); 
    }
}

/**
 * Gestiona la solicitud de baja voluntaria de un apadrinamiento activo.
 */
export function gestionarBaja(idPadrinazgo, nombreGato) {
    lanzarAlerta({
        titulo: '¿Dejar de apadrinar?',
        mensaje: `Tu ayuda es vital para ${nombreGato}. Seguirá activo hasta fin de mes.`,
        icono: 'warning', 
        confirmar: true, 
        textoBoton: 'SÍ, CANCELAR',
        alConfirmar: async () => {
            try {
                const respuesta = await fetch(`/api/usuarios/padrinazgos/${idPadrinazgo}/cancelar`, { 
                    method: 'PUT', 
                    headers: cabecerasApi 
                });
                const datos = await respuesta.json();
                if (respuesta.ok) {
                    if (datos.nuevoIdRol) { 
                        const cacheUser = JSON.parse(localStorage.getItem('usuario')); 
                        cacheUser.rol = datos.nuevoIdRol; 
                        localStorage.setItem('usuario', JSON.stringify(cacheUser)); 
                    }
                    lanzarAlerta({ 
                        titulo: 'Cancelado', 
                        mensaje: datos.mensaje, 
                        icono: 'check_circle', 
                        alConfirmar: gestionarPadrinazgos 
                    });
                }
            } catch (error) { 
                console.error("Error al cancelar apadrinamiento:", error); 
            }
        }
    });
}

/**
 * Despliega la ficha técnica y la historia de un gato en una ventana modal.
 */
export function mostrarFichaGato(idGato) {
    const gato = historialPadrinazgos.find(g => g.id_gato === idGato);
    if (!gato) return;

    document.getElementById('contenido-modal-gato').innerHTML = `
        <div class="flex flex-col md:flex-row">
            <img src="/recursos/imagenes/${gato.imagen_url}" class="w-full md:w-5/12 h-64 md:h-auto object-cover">
            <div class="p-12 flex-1">
                <div class="flex justify-between items-start mb-8">
                    <div>
                        <h3 class="text-5xl font-black uppercase tracking-tighter text-texto-principal leading-none mb-2">
                            ${gato.nombre_gato}
                        </h3>
                        <p class="text-sm font-black text-principal uppercase tracking-[0.2em]">${gato.raza}</p>
                    </div>
                    <button data-action="close-modal" data-modal-id="modal-gato" class="text-gray-300 hover:text-texto-principal transition-colors">
                        <span class="material-symbols-outlined text-3xl pointer-events-none">close</span>
                    </button>
                </div>
                <div class="space-y-8">
                    <div class="p-5 bg-green-50 rounded-[2rem] border border-green-100 flex items-center gap-4">
                        <div class="size-12 rounded-2xl bg-white flex items-center justify-center text-green-500 shadow-sm">
                            <span class="material-symbols-outlined">health_and_safety</span>
                        </div>
                        <div>
                            <p class="text-[9px] font-black text-green-600 uppercase tracking-widest">Salud y Cuidados</p>
                            <p class="text-sm font-bold text-green-800 uppercase tracking-tight">${gato.salud || 'Fuerte y sano'}</p>
                        </div>
                    </div>
                    <div class="text-base text-texto-secundario italic leading-relaxed font-medium">
                        "${gato.historia.substring(0, 250)}..."
                    </div>
                </div>
                <button data-action="close-modal" data-modal-id="modal-gato" 
                        class="mt-12 w-full py-5 bg-principal text-texto-principal font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-xl hover:scale-[1.02] transition-all">
                    Cerrar Ficha
                </button>
            </div>
        </div>`;
    document.getElementById('modal-gato')?.classList.replace('hidden', 'flex');
    document.body.style.overflow = 'hidden';
}
