/**
 * Gestión del proceso de reserva de servicios, validación de horarios y pasarela de pago.
 */

import { obtenerUsuarioSesion, Validador, mostrarEstadoValidacion } from '../recursos/js/utilidades.js';
import { lanzarAlerta, lanzarPasarelaPago } from '../recursos/js/modales.js';

document.addEventListener('DOMContentLoaded', () => {
    prepararFormularioReserva();
});

let tipoServicioActual = 'cafeteria';

/**
 * Inicializa el formulario verificando la sesión y configurando el tipo de servicio.
 */
function prepararFormularioReserva() {
    const usuario = obtenerUsuarioSesion();
    if (!usuario) {
        localStorage.setItem('url_retorno', window.location.href);
        lanzarAlerta({
            titulo: 'Acceso Restringido',
            mensaje: 'Inicia sesión para realizar una reserva.',
            icono: 'lock',
            textoBoton: 'IR AL LOGIN',
            alConfirmar: () => window.location.href = '/login/'
        });
        return;
    }

    document.getElementById('contenedor-formulario')?.classList.remove('opacity-0');

    const parametros = new URLSearchParams(window.location.search);
    tipoServicioActual = parametros.get('tipo') || 'cafeteria';
    const planDesdeUrl = parametros.get('plan');

    establecerValoresPredeterminados(usuario);
    ajustarInterfazPorServicio();
    
    if (planDesdeUrl) {
        const radioPlan = document.querySelector(`input[name="plan"][value="${planDesdeUrl}"]`);
        if (radioPlan) radioPlan.checked = true;
    }

    vincularEventosActualizacion();
    vincularValidacionTiempoReal();
    actualizarResumenPago();
}

/**
 * Vincula la validación visual instantánea para los campos del formulario.
 */
function vincularValidacionTiempoReal() {
    const reglas = [
        { id: 'input-nombre', validar: (v) => Validador.esTextoValido(v, 3) },
        { id: 'input-email', validar: (v) => Validador.esCorreoValido(v) },
        { id: 'input-telefono', validar: (v) => Validador.esTelefonoValido(v) },
        { id: 'input-fecha', validar: (v) => Validador.esFechaFutura(v) }
    ];

    reglas.forEach(regla => {
        const input = document.getElementById(regla.id);
        input?.addEventListener('input', (e) => {
            const esValido = regla.validar(e.target.value);
            if (input?.classList.contains('campo-invalido') && esValido) {
                mostrarEstadoValidacion(regla.id, true);
            }
        });
    });
}

/**
 * Autorellena los campos de contacto y establece la fecha mínima de reserva.
 */
function establecerValoresPredeterminados(usuario) {
    const campoNombre = document.getElementById('input-nombre');
    const campoEmail = document.getElementById('input-email');
    const campoTelefono = document.getElementById('input-telefono');
    const campoFecha = document.getElementById('input-fecha');

    if (campoNombre) campoNombre.value = `${usuario.nombre || ''} ${usuario.apellidos || ''}`.trim();
    if (campoEmail) campoEmail.value = usuario.email || '';
    if (campoTelefono) campoTelefono.value = usuario.telefono || '';
    
    if (campoFecha) {
        const hoy = new Date().toISOString().split("T")[0];
        campoFecha.min = hoy;
    }
}

/**
 * Modifica los elementos visuales del formulario para adaptarse al servicio seleccionado.
 */
function ajustarInterfazPorServicio() {
    const elementoTitulo = document.getElementById('titulo-reserva');
    const elementoIcono = document.getElementById('icono-tipo');
    const elementoHorario = document.getElementById('horario-texto');
    const elementoEtiquetaPlan = document.getElementById('etiqueta-plan-base');
    const campoTipo = document.getElementById('tipo_reserva');
    
    if (campoTipo) campoTipo.value = tipoServicioActual;

    if (tipoServicioActual === 'coworking') {
        elementoTitulo.innerHTML = 'Reserva <span class="text-principal italic">Coworking</span>';
        elementoIcono.innerHTML = '<span class="material-symbols-outlined text-4xl font-black">laptop_mac</span>';
        elementoHorario.innerText = 'L-V: 08:00 - 20:00';
        if (elementoEtiquetaPlan) elementoEtiquetaPlan.innerText = 'Nómada';
        
        ['opcion-team', 'opcion-dia', 'opcion-mes'].forEach(id => {
            document.getElementById(id)?.classList.remove('hidden');
        });
    } else {
        elementoTitulo.innerHTML = 'Reserva <span class="text-principal italic">Cafetería</span>';
        elementoIcono.innerHTML = '<span class="material-symbols-outlined text-4xl font-black">coffee</span>';
        elementoHorario.innerText = 'L-D: 10:00 - 21:00';
        if (elementoEtiquetaPlan) elementoEtiquetaPlan.innerText = 'Visita';
        limitarHorasCafeteria();
    }
}

