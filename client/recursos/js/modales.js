/**
 * Gestión de ventanas modales, alertas del sistema y pasarela de pago simulada.
 */

import { obtenerUsuarioSesion, Validador, mostrarEstadoValidacion, mostrarErrorCampo } from './utilidades.js';

/**
 * Muestra la ventana modal especificada.
 */
export function abrirModal(id) { 
    const elementoModal = document.getElementById(id);
    if (elementoModal) {
        elementoModal.classList.remove('hidden');
        elementoModal.classList.add('flex');
        document.body.style.overflow = 'hidden';
    }
}

/**
 * Oculta la ventana modal especificada.
 */
export function cerrarModal(id) { 
    const elementoModal = document.getElementById(id);
    if (elementoModal) {
        elementoModal.classList.add('hidden');
        elementoModal.classList.remove('flex');
        document.body.style.overflow = 'auto';
    }
}

/**
 * Genera y muestra una alerta modal personalizada con opciones de confirmación.
 */
export function lanzarAlerta({ 
    titulo, 
    mensaje, 
    icono = 'info', 
    confirmar = false, 
    peligro = false, 
    textoBoton = 'ENTENDIDO', 
    textoCancelar = 'CANCELAR', 
    alConfirmar = null 
}) {
    const modalExistente = document.getElementById('modal-personalizado');
    if (modalExistente) modalExistente.remove();

    const claseBoton = peligro ? 'bg-red-500 text-white shadow-red-200' : 'bg-principal text-texto-principal shadow-principal/30';

    const estructuraHtml = `
        <div id="modal-personalizado" class="fixed inset-0 z-[1000] flex items-center justify-center p-4 opacity-0 transition-opacity duration-300">
            <div class="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
            <div class="relative bg-white dark:bg-[#1f1b16] w-full max-w-md rounded-[2.5rem] shadow-2xl border border-principal/20 overflow-hidden transform scale-90 transition-transform duration-300">
                <div class="p-10 text-center">
                    ${icono ? `
                    <div class="w-20 h-20 ${peligro ? 'bg-red-50 text-red-500' : 'bg-principal/10 text-principal'} rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                        <span class="material-symbols-outlined text-4xl">${icono}</span>
                    </div>` : ''}
                    <h3 class="text-2xl font-black text-texto-principal dark:text-white mb-4 leading-tight">${titulo}</h3>
                    <p class="text-texto-secundario dark:text-gray-400 font-medium leading-relaxed mb-8 text-sm italic">${mensaje}</p>
                    <div class="flex flex-col gap-3">
                        <button id="btn-modal-ok" class="w-full py-4 ${claseBoton} font-black rounded-2xl hover:scale-[1.02] transition-all shadow-lg uppercase text-[10px] tracking-widest">${textoBoton}</button>
                        ${confirmar ? `<button id="btn-modal-cancel" class="w-full py-3 text-texto-secundario dark:text-gray-500 font-bold hover:text-texto-principal transition-colors text-[10px] uppercase tracking-widest">${textoCancelar}</button>` : ''}
                    </div>
                </div>
            </div>
        </div>`;

    document.body.insertAdjacentHTML('beforeend', estructuraHtml);
    const modal = document.getElementById('modal-personalizado');
    const contenido = modal.querySelector('.relative');

    requestAnimationFrame(() => {
        modal.classList.add('opacity-100');
        contenido.classList.remove('scale-90');
        contenido.classList.add('scale-100');
    });

    document.getElementById('btn-modal-ok').onclick = async () => {
        modal.remove();
        if (alConfirmar) await alConfirmar();
    };

    const botonCancelar = document.getElementById('btn-modal-cancel');
    if (botonCancelar) botonCancelar.onclick = () => modal.remove();
}

/**
 * Despliega la interfaz de la pasarela de pago para procesar transacciones.
 */
