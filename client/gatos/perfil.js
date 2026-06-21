/**
 * Gestión de la ficha técnica del gato, galería de imágenes y trámites de adopción o apadrinamiento.
 */

import { obtenerUsuarioSesion } from '../recursos/js/utilidades.js';
import { lanzarAlerta, validarAccesoUsuario } from '../recursos/js/modales.js';
import { inicializarEstructuraCarrito } from '../recursos/js/carrito.js';

document.addEventListener('DOMContentLoaded', () => {
    inicializarPerfilGato();
    inicializarEstructuraCarrito();
});

/**
 * Inicializa la página extrayendo el identificador del gato de los parámetros de búsqueda.
 */
function inicializarPerfilGato() {
    const parametros = new URLSearchParams(window.location.search);
    const idGato = parametros.get('id');

    if (!idGato) {
        window.location.href = '/gatos/'; 
        return;
    }

    obtenerDatosGato(idGato);
}

/**
 * Obtiene la información completa del residente desde el servidor.
 */
async function obtenerDatosGato(id) {
    try {
        const respuesta = await fetch(`/api/gatos/${id}`);
        if (!respuesta.ok) throw new Error('El gato solicitado no existe');
        
        const gato = await respuesta.json();
        dibujarPerfilGato(gato);
    } catch (error) {
        console.error("[Error] al cargar perfil:", error.message);
        document.getElementById('perfil-nombre').innerText = "Gato no encontrado";
    }
}

/**
 * Distribuye los datos del gato en los diferentes componentes de la interfaz.
 */
function dibujarPerfilGato(gato) {
    asignarTexto('meta-titulo', `Perfil de ${gato.nombre_gato} | Catfeina`);
    asignarTexto('breadcrumb-nombre', gato.nombre_gato);
    asignarTexto('perfil-nombre', gato.nombre_gato);
    asignarTexto('perfil-raza-color', `${gato.raza || 'Mestizo'} • ${gato.color || 'Color único'}`);
    asignarTexto('perfil-sexo', gato.sexo);
    asignarTexto('perfil-raza', gato.raza || 'Común');
    asignarTexto('historia-nombre', gato.nombre_gato);

    asignarTexto('perfil-edad', calcularEdadLegible(gato.fecha_nacimiento));

    configurarGaleriaFotos(gato);

    dibujarEtiquetaEstado(gato.estado_adopcion);

    dibujarRasgosPersonalidad(gato.personalidad);

    const contenedorHistoria = document.getElementById('perfil-historia');
    if (contenedorHistoria) {
        const texto = gato.historia || "Próximamente conocerás su historia...";
        contenedorHistoria.innerHTML = `<p class="leading-relaxed italic">${texto.replace(/\n/g, '</p><p class="mt-4 leading-relaxed italic">')}</p>`;
    }

    dibujarSeccionSalud(gato);
    dibujarSeccionCompatibilidad(gato);

    configurarBotonesAccion(gato);
}

/**
 * Configura el visor principal de imágenes y la lista de miniaturas de la galería.
 */
function configurarGaleriaFotos(gato) {
    const visorPrincipal = document.getElementById('img-principal-display');
    const contenedorMiniaturas = document.getElementById('galeria-miniaturas');
    if (!visorPrincipal || !contenedorMiniaturas) return;

    const rutaPortada = gato.imagen_url ? `/recursos/imagenes/${gato.imagen_url}` : '/recursos/imagenes/logo.webp';
    visorPrincipal.src = rutaPortada;

    const fotos = [rutaPortada];
    if (Array.isArray(gato.imagenes_secundarias)) {
        gato.imagenes_secundarias.forEach(url => fotos.push(`/recursos/imagenes/${url}`));
    } else if (gato.galeria_urls) {
        gato.galeria_urls.split(',').forEach(url => fotos.push(`/recursos/imagenes/${url.trim()}`));
    }

    contenedorMiniaturas.innerHTML = fotos.map((src, indice) => `
        <button class="miniatura-foto size-20 rounded-2xl overflow-hidden border-2 transition-all flex-shrink-0 ${indice === 0 ? 'border-principal shadow-md scale-105' : 'border-transparent opacity-60 hover:opacity-100'}"
                data-src="${src}">
            <img src="${src}" class="size-full object-cover" onerror="this.src='/recursos/imagenes/logo.webp'">
        </button>
    `).join('');

    contenedorMiniaturas.addEventListener('click', (e) => {
        const boton = e.target.closest('.miniatura-foto');
        if (!boton) return;

        visorPrincipal.src = boton.dataset.src;
        document.querySelectorAll('.miniatura-foto').forEach(b => {
            b.classList.remove('border-principal', 'shadow-md', 'scale-105');
            b.classList.add('border-transparent', 'opacity-60');
        });
        boton.classList.add('border-principal', 'shadow-md', 'scale-105');
        boton.classList.remove('opacity-60');
    });
}

