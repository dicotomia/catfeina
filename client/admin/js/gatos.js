/**
 * Gestión de la información de los gatos residentes, filtros y visualización en el panel.
 */
import { interfazApi } from './interfaz-api.js';
import * as UI from './ui.js';
import { Validador, mostrarEstadoValidacion } from '../../recursos/js/utilidades.js';

let listaGatosEnCache = [];

/**
 * Obtiene el catálogo completo de gatos y actualiza los indicadores visuales.
 */
export async function cargarGatos() {
    try {
        const gatos = await interfazApi.obtener('/gatos');
        listaGatosEnCache = gatos || [];
        actualizarIndicadoresClave(listaGatosEnCache);
        renderizarTablaGatos(listaGatosEnCache);
        actualizarGraficaEstados(listaGatosEnCache);
    } catch (error) {
        UI.mostrarNotificacion('Error', 'No se pudieron cargar los datos de los gatos');
    }
}

/**
 * Calcula y muestra los contadores de rendimiento para la sección de gatos.
 */
function actualizarIndicadoresClave(gatos) {
    const indicadores = {
        'kpi-gatos-total': gatos.length,
        'kpi-gatos-adoptados': gatos.filter(g => g.estado_adopcion === 'Adoptado').length,
        'kpi-gatos-urgentes': gatos.filter(g => g.estado_adopcion === 'Urgente').length,
        'kpi-gatos-buscando': gatos.filter(g => ['En Adopción', 'Urgente'].includes(g.estado_adopcion)).length
    };
    Object.entries(indicadores).forEach(([id, valor]) => {
        const elemento = document.getElementById(id);
        if (elemento) elemento.innerText = valor;
    });
}

/**
 * Genera el contenido de la tabla de gestión de gatos con sus acciones.
 */
export function renderizarTablaGatos(gatos) {
    UI.renderizarTabla('lista-gatos-admin', gatos, gato => `
        <tr class="hover:bg-gray-50/50 transition-colors border-b last:border-0 ${gato.activo ? '' : 'opacity-50 grayscale'}">
            <td class="p-4">
                <div class="flex items-center gap-3">
                    <img src="/recursos/imagenes/${gato.imagen_url || 'logo.webp'}" 
                         class="size-12 rounded-xl object-cover shadow-sm border border-gray-100" 
                         onerror="this.src='/recursos/imagenes/logo.webp'">
                    <div class="flex flex-col">
                        <span class="font-bold text-gray-800">${gato.nombre_gato}</span>
                        <span class="text-[10px] text-gray-400 font-medium uppercase tracking-wider">${gato.raza || 'Mestizo'}</span>
                    </div>
                </div>
            </td>
            <td class="p-4">
                <span class="px-3 py-1 rounded-full text-[10px] font-black uppercase ${UI.obtenerClaseEstado(gato.estado_adopcion)}">
                    ${gato.estado_adopcion}
                </span>
            </td>
            <td class="p-4 text-center">
                <span class="material-symbols-outlined text-lg ${gato.sexo === 'Macho' ? 'text-blue-400' : 'text-pink-400'}">
                    ${gato.sexo === 'Macho' ? 'male' : 'female'}
                </span>
            </td>
            <td class="p-4 text-right">
                <div class="flex justify-end gap-1">
                    <button data-action="edit" data-type="gato" data-id="${gato.id_gato}" 
                            class="p-2 text-blue-400 hover:bg-blue-50 rounded-lg transition-all" title="Editar">
                        <span class="material-symbols-outlined text-xl">edit</span>
                    </button>
                    <button data-action="delete" data-type="gato" data-id="${gato.id_gato}" 
                            class="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-all" title="Eliminar">
                        <span class="material-symbols-outlined text-xl">delete</span>
                    </button>
                </div>
            </td>
        </tr>
    `);
}

/**
 * Realiza la subida de uno o varios archivos de imagen al servidor.
 */
