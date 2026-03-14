/**
 * Servidor principal del backend
 * Este es el archivo principal del servidor de backend
 * configure express, middlewares, rutas, y la coneccion de base de datos
 */

//IMPORTACIONES
const express = require('express');

//importar cors para permitir solicitudes desde el frontend
const cors = require('cors');

//importar path para manejar rutas de archivos
const path = require('path');

//importar dotenv para manejar variables de entorno
require('dotenv').config();

//importar configuracion de la base de datos
const { testConnection, syncDatabase: syncDataBase } = require('./config/dataBase');

//importar modelos y asociaciones
const { initAssociations } = require('./models');

//importar seeders
const {runSeeders} = require('./seeders/adminSeeder');

//crear aplicaciones express
const app = express();

//obtener el puerto desde la variable de entorno
const PORT = process.env.PORT || 5000;

//MIDDLEWARES GLOBALES

//cors permite peticiones desde el frontend
//configura que los dominios puedan hacer peticiones el backend

app.use(cors({
    origin : process.env.FRONTEND_URL || 'http://localhost:3000', //permitir solo el frontend
    credentials : true, //permitir envio de credenciales
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],// metodos permitidos
    allowedHeaders: ['Content-Type', 'Authorization'] //headers permitidos
}));

/**
 * express.json() parsear el body de las peticiones en formato JSON
 */

app.use(express.json());

/**
 * express.urlencoded() pasar el body de los formularios
 * las imagenes estaran disponibles
 */

app.use(express.urlencoded({extended: true}));

/**
 * servir archivos estaticos imagenes desde la carpeta raiz 
 */

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

//middleware para logging de peticiones 
//muestra en consola cada peticion que llega al servidor

if(process.env.NODE_ENV === 'development') {
    app.use((req, res, next) => {
        console.log(`ok ${req.method} ${req.path}`);
        next();
    });
}

//rutas

//rutas raiz verificar que el servidor esta corriendo

app.get('/,', (req, res) => {
    res.json({
        success: true,
        message: 'Servidor E-commerce Backend corriendo correctamente',
        version: '1.0.0',
        timeStamp: new Date().toISOString()
    });
});

//ruta de salud que verifica como esta el servidor
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        status: 'healthy',
        database: 'connected',
        timeStamp: new Date().toISOString()
    });
});

//rutas api 

//rutas de autenticacion
//incluye registro login, perfil

const authRoutes = require('./routes/auth.routes');
app.use('/api/auth', authRoutes);

//rutas del admin
//requieren autenticacion y reol de admin
const adminRoutes =require('./routes/admin.routes');
app.use('/api/admin', adminRoutes);

//rutas del cliente
//requieren autenticacion y rol de cliente
const clienteRoutes = require('./routes/cliente.routes');
// montar las rutas de cliente en /api para que /api/catalogo/* funcione
app.use('/api', clienteRoutes);
// también mantener el prefijo /api/cliente para compatibilidad
app.use('/api/cliente', clienteRoutes);

//rutas manejo de rutas no encontradas (404)

app.use((req,res) => {
    res.status(404).json({
        success: false,
        message: 'Ruta no encontrada',
        path: req.path
    });
});

//manejo de errores globales

app.use((err, req, res, next) => {
    console.error('Error:', err.message);
    //error de multer subida de archivos
    if(err.name === 'MulterError'){
        return res.status(400).json({
            success: false,
            message: 'Error al subir el archivo',
            err: err.message
        });
    }
    
    //otros errores 
    res.status(500).json({
        success: false,
        message: err.message ||'Error interno del servidor',
        ...(process.env.NODE_ENV === 'development' && {stack: err.stack})
    })
});

//incializar servidor y base de datos 

/** 
 * funcion principal para iniciar el servidor
 * prueba la conexion a MySQL
 * sincroniza los modelos (crea las tablas)
 * inicia el servidor express
 */

let server;

const startServer = async () => {
    try{
        //paso 1 probar conexiones a MySQL
        console.log('Conectando a MySQL...');
        const dbConnected = await testConnection();

        if(!dbConnected) {
            console.error('No se pudo conectar a MySQL, verificar XAMPP y el archivo .env');
            process.exit(1); //salir si no hay conexion 
        }

        //paso 2 sincronizar modelos (crear las tablas)
        console.log('Sincronizando modelos con base de datos');

        //inicializar asociaciones entre modelos 
        initAssociations();

        //en desarrollo alter puede ser true para actualizar la estructura 
        //en produccion debe ser false para no perder datos
        const alterTables = process.env.NODE_ENV === 'development';
        const dbSynced = await syncDataBase(false, alterTables);

        if(!dbSynced) {
            console.error('No se pudo sincronizar la base de datos');
            process.exit(1); //salir si no se puede sincronizar
        }

        //paso 3 ejecutar seeders datos iniciales
        await runSeeders();

        //paso 4 iniciar el servidor express
        server = app.listen(PORT, () => {
            console.log('\n ______________________');
            console.log(`Servidor corriendo en el puerto ${PORT}`);
            console.log(`URL: http://localhost:${PORT}`);
            console.log(`Base de datos ${process.env.DB_NAME}`);
            console.log(`Modo: ${process.env.NODE_ENV}`);
            console.log('Servidor listo para realizar peticiones');
        });
    }catch(error) {
        console.error('X Error fatal al inciar el servidor:', error.message);
        process.exit(1);
    }
};

//manejo de cierre
//captura el ctrl+c para cerrar el servidor correctamente

process.on('SIGINT', () => {
    console.error('\n\n Cerrando el servidor...');
    process.exit(0);
});

//capturar errores no manejados
process.on('unhandledRejection', (err) => {
    console.error('X error no manejado:', err.message);
    if (server && typeof server.close === 'function') {
        server.close(() => {
            process.exit(1);
        });
    } else {
        process.exit(1);
    }
});

// Iniciar el servidor solo si se ejecuta directamente (no cuando se importa en tests)
if (require.main === module) {
    startServer();
}

//exportar app para testing (y opcionalmente permitir iniciar el servidor)
module.exports = app;
module.exports.startServer = startServer;
