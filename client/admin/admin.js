/**
 * Orquestador del panel de administración.
 */

import { interfazApi } from './js/interfaz-api.js';
import * as UI from './js/ui.js';

// Importación de módulos funcionales
import * as Gatos from './js/gatos.js';
import * as Tienda from './js/tienda.js';
import * as Usuarios from './js/usuarios.js';
import * as Adopciones from './js/adopciones.js';
import * as Padrinazgos from './js/padrinazgos.js';
import * as Eventos from './js/eventos.js';
import * as Reservas from './js/reservas.js';
import * as Pedidos from './js/pedidos.js';
import * as Comentarios from './js/comentarios.js';

/**
 * Configuración de carga y gestión por sección del panel.
 */
const CONFIGURACION_SECCIONES = {
    dashboard: { cargar: cargarEstadisticas },
    gatos: { cargar: Gatos.cargarGatos, idFormulario: 'form-gato', manejador: Gatos.manejarEnvioGato },
    tienda: { cargar: Tienda.cargarProductos, idFormulario: 'form-producto', manejador: Tienda.manejarEnvioProducto },
    usuarios: { cargar: Usuarios.cargarUsuarios, idFormulario: 'form-usuario', manejador: Usuarios.manejarEnvioUsuario },
    adopciones: { cargar: Adopciones.cargarAdopciones, idFormulario: 'form-gestion-adopcion', manejador: Adopciones.manejarEnvioAdopcion },
    padrinazgos: { cargar: Padrinazgos.cargarPadrinazgos, idFormulario: 'form-padrinazgo', manejador: Padrinazgos.manejarEnvioPadrinazgo },
    eventos: { cargar: Eventos.cargarEventos, idFormulario: 'form-evento', manejador: Eventos.manejarEnvioEvento },
    inscripciones: { cargar: Eventos.cargarInscripciones, idFormulario: 'form-inscripcion', manejador: Eventos.manejarEnvioInscripcion },
    reservas: { cargar: Reservas.cargarReservas, idFormulario: 'form-reserva', manejador: Reservas.manejarEnvioReserva },
    pedidos: { cargar: Pedidos.cargarPedidos, idFormulario: 'form-pedido-edit', manejador: Pedidos.manejarEnvioPedido },
    comentarios: { cargar: Comentarios.cargarComentarios }
};

const datosUsuario = JSON.parse(localStorage.getItem('usuario'));
const esPerfilEmpleado = datosUsuario?.rol === 2;

/**
 * Inicialización de componentes tras la carga del DOM.
 */
document.addEventListener('DOMContentLoaded', () => {
    configurarSeguridadAcceso();
    inicializarMenuNavegacion();
    inicializarFormulariosAdmin();
    inicializarAccionesGlobales();
    inicializarFiltrosBusqueda();
    
    // Establece el dashboard como vista inicial
    cambiarSeccion('dashboard');
});

/**
 * Restringe el acceso visual a secciones según el rol del usuario.
 */
function configurarSeguridadAcceso() {
    if (esPerfilEmpleado) {
        const seccionesProhibidas = ['tienda', 'comentarios', 'usuarios'];
        seccionesProhibidas.forEach(id => {
            document.querySelector(`[data-section="${id}"]`)?.remove();
            document.getElementById(`card-stats-${id}`)?.remove();
        });
    }
}

/**
 * Gestiona la navegación entre las pestañas del panel lateral.
 */
function inicializarMenuNavegacion() {
    const sidebar = document.querySelector('aside nav');
    sidebar?.addEventListener('click', (evento) => {
        const boton = evento.target.closest('[data-section]');
        if (boton) {
            cambiarSeccion(boton.dataset.section);
        }
    });
}

/**
 * Activa la sección seleccionada y dispara la carga de sus datos.
 */
function cambiarSeccion(idSeccion) {
    if (esPerfilEmpleado && ['usuarios', 'comentarios'].includes(idSeccion)) return;

    // Actualiza el estado visual de la interfaz
    document.querySelectorAll('.section-content').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));

    const seccionObjetivo = document.getElementById(`section-${idSeccion}`);
    const enlaceObjetivo = document.querySelector(`[data-section="${idSeccion}"]`);

    if (seccionObjetivo) seccionObjetivo.classList.add('active');
    if (enlaceObjetivo) enlaceObjetivo.classList.add('active');

    // Carga los datos de la sección
    const config = CONFIGURACION_SECCIONES[idSeccion];
    if (config?.cargar) {
        config.cargar();
    }
}

/**
 * Vincula cada formulario con su respectivo controlador de envío.
 */
function inicializarFormulariosAdmin() {
    Object.values(CONFIGURACION_SECCIONES).forEach(config => {
        if (config.idFormulario && config.manejador) {
            const formulario = document.getElementById(config.idFormulario);
            formulario?.addEventListener('submit', config.manejador);
        }
    });
}

/**
 * Gestiona los eventos de clic para las acciones generales del panel.
 */
function inicializarAccionesGlobales() {
    document.addEventListener('click', async (evento) => {
        const objetivo = evento.target.closest('[data-action]');
        if (!objetivo) return;

        const { action: accion, id, type: tipo, estado, total } = objetivo.dataset;

        switch (accion) {
            case 'delete':
                ejecutarConfirmacionYEliminacion(tipo, id);
                break;
            case 'edit':
                lanzarEdicionEntidad(tipo, id);
                break;
            case 'create':
                lanzarCreacionEntidad(tipo);
                break;
            case 'view':
                if (tipo === 'pedido') Pedidos.verDetallePedido(id, total);
                break;
            case 'moderate':
                if (tipo === 'comentario') Comentarios.moderarComentario(id, estado);
                break;
            case 'logout':
                localStorage.clear();
                window.location.href = '/';
                break;
            case 'close-modal':
                UI.cerrarModal(objetivo.dataset.modalId);
                break;
        }
    });
}