async function procesarSubidaArchivos(idInput) {
    const input = document.getElementById(idInput);
    if (!input?.files?.length) return null;

    const datosFormulario = new FormData();
    Array.from(input.files).forEach(archivo => datosFormulario.append('imagenes', archivo));

    const resultado = await interfazApi.subirArchivo('/upload', datosFormulario);
    return resultado.urls;
}

/**
 * Procesa el envío del formulario para la creación o actualización de un gato.
 */
export async function manejarEnvioGato(evento) {
    evento.preventDefault();
    const idGato = document.getElementById('g-id').value;

    const nombre = document.getElementById('g-nombre').value.trim();
    const raza = document.getElementById('g-raza').value.trim();
    const color = document.getElementById('g-color').value.trim();
    const nacimiento = document.getElementById('g-nacimiento').value;
    const llegada = document.getElementById('g-llegada').value;
    const historia = document.getElementById('g-historia').value.trim();

    const nombreOk = Validador.esSoloLetras(nombre);
    const razaOk = Validador.esTextoValido(raza, 2);
    const colorOk = Validador.esTextoValido(color, 2);
    const historiaOk = Validador.esTextoValido(historia, 10);

    // Validaciones de fechas
    const nacimientoOk = nacimiento !== "" && Validador.esFechaPasada(nacimiento);
    const llegadaOk = llegada !== "" && new Date(llegada) >= new Date(nacimiento);

    mostrarEstadoValidacion('g-nombre', nombreOk, 'Introduce solo letras.');
    mostrarEstadoValidacion('g-raza', razaOk, 'Indica la raza (mín. 2 letras).');
    mostrarEstadoValidacion('g-color', colorOk, 'Indica el color.');
    mostrarEstadoValidacion('g-nacimiento', nacimientoOk, nacimiento === "" ? 'Fecha obligatoria.' : 'No puede ser una fecha futura.');
    mostrarEstadoValidacion('g-llegada', llegadaOk, llegada === "" ? 'Fecha obligatoria.' : 'No puede ser anterior al nacimiento.');
    mostrarEstadoValidacion('g-historia', historiaOk, 'Historia demasiado corta (mín. 10 carac.).');

    if (!nombreOk || !razaOk || !colorOk || !nacimientoOk || !llegadaOk || !historiaOk) {
        return UI.mostrarNotificacion('Datos incorrectos', 'Por favor, revisa los campos marcados en rojo.', 'error');
    }

    try {
        const [urlPrincipalNueva, urlsGaleriaNuevas] = await Promise.all([
            procesarSubidaArchivos('g-archivo-principal'),
            procesarSubidaArchivos('g-archivo-galeria')
        ]);

        const cuerpoPeticion = {
            nombre_gato: document.getElementById('g-nombre').value,
            sexo: document.getElementById('g-sexo').value,
            raza: document.getElementById('g-raza').value,
            color: document.getElementById('g-color').value,
            fecha_nacimiento: document.getElementById('g-nacimiento').value,
            fecha_llegada: document.getElementById('g-llegada').value,
            estado_adopcion: document.getElementById('g-estado').value,
            fecha_adopcion: document.getElementById('g-adopcion').value || null,
            esterilizado: document.getElementById('g-esterilizado').value === "1",
            personalidad: document.getElementById('g-personalidad').value,
            activo: document.getElementById('g-activo').value === "1",
            salud: document.getElementById('g-salud').value,
            historia: document.getElementById('g-historia').value,
            apto_perros: document.getElementById('g-apto-perros').value === "1",
            apto_ninos: document.getElementById('g-apto-ninos').value === "1",
            apto_otros_gatos: document.getElementById('g-apto-gatos').value === "1",
            imagen_url: urlPrincipalNueva ? urlPrincipalNueva[0] : document.getElementById('g-imagen-principal-url').value
        };

        const urlsGaleriaActual = document.getElementById('g-galeria-urls').value
            .split(',')
            .filter(url => url.trim() !== '');
            
        cuerpoPeticion.galeria = urlsGaleriaNuevas 
            ? [...urlsGaleriaActual, ...urlsGaleriaNuevas] 
            : urlsGaleriaActual;

        if (idGato) {
            await interfazApi.actualizar(`/gatos/${idGato}`, cuerpoPeticion);
        } else {
            await interfazApi.enviar('/gatos', cuerpoPeticion);
        }

        UI.cerrarModal('modal-gato');
        await cargarGatos();
        UI.mostrarExito(idGato ? 'Gato actualizado correctamente' : 'Nuevo gato añadido');
    } catch (error) {
        UI.mostrarNotificacion('Error', error.message);
    }
}

