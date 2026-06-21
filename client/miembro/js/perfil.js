/**
 * Gestión del perfil de usuario, actualización de datos personales y seguridad.
 */

import { lanzarAlerta } from '../../recursos/js/modales.js';
import { Validador, mostrarEstadoValidacion, mostrarErrorCampo } from '../../recursos/js/utilidades.js';

const fichaAcceso = localStorage.getItem('token');
const cabecerasApi = { 
    'Authorization': `Bearer ${fichaAcceso}`, 
    'Content-Type': 'application/json' 
};

/**
 * Obtiene la información del perfil del usuario y rellena los campos del formulario.
 */
export async function recuperarDatosPerfil() {
    try {
        const respuesta = await fetch('/api/usuarios/perfil', { headers: cabecerasApi });
        const usuario = await respuesta.json();
        
        document.getElementById('perf-nombre').value = usuario.nombre;
        document.getElementById('perf-apellidos').value = usuario.apellidos;
        document.getElementById('perf-telefono').value = usuario.telefono || '';
        
        activarValidacionEnTiempoReal();
    } catch (error) { 
        console.error("Fallo al obtener perfil:", error); 
    }
}

/**
 * Inicializa los controladores de eventos para la validación instantánea de los campos.
 */
function activarValidacionEnTiempoReal() {
    const ids = ['perf-nombre', 'perf-apellidos', 'perf-telefono'];
    ids.forEach(id => {
        const el = document.getElementById(id);
        el?.addEventListener('input', (evento) => {
            const valor = evento.target.value;
            const esValido = id === 'perf-telefono' ? Validador.esTelefonoValido(valor) : Validador.esSoloLetras(valor);
            if (el.classList.contains('campo-invalido') && esValido) {
                mostrarEstadoValidacion(id, true);
            }
        });
    });

    document.getElementById('perf-pass-nueva')?.addEventListener('input', (evento) => {
        const el = evento.target;
        const esSegura = Validador.esClaveSegura(el.value);
        if (el.classList.contains('campo-invalido') && esSegura) {
            mostrarEstadoValidacion('perf-pass-nueva', true);
            mostrarErrorCampo('error-perf-pass-nueva', '');
        }
    });
}

/**
 * Controla la visibilidad del formulario de cambio de contraseña.
 */
export function gestionarDespliegueSeguridad() {
    const formulario = document.getElementById('form-password');
    const iconoFlecha = document.getElementById('chevron-seguridad');
    
    if (!formulario) return;

    const estaOculto = formulario.classList.contains('hidden');
    
    if (estaOculto) {
        formulario.classList.remove('hidden');
        iconoFlecha.style.transform = 'rotate(180deg)';
    } else {
        formulario.classList.add('hidden');
        iconoFlecha.style.transform = 'rotate(0deg)';
    }
}

/**
 * Envía la información actualizada del perfil al servidor tras validarla.
 */
export async function guardarCambiosPerfil(evento) {
    evento.preventDefault();
    
    const nombre = document.getElementById('perf-nombre').value;
    const apellidos = document.getElementById('perf-apellidos').value;
    const telefono = document.getElementById('perf-telefono').value;

    const nombreOk = Validador.esSoloLetras(nombre);
    const apellidosOk = Validador.esSoloLetras(apellidos);
    const telOk = Validador.esTelefonoValido(telefono);

    mostrarEstadoValidacion('perf-nombre', nombreOk, 'Introduce solo letras.');
    mostrarEstadoValidacion('perf-apellidos', apellidosOk, 'Introduce solo letras.');
    mostrarEstadoValidacion('perf-telefono', telOk, 'Teléfono introducido incorrecto.');

    if (!nombreOk || !apellidosOk || !telOk) {
        const primerError = !nombreOk ? 'perf-nombre' : (!apellidosOk ? 'perf-apellidos' : 'perf-telefono');
        document.getElementById(primerError)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }

    const datosActualizados = { nombre, apellidos, telefono };

    try {
        const respuesta = await fetch('/api/usuarios/perfil', { 
            method: 'PUT', 
            headers: cabecerasApi, 
            body: JSON.stringify(datosActualizados) 
        });

        if (respuesta.ok) {
            const cache = JSON.parse(localStorage.getItem('usuario'));
            localStorage.setItem('usuario', JSON.stringify({ ...cache, ...datosActualizados }));

            lanzarAlerta({ 
                titulo: 'Cambios guardados', 
                mensaje: 'Tu perfil se ha actualizado correctamente.', 
                icono: 'verified' 
            });
            
            const saludo = document.getElementById('bienvenida-nombre');
            if (saludo) saludo.innerHTML = `Hola de nuevo, <span class="text-principal">${datosActualizados.nombre}</span>`;
        }
    } catch (error) { 
        console.error("Error al guardar:", error); 
    }
}

/**
 * Procesa la solicitud de cambio de contraseña enviando las claves al servidor.
 */
export async function procesarCambioContrasena(evento) {
    evento.preventDefault();
    const contrasenaActual = document.getElementById('perf-pass-actual').value;
    const contrasenaNueva = document.getElementById('perf-pass-nueva').value;

    if (!Validador.esClaveSegura(contrasenaNueva)) {
        return lanzarAlerta({ 
            titulo: 'Clave insegura', 
            mensaje: 'La nueva contraseña no cumple los requisitos.', 
            icono: 'security' 
        });
    }

    try {
        const respuesta = await fetch('/api/usuarios/perfil/password', { 
            method: 'PUT', 
            headers: cabecerasApi, 
            body: JSON.stringify({ contrasenaActual, contrasenaNueva }) 
        });
        
        const resultado = await respuesta.json();
        
        if (respuesta.ok) {
            lanzarAlerta({ 
                titulo: 'Éxito', 
                mensaje: 'Contraseña actualizada.', 
                icono: 'verified' 
            });
            evento.target.reset();
            gestionarDespliegueSeguridad();
        } else {
            throw new Error(resultado.mensaje);
        }
    } catch (error) {
        lanzarAlerta({ 
            titulo: 'Error', 
            mensaje: error.message, 
            icono: 'error' 
        });
    }
}