/**
 * Vincula los filtros de búsqueda a sus respectivos módulos.
 */
function inicializarFiltrosBusqueda() {
    const filtroGatoEstado = document.getElementById('filtro-gato-estado');
    const filtroGatoNombre = document.getElementById('filtro-gato-nombre');
    filtroGatoEstado?.addEventListener('change', Gatos.aplicarFiltrosGatos);
    filtroGatoNombre?.addEventListener('input', Gatos.aplicarFiltrosGatos);

    const filtroAdopcionEstado = document.getElementById('filtro-adopcion-estado');
    const filtroAdopcionGato = document.getElementById('filtro-adopcion-gato');
    filtroAdopcionEstado?.addEventListener('change', Adopciones.aplicarFiltrosAdopciones);
    filtroAdopcionGato?.addEventListener('input', Adopciones.aplicarFiltrosAdopciones);

    const filtroPadrinazgoGato = document.getElementById('filtro-padrinazgo-gato');
    filtroPadrinazgoGato?.addEventListener('input', Padrinazgos.aplicarFiltroPadrinazgos);
}

/**
 * Gestiona el proceso de eliminación con confirmación de usuario.
 */
async function ejecutarConfirmacionYEliminacion(entidad, id) {
    const rutasBorrado = {
        gato: { ruta: `/gatos/${id}`, refrescar: Gatos.cargarGatos },
        producto: { ruta: `/productos/${id}`, refrescar: Tienda.cargarProductos },
        evento: { ruta: `/eventos/${id}`, refrescar: Eventos.cargarEventos },
        padrinazgo: { ruta: `/padrinazgos/${id}`, refrescar: Padrinazgos.cargarPadrinazgos }
    };

    const configuracion = rutasBorrado[entidad];
    if (!configuracion) return;

    UI.confirmarAccion(
        '¿Confirmar Eliminación?',
        `Vas a borrar un registro de ${entidad}. Esta acción no se puede deshacer.`,
        'SÍ, ELIMINAR',
        async () => {
            try {
                await interfazApi.eliminar(configuracion.ruta);
                configuracion.refrescar();
                cargarEstadisticas();
                UI.mostrarBorrado(entidad);
            } catch (error) {
                UI.mostrarNotificacion('Error', 'No se ha podido eliminar el registro');
            }
        }
    );
}

/**
 * Abre el formulario de edición para la entidad seleccionada.
 */
function lanzarEdicionEntidad(entidad, id) {
    const editores = {
        gato: Gatos.prepararEdicionGato,
        producto: Tienda.prepararEdicionProducto,
        usuario: Usuarios.prepararEdicionUsuario,
        adopcion: Adopciones.prepararGestionAdopcion,
        padrinazgo: Padrinazgos.prepararEdicionPadrinazgo,
        evento: Eventos.prepararEdicionEvento,
        inscripcion: Eventos.prepararEdicionInscripcion,
        reserva: Reservas.prepararEdicionReserva,
        pedido: Pedidos.prepararEdicionPedido
    };
    if (editores[entidad]) editores[entidad](id);
}

/**
 * Abre el formulario de creación para la entidad seleccionada.
 */
function lanzarCreacionEntidad(entidad) {
    const creadores = {
        gato: Gatos.abrirModalNuevoGato,
        producto: Tienda.abrirModalNuevoProducto,
        evento: Eventos.abrirModalNuevoEvento
    };
    if (creadores[entidad]) creadores[entidad]();
}

/**
 * Obtiene y muestra las estadísticas globales del panel.
 */
async function cargarEstadisticas() {
    try {
        const datos = await interfazApi.obtener('/stats');
        
        const mapeoIDs = {
            'stat-gatos': datos.gatos,
            'stat-adopciones': datos.adopciones,
            'stat-productos': datos.productos,
            'stat-eventos': datos.eventos,
            'stat-usuarios': datos.usuarios,
            'stat-comentarios': datos.comentarios,
            'stat-solicitudes': datos.solicitudes,
            'stat-reservas': datos.reservas,
            'stat-pedidos': datos.pedidos,
            'stat-padrinazgos': datos.padrinazgos,
            'stat-inscripciones': datos.inscripciones,
            'stat-buscando': datos.buscando,
            'stat-urgentes': datos.urgentes
        };

        Object.entries(mapeoIDs).forEach(([id, valor]) => {
            const el = document.getElementById(id);
            if (el) el.innerText = valor ?? 0;
        });

        const msgBienvenida = document.getElementById('welcome-msg');
        if (msgBienvenida) {
            msgBienvenida.innerText = esPerfilEmpleado 
                ? `Hola, ${datos.admin.nombre} (Empleado)` 
                : `Bienvenido/a, ${datos.admin.nombre}`;
        }

        // Actualiza la representación gráfica de estados
        if (datos.distribucion_gatos) {
            Gatos.actualizarGraficaEstados(datos.distribucion_gatos);
        }
    } catch (error) {
        console.error("Error al cargar estadísticas:", error.message);
    }
}
