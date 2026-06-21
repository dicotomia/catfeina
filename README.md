#  Catfeina - Proyecto Final DAW

¡Bienvenido a Catfeina! Este proyecto está diseñado para ser flexible en su ejecución. Puedes elegir el método que mejor te convenga, pero recomendamos usar los scripts de automatización.

##  Opciones de Ejecución

### 1. Instalación Automática (Recomendado )
Hemos preparado scripts para que no tengas que configurar nada manualmente. Solo necesitas tener **Docker Desktop** abierto.

*   **En Windows:** Haz doble clic en `setup.bat`.
*   **En Linux/macOS:** Ejecuta `chmod +x setup.sh && ./setup.sh` en la terminal.

**¿Qué hace el script?**
1. Verifica que Docker esté instalado.
2. Levanta los contenedores de Node.js y MySQL.
3. Importa automáticamente la base de datos `catfeina_db.sql`.
4. Abre la aplicación en tu navegador (`http://localhost:3000`).

### 2. Ejecución Local (Manual)
Ideal si prefieres usar tu propia instancia de MySQL (como MySQL Workbench).
1. **Base de Datos:** Importa el SQL de `server/database/catfeina_db.sql`.
2. **Dependencias:** Entra en la carpeta `server/` y ejecuta `npm install`.
3. **Servidor:** Ejecuta `node index.js`.
4. **Configuración:** El sistema usará el puerto `3306` por defecto (configurable en el archivo `.env`).
