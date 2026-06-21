/**
 * Gestión del formulario de tramitación para el apadrinamiento de gatos.
 */

import { obtenerUsuarioSesion, Validador, mostrarEstadoValidacion, mostrarErrorCampo } from '../recursos/js/utilidades.js';
import { lanzarAlerta, lanzarPasarelaPago } from '../recursos/js/modales.js';

document.addEventListener('DOMContentLoaded', () => {
    inicializarTramiteApadrinar();
    vincularValidacionVisual();
});

let datosGatoGlobal = { nombre: '', imagen: '' };

/**
 * Inicializa el proceso verificando la sesión y extrayendo los datos del gato seleccionado.
 */
function inicializarTramiteApadrinar() {
    const usuario = obtenerUsuarioSesion();
    if (!usuario) {
        localStorage.setItem('url_retorno', window.location.href);
        lanzarAlerta({
            titulo: 'Acceso Restringido',
            mensaje: 'Para poder apadrinar a uno de nuestros residentes, primero debes iniciar sesión.',
            icono: 'lock',
            textoBoton: 'IR AL LOGIN',
            alConfirmar: () => window.location.href = '/login/'
        });
        return;
    }

    const parametros = new URLSearchParams(window.location.search);
    datosGatoGlobal.nombre = parametros.get('gato') || 'un michi';
    datosGatoGlobal.imagen = parametros.get('imagen');

    rellenarDatosUsuario(usuario);
    dibujarFichaGato();
    vincularEventos();
    refrescarResumenPago();
}

/**
 * Vincula la validación visual de los campos de contacto del formulario.
 */
function vincularValidacionVisual() {
    const reglas = [
        { id: 'input-nombre', validar: (v) => Validador.esSoloLetras(v) },
        { id: 'input-email', validar: (v) => Validador.esCorreoValido(v) },
        { id: 'input-telefono', validar: (v) => Validador.esTelefonoValido(v) }
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
 * Autorellena el formulario con la información del perfil del usuario autenticado.
 */
function rellenarDatosUsuario(usuario) {
    document.getElementById('input-nombre').value = `${usuario.nombre || ''} ${usuario.apellidos || ''}`.trim();
    document.getElementById('input-email').value = usuario.email || '';
    document.getElementById('input-telefono').value = usuario.telefono || '';
}

/**
 * Renderiza la información visual del gato que se va a apadrinar.
 */
function dibujarFichaGato() {
    const elementoNombre = document.getElementById('nombre-gato-padrino');
    const elementoImagen = document.getElementById('img-gato-padrino');
    
    if (elementoNombre) elementoNombre.innerText = datosGatoGlobal.nombre;
    if (elementoImagen && datosGatoGlobal.imagen) {
        elementoImagen.src = `/recursos/imagenes/${datosGatoGlobal.imagen}`;
    }
}

/**
 * Escucha los cambios de plan y el envío definitivo del formulario.
 */
function vincularEventos() {
    document.querySelectorAll('input[name="plan_apadrinar"]').forEach(radio => {
        radio.addEventListener('change', refrescarResumenPago);
    });

    document.getElementById('form-padrinazgo')?.addEventListener('submit', procesarSolicitudFinal);
}

/**
 * Actualiza el resumen de aportación mensual según el plan seleccionado.
 */
function refrescarResumenPago() {
    const resumen = document.getElementById('resumen-pago');
    const nivelElegido = document.querySelector('input[name="plan_apadrinar"]:checked')?.value || 'curioso';
    
    const precios = { curioso: 5, amigo: 10, familia: 25 };
    const total = precios[nivelElegido];

    if (resumen) {
        resumen.innerHTML = `
            <p class="text-xs font-bold text-texto-principal dark:text-white uppercase tracking-wider">Plan ${nivelElegido.toUpperCase()}</p>
            <p class="text-3xl font-black text-principal mt-1">${total.toFixed(2)}€<span class="text-xs">/mes</span></p>
            <p class="text-[9px] text-gray-400 font-medium mt-2 italic">Ayuda directa para la alimentación y salud de ${datosGatoGlobal.nombre}.</p>
        `;
    }
}

/**
 * Ejecuta el proceso de pago y registra el apadrinamiento en el sistema.
 */
async function procesarSolicitudFinal(evento) {
    evento.preventDefault();

    const nombre = document.getElementById('input-nombre').value;
    const email = document.getElementById('input-email').value;
    const telefono = document.getElementById('input-telefono').value;

    const nombreOk = Validador.esSoloLetras(nombre);
    const emailOk = Validador.esCorreoValido(email);
    const telOk = Validador.esTelefonoValido(telefono);

    mostrarEstadoValidacion('input-nombre', nombreOk, 'Introduce solo letras.');
    mostrarEstadoValidacion('input-email', emailOk, 'Email no válido.');
    mostrarEstadoValidacion('input-telefono', telOk, 'Teléfono introducido incorrecto.');

    if (!nombreOk || !emailOk || !telOk) {
        const primerError = !nombreOk ? 'input-nombre' : (!emailOk ? 'input-email' : 'input-telefono');
        document.getElementById(primerError)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }
    
    const precioTexto = document.querySelector('#resumen-pago .text-3xl').innerText;
    const monto = parseFloat(precioTexto.replace(/[^\d.,]/g, '').replace(',', '.'));

    lanzarPasarelaPago({
        total: monto,
        concepto: `Apadrinar a ${datosGatoGlobal.nombre}`,
        alConfirmar: async () => {
            const boton = document.getElementById('btn-confirmar');
            boton.disabled = true;
            boton.innerText = 'PROCESANDO...';

            const datos = {
                id_usuario: obtenerUsuarioSesion().id,
                nombre_gato: datosGatoGlobal.nombre,
                plan: document.querySelector('input[name="plan_apadrinar"]:checked').value,
                pagado: true,
                tipo_reserva: 'apadrinar'
            };

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
                        titulo: '¡Gracias de corazón!',
                        mensaje: `Has salvado una vida sin llevarla a casa. Gracias a tu apoyo, ${datosGatoGlobal.nombre} tendrá todo lo que necesita.`,
                        icono: 'verified',
                        textoBoton: 'VER MI PERFIL',
                        alConfirmar: () => window.location.href = '/miembro/'
                    });
                } else {
                    const errorServidor = await respuesta.json();
                    throw new Error(errorServidor.mensaje || "No se pudo completar el registro.");
                }
            } catch (error) {
                lanzarAlerta({ titulo: 'Error', mensaje: error.message, icono: 'error' });
                boton.disabled = false;
                boton.innerText = 'REINTENTAR';
            }
        }
    });
}
