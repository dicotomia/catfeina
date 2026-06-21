/**
 * Funciones de utilidad compartidas, validadores de datos y gestión de sesión.
 */

/**
 * Diccionario de funciones para la validación de formatos de entrada.
 */
export const Validador = {
    /**
     * Valida que un texto cumpla con una longitud mínima de caracteres.
     */
    esTextoValido: (texto, minimo = 3) => {
        return texto && texto.trim().length >= minimo;
    },

    /**
     * Valida que un texto contenga exclusivamente letras y espacios.
     */
    esSoloLetras: (texto) => {
        const patron = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
        return texto && patron.test(texto.trim());
    },

    /**
     * Valida que un correo electrónico tenga un formato sintácticamente correcto.
     */
    esCorreoValido: (email) => {
        const patron = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return patron.test(email);
    },

    /**
     * Valida que un número de teléfono tenga una longitud de entre 9 y 15 dígitos.
     */
    esTelefonoValido: (telefono) => {
        const patron = /^\d{9,15}$/;
        return patron.test(telefono);
    },

    /**
     * Valida que una contraseña cumpla con criterios de longitud y complejidad.
     */
    esClaveSegura: (password) => {
        if (!password || password.length < 6) return false;
        const tieneMayuscula = /[A-Z]/.test(password);
        const tieneNumero = /\d/.test(password);
        const tieneSimbolo = /[!@#$%^&*(),.?":{}|<>]/.test(password);
        return tieneMayuscula && tieneNumero && tieneSimbolo;
    },

    /**
     * Convierte caracteres especiales en entidades HTML seguras para evitar inyecciones.
     */
    sanitizarTexto: (texto) => {
        if (!texto) return '';
        const mapa = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#x27;',
            "/": '&#x2F;',
        };
        const reg = /[&<>"'/]/ig;
        return texto.replace(reg, (match) => (mapa[match]));
    },

    /**
     * Valida que un número de tarjeta bancaria contenga exactamente 16 dígitos.
     */
    esTarjetaValida: (numero) => {
        return /^\d{16}$/.test(numero.replace(/\s/g, ''));
    },

    /**
     * Valida que el código de verificación de la tarjeta contenga 3 dígitos.
     */
    esCvcValido: (cvc) => {
        return /^\d{3}$/.test(cvc);
    },

    /**
     * Valida que una fecha de expiración sea posterior al mes y año actuales.
     */
    esExpiracionValida: (fecha) => {
        if (!/^\d{2}\/\d{2}$/.test(fecha)) return false;
        const [mes, anio] = fecha.split('/').map(n => parseInt(n));
        if (mes < 1 || mes > 12) return false;
        
        const hoy = new Date();
        const anioActual = parseInt(hoy.getFullYear().toString().slice(-2));
        const mesActual = hoy.getMonth() + 1;

        if (anio < anioActual) return false;
        if (anio === anioActual && mes < mesActual) return false;
        
        return true;
    },

    /**
     * Valida que un código postal contenga exactamente 5 dígitos.
     */
    esCodigoPostalValido: (cp) => {
        return /^\d{5}$/.test(cp);
    },

    /**
     * Determina si una fecha proporcionada es cronológicamente anterior al día actual.
     */
    esFechaPasada: (fecha) => {
        if (!fecha) return false;
        const seleccionada = new Date(fecha);
        const hoy = new Date();
        return seleccionada < hoy;
    },

    /**
     * Determina si una fecha seleccionada corresponde al día de hoy o a uno futuro.
     */
    esFechaFutura: (fecha) => {
        if (!fecha) return false;
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        return new Date(fecha) >= hoy;
    }
};

/**
 * Controla el desplazamiento de imágenes en una galería mediante índices circulares.
 */
export function gestionarCarruselImagen(idImagen, direccion, evento, listaImagenes = []) {
    if (evento) {
        evento.preventDefault();
        evento.stopPropagation();
    }

    const elementoImg = document.getElementById(idImagen);
    if (!elementoImg || !listaImagenes || listaImagenes.length <= 1) return;

    let indiceActual = parseInt(elementoImg.dataset.index) || 0;

    indiceActual += direccion;
    if (indiceActual >= listaImagenes.length) indiceActual = 0;
    if (indiceActual < 0) indiceActual = listaImagenes.length - 1;

    const nuevaRuta = listaImagenes[indiceActual];
    
    const imagenTemporal = new Image();
    imagenTemporal.src = nuevaRuta;
    imagenTemporal.onload = () => {
        elementoImg.src = nuevaRuta;
        elementoImg.dataset.index = indiceActual;
    };
}

/**
 * Muestra el estado de validación de un campo inyectando mensajes y aplicando estilos.
 */
export function mostrarEstadoValidacion(idElemento, esValido, mensajeError = 'Campo inválido. Revisa la información introducida.') {
    const el = document.getElementById(idElemento);
    if (!el) return;

    let errorSpan = el.previousElementSibling;
    let esErrorNuestro = errorSpan && errorSpan.classList.contains('mensaje-error-validador');

    const clasesError = ['!border-red-500', '!bg-red-50', 'dark:!bg-red-900/10'];

    if (esValido) {
        el.classList.remove(...clasesError);
        if (esErrorNuestro) {
            errorSpan.remove();
        }
    } else {
        el.classList.add(...clasesError);
        
        if (!esErrorNuestro) {
            errorSpan = document.createElement('span');
            errorSpan.className = 'mensaje-error-validador text-[10px] font-black uppercase tracking-widest text-red-500 mb-1 block';
            el.parentNode.insertBefore(errorSpan, el);
        }
        errorSpan.innerText = mensajeError;

        el.addEventListener('input', () => {
            el.classList.remove(...clasesError);
            const actualSpan = el.previousElementSibling;
            if (actualSpan && actualSpan.classList.contains('mensaje-error-validador')) {
                actualSpan.remove();
            }
        }, { once: true });
    }
}

/**
 * Controla la visibilidad y el contenido de los mensajes de error asociados a un campo.
 */
export function mostrarErrorCampo(idError, mensaje = '') {
    const el = document.getElementById(idError);
    if (!el) return;

    if (mensaje) {
        el.innerText = mensaje;
        el.classList.remove('hidden');
    } else {
        el.innerText = '';
        el.classList.add('hidden');
    }
}


/**
 * Convierte un valor numérico a una cadena de texto formateada como moneda Euro.
 */
export const formatearMoneda = (valor) => {
    return new Intl.NumberFormat('es-ES', { 
        style: 'currency', 
        currency: 'EUR' 
    }).format(valor);
};

/**
 * Obtiene los datos de la sesión actual almacenados en el navegador.
 */
export function obtenerUsuarioSesion() {
    try {
        return JSON.parse(localStorage.getItem('usuario'));
    } catch (e) {
        return null;
    }
}
