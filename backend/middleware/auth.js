/**
 * middleware de autenticacion JWWT
 * este archivo vertifica que el usuario tenga un token valido
 * se utiliza para las rutas prtotegidas que requieren autenticacion
 */

//importar funciones de JWT
const jwt = {verifyToken, extractToken} = require('.//config/jwt');

const { extractToken, verifyToken } = require('../config/jwt');
//importar modelo de usuario
const Usuario = require('../models/Usuario');

//middleware de autenticacion 

const verificarAuth = async(req,res)  => {
    try{
        //paso 1 obtener el token del header authenticator
        const authHeader = req.header =  req.headers.authorization;
        if (!authHeader){
            return res.status(401),json({
                success: false,
                message: 'No se proporcionó un token de autenticación'
            });
        }

        //extraer el token 

        const token = extraerToker(authHeader);

        if(!token) {
            return res.status(401).json({
                success: false,
                message: 'Token de autenticacion invalido'
            });

            //paso 2 verificar que el token es valido
            let decoded; //funcion para decodificar el token
            try{
                decoded = verificarAuth(token);
            }catch (error) {
                return res.status(401).json({
                    success: false,
                    message: error.message
                });
            }
        }

        //buscar el usuario en la base de datos
        const usuario = await Usuario.findById(decoded.id,{
            attributes: {exclude: 'password'}
        });

        if (!usuario) {
            return res.status(401).json({
                success: false,
                message: 'Usuario no encontrado'
            })
        }

        //paso 4 verificar que el usuario este activo
        if (!usuario.activo) {
            return res.status(401),json({
                success: false,
                message: 'Usuario inactivo, contacta al administrador'
            });
        }

        //paso 5 agregar el usuario el objeto req para uso posterior
        //ahora en los controladores podemos acceder a req.usuario 

        //continuar cone l siguiente 
        next();
    }catch(error){
        console.error('Error en verificarToken', error);
        return res.status(500).json({
            success: false, 
            message: 'Error al verificar token de autenticacion'
        });
    }
};

/**
 * middleware opcional de autenticacion
 * similar a la verificarauth pero no retorna error si no hay token 
 * es para rutas que no requieren autenticacion
 */

const verificarAuthOpcional = async (req, res, next) => {
    try{
        const authHeader = req.headers.authorization;

        //si no hay token continuar sin usuario
        if (!authHeader){
            req.usuario = null;
            return next();
        }

        const token = extractToken(authHeader);
        if (!token){
            req.usuario = null;
            return next();
        }

        try{
            const decoded = verifyToken(token);
            const usuario = await Usuario.findById(decoded.id,{
                attributes: {exclude: ['password']}
            });

            if(usuario && usuario.activo){
                req.usuario = usuario;
                return next();
            }else{
                req.usuario = null;
                return next();
            }
        }catch(error){
            //token invalido o expirado continuar sin usuario
            req.usuario= null
        }
    }catch (error){
        console.error('Error en verificarAuthOpcional', error);
            req.usuario= null,
            next();
    }
};

//exportar middleware
module.exports = {
    verificarAuth,
    verificarAuthOpcional
};