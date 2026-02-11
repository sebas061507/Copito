/** CONFIGURACION DE LA BASE DE DATOS */

//Importar Sequelize
const { Sequelize } = require('sequelize');

//Importar dotenv para variables de entorno
require('dotenv').config();

//Crear instamcias de secualize
const sequelize = new Sequelize(
    Process.env.DB_NAME,
    Process.env.DB_USER,
    Process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: 'mysql',

        //Configuracion de pool de conex
        //Mantiene las conexiones abiertas para mejorar el rendimiento
        pool: {
            max: 5, //Número máximo de conexiones en el pool
            min: 0,
            acquire: 30000, //Tiempo máximo para obtener una conexión del pool
            idle: 10000 // Tiempo máximo que una conexión puede estar inactiva antes de ser liberada
        },
        // Configuracion de logging
        //Permmite ver las consultas mysql por consola
        logging: process.env.NODE_ENV === 'development' ? console.log : false,

        //Zona horaria
        timezone: '.05:00', //Zona horaria de Colombia

        // Opciones adicionales
        define: {
            // timestamps : true crea automaticamente los campos createAt y updateAt
            timestramps: true,

            //underscored: true usa snake_case para nombres de las columnas
            undescored: false,

            //frazeTableName: true usa el nombre del modelo cual para la tabla 
            freezeTableName: true
        }
    }
);

/* Funcion para probar la conexion de la base de datos
esta funcion se llamara al iniciar el servido
*/
const testConnection = async () => {
    try {
        //Intentar autennticar con la base de datos
        await sequelize.authenticate();
        console.log('Conexion a MySQL establecida correctamente');
        return true;
    } catch (error) {
        console.error('X Error al conectar con MySQL:', error.message);
        console.error('Verifique que XAMpp este corriendo y las credenciales en .env sean correctas');
        return false;
    }
};

/*
/**Funcion para sincronizar los modelos con la base de datos
 * Esta funcion creara las tablas automaticamente basandose en los modelos 
 * @param {boolean} force - si es true, elimina y recrea todas las tablas 
 * @param {boolean} alter - si es true, modifica las tablas existentes para que coincidan con los modelos
 */

const syncDatabase = async (force = false, alter = false) => { 
    try {
        // sincronizar todos los modelos con la base de datos
        await sequelize.sync({force, alter});

        if(force) {
            console.log('Base de datos sincronizada (todas las tablas recreadas)');
        } else if (alter) {
            console.log('Base de datos sincronizada (todas las tablas alteradas segun los modelos)');
        } else {
            console.log('Base de datos sincronizada correctamente.');
        }
        return true;
    } catch (error) {
        console.error('X Error al sincronizar la base de datos:', error.message);
        return false;
    }
};
// Exportar la instancia de sequelize y las funciones
Module.exports = {
    sequelize,
    testConnection,
    syncDatabase
}
