/**
 * Gestión de la agenda de eventos e inscripciones de asistentes en el panel.
 */
import { interfazApi } from './interfaz-api.js';
import * as UI from './ui.js';
import { Validador, mostrarEstadoValidacion } from '../../recursos/js/utilidades.js';

let listaEventosEnCache = [];
let listaInscripcionesEnCache = [];

/**
 * Obtiene la lista completa de eventos registrados desde el servidor.
 */
export async function cargarEventos() {
    try {
        const eventos = await interfazApi.obtener('/eventos');
        listaEventosEnCache = eventos || [];
        renderizarTablaEventos(listaEventosEnCache);
    } catch (error) {
        UI.mostrarNotificacion('Error', 'No se pudieron cargar los eventos');
    }
}

/**
 * Genera el contenido de la tabla para la gestión administrativa de eventos.
 */
function renderizarTablaEventos(eventos) {
    UI.renderizarTabla('lista-eventos-admin', eventos, evento => `
        <tr class="border-b hover:bg-gray-50/50 transition-colors">
            <td class="p-4">
                <div class="flex items-center gap-3">
                    <img src="/recursos/imagenes/${evento.imagen_url || 'logo.webp'}" 
                         class="size-10 rounded-lg object-cover shadow-sm border border-gray-100" 
                         onerror="this.src='/recursos/imagenes/logo.webp'">
                    <span class="font-bold text-gray-800">${evento.titulo}</span>
                </div>
            </td>
            <td class="p-4 text-sm text-gray-500">${UI.formatearFecha(evento.fecha)}</td>
            <td class="p-4"><span class="px-2 py-1 bg-gray-100 rounded text-xs font-bold uppercase text-gray-600">${evento.categoria}</span></td>
            <td class="p-4 font-black text-gray-700">${parseFloat(evento.precio).toFixed(2)}€</td>
            <td class="p-4 text-right">
                <div class="flex justify-end gap-1">
                    <button data-action="edit" data-type="evento" data-id="${evento.id_evento}" 
                            class="p-2 text-blue-400 hover:bg-blue-50 rounded-lg transition-all" title="Editar">
                        <span class="material-symbols-outlined">edit</span>
                    </button>
                    <button data-action="delete" data-type="evento" data-id="${evento.id_evento}" 
                            class="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-all" title="Eliminar">
                        <span class="material-symbols-outlined">delete</span>
                    </button>
                </div>
            </td>
        </tr>
    `);
}

/**
 * Realiza la subida del archivo de imagen principal del evento.
 */
async function procesarSubidaImagenEvento() {
    const input = document.getElementById('e-archivo-principal');
    if (!input?.files?.length) return null;

    const datosFormulario = new FormData();
    datosFormulario.append('imagenes', input.files[0]);

    const resultado = await interfazApi.subirArchivo('/upload', datosFormulario);
    return resultado.urls[0];
}

/**
 * Procesa el envío del formulario de creación o modificación de un evento.
 */
export async function manejarEnvioEvento(evento) {
    evento.preventDefault();
    const idEvento = document.getElementById('e-id').value;

    const titulo = document.getElementById('e-titulo').value.trim();
    const desc = document.getElementById('e-descripcion').value.trim();
    const fecha = document.getElementById('e-fecha').value;
    const hora = document.getElementById('e-hora').value;
    const precio = document.getElementById('e-precio').value;

    const tituloOk = Validador.esTextoValido(titulo, 5);
    const descOk = Validador.esTextoValido(desc, 10);
    const fechaOk = fecha !== "" && Validador.esFechaFutura(fecha);
    const horaOk = hora !== "";
    const precioOk = !isNaN(precio) && parseFloat(precio) >= 0;

    mostrarEstadoValidacion('e-titulo', tituloOk, 'Título demasiado corto (mín. 5).');
    mostrarEstadoValidacion('e-descripcion', descOk, 'Descripción demasiado corta (mín. 10).');
    mostrarEstadoValidacion('e-fecha', fechaOk, fecha === "" ? 'Fecha obligatoria.' : 'No puedes crear eventos en fechas pasadas.');
    mostrarEstadoValidacion('e-hora', horaOk, 'Hora obligatoria.');
    mostrarEstadoValidacion('e-precio', precioOk, 'Precio no válido.');

    if (!tituloOk || !descOk || !fechaOk || !horaOk || !precioOk) {
        return UI.mostrarNotificacion('Formulario incompleto', 'Por favor, revisa los errores en rojo.', 'error');
    }
    
    try {
        const urlNueva = await procesarSubidaImagenEvento();

        const cuerpoPeticion = {
            titulo: document.getElementById('e-titulo').value,
            descripcion: document.getElementById('e-descripcion').value,
            fecha: document.getElementById('e-fecha').value,
            hora: document.getElementById('e-hora').value,
            ubicacion: document.getElementById('e-ubicacion').value,
            categoria: document.getElementById('e-categoria').value,
            precio: document.getElementById('e-precio').value,
            imagen_url: urlNueva ? urlNueva : document.getElementById('e-imagen').value
        };

        if (idEvento) {
            await interfazApi.actualizar(`/eventos/${idEvento}`, cuerpoPeticion);
        } else {
            await interfazApi.enviar('/eventos', cuerpoPeticion);
        }
        
        UI.cerrarModal('modal-evento');
        await cargarEventos();
        UI.mostrarExito(idEvento ? 'Evento actualizado correctamente' : 'Nuevo evento creado');
    } catch (error) {
        UI.mostrarNotificacion('Error', error.message);
    }
}

