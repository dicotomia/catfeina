/**
 * Gestión de solicitudes de adopción, validación de datos y generación de cuestionario PDF.
 */

import { obtenerUsuarioSesion, Validador, mostrarEstadoValidacion } from '../recursos/js/utilidades.js';
import { lanzarAlerta } from '../recursos/js/modales.js';

const { jsPDF } = window.jspdf;

document.addEventListener('DOMContentLoaded', () => {
    inicializarFormularioAdopcion();
    vincularValidacionEnVivo();
});

/**
 * Inicializa el formulario de adopción verificando la sesión y los parámetros de la URL.
 */
function inicializarFormularioAdopcion() {
    const datosUsuario = obtenerUsuarioSesion();
    
    if (!datosUsuario) {
        localStorage.setItem('url_retorno', window.location.href);
        lanzarAlerta({
            titulo: 'Acceso Restringido',
            mensaje: 'Para poder tramitar una solicitud de adopción, necesitamos saber quién eres. Por favor, inicia sesión.',
            icono: 'lock',
            textoBoton: 'IR AL LOGIN',
            alConfirmar: () => window.location.href = '/login/'
        });
        return;
    }

    document.getElementById('contenedor-adopcion')?.classList.remove('opacity-0');

    const parametros = new URLSearchParams(window.location.search);
    const idGato = parametros.get('id');
    const nombreGato = parametros.get('nombre');

    if (!idGato) {
        window.location.href = '/gatos/';
        return;
    }

    document.getElementById('f-nombre').value = datosUsuario.nombre || '';
    document.getElementById('f-apellidos').value = datosUsuario.apellidos || '';
    document.getElementById('f-email').value = datosUsuario.email || '';
    document.getElementById('f-telefono').value = datosUsuario.telefono || '';

    const formulario = document.getElementById('form-adopcion-completo');
    formulario?.addEventListener('submit', (e) => manejarEnvioSolicitud(e, idGato, nombreGato, datosUsuario));
}

/**
 * Vincula la validación en tiempo real para los campos de datos personales.
 */
function vincularValidacionEnVivo() {
    const reglas = [
        { id: 'f-nombre', msg: 'Introduce solo letras.', validar: (v) => Validador.esSoloLetras(v) },
        { id: 'f-provincia', msg: 'Provincia no válida (solo letras).', validar: (v) => Validador.esSoloLetras(v) },
        { id: 'f-localidad', msg: 'Localidad no válida (solo letras).', validar: (v) => Validador.esSoloLetras(v) },
        { id: 'f-cp', msg: 'Código postal no válido (5 números).', validar: (v) => Validador.esCodigoPostalValido(v) },
        { id: 'f-email', msg: 'Email no válido.', validar: (v) => Validador.esCorreoValido(v) },
        { id: 'f-telefono', msg: 'Teléfono introducido incorrecto.', validar: (v) => Validador.esTelefonoValido(v) },
        { id: 'f-nacimiento', msg: 'Fecha de nacimiento no válida.', validar: (v) => Validador.esFechaPasada(v) }
    ];

    reglas.forEach(regla => {
        const input = document.getElementById(regla.id);
        input?.addEventListener('input', (e) => {
            const esValido = regla.validar(e.target.value);
            if (input.classList.contains('campo-invalido') && esValido) {
                mostrarEstadoValidacion(regla.id, true, regla.msg);
            }
        });
    });
}

/**
 * Procesa la captura de datos, genera el documento PDF y realiza el envío al servidor.
 */
async function manejarEnvioSolicitud(evento, idGato, nombreGato, usuario) {
    evento.preventDefault();

    const campos = [
        { id: 'f-nombre', msg: 'Introduce solo letras.', val: () => Validador.esSoloLetras(document.getElementById('f-nombre').value) },
        { id: 'f-provincia', msg: 'Provincia no válida (solo letras).', val: () => Validador.esSoloLetras(document.getElementById('f-provincia').value) },
        { id: 'f-localidad', msg: 'Localidad no válida (solo letras).', val: () => Validador.esSoloLetras(document.getElementById('f-localidad').value) },
        { id: 'f-cp', msg: 'Código postal no válido (5 números).', val: () => Validador.esCodigoPostalValido(document.getElementById('f-cp').value) },
        { id: 'f-email', msg: 'Email no válido.', val: () => Validador.esCorreoValido(document.getElementById('f-email').value) },
        { id: 'f-telefono', msg: 'Teléfono introducido incorrecto.', val: () => Validador.esTelefonoValido(document.getElementById('f-telefono').value) },
        { id: 'f-nacimiento', msg: 'Fecha de nacimiento no válida.', val: () => Validador.esFechaPasada(document.getElementById('f-nacimiento').value) }
    ];

    let primerErrorId = null;
    let esFormularioValido = true;

    campos.forEach(campo => {
        const ok = campo.val();
        mostrarEstadoValidacion(campo.id, ok, campo.msg);
        if (!ok) {
            esFormularioValido = false;
            if (!primerErrorId) primerErrorId = campo.id;
        }
    });

    if (!esFormularioValido) {
        const elError = document.getElementById(primerErrorId);
        if (elError) {
            elError.scrollIntoView({ behavior: 'smooth', block: 'center' });
            elError.focus();
        }
        return;
    }

    const botonEnviar = document.getElementById('btn-enviar');
    
    botonEnviar.disabled = true;
    botonEnviar.innerHTML = '<span class="material-symbols-outlined animate-spin text-sm">progress_activity</span> PROCESANDO SOLICITUD...';

    try {
        const archivoPdfBlob = generarDocumentoAdopcion(evento.target, nombreGato, idGato);

        const paqueteEnvio = new FormData();
        paqueteEnvio.append('id_usuario', usuario.id || usuario.id_usuario);
        paqueteEnvio.append('id_gato', idGato);
        paqueteEnvio.append('pdf', archivoPdfBlob, `solicitud_adopcion_${idGato}.pdf`);

        const respuesta = await fetch('/api/usuarios/adoptar-pdf', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
            body: paqueteEnvio
        });

        if (!respuesta.ok) {
            const errorServidor = await respuesta.json();
            throw new Error(errorServidor.mensaje || "Fallo en el servidor al registrar la solicitud");
        }

        lanzarAlerta({
            titulo: '¡Solicitud recibida!',
            mensaje: 'Tu cuestionario de adopción ha sido registrado correctamente. Nuestro equipo lo revisará en detalle y se pondrá en contacto contigo pronto.',
            icono: 'favorite',
            textoBoton: 'IR A MI PANEL',
            alConfirmar: () => window.location.href = '/miembro/'
        });

    } catch (error) {
        console.error("[Error] al tramitar adopción:", error.message);
        lanzarAlerta({
            titulo: 'No se pudo enviar',
            mensaje: error.message,
            icono: 'error',
            textoBoton: 'REINTENTAR'
        });
        botonEnviar.disabled = false;
        botonEnviar.innerHTML = 'GENERAR SOLICITUD Y ENVIAR';
    }
}