/**
 * Escucha cambios en las opciones del formulario para actualizar el precio en tiempo real.
 */
function vincularEventosActualizacion() {
    const selectores = ['input[name="plan"]', '#input-personas', '#input-horas', '#input-hora', '#input-fecha'];
    selectores.forEach(selector => {
        document.querySelectorAll(selector).forEach(elemento => {
            elemento.addEventListener('change', actualizarResumenPago);
            elemento.addEventListener('input', actualizarResumenPago);
        });
    });

    document.getElementById('form-final-reserva')?.addEventListener('submit', procesarEnvioReserva);
    document.getElementById('btn-abrir-reglas')?.addEventListener('click', abrirNormas);
    document.getElementById('btn-aceptar-reglas')?.addEventListener('click', cerrarNormas);
}

/**
 * Calcula el importe total de la reserva aplicando las tarifas correspondientes.
 */
function actualizarResumenPago() {
    const contenedorResumen = document.getElementById('resumen-tipo');
    if (!contenedorResumen) return;

    const planElegido = document.querySelector('input[name="plan"]:checked')?.value || 'estandar';
    const inputPersonas = document.getElementById('input-personas');
    const inputHoras = document.getElementById('input-horas');
    
    const seccionPersonas = document.getElementById('seccion-personas');
    const seccionHoras = document.getElementById('seccion-horas');
    const avisoGrupal = document.getElementById('hint-personas');

    seccionPersonas?.classList.remove('hidden');
    seccionHoras?.classList.remove('hidden');
    avisoGrupal?.classList.add('hidden');

    if (planElegido === 'grupal') {
        if (inputPersonas) {
            inputPersonas.min = "4";
            if (parseInt(inputPersonas.value) < 4) inputPersonas.value = 4;
        }
        avisoGrupal?.classList.remove('hidden');
    } 
    else {
        if (inputPersonas && inputPersonas.min === "4") {
            inputPersonas.value = 1;
        }
        if (inputPersonas) inputPersonas.min = "1";

        if (planElegido === 'residente') {
            seccionPersonas?.classList.add('hidden');
            seccionHoras?.classList.add('hidden');
        }
    }

    let personas = parseInt(inputPersonas?.value) || 1;
    let horas = parseFloat(inputHoras?.value) || 1;
    
    if (planElegido === 'residente') {
        personas = 1;
        horas = 1;
    }

    let subtotal = 0;
    if (tipoServicioActual === 'coworking') {
        const tarifas = { nomada: 12.90, diario: 35, residente: 400, grupal: 12.90 };
        if (planElegido === 'residente') subtotal = 400;
        else if (planElegido === 'diario') subtotal = tarifas.diario * personas;
        else subtotal = (tarifas[planElegido] || 12.90) * personas * horas;
    } else {
        subtotal = 4.00 * personas * horas;
    }

    contenedorResumen.innerHTML = `
        <p class="text-xs font-bold text-texto-principal uppercase tracking-wider">Plan ${planElegido.toUpperCase()}</p>
        <p class="text-3xl font-black text-principal mt-1">${subtotal.toFixed(2)}€</p>
        <div class="mt-2 mb-3 py-2 border-y border-principal/10">
            <p class="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                ${planElegido === 'residente' ? 'Suscripción Mensual' : `${personas} Pers. • ${horas} h`}
            </p>
        </div>`;
}

/**
 * Valida los datos introducidos y tramita el pago de la reserva.
 */