/**
 * Carga los datos de un evento seleccionado en los campos del formulario de edición.
 */
export function prepararEdicionEvento(id) {
    const evento = listaEventosEnCache.find(e => e.id_evento == id);
    if (!evento) return;
    
    document.getElementById('modal-evento-titulo').innerText = 'Editar Evento';
    document.getElementById('e-id').value = evento.id_evento;
    document.getElementById('e-titulo').value = evento.titulo;
    document.getElementById('e-descripcion').value = evento.descripcion;
    document.getElementById('e-fecha').value = evento.fecha.split('T')[0];
    document.getElementById('e-hora').value = evento.hora;
    document.getElementById('e-ubicacion').value = evento.ubicacion;
    document.getElementById('e-categoria').value = evento.categoria;
    document.getElementById('e-precio').value = evento.precio;
    
    document.getElementById('e-imagen').value = evento.imagen_url || '';
    document.getElementById('e-prev-principal').src = `/recursos/imagenes/${evento.imagen_url || 'logo.webp'}`;
    document.getElementById('txt-evento-principal-nombre').innerText = evento.imagen_url ? `Archivo: ${evento.imagen_url}` : 'Sin imagen';
    
    UI.abrirModal('modal-evento');
}

/**
 * Limpia y despliega el formulario para el registro de un nuevo evento.
 */
export function abrirModalNuevoEvento() {
    const formulario = document.getElementById('form-evento');
    if (formulario) formulario.reset();

    document.getElementById('e-id').value = '';
    document.getElementById('e-imagen').value = '';
    document.getElementById('e-prev-principal').src = '/recursos/imagenes/logo.webp';
    document.getElementById('txt-evento-principal-nombre').innerText = 'Sin imagen';
    document.getElementById('modal-evento-titulo').innerText = 'Crear Nuevo Evento';
    
    UI.abrirModal('modal-evento');
}

/**
 * Obtiene el listado de inscripciones a eventos desde el servidor.
 */
export async function cargarInscripciones() {
    try {
        const inscripciones = await interfazApi.obtener('/eventos/inscripciones');
        listaInscripcionesEnCache = inscripciones || [];
        renderizarTablaInscripciones(listaInscripcionesEnCache);
    } catch (error) {
        UI.mostrarNotificacion('Error', 'No se pudieron cargar las inscripciones');
    }
}

/**
 * Genera el contenido de la tabla para la supervisión de inscripciones.
 */
function renderizarTablaInscripciones(inscripciones) {
    UI.renderizarTabla('lista-inscripciones-admin', inscripciones, inscripcion => `
        <tr class="border-b hover:bg-gray-50/50">
            <td class="p-4">
                <div class="font-bold text-gray-800">${inscripcion.nombre} ${inscripcion.apellidos}</div>
                <div class="text-xs text-gray-400">${inscripcion.email}</div>
            </td>
            <td class="p-4">
                <div class="font-bold text-gray-700">${inscripcion.evento_titulo}</div>
                <div class="text-[10px] text-gray-400 uppercase font-medium">${UI.formatearFecha(inscripcion.evento_fecha)}</div>
            </td>
            <td class="p-4 text-center font-bold text-gray-600">${inscripcion.num_personas}</td>
            <td class="p-4">
                <span class="px-3 py-1 rounded-full text-[10px] font-black uppercase ${inscripcion.estado_pago === 'Pagado' ? 'bg-green-50 text-green-600' : 'bg-yellow-50 text-yellow-600'}">
                    ${inscripcion.estado_pago}
                </span>
            </td>
            <td class="p-4 text-right">
                <button data-action="edit" data-type="inscripcion" data-id="${inscripcion.id_inscripcion}" 
                        class="p-2 text-primary hover:bg-primary/5 rounded-lg transition-all" title="Gestionar Pago">
                    <span class="material-symbols-outlined text-xl">edit</span>
                </button>
            </td>
        </tr>
    `);
}

/**
 * Carga los datos de una inscripción en el formulario de gestión de pagos y asistentes.
 */
export function prepararEdicionInscripcion(id) {
    const inscripcion = listaInscripcionesEnCache.find(i => i.id_inscripcion == id);
    if (!inscripcion) return;
    
    document.getElementById('i-id').value = inscripcion.id_inscripcion;
    document.getElementById('i-pago').value = inscripcion.estado_pago;
    document.getElementById('i-personas').value = inscripcion.num_personas;
    document.getElementById('i-observaciones').value = inscripcion.observaciones || '';
    
    UI.abrirModal('modal-inscripcion');
}

/**
 * Procesa la actualización de los datos de una inscripción de evento.
 */
export async function manejarEnvioInscripcion(evento) {
    evento.preventDefault();
    const idInscripcion = document.getElementById('i-id').value;
    
    const cuerpoPeticion = {
        estado_pago: document.getElementById('i-pago').value,
        num_personas: document.getElementById('i-personas').value,
        observaciones: document.getElementById('i-observaciones').value
    };

    try {
        await interfazApi.actualizar(`/eventos/inscripciones/${idInscripcion}`, cuerpoPeticion);
        UI.cerrarModal('modal-inscripcion');
        await cargarInscripciones();
        UI.mostrarExito('Inscripción actualizada correctamente');
    } catch (error) {
        UI.mostrarNotificacion('Error', error.message);
    }
}
