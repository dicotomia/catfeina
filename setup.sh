#!/bin/bash
echo -e "=========================================================="
echo -e "       CATFEINA - Script de Instalación (DOCKER)"
echo -e "=========================================================="
if ! command -v docker &> /dev/null
then
    echo -e "[ERROR] Docker no está instalado."
    exit 1
fi
if ! docker info &> /dev/null
then
    echo -e "[ERROR] El daemon de Docker no está en ejecución. Asegúrate de que Docker Desktop esté abierto."
    exit 1
fi
echo -e "[OK] Docker detectado. Levantando los contenedores MySQL y Node.js"

echo -e "[INFO] Creando/actualizando el archivo .env en el servidor..."
echo "DB_HOST=localhost" > server/.env
echo "DB_USER=root" >> server/.env
echo "DB_PASSWORD=root" >> server/.env
echo "DB_NAME=catfeina_db" >> server/.env
echo "DB_PORT=3307" >> server/.env
echo "JWT_SECRET=secreto_super_seguro_catfeina_2026" >> server/.env
echo "PORT=3000" >> server/.env

docker compose up -d --build

echo -e "[INFO] Esperando a que la base de datos esté lista para asegurar la carga de datos..."
sleep 15 # Esperar un poco más para que MySQL procese el init.sql

# Forzar la importación manual del script SQL por si el volumen ya existía
echo -e "[INFO] Cargando datos iniciales de catfeina_db.sql..."
docker compose exec -T db mysql -u root -proot --default-character-set=utf8mb4 < server/database/catfeina_db.sql

if [ $? -eq 0 ]; then
    echo -e "
[OK] Aplicación levantada con éxito y base de datos inicializada."
    echo -e "
Puedes acceder a la aplicación en:
http://localhost:3000

Los contenedores están corriendo en segundo plano.
Para detenerlos, usa: docker compose down
"
else
    echo -e "[ERROR] Algo salió mal al levantar Docker."
    exit 1
fi
