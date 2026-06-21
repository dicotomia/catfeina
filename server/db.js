/**
 * Configuración del pool de conexiones para la base de datos MySQL.
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '.env') });

const baseDeDatos = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  charset: 'utf8mb4',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

/**
 * Validación de la disponibilidad del servicio de base de datos.
 */
baseDeDatos.getConnection()
  .then(conexion => {
    console.log("[Éxito] Conexión establecida con la base de datos MySQL.");
    conexion.release();
  })
  .catch(error => {
    console.error("[Error] No se pudo conectar a la base de datos:", error.message);
  });

export default baseDeDatos;
