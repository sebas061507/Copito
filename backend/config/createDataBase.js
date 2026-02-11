/**
 * Script de inicializacion de la base de datos
 * este script crea la base de datos si no existe 
 * Debe ejecutarse una sola vez antes de inciar el servidor 
 */

// Importar mysql2 para la conexion directa
const mysql = require('mysql2/promise');

// Importar dotenv para cargar las variables de entorno 
require('dotenv').config();

// Funcion para crear la base de datos
const createDataBase = async () => {
    let connection;

    try{
        console.log(' Iniciando creacion de la base de datos ... \n');

        //Conectar a MySQL sin especificar base de datos
        console.log(' Conectando a MySQL...');
        connection = await mysql.createConnection({
            host: Process.env.DB_HOST || 'localhost',
            port: Process.env.DB_POST || 3306,
            user: Process.env.DB_USER || 'root',
            password: Process.env.DB_PASSWORD || '',
        });

        console.log(' Conexion a MySQL establecida\n');

        //Crear la base de datos si no existe
        const dbName = process.env.DB_NAME || 'ecommerce_db';
        console.log(`Creando base de datos: ${dbName}...`);

        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}' creada/verificada exitosamente\n`);

        //Cerar conexion
        await connection.end();

        console.log(' ¡Proceso completado! Ahora puedes iniciar el servidor con: npm start\n');
    } catch (error) {
        console.error('Error al crear la base de datos:', error.message);
        console.error('\n Verifica que:');
        console.error(' 1. XAMPP esta corriendo');
        console.error(' 2. MySQL este inciado en XAMPP');
        console.error(' 3. Las credenciales en .env sean correcats\n');

        if (connection) {
            await connection.end();
        }

        process.exit(1);
    }
};

// Ejecutar la funcion 
createDataBase();