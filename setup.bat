@echo off
echo ==========================================
echo   INSTALACION CATFEINA
echo ==========================================
echo Presiona una tecla para empezar...
pause >nul
cd /d "%~dp0"
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker no esta instalado.
    pause
    exit /b
)
echo [OK] Docker detectado.
echo Levantando los contenedores MySQL y Node.js.
echo [INFO] Creando/actualizando el archivo .env en el servidor...
(
echo DB_HOST=localhost
echo DB_USER=root
echo DB_PASSWORD=root
echo DB_NAME=catfeina_db
echo DB_PORT=3307
echo JWT_SECRET=secreto_super_seguro_catfeina_2026
echo PORT=3000
) > server\.env
docker compose up -d --build
if %errorlevel% neq 0 (
    echo [ERROR] Error al hacer docker compose up.
    pause
    exit /b
)
echo [INFO] Esperando a que la base de datos este lista para asegurar la carga de datos...
timeout /t 15 /nobreak
docker compose exec -T db mysql -u root -proot --default-character-set=utf8mb4 < server/database/catfeina_db.sql
echo [OK] Aplicacion levantada con exito y base de datos inicializada.
echo Los contenedores estan corriendo en segundo plano. Para detenerlos, usa: docker compose down.
start http://localhost:3000
echo Servidor arrancado en http://localhost:3000 Presiona cualquier tecla para cerrar esta ventana...
pause >nul
