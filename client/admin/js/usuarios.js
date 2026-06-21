/**
 * Gestión de los perfiles de usuario, roles y permisos de acceso en el panel.
 */
import { interfazApi } from './interfaz-api.js';
import * as UI from './ui.js';

let listaUsuariosEnCache = [];

/**
 * Obtiene la lista completa de usuarios registrados desde el servidor.
 */
export async function cargarUsuarios() {
    try {
        const usuarios = await interfazApi.obtener('/usuarios');
        listaUsuariosEnCache = usuarios || [];
        renderizarTablaUsuarios(listaUsuariosEnCache);
    } catch (error) {
        UI.mostrarNotificacion('Error', 'No se pudieron cargar los usuarios');
    }
}

/**
 * Genera el contenido de la tabla para la gestión administrativa de usuarios.
 */
function renderizarTablaUsuarios(usuarios) {
    UI.renderizarTabla('lista-usuarios-admin', usuarios, usuario => `
        <tr class="hover:bg-gray-50/50 transition-colors border-b last:border-0">
            <td class="p-4 font-bold text-gray-800">
                ${usuario.nombre} ${usuario.apellidos}
                <div class="text-[10px] text-gray-400 font-normal uppercase italic">ID: #${usuario.id_usuario}</div>
            </td>
            <td class="p-4 text-sm text-gray-600">
                ${usuario.email}
                <div class="text-xs text-gray-400">${usuario.telefono || 'Sin teléfono'}</div>
            </td>
            <td class="p-4 text-sm text-gray-500">${UI.formatearFecha(usuario.fecha_registro)}</td>
            <td class="p-4">
                <span class="px-3 py-1 rounded-full text-[10px] font-black uppercase border ${UI.obtenerClaseRol(usuario.nombre_rol)}">
                    ${usuario.nombre_rol || 'Miembro'}
                </span>
            </td>
            <td class="p-4 text-right">
                <button data-action="edit" data-type="usuario" data-id="${usuario.id_usuario}" 
                        class="p-2 text-primary hover:bg-primary/5 rounded-lg transition-all" title="Editar Perfil">
                    <span class="material-symbols-outlined text-xl">edit</span>
                </button>
            </td>
        </tr>
    `);
}

/**
 * Carga la información de un usuario específico en el formulario de edición de perfil.
 */
export function prepararEdicionUsuario(id) {
    const usuario = listaUsuariosEnCache.find(u => u.id_usuario == id);
    if (!usuario) return;
    
    document.getElementById('u-id').value = usuario.id_usuario;
    document.getElementById('u-nombre').value = usuario.nombre;
    document.getElementById('u-apellidos').value = usuario.apellidos;
    document.getElementById('u-email').value = usuario.email;
    document.getElementById('u-telefono').value = usuario.telefono || '';
    document.getElementById('u-rol').value = usuario.id_rol;
    
    UI.abrirModal('modal-usuario');
}

/**
 * Procesa la actualización de los datos de perfil y asignación de rol de un usuario.
 */
export async function manejarEnvioUsuario(evento) {
    evento.preventDefault();
    const idUsuario = document.getElementById('u-id').value;
    
    const cuerpoPeticion = {
        nombre: document.getElementById('u-nombre').value,
        apellidos: document.getElementById('u-apellidos').value,
        email: document.getElementById('u-email').value,
        telefono: document.getElementById('u-telefono').value,
        id_rol: document.getElementById('u-rol').value
    };

    try {
        await interfazApi.actualizar(`/usuarios/${idUsuario}`, cuerpoPeticion);
        UI.cerrarModal('modal-usuario');
        await cargarUsuarios();
        UI.mostrarExito('Usuario actualizado correctamente');
    } catch (error) {
        UI.mostrarNotificacion('Error', error.message);
    }
}
