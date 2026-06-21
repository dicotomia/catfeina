/**
 * Gestión del proceso de autenticación, registro de nuevos usuarios y persistencia de sesión.
 */

import { lanzarAlerta } from '../recursos/js/modales.js';
import { Validador, mostrarEstadoValidacion } from '../recursos/js/utilidades.js';

document.addEventListener('DOMContentLoaded', () => {
    inicializarAutenticacion();
    vincularValidacionEnTiempoReal();
});

/**
 * Vincula los formularios de acceso y registro a sus controladores de envío.
 */
function inicializarAutenticacion() {
    const formularioAcceso = document.getElementById('form-login');
    const formularioRegistro = document.getElementById('form-registro');

    formularioAcceso?.addEventListener('submit', (e) => manejarEnvio(e, 'acceso'));
    formularioRegistro?.addEventListener('submit', (e) => manejarEnvio(e, 'registro'));
}

/**
 * Activa la validación visual instantánea para los campos de entrada de ambos formularios.
 */
function vincularValidacionEnTiempoReal() {
    const reglasRegistro = [
        { id: 'reg-nombre', mensaje: 'Introduce solo letras.', validar: (v) => Validador.esSoloLetras(v) },
        { id: 'reg-apellidos', mensaje: 'Introduce solo letras.', validar: (v) => Validador.esSoloLetras(v) },
        { id: 'reg-email', mensaje: 'El formato del correo no es válido.', validar: (v) => Validador.esCorreoValido(v) },
        { id: 'reg-password', mensaje: 'Mínimo 6 caracteres, mayúscula, número y símbolo.', validar: (v) => Validador.esClaveSegura(v) }
    ];

    const reglasLogin = [
        { id: 'login-identificador', mensaje: 'Introduce tu email o usuario.', validar: (v) => Validador.esTextoValido(v, 1) },
        { id: 'login-password', mensaje: 'La contraseña es obligatoria.', validar: (v) => Validador.esTextoValido(v, 1) }
    ];

    [...reglasRegistro, ...reglasLogin].forEach(regla => {
        const input = document.getElementById(regla.id);
        input?.addEventListener('input', (e) => {
            const esValido = regla.validar(e.target.value);
            if (input.classList.contains('campo-invalido') && esValido) {
                mostrarEstadoValidacion(regla.id, true);
            }
        });
    });
}

/**
 * Procesa la validación y el envío de los datos de autenticación a la API.
 */
async function manejarEnvio(evento, tipo) {
    evento.preventDefault();
    const boton = evento.target.querySelector('button[type="submit"]');
    const textoOriginal = boton.innerText;

    const reglas = tipo === 'acceso' ? [
        { id: 'login-identificador', mensaje: 'Introduce tu email o usuario.', validar: (v) => Validador.esTextoValido(v, 1) },
        { id: 'login-password', mensaje: 'La contraseña es obligatoria.', validar: (v) => Validador.esTextoValido(v, 1) }
    ] : [
        { id: 'reg-nombre', mensaje: 'Introduce solo letras.', validar: (v) => Validador.esSoloLetras(v) },
        { id: 'reg-apellidos', mensaje: 'Introduce solo letras.', validar: (v) => Validador.esSoloLetras(v) },
        { id: 'reg-email', mensaje: 'El formato del correo no es válido.', validar: (v) => Validador.esCorreoValido(v) },
        { id: 'reg-password', mensaje: 'Mínimo 6 caracteres, mayúscula, número y símbolo.', validar: (v) => Validador.esClaveSegura(v) }
    ];

    let esFormularioValido = true;
    reglas.forEach(regla => {
        const valor = document.getElementById(regla.id)?.value || '';
        const esValido = regla.validar(valor);
        mostrarEstadoValidacion(regla.id, esValido, regla.mensaje);
        if (!esValido) esFormularioValido = false;
    });

    if (!esFormularioValido) return;

    const datosRaw = tipo === 'acceso' ? {
        identificador: document.getElementById('login-identificador')?.value,
        password: document.getElementById('login-password')?.value
    } : {
        nombre: Validador.sanitizarTexto(document.getElementById('reg-nombre')?.value),
        apellidos: Validador.sanitizarTexto(document.getElementById('reg-apellidos')?.value),
        email: document.getElementById('reg-email')?.value,
        password: document.getElementById('reg-password')?.value
    };

    boton.disabled = true;
    boton.innerHTML = '<span class="flex items-center justify-center gap-2"><svg class="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> PROCESANDO...</span>';

    try {
        const ruta = tipo === 'acceso' ? '/api/auth/login' : '/api/auth/registro';
        
        const respuesta = await fetch(ruta, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datosRaw)
        });

        const resultado = await respuesta.json().catch(() => ({ mensaje: 'Error en el formato de respuesta del servidor' }));

        if (respuesta.ok) {
            finalizarSesionExitosa(resultado, tipo);
        } else {
            lanzarAlerta({ 
                titulo: tipo === 'acceso' ? 'Acceso Denegado' : 'Error en Registro', 
                mensaje: resultado.mensaje || resultado.error || 'Credenciales incorrectas.', 
                icono: 'error_outline' 
            });
        }
    } catch (error) {
        console.error("[Detalle del Error de Red]:", error);
        lanzarAlerta({ 
            titulo: 'Servidor No Disponible', 
            mensaje: 'No se ha podido establecer conexión con el servidor.', 
            icono: 'wifi_off' 
        });
    } finally {
        boton.disabled = false;
        boton.innerText = textoOriginal;
    }
}

/**
 * Almacena el token de seguridad y redirige al usuario a su destino tras un acceso exitoso.
 */
function finalizarSesionExitosa(datos, tipo) {
    localStorage.setItem('token', datos.token);
    localStorage.setItem('usuario', JSON.stringify(datos.usuario));
    
    localStorage.removeItem('cached_nav');

    const esNuevoRegistro = tipo === 'registro';
    
    lanzarAlerta({
        titulo: esNuevoRegistro ? '¡Bienvenido/a!' : `Hola de nuevo, ${datos.usuario.nombre}`,
        mensaje: esNuevoRegistro 
            ? 'Tu cuenta ha sido creada con éxito. ¡Ya puedes empezar a salvar vidas!'
            : 'Qué alegría verte otra vez por Catfeina.',
        icono: esNuevoRegistro ? 'celebration' : 'mood',
        textoBoton: 'CONTINUAR',
        alConfirmar: () => {
            const urlRetorno = localStorage.getItem('url_retorno') || '/';
            localStorage.removeItem('url_retorno');
            window.location.href = urlRetorno;
        }
    });
}