/**
 * Carga la información de un gato específico en los campos del formulario de edición.
 */
export function prepararEdicionGato(id) {
    const gato = listaGatosEnCache.find(g => g.id_gato == id);
    if (!gato) return;

    const campos = {
        'g-id': gato.id_gato,
        'g-nombre': gato.nombre_gato,
        'g-sexo': gato.sexo,
        'g-raza': gato.raza || '',
        'g-color': gato.color || '',
        'g-nacimiento': gato.fecha_nacimiento?.split('T')[0] || '',
        'g-llegada': gato.fecha_llegada?.split('T')[0] || '',
        'g-adopcion': gato.fecha_adopcion?.split('T')[0] || '',
        'g-estado': gato.estado_adopcion,
        'g-esterilizado': gato.esterilizado ? "1" : "0",
        'g-personalidad': gato.personalidad || '',
        'g-activo': gato.activo ? "1" : "0",
        'g-salud': gato.salud || '',
        'g-historia': gato.historia || '',
        'g-apto-perros': gato.apto_perros ? "1" : "0",
        'g-apto-ninos': gato.apto_ninos ? "1" : "0",
        'g-apto-gatos': gato.apto_otros_gatos ? "1" : "0",
        'g-imagen-principal-url': gato.imagen_url || '',
        'g-galeria-urls': gato.galeria_urls || ''
    };

    Object.entries(campos).forEach(([idCampo, valor]) => {
        const elemento = document.getElementById(idCampo);
        if (elemento) elemento.value = valor;
    });

    document.getElementById('modal-gato-titulo').innerText = 'Editar Gato';
    document.getElementById('g-prev-principal').src = `/recursos/imagenes/${gato.imagen_url || 'logo.webp'}`;
    renderizarMiniaturasGaleria(gato.galeria_urls || '');
    
    UI.abrirModal('modal-gato');
}

/**
 * Limpia y abre el formulario para registrar un nuevo gato en el sistema.
 */
export function abrirModalNuevoGato() {
    const formulario = document.getElementById('form-gato');
    if (formulario) formulario.reset();
    
    document.getElementById('g-id').value = '';
    document.getElementById('g-imagen-principal-url').value = '';
    document.getElementById('g-prev-principal').src = '/recursos/imagenes/logo.webp';
    document.getElementById('g-galeria-urls').value = '';
    document.getElementById('g-llegada').value = new Date().toISOString().split('T')[0];
    document.getElementById('modal-gato-titulo').innerText = 'Añadir Nuevo Gato';
    
    renderizarMiniaturasGaleria('');
    UI.abrirModal('modal-gato');
}

/**
 * Renderiza las vistas previas de las imágenes de la galería en el formulario.
 */
function renderizarMiniaturasGaleria(urlsCadena) {
    const contenedor = document.getElementById('g-galeria-prev');
    if (!contenedor) return;

    if (!urlsCadena?.trim()) {
        contenedor.innerHTML = '<p class="text-[9px] text-gray-400 w-full text-center py-2 italic">Sin fotos en la galería</p>';
        return;
    }

    const urls = urlsCadena.split(',').filter(u => u.trim());
    contenedor.innerHTML = urls.map(url => `
        <div class="relative group size-12 shadow-sm rounded-lg overflow-hidden border border-gray-100">
            <img src="/recursos/imagenes/${url}" class="size-full object-cover">
            <button type="button" data-action="eliminar-foto" data-url="${url}" 
                    class="absolute top-0 right-0 bg-red-500 text-white size-5 flex items-center justify-center rounded-bl-lg opacity-0 group-hover:opacity-100 transition-opacity">
                <span class="material-symbols-outlined text-[12px] font-bold">close</span>
            </button>
        </div>
    `).join('');

    contenedor.querySelectorAll('[data-action="eliminar-foto"]').forEach(boton => {
        boton.onclick = () => {
            const urlAEliminar = boton.dataset.url;
            const urlsActuales = document.getElementById('g-galeria-urls').value
                .split(',')
                .filter(u => u !== urlAEliminar && u.trim());
            const nuevoValor = urlsActuales.join(',');
            document.getElementById('g-galeria-urls').value = nuevoValor;
            renderizarMiniaturasGaleria(nuevoValor);
        };
    });
}