/**
 * Genera el archivo PDF con las respuestas del formulario para su tramitación.
 */
function generarDocumentoAdopcion(formularioHtml, nombreGato, idGato) {
    const documento = new jsPDF();
    const datosFormulario = new FormData(formularioHtml);
    
    const etiquetas = {
        nombre: "Nombre",
        apellidos: "Apellidos",
        direccion: "Dirección Completa",
        provincia: "Provincia",
        localidad: "Localidad",
        cp: "Código Postal",
        telefono: "Teléfono de contacto",
        email: "Correo electrónico",
        fecha_nacimiento: "Fecha de nacimiento",
        nacionalidad: "Nacionalidad",
        profesion: "Profesión o trabajo actual",
        motivo: "¿Por qué desea adoptar un gato?",
        estilo_vida: "Estilo de vida (viajes, tiempo en casa)",
        proyectos: "Proyectos a corto/medio plazo",
        situacion_laboral: "Situación laboral",
        experiencia_gatos: "¿Ha tenido gatos anteriormente?",
        expectativas: "¿Qué espera de su futuro gato?",
        acuerdo_familia: "¿Están todos los miembros de acuerdo?",
        tipo_vivienda: "Tipo de vivienda",
        tipo_vivienda_detalle: "Detalles adicionales de la vivienda",
        espacio_gato: "Espacio destinado al animal",
        otros_animales: "Otros animales en el hogar",
        tiempo_solo: "Tiempo que el gato pasará solo al día",
        viajes: "Plan para vacaciones o ausencias",
        lugar_dormir: "Lugar donde dormirá el animal",
        alimentacion: "Tipo de alimentación prevista",
        salida_exterior: "Acceso al exterior de la vivienda",
        frecuencia_vet: "Frecuencia prevista de visitas al veterinario",
        problemas_salud: "Actuación ante problemas de salud graves",
        comportamiento_destrozos: "Gestión de comportamientos inesperados",
        opinion_abandono: "Opinión personal sobre el abandono",
        protecciones: "Medidas de seguridad (ventanas/balcones)",
        desunglar: "Opinión sobre la desungulación",
        alergias_embarazo: "Plan ante posibles alergias o embarazos"
    };

    documento.setFont("helvetica", "bold");
    documento.setFontSize(22);
    documento.setTextColor(31, 41, 55);
    documento.text(`SOLICITUD DE ADOPCIÓN`, 20, 25);
    
    documento.setFontSize(10);
    documento.setTextColor(150, 150, 150);
    documento.text(`CATFEINA - CAT CAFÉ & CENTRO DE ADOPCIÓN`, 20, 32);
    
    documento.setDrawColor(234, 179, 8); 
    documento.setLineWidth(1);
    documento.line(20, 38, 190, 38);

    documento.setFontSize(11);
    documento.setTextColor(0, 0, 0);
    documento.text(`GATO: ${nombreGato.toUpperCase()}`, 20, 48);
    documento.text(`ID: #${idGato}`, 100, 48);
    documento.text(`FECHA: ${new Date().toLocaleDateString('es-ES')}`, 150, 48);
    
    let posicionY = 60;
    
    for (let [clave, valor] of datosFormulario.entries()) {
        const etiqueta = etiquetas[clave] || clave.toUpperCase();
        const textoRespuesta = valor.toString() || "No especificado";
        
        const lineasRespuesta = documento.splitTextToSize(textoRespuesta, 165);
        const alturaBloque = (lineasRespuesta.length * 5) + 15;

        if (posicionY + alturaBloque > 275) { 
            documento.addPage(); 
            posicionY = 25; 
        }

        documento.setFont("helvetica", "bold");
        documento.setFontSize(9);
        documento.setTextColor(120, 90, 0); 
        documento.text(etiqueta.toUpperCase(), 20, posicionY);
        
        documento.setFont("helvetica", "normal");
        documento.setFontSize(10);
        documento.setTextColor(40, 40, 40);
        documento.text(lineasRespuesta, 20, posicionY + 6);
        
        posicionY += alturaBloque;
    }

    const nPaginas = documento.internal.getNumberOfPages();
    for (let i = 1; i <= nPaginas; i++) {
        documento.setPage(i);
        documento.setFontSize(8);
        documento.setTextColor(180);
        documento.text(`Documento generado por el sistema de Catfeina - Página ${i} de ${nPaginas}`, 20, 285);
    }

    return documento.output('blob');
}