async function procesarEnvioReserva(evento) {
    evento.preventDefault();
    if (!validarIntegridadFormulario()) return;

    const totalTexto = document.querySelector('#resumen-tipo .text-3xl').innerText;
    const importeTotal = parseFloat(totalTexto.replace(/[^\d.,]/g, '').replace(',', '.'));

    lanzarPasarelaPago({
        total: importeTotal,
        concepto: `Reserva Catfeina (${tipoServicioActual})`,
        alConfirmar: async () => {
            const botonEnvio = document.getElementById('btn-confirmar-final');
            botonEnvio.disabled = true;
            botonEnvio.innerText = 'PROCESANDO...';

            const datos = Object.fromEntries(new FormData(evento.target).entries());
            datos.id_usuario = obtenerUsuarioSesion().id;
            datos.pagado = true;

            try {
                const respuesta = await fetch('/api/reservas', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify(datos)
                });

                if (respuesta.ok) {
                    lanzarAlerta({
                        titulo: '¡Confirmado!',
                        mensaje: 'Tu reserva se ha registrado con éxito.',
                        icono: 'verified',
                        textoBoton: 'VER PANEL',
                        alConfirmar: () => window.location.href = '/miembro/'
                    });
                } else {
                    const errorServidor = await respuesta.json();
                    throw new Error(errorServidor.mensaje || "Error en el servidor.");
                }
            } catch (error) {
                lanzarAlerta({ titulo: 'Fallo en Reserva', mensaje: error.message, icono: 'error' });
                botonEnvio.disabled = false;
                botonEnvio.innerText = 'REINTENTAR';
            }
        }
    });
}

/**
 * Realiza las comprobaciones de seguridad y formato del formulario antes del envío.
 */
function validarIntegridadFormulario() {
    let esValido = true;
    const nombre = document.getElementById('input-nombre').value.trim();
    const tel = document.getElementById('input-telefono').value.trim();
    const mail = document.getElementById('input-email').value.trim();
    const fecha = document.getElementById('input-fecha').value;
    const hora = document.getElementById('input-hora').value;
    const reglasAceptadas = document.getElementById('check-reglas').checked;

    const campos = [
        { id: 'input-nombre', val: nombre, msg: 'Introduce solo letras.', fn: (v) => Validador.esSoloLetras(v) },
        { id: 'input-telefono', val: tel, msg: 'Teléfono introducido incorrecto', fn: (v) => Validador.esTelefonoValido(v) },
        { id: 'input-email', val: mail, msg: 'Email no válido', fn: (v) => Validador.esCorreoValido(v) }
    ];

    let primerErrorId = null;
    campos.forEach(c => {
        const ok = c.fn(c.val);
        mostrarEstadoValidacion(c.id, ok, c.msg);
        if (!ok) {
            esValido = false;
            if (!primerErrorId) primerErrorId = c.id;
        }
    });
    
    const momentoElegido = new Date(`${fecha}T${hora}`);
    const momentoActual = new Date();
    
    const fechaOk = fecha && momentoElegido > momentoActual;
    mostrarEstadoValidacion('input-fecha', fechaOk, 'La fecha debe ser futura');
    if (!fechaOk) {
        esValido = false;
        if (!primerErrorId) primerErrorId = 'input-fecha';
    }

    if (!reglasAceptadas) {
        lanzarAlerta({ titulo: 'Normas', mensaje: 'Debes aceptar las normas de Catfeina para reservar.', icono: 'gavel' });
        esValido = false;
    }

    if (!esValido && primerErrorId) {
        document.getElementById(primerErrorId)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    return esValido;
}

/**
 * Restringe la duración máxima de la reserva para el servicio de cafetería.
 */
function limitarHorasCafeteria() {
    const selectorHoras = document.getElementById('input-horas');
    if (selectorHoras) {
        Array.from(selectorHoras.options).forEach(opcion => {
            if (parseFloat(opcion.value) > 2) opcion.remove();
        });
        selectorHoras.value = "0.5";
    }
    document.getElementById('aviso-tiempo')?.classList.remove('hidden');
}

/**
 * Muestra el cuadro de diálogo con las normas de convivencia del centro.
 */
function abrirNormas() {
    const modal = document.getElementById('modal-reglas');
    const scroll = document.getElementById('scroll-reglas');
    const botonAceptar = document.getElementById('btn-aceptar-reglas');

    modal?.classList.replace('hidden', 'flex');
    document.body.style.overflow = 'hidden';
    
    if (scroll) {
        scroll.scrollTop = 0;
        scroll.onscroll = () => {
            if (scroll.scrollHeight - scroll.scrollTop <= scroll.clientHeight + 10) {
                botonAceptar.disabled = false;
                botonAceptar.classList.remove('opacity-50');
                botonAceptar.classList.add('bg-principal');
                botonAceptar.innerText = "ACEPTO LAS NORMAS";
            }
        };
    }
}

/**
 * Cierra el modal de normas y marca la casilla de aceptación.
 */
function cerrarNormas() {
    document.getElementById('modal-reglas')?.classList.replace('flex', 'hidden');
    document.body.style.overflow = '';
    const casilla = document.getElementById('check-reglas');
    if (casilla) { casilla.checked = true; casilla.disabled = false; }
}
