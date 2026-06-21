/**
 * Orquestador principal del panel de miembros y coordinación de módulos privados.
 */

import { obtenerUsuarioSesion } from '../recursos/js/utilidades.js';
import { lanzarAlerta, cerrarModal, abrirModal } from '../recursos/js/modales.js';
import { inicializarEstructuraCarrito } from '../recursos/js/carrito.js';

import * as Reservas from './js/reservas.js';
import * as Pedidos from './js/pedidos.js';
import * as Eventos from './js/eventos.js';
import * as Adopciones from './js/adopciones.js';
import * as Padrinazgos from './js/padrinazgos.js';
import * as Perfil from './js/perfil.js';

const fichaAcceso = localStorage.getItem('token');
const cabecerasSeguras = { 'Authorization': `Bearer ${fichaAcceso}` };

document.addEventListener('DOMContentLoaded', () => {
    prepararPanelMiembro();
    inicializarEstructuraCarrito();
});

/**
 * Valida la existencia de una sesión activa e inicializa los componentes del panel.
 */
function prepararPanelMiembro() {
    if (!fichaAcceso) {
        window.location.href = '/login';
        return;
    }

    document.getElementById('contenedor-miembro')?.classList.remove('opacity-0');

    vincularInteraccionesGlobales();
    configurarEventosFormulario();
    
    cambiarVistaPanel('dashboard');
}

/**
 * Gestiona la navegación entre las diferentes pestañas del área de miembros.
 */
async function cambiarVistaPanel(idSeccion) {
    document.querySelectorAll('.seccion-panel').forEach(seccion => seccion.classList.remove('activa'));
    document.getElementById(`pantalla-${idSeccion}`)?.classList.add('activa');

    document.querySelectorAll('.btn-sidebar').forEach(boton => boton.classList.remove('active'));
    document.getElementById(`btn-${idSeccion}`)?.classList.add('active');

    window.scrollTo({ top: 0, behavior: 'smooth' });

    const gestoresCarga = {
        dashboard: cargarResumenGeneral,
        reservas: Reservas.obtenerReservas,
        pedidos: Pedidos.obtenerPedidos,
        eventos: Eventos.obtenerEventos,
        adopciones: Adopciones.obtenerAdopciones,
        padrinazgos: Padrinazgos.gestionarPadrinazgos,
        perfil: Perfil.recuperarDatosPerfil
    };

    if (gestoresCarga[idSeccion]) gestoresCarga[idSeccion]();
}

/**
 * Obtiene y muestra los indicadores clave y la actividad reciente del usuario.
 */
async function cargarResumenGeneral() {
    try {
        const respuesta = await fetch('/api/usuarios/stats', { headers: cabecerasSeguras });
        const datos = await respuesta.json();
        
        document.getElementById('bienvenida-nombre').innerHTML = `Hola de nuevo, <span class="text-principal">${datos.nombre}</span>`;
        document.getElementById('nivel-nombre').innerText = datos.nivel?.replace('Gold', '').trim();

        const bloqueIncentivo = document.getElementById('contenedor-incentivo-padrino');
        const botonPadrinazgo = document.getElementById('btn-padrinazgos');
        const esPadrino = datos.nivel?.toLowerCase().includes('padrino');

        if (esPadrino) {
            bloqueIncentivo?.classList.add('hidden');
            botonPadrinazgo?.classList.remove('hidden');
        } else {
            bloqueIncentivo?.classList.remove('hidden');
            botonPadrinazgo?.classList.add('hidden');
        }

        if (datos.proximaReserva) {
            const fecha = new Date(datos.proximaReserva.fecha);
            document.getElementById('reserva-fecha').innerText = fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
            document.getElementById('reserva-servicio').innerText = `${datos.proximaReserva.nombre_servicio} • ${datos.proximaReserva.hora_inicio.substring(0,5)}`;
        }
        
        actualizarHistorialActividad();
    } catch (error) { 
        console.error("Error al cargar resumen:", error); 
    }
}