/**
 * Filtra los registros de gatos en tiempo real por estado y nombre.
 */
export function aplicarFiltrosGatos() {
    const estado = document.getElementById('filtro-gato-estado').value;
    const nombre = document.getElementById('filtro-gato-nombre').value.toLowerCase();

    const filtrados = listaGatosEnCache.filter(g => {
        return (estado === 'Todos' || g.estado_adopcion === estado) &&
               g.nombre_gato.toLowerCase().includes(nombre);
    });

    renderizarTablaGatos(filtrados);
}

/**
 * Actualiza la representación gráfica de la distribución de gatos por estado.
 */
export function actualizarGraficaEstados(datosOSimilares) {
    if (!window.Chart) return;
    const lienzo = document.getElementById('grafica-gatos-estados-dash');
    if (!lienzo) return;

    let estados = {};
    if (Array.isArray(datosOSimilares)) {
        if (datosOSimilares.length > 0 && datosOSimilares[0].estado !== undefined) {
            datosOSimilares.forEach(item => { estados[item.estado] = item.total; });
        } 
        else {
            estados = datosOSimilares.reduce((acumulador, gato) => {
                acumulador[gato.estado_adopcion] = (acumulador[gato.estado_adopcion] || 0) + 1;
                return acumulador;
            }, {});
        }
    } else {
        estados = datosOSimilares;
    }

    const etiquetas = Object.keys(estados);
    const valores = Object.values(estados);
    const paletaColores = { 
        'Urgente': '#ef4444', 
        'En Adopción': '#f97316', 
        'Reservado': '#eab308', 
        'Adoptado': '#22c55e', 
        'No Disponible': '#94a3b8', 
        'Residente VIP': '#a855f7' 
    };

    if (window.graficaGatosActiva) window.graficaGatosActiva.destroy();
    
    window.graficaGatosActiva = new Chart(lienzo, {
        type: 'doughnut',
        data: {
            labels: etiquetas,
            datasets: [{
                data: valores,
                backgroundColor: etiquetas.map(l => paletaColores[l] || '#94a3b8'),
                borderWidth: 0
            }]
        },
        options: { cutout: '75%', plugins: { legend: { display: false } } }
    });

    const contenedorLeyenda = document.getElementById('leyenda-grafica-dash');
    if (contenedorLeyenda) {
        contenedorLeyenda.innerHTML = etiquetas.map(etiqueta => `
            <div class="flex items-center gap-2">
                <div class="size-3 rounded-full shadow-sm" style="background-color: ${paletaColores[etiqueta] || '#94a3b8'}"></div>
                <div class="flex flex-col">
                    <span class="text-[10px] font-bold text-gray-400 uppercase leading-none">${etiqueta}</span>
                    <span class="text-sm font-black text-gray-700">${estados[etiqueta]}</span>
                </div>
            </div>
        `).join('');
    }
}

/**
 * Gestiona la previsualización de la imagen principal al seleccionar un archivo.
 */
document.addEventListener('change', evento => {
    if (evento.target.id === 'g-archivo-principal') {
        const archivo = evento.target.files[0];
        if (archivo) {
            const lector = new FileReader();
            lector.onload = (e) => {
                document.getElementById('g-prev-principal').src = e.target.result;
            };
            lector.readAsDataURL(archivo);
        }
    }
});
