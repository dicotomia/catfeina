/**
 * Carga dinámica de los componentes base de la interfaz (navegación y pie de página).
 */

async function cargarEstructuraBase() {
    try {
        const contenedorNav = document.getElementById('nav-placeholder');
        if (contenedorNav) {
            let htmlNavegacion = localStorage.getItem('cache_nav');
            
            if (!htmlNavegacion) {
                const respuesta = await fetch('/components/nav.html');
                htmlNavegacion = await respuesta.text();
                localStorage.setItem('cache_nav', htmlNavegacion);
            }
            
            const usuario = JSON.parse(localStorage.getItem('usuario'));
            if (usuario) {
                const esPersonal = (usuario.rol === 1 || usuario.rol === 2);
                const rutaDestino = esPersonal ? '/admin/' : '/miembro/';
                
                const htmlUsuario = `
                    <a href="${rutaDestino}" class="flex items-center gap-2 px-6 py-2 rounded-full bg-principal/10 hover:bg-principal text-texto-principal transition-all border border-principal/20 shadow-sm group">
                        <span class="material-symbols-outlined text-lg group-hover:rotate-12 transition-transform">account_circle</span>
                        <span class="text-[10px] font-black uppercase tracking-widest">${usuario.nombre}</span>
                    </a>
                `;
                htmlNavegacion = htmlNavegacion.replace(/<a href="\/login"[^>]*>LOGIN<\/a>/g, htmlUsuario);
            }
            
            contenedorNav.innerHTML = htmlNavegacion;
            resaltarEnlaceActivo(contenedorNav);
            vincularMenuHamburguesa();
        }

        const contenedorFooter = document.getElementById('footer-placeholder');
        if (contenedorFooter) {
            let htmlFooter = localStorage.getItem('cache_footer');
            if (!htmlFooter) {
                const respuesta = await fetch('/components/footer.html');
                htmlFooter = await respuesta.text();
                localStorage.setItem('cache_footer', htmlFooter);
            }
            contenedorFooter.innerHTML = htmlFooter;
        }

    } catch (error) {
        console.error("[Aviso] No se pudieron cargar los componentes base:", error.message);
    }
}

/**
 * Resalta visualmente el enlace de navegación correspondiente a la página actual.
 */
function resaltarEnlaceActivo(contenedor) {
    const rutaActual = window.location.pathname;
    const enlaces = contenedor.querySelectorAll('.nav-link');
    
    enlaces.forEach(enlace => {
        const destino = enlace.getAttribute('href');
        const coincide = (rutaActual === '/' && destino === '/') || (destino !== '/' && rutaActual.startsWith(destino));
        
        if (coincide) {
            enlace.classList.add('text-principal', 'border-b-2', 'border-principal');
            enlace.classList.remove('text-gray-500');
        }
    });
}

/**
 * Habilita el control de apertura y cierre del menú lateral en dispositivos móviles.
 */
function vincularMenuHamburguesa() {
    const botonMenu = document.getElementById('menu-btn');
    const listaEnlaces = document.getElementById('menu-lista');
    if (botonMenu && listaEnlaces) {
        botonMenu.onclick = () => {
            listaEnlaces.classList.toggle('hidden');
            listaEnlaces.classList.toggle('flex');
        };
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', cargarEstructuraBase);
} else {
    cargarEstructuraBase();
}