/**
 * Recupera las últimas reservas del usuario para mostrarlas en el tablero principal.
 */
async function actualizarHistorialActividad() {
    const contenedor = document.getElementById('historial-actividad');
    try {
        const respuesta = await fetch('/api/usuarios/reservas', { headers: cabecerasSeguras });
        const reservas = await respuesta.json();
        
        if (reservas.length === 0) {
            contenedor.innerHTML = '<p class="text-[10px] font-bold text-gray-400 text-center py-4">Sin actividad reciente</p>';
            return;
        }

        contenedor.innerHTML = reservas.slice(0, 3).map(reserva => `
            <div class="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100">
                <div class="flex items-center gap-3">
                    <span class="material-symbols-outlined text-gray-300 text-xl">
                        ${reserva.nombre_servicio.includes('Coworking') ? 'laptop_mac' : 'local_cafe'}
                    </span>
                    <p class="text-[11px] font-black text-texto-principal uppercase">${reserva.nombre_servicio}</p>
                </div>
                <span class="text-[9px] font-black px-3 py-1 bg-gray-50 text-gray-500 rounded-lg uppercase">
                    ${reserva.estado_reserva}
                </span>
            </div>`).join('');
    } catch (error) { }
}

/**
 * Centraliza la gestión de los eventos de clic para las acciones generales del panel.
 */
function vincularInteraccionesGlobales() {
    document.addEventListener('click', async (evento) => {
        const elemento = evento.target.closest('[data-action]');
        if (!elemento) return;

        const { action: accion, id, total, nombre } = elemento.dataset;

        switch (accion) {
            case 'nav-panel': cambiarVistaPanel(id); break;
            case 'cerrar-sesion': localStorage.clear(); window.location.href = '/'; break;
            case 'ver-pedido': 
                Pedidos.mostrarDetallePedido(id, total).then(() => mostrarModalEspecifico('modal-detalle-pedido')); 
                break;
            case 'ver-ficha-mich': Padrinazgos.mostrarFichaGato(parseInt(id)); break;
            case 'transferir-ayuda': Padrinazgos.lanzarSeleccionNuevoAhijado(id); break;
            case 'finalizar-ayuda': Padrinazgos.ejecutarArchivado(id); break;
            case 'cancelar-ayuda': Padrinazgos.gestionarBaja(id, nombre); break;
            case 'toggle-recuerdos':
                document.getElementById('lista-recuerdos')?.classList.toggle('hidden');
                elemento.querySelector('.material-symbols-outlined').style.transform = 
                    document.getElementById('lista-recuerdos').classList.contains('hidden') ? 'rotate(0deg)' : 'rotate(180deg)';
                break;
            case 'toggle-seguridad':
                Perfil.gestionarDespliegueSeguridad();
                break;
            case 'close-modal':
                if (elemento.dataset.modalId) cerrarModal(elemento.dataset.modalId);
                else {
                    const modalCercano = elemento.closest('.fixed');
                    if (modalCercano) { 
                        modalCercano.classList.replace('flex', 'hidden'); 
                        document.body.style.overflow = 'auto'; 
                    }
                }
                break;
        }
    });
}

/**
 * Asigna los controladores de envío para los formularios de perfil y seguridad.
 */
function configurarEventosFormulario() {
    document.getElementById('form-perfil')?.addEventListener('submit', Perfil.guardarCambiosPerfil);
    document.getElementById('form-password')?.addEventListener('submit', Perfil.procesarCambioContrasena);
}

/**
 * Cambia el estado de visibilidad de una ventana modal específica.
 */
function mostrarModalEspecifico(id) {
    const modal = document.getElementById(id);
    if (modal) { 
        modal.classList.replace('hidden', 'flex'); 
        document.body.style.overflow = 'hidden'; 
    }
}
