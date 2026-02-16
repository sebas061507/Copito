/**
 * Configuracion de subida de archivos
 * 
 * Multer es un middleware para manejar la subida de archivos 
 * Este archivo configura como y donde se guardan las imagenes
 */

// Importar multer para manejar archivos 
const multer = require('multer');

//Importar path para trabjaar con rutas de archivos
const path = require('path');

// Importar fs para verificar /crear directorios 
const fs = require('fs');

//importar dotenv para variables de entorno 
require('dotenv').config();

// Obtener la ruta de donde se guardan los archivos
const uploadPath = process.env.UPLOAD_PATH || './uploads';

//Veridicar si la carpeta uploads existe, si no crearla
if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
    console.log(`Carpeta ${uploadPath} creada`);
}

/**
 * Configuracion de almacenimiento fisico de multer
 * Define donde y como se guardaran los archivos
 */

const storage = multer.diskStorage({
    /**
     * Destination: define la carpeta destio donde se guardara el archivo
     * 
     * @param {Object} req - Objeto de peticion HTTP
     * @param {Object} file - Archivo que esta subiendo
     * @param {Function} cb - Callback que se llama con (error, destination){
     */
    destination: function (req, file, cb) {
        // cb(null, ruta) => sin error, ruta = carpeta destino
        cb(null, uploadPath);
    },
    
    /**
     * Filename: Define el nombre con el que se guardara el archivo
     * formati: tiemstamp-nombreoriginal.ext
     * 
     * @param {Object} req - Objeto de peticion HTTP
     * @param {Object} file - Archivo que se esta subiendo
     * @param {Function} cb - Callback que se llama con (error, filename)
     */
    filename: function (req, file, cb) {
        //Genera nombre unico usando timestamp + nombre original
        //Date.now() genera un tiemstamp unico 
        //path.extname() extrae la extension dek archivo (.jpg, .png, etc)
        const uniqueName = Date.now() + '-' + file.originalName;
        cb(null, uniqueName);
    }
});

/**
 * Filtro para validar el tipo de archivo
 * solo permire imagenes (jpg, jpeg, png, gif)
 * 
 * @param {Object} req - Objeto de peticion HTTP
 * @param {Object} file - Archivo que se esta subiendo
 * @param {Function} cb - Callback que se llama con (error, acceptFile)
 */
const fileFilter = (req, file, cb) => {
    //Tiempos Mime permitidos para imagenes
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];

    //Verificar si el tipo de archivo esta en la lista permitida
    if(allowedMimeTypes.includes(file.mimetype)) {
        // cb(null, true) -> aceptar el archivo
        cb(null, true);
    } else {
        //cb(error) -> rechazar el archivo
        cb(new Error('Solo permite imagenes (JPEG, JPG, PNG, GIF)'), false);
    }
};

/**
 * Configurar multer con las opciones definidas
 */

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limist: {
        //Limite de tamaño del archino en bytes
        //por defecto 5MB (5 * 1024) 5242800 bytes
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5242800
    }
});

/**
 * Funcion para eliminar el archivo del servidor
 * Util cuando se actualiza o elimina el producto
 * 
 * @param {String} filename - nombre del archivo a eliminar
 * @returns {Boolean} - true si se elimino, false si hubo un error 
 */

const deleteFile = (filename) => {
    try {
        //Construit la ruta completa del archivo
        const filePath = path.join(uploadPath, filename);

        //Verificar si  el archivo existe 
        if (fs.existsSync(filePath)) {
            //Eliminar el archivo
            fs.unlinkSync(filePath);
            console.log(`Archivo eliminado: ${filename}`);
            return true;
        } else {
            console.log(`Archivo no escontrado: ${filename}`);
            return false;
        }
    } catch (error) {
        console.error('Error al eliminar archivo:', error.message);
        return false;
    }
}; 

// Exportar configuracion de multer y funcion de eliminacion
module.exports = {
    upload,
    deleteFile
};