/**
 * Gestiona la visibilidad y el comportamiento de los botones de adopción y apadrinamiento.
 */
async function configurarBotonesAccion(gato) {
    const btnAdoptar = document.getElementById('btn-adoptar');
    const btnApadrinar = document.getElementById('btn-apadrinar');

    if (btnAdoptar) {
        const noAdoptable = ['Residente VIP', 'Reservado', 'Adoptado'].includes(gato.estado_adopcion);
        if (noAdoptable) {
            btnAdoptar.innerHTML = `<span class="material-symbols-outlined text-xl">home</span> YA TIENE UN HOGAR`;
            btnAdoptar.className = "w-full py-4 rounded-2xl bg-gray-100 text-gray-400 font-black flex items-center justify-center gap-2 cursor-default";
        } else {
            btnAdoptar.onclick = () => {
                const usuario = validarAccesoUsuario(`Para poder iniciar el proceso de adopción de ${gato.nombre_gato}, primero debes iniciar sesión.`);
                if (usuario) {
                    const visorPrincipal = document.getElementById('img-principal-display');
                    const nombreFoto = visorPrincipal.src.split('/').pop();
                    window.location.href = `/adoptar/?id=${gato.id_gato}&nombre=${encodeURIComponent(gato.nombre_gato)}&imagen=${encodeURIComponent(nombreFoto)}`;
                }
            };
        }
    }

    if (btnApadrinar) {
        btnApadrinar.onclick = () => {
            const usuario = validarAccesoUsuario(`Para poder convertirte en el padrino o madrina de ${gato.nombre_gato}, primero debes iniciar sesión.`);
            if (usuario) {
                const visorPrincipal = document.getElementById('img-principal-display');
                const nombreFoto = visorPrincipal.src.split('/').pop();
                window.location.href = `/apadrinar/formulario.html?gato=${encodeURIComponent(gato.nombre_gato)}&imagen=${encodeURIComponent(nombreFoto)}`;
            }
        };
        
        const sesion = JSON.parse(localStorage.getItem('usuario'));
        if (sesion) {
            try {
                const res = await fetch('/api/usuarios/padrinazgos', {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                });
                if (res.ok) {
                    const padrinazgos = await res.json();
                    const hoy = new Date();
                    const apadrinamientoActivo = padrinazgos.find(p => 
                        p.id_gato === gato.id_gato && 
                        (p.fecha_fin === null || new Date(p.fecha_fin) >= hoy)
                    );

                    if (apadrinamientoActivo) {
                        btnApadrinar.innerHTML = `GRACIAS POR AYUDAR`;
                        btnApadrinar.className = "w-full py-4 rounded-2xl border-2 border-principal/30 bg-principal/5 text-principal font-black flex items-center justify-center gap-2 cursor-default transition-all shadow-inner";
                        btnApadrinar.onclick = null;
                    }
                }
            } catch (e) { }
        }
    }
}

/**
 * Calcula la edad del animal en formato de texto legible.
 */
function calcularEdadLegible(fecha) {
    const nacimiento = new Date(fecha);
    const hoy = new Date();
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const m = hoy.getMonth() - nacimiento.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) edad--;
    
    if (edad <= 0) return "Cachorro";
    return edad === 1 ? "1 Año" : `${edad} Años`;
}

/**
 * Asigna el valor de texto a un elemento del DOM indicado.
 */