export function lanzarPasarelaPago({ total, concepto, mostrarAvisoTienda = false, alConfirmar }) {
    const modalExistente = document.getElementById('modal-pasarela');
    if (modalExistente) modalExistente.remove();

    const estructuraHtml = `
        <div id="modal-pasarela" class="fixed inset-0 z-[2000] flex items-center justify-center p-4 opacity-0 transition-opacity duration-300">
            <div class="absolute inset-0 bg-black/80 backdrop-blur-md"></div>
            <div class="relative bg-white dark:bg-[#1a1612] w-full max-w-md rounded-[2.5rem] shadow-2xl border border-white/10 overflow-hidden transform scale-90 transition-transform duration-300">
                <div class="p-8 bg-[#1a1612] text-white flex justify-between items-center border-b border-white/5">
                    <div>
                        <p class="text-[10px] font-black uppercase tracking-[0.2em] text-principal">Pago Seguro</p>
                        <h3 class="text-xl font-black italic uppercase tracking-tighter">Catfeina <span class="text-principal">Pay</span></h3>
                    </div>
                </div>
                <div class="p-8 space-y-6">
                    <div class="flex justify-between items-end pb-4 border-b border-gray-100 dark:border-white/5">
                        <span class="text-[10px] font-bold text-texto-secundario uppercase">Concepto: ${concepto}</span>
                        <span class="text-2xl font-black text-texto-principal dark:text-white">${parseFloat(total).toFixed(2)}€</span>
                    </div>

                    ${mostrarAvisoTienda ? `
                    <div class="p-4 bg-principal/5 rounded-2xl border border-principal/10 flex items-start gap-3">
                        <span class="material-symbols-outlined text-principal text-lg">store</span>
                        <p class="text-[10px] font-medium leading-relaxed text-texto-secundario dark:text-gray-400 italic">
                            Los pedidos se recogen en nuestro local de Córdoba. No realizamos envíos a domicilio.
                        </p>
                    </div>` : ''}

                    <div class="space-y-4" id="form-tarjeta">
                        <div class="flex flex-col gap-1.5">
                            <label class="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1">Número de Tarjeta</label>
                            <input type="text" id="pago-numero" placeholder="XXXX XXXX XXXX XXXX" maxlength="19" class="w-full bg-gray-50 dark:bg-white/5 border-none rounded-xl p-4 text-sm font-mono tracking-widest focus:ring-2 focus:ring-principal dark:text-white outline-none transition-all">
                            <p id="error-pago-numero" class="text-[8px] text-red-500 font-black uppercase hidden ml-2"></p>
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div class="flex flex-col gap-1.5">
                                <label class="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1">Vencimiento</label>
                                <input type="text" id="pago-expira" placeholder="MM/YY" maxlength="5" class="w-full bg-gray-50 dark:bg-white/5 border-none rounded-xl p-4 text-sm font-bold focus:ring-2 focus:ring-principal dark:text-white outline-none transition-all">
                                <p id="error-pago-expira" class="text-[8px] text-red-500 font-black uppercase hidden ml-2"></p>
                            </div>
                            <div class="flex flex-col gap-1.5">
                                <label class="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1">CVC</label>
                                <input type="text" id="pago-cvc" placeholder="***" maxlength="3" class="w-full bg-gray-50 dark:bg-white/5 border-none rounded-xl p-4 text-sm font-bold focus:ring-2 focus:ring-principal dark:text-white outline-none transition-all">
                                <p id="error-pago-cvc" class="text-[8px] text-red-500 font-black uppercase hidden ml-2"></p>
                            </div>
                        </div>
                    </div>
                    <div id="estado-conectando" class="hidden py-10 flex flex-col items-center gap-4 text-center">
                        <span class="material-symbols-outlined text-5xl text-principal animate-bounce">shield_with_heart</span>
                        <p class="text-xs font-black uppercase tracking-widest">Conectando...</p>
                    </div>
                    <div id="estado-verificando" class="hidden py-10 flex flex-col items-center gap-4 text-center">
                        <div class="w-16 h-16 border-4 border-principal border-t-transparent rounded-full animate-spin"></div>
                        <p class="text-xs font-black uppercase tracking-widest animate-pulse">Verificando fondos...</p>
                    </div>
                    <button id="btn-finalizar-pago" class="w-full py-5 bg-principal text-texto-principal font-black rounded-2xl shadow-xl hover:scale-[1.02] transition-all uppercase tracking-[0.2em] text-[10px]">REALIZAR PAGO AHORA</button>
                    <button id="btn-cancelar-pago" class="w-full text-[9px] font-black text-gray-400 uppercase tracking-widest hover:text-red-500 transition-colors">CANCELAR OPERACIÓN</button>
                </div>
            </div>
        </div>`;

    document.body.insertAdjacentHTML('beforeend', estructuraHtml);
    const modal = document.getElementById('modal-pasarela');
    const inputNumero = document.getElementById('pago-numero');
    const inputExp = document.getElementById('pago-expira');
    const inputCvc = document.getElementById('pago-cvc');
    const botonPago = document.getElementById('btn-finalizar-pago');
    const botonCancelar = document.getElementById('btn-cancelar-pago');

    requestAnimationFrame(() => {
        modal.classList.add('opacity-100');
        modal.querySelector('.relative').classList.remove('scale-90');
        modal.querySelector('.relative').classList.add('scale-100');
    });

    inputNumero.oninput = (e) => {
        let v = e.target.value.replace(/\D/g, '');
        e.target.value = (v.match(/.{1,4}/g)?.join(' ') || v).substring(0, 19);
        mostrarEstadoValidacion('pago-numero', Validador.esTarjetaValida(e.target.value));
        mostrarErrorCampo('error-pago-numero');
    };

    inputExp.oninput = (e) => {
        let v = e.target.value.replace(/\D/g, '');
        if (v.length > 2) v = v.substring(0,2) + '/' + v.substring(2,4);
        e.target.value = v;
        mostrarEstadoValidacion('pago-expira', Validador.esExpiracionValida(e.target.value));
        mostrarErrorCampo('error-pago-expira');
    };

    inputCvc.oninput = (e) => {
        mostrarEstadoValidacion('pago-cvc', Validador.esCvcValido(e.target.value));
        mostrarErrorCampo('error-pago-cvc');
    };

    botonCancelar.onclick = () => modal.remove();

    botonPago.onclick = function() {
        const num = inputNumero.value;
        const exp = inputExp.value;
        const cvc = inputCvc.value;

        let errores = 0;
        if (!Validador.esTarjetaValida(num)) { mostrarErrorCampo('error-pago-numero', 'Número inválido'); errores++; }
        if (!Validador.esExpiracionValida(exp)) { mostrarErrorCampo('error-pago-expira', 'Fecha incorrecta'); errores++; }
        if (!Validador.esCvcValido(cvc)) { mostrarErrorCampo('error-pago-cvc', 'CVC inválido'); errores++; }

        if (errores > 0) return;

        document.getElementById('form-tarjeta').classList.add('hidden');
        this.classList.add('hidden');
        botonCancelar.classList.add('hidden');
        document.getElementById('estado-conectando').classList.remove('hidden');

        setTimeout(() => {
            document.getElementById('estado-conectando').classList.add('hidden');
            document.getElementById('estado-verificando').classList.remove('hidden');
            setTimeout(() => {
                modal.remove();
                if (alConfirmar) alConfirmar();
            }, 2000);
        }, 1500);
    };
}

