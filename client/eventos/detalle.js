/**
 * Gestión visual del detalle de actividades y proceso de inscripción con pago integrado.
 */

import { validarAccesoUsuario, lanzarAlerta, lanzarPasarelaPago } from '../recursos/js/modales.js';
import { inicializarEstructuraCarrito } from '../recursos/js/carrito.js';

let idEventoGlobal = null;
let tituloEventoGlobal = '';

document.addEventListener('DOMContentLoaded', () => {
    inicializarVistaDetalleEvento();
    inicializarEstructuraCarrito();
});

/**
 * Configura la página extrayendo el identificador de la actividad de la URL.
 */
function inicializarVistaDetalleEvento() {
    const parametros = new URLSearchParams(window.location.search);
    idEventoGlobal = parametros.get('id');

    if (!idEventoGlobal) {
        window.location.href = '/eventos/';
        return;
    }

    recuperarDatosEvento();
    configurarFormularioInscripcion();
}

/**
 * Obtiene la información técnica de la actividad desde el servidor.
 */
async function recuperarDatosEvento() {
    try {
        const respuesta = await fetch(`/api/eventos/${idEventoGlobal}`);
        if (!respuesta.ok) throw new Error('Evento no encontrado');
        
        const evento = await respuesta.json();
        tituloEventoGlobal = evento.titulo;
        dibujarFichaEvento(evento);
    } catch (error) {
        console.error("[Error] al cargar evento:", error.message);
        document.getElementById('evento-titulo').innerText = "Actividad no encontrada";
    }
}

/**
 * Rellena los campos de la interfaz con los datos de la actividad recibida.
 */
function dibujarFichaEvento(e) {
    document.title = `${e.titulo} | Catfeina`;
    document.getElementById('evento-titulo').innerText = e.titulo;
    document.getElementById('evento-categoria').innerText = e.categoria;
    document.getElementById('evento-descripcion').innerText = e.descripcion_larga || e.descripcion;
    
    const fechaObj = new Date(e.fecha);
    document.getElementById('evento-fecha').innerText = fechaObj.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
    document.getElementById('evento-hora').innerText = e.hora ? e.hora.substring(0,5) + ' hrs' : 'A confirmar';
    document.getElementById('evento-ubicacion').innerText = e.ubicacion || 'Catfeina Córdoba';
    
    const precioMonto = parseFloat(e.precio);
    const etiquetaPrecio = document.getElementById('badge-precio-flotante');
    if (etiquetaPrecio) etiquetaPrecio.innerText = precioMonto > 0 ? `${precioMonto.toFixed(2)}€` : 'Gratis';

    const imagenHero = document.getElementById('evento-imagen-hero');
    if (imagenHero) imagenHero.src = `/recursos/imagenes/${e.imagen_url || 'logo.webp'}`;

    if (e.requisitos) {
        const seccionReq = document.getElementById('seccion-requisitos');
        const listaReq = document.getElementById('evento-requisitos');
        if (seccionReq && listaReq) {
            seccionReq.classList.remove('hidden');
            listaReq.innerHTML = e.requisitos.split('.').map(r => r.trim() ? `<p class="mb-2">• ${r}.</p>` : '').join('');
        }
    }
}

/**
 * Configura el escuchador para el envío del formulario de inscripción.
 */
function configurarFormularioInscripcion() {
    const formulario = document.getElementById('form-inscripcion');
    formulario?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const usuario = validarAccesoUsuario(`Para poder reservar tu plaza en "${tituloEventoGlobal}", primero debes iniciar sesión.`);
        if (!usuario) return;

        const datosForm = new FormData(e.target);
        const precioTexto = document.getElementById('badge-precio-flotante').innerText;
        const precioUnitario = parseFloat(precioTexto.replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
        const totalAInscribir = parseInt(datosForm.get('num_personas')) || 1;
        const montoFinal = precioUnitario * totalAInscribir;

        if (montoFinal > 0) {
            lanzarPasarelaPago({
                total: montoFinal,
                concepto: `Entrada: ${tituloEventoGlobal}`,
                alConfirmar: () => ejecutarRegistroInscripcion(datosForm, montoFinal)
            });
        } else {
            ejecutarRegistroInscripcion(datosForm, 0);
        }
    });
}

/**
 * Registra la confirmación de asistencia en la base de datos del servidor.
 */
async function ejecutarRegistroInscripcion(datosForm, total) {
    const boton = document.getElementById('btn-inscribirse');
    boton.disabled = true;
    boton.innerText = 'PROCESANDO...';

    const paqueteDatos = {
        id_evento: idEventoGlobal,
        num_personas: datosForm.get('num_personas'),
        observaciones: datosForm.get('observaciones'),
        total: total,
        estado_pago: total > 0 ? 'Pagado' : 'Gratuito'
    };

    try {
        const respuesta = await fetch('/api/eventos/inscribir', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(paqueteDatos)
        });

        if (respuesta.ok) {
            lanzarAlerta({
                titulo: '¡Inscripción confirmada!',
                mensaje: `Te has apuntado con éxito a "${tituloEventoGlobal}". ¡Nos vemos muy pronto!`,
                icono: 'verified',
                textoBoton: 'MIS EVENTOS',
                alConfirmar: () => window.location.href = '/miembro/'
            });
        } else {
            throw new Error("Fallo en la comunicación con el servidor.");
        }
    } catch (error) {
        lanzarAlerta({ titulo: 'Error', mensaje: error.message, icono: 'error' });
        boton.disabled = false;
        boton.innerText = 'RESERVAR PLAZA';
    }
}