function asignarTexto(id, valor) {
    const el = document.getElementById(id);
    if (el) el.innerText = valor || '--';
}

/**
 * Genera el componente visual de la etiqueta de estado del gato.
 */
function dibujarEtiquetaEstado(estado) {
    const div = document.getElementById('etiqueta-estado');
    if (!div) return;
    div.classList.remove('hidden');
    
    const config = {
        'Reservado': { clase: 'bg-amber-400 text-neutral-900 border-amber-500/20', icono: 'lock' },
        'Urgente': { clase: 'bg-red-500 text-white animate-pulse shadow-red-200', icono: 'warning' },
        'Residente VIP': { clase: 'bg-purple-100 text-purple-700 border-purple-200', icono: 'stars' },
        'default': { clase: 'bg-white text-texto-principal border-gray-200', icono: 'pets' }
    };
    
    const c = config[estado] || config['default'];
    div.className = `absolute top-6 left-6 backdrop-blur-md px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-xl ${c.clase}`;
    div.innerHTML = `<span class="material-symbols-outlined text-sm icon-filled">${c.icono}</span> ${estado}`;
}

/**
 * Renderiza los rasgos de personalidad del animal mediante etiquetas.
 */
function dibujarRasgosPersonalidad(texto) {
    const contenedor = document.getElementById('perfil-personalidad');
    if (!contenedor) return;
    contenedor.innerHTML = (texto || 'Carácter por descubrir').split(',').map(rasgo => `
        <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-sm font-semibold border border-green-200 dark:border-green-800">
            <span class="material-symbols-outlined text-sm">pets</span> ${rasgo.trim()}
        </span>
    `).join('');
}

/**
 * Genera el listado de información relativa al estado de salud.
 */
function dibujarSeccionSalud(gato) {
    const lista = document.getElementById('lista-salud');
    if (!lista) return;
    lista.innerHTML = '';
    if (gato.esterilizado) agregarItemLista(lista, 'Esterilizado/a', 'check_circle', 'text-green-600');
    if (gato.salud) agregarItemLista(lista, gato.salud, 'medical_services', 'text-blue-500');
}

/**
 * Genera el listado de compatibilidades y preferencias del animal.
 */
function dibujarSeccionCompatibilidad(gato) {
    const listaLikes = document.getElementById('lista-likes');
    const listaDislikes = document.getElementById('lista-dislikes');
    
    if (listaLikes) {
        listaLikes.innerHTML = '';
        agregarItemLista(listaLikes, 'Las siestas al sol y el cariño', 'wb_sunny', 'text-orange-400');
        if (gato.apto_ninos) agregarItemLista(listaLikes, 'Jugar con niños respetuosos', 'child_care', 'text-green-500');
        if (gato.apto_otros_gatos) agregarItemLista(listaLikes, 'La compañía de otros gatos', 'group', 'text-blue-500');
        if (gato.apto_perros) agregarItemLista(listaLikes, 'Convivir con perros tranquilos', 'pets', 'text-blue-500');
    }

    if (listaDislikes) {
        listaDislikes.innerHTML = '';
        agregarItemLista(listaDislikes, 'Ruidos fuertes y brusquedad', 'volume_off', 'text-red-500');
        if (!gato.apto_perros) agregarItemLista(listaDislikes, 'La convivencia con perros', 'pets', 'text-red-500');
        if (!gato.apto_ninos) agregarItemLista(listaDislikes, 'El ajetreo excesivo de niños', 'do_not_touch', 'text-red-500');
        if (!gato.apto_otros_gatos) agregarItemLista(listaDislikes, 'Compartir su territorio', 'block', 'text-red-500');
    }
}

/**
 * Añade un elemento informativo con icono y color a una lista del DOM.
 */
function agregarItemLista(lista, texto, icono, colorClase) {
    const li = document.createElement('li');
    li.className = "flex items-start gap-2 text-sm text-texto-secundario dark:text-gray-300";
    li.innerHTML = `<span class="material-symbols-outlined ${colorClase} text-base mt-0.5 shrink-0">${icono}</span><span>${texto}</span>`;
    lista.appendChild(li);
}