/**
 * Valida la existencia de una sesión de usuario activa antes de permitir una acción protegida.
 */
export function validarAccesoUsuario(mensajePersonalizado = 'Para poder continuar con esta acción, primero debes iniciar sesión.') {
    const usuario = obtenerUsuarioSesion();
    if (!usuario) {
        localStorage.setItem('url_retorno', window.location.href);
        lanzarAlerta({
            titulo: '¡Hola, humano!',
            mensaje: mensajePersonalizado,
            icono: 'lock',
            textoBoton: 'IR AL LOGIN',
            alConfirmar: () => window.location.href = '/login/'
        });
        return null;
    }
    return usuario;
}

/**
 * Gestiona el proceso completo de pago para los artículos contenidos en el carrito.
 */
export async function procesarPagoCarrito() {
    const usuario = validarAccesoUsuario('Para poder finalizar tu pedido, primero debes iniciar sesión.');
    if (!usuario) return;

    const carrito = JSON.parse(localStorage.getItem('carrito')) || [];
    if (carrito.length === 0) return;

    const totalCompra = carrito.reduce((acc, i) => acc + (i.precio * i.cantidad), 0);

    lanzarPasarelaPago({
        total: totalCompra,
        concepto: 'Tienda Catfeina',
        mostrarAvisoTienda: true, 
        alConfirmar: async () => {
            try {
                const res = await fetch('/api/productos/comprar', {
                    method: 'POST',
                    headers: cabecerasSeguras(),
                    body: JSON.stringify({ 
                        id_usuario: usuario.id || usuario.id_usuario, 
                        items: carrito, 
                        total: totalCompra 
                    })
                });
                if (res.ok) {
                    lanzarAlerta({ titulo: '¡Pago Confirmado!', mensaje: 'Pedido recibido. Recuerda que puedes recogerlo en nuestro local. ¡Gracias!', icono: 'verified' });
                    localStorage.setItem('carrito', JSON.stringify([]));
                    if (window.actualizarContadorCarrito) window.actualizarContadorCarrito();
                }
            } catch (e) { console.error("Fallo en pago:", e); }
        }
    });
}

function cabecerasSeguras() {
    return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` };
}
