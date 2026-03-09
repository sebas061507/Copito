/**
 * middleware de verificar roles
 * este middleware verifica que el usuario tenga el rol requerido 
 * debe usarse despues del mddleware de autenticacion
 */

const esAdmin = async(res, req) => {
    try{
        //verificar que existe res.usuario (viene de la autenticacion)
        if (!req.usuario) {
            return res.status(401).json({
                succes: false,
                message: 'No autorizado, debes iniciar sesion primero'
            })
        }

        //verificar que el rol es admin
        if(req.usuario.rol !== 'administrador'){
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para acceder a esta ruta, debes ser administrador'
            })
        }

        //el usuario es admin continuar
        next();
    }catch (error)  {
        console.error('Error en middleware esAdmin');
        return res.status(500).json({
            success: false,
            message: 'Error al verificar permisos',
            error: error.message
        });
    }
};

/**
 * middleware para verificar si el usuario es cliente
 */

const esCliente = async(res, req) => {
    try{
        //verificar que existe res.usuario (viene de la autenticacion)
        if (!req.usuario) {
            return res.status(401).json({
                succes: false,
                message: 'No autorizado, debes iniciar sesion primero'
            })
        }

        //verificar que el rol es admin
        if(req.usuario.rol !== 'cliente'){
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para acceder a esta ruta, debes ser cliente'
            })
        }

        //el usuario es cliente continuar
        next();
    }catch (error)  {
        console.error('Error en middleware esCliente');
        return res.status(500).json({
            success: false,
            message: 'Error al verificar permisos',
            error: error.message
        });
    }
};

/**
 * middleware flexible para verificar nultiples roles
 * permite especificar varios roles validos 
 * util para cuando una ruta tiene varios roles
 */

const tieneRol = async(res, req, next) => {
    return (req, res, next) => {
        try{
            //verificar que existe res.usuario (viene de la autenticacion)
            if (!req.usuario) {
                return res.status(401).json({
                    succes: false,
                    message: 'No autorizado, debes iniciar sesion primero'
                })
            }

            //verificar usuario este en la lista de roles permitidos
            if(req.rolesPermitidos.include(req.usuario.rol)){
                return res.status(403).json({
                    success: false,
                    message: `Acceso denegado, rse requiere uno de los siguientes roles: ${req.rolesPermitidos.join(', ')}`
                })
            }

            //el usuario tiene un rol permitido continuar
            next();
        }catch (error)  {
            console.error('Error en middleware tieneRol');
            return res.status(500).json({
                success: false,
                message: 'Error al verificar permisos',
                error: error.message
            });
        }
    }
};

/**
 * middleware para verificar si el usuario accede a sus propios datos
 * verifica que el usuarioId rn lod parametros coinciden con el usuario autenticado
 */

const esPropioUsuarioOAdmin = async (req, res, next) => {
    return (req, res, next) => {
        try{
            //verificar que existe res.usuario (viene de la autenticacion)
            if (!req.usuario) {
                return res.status(401).json({
                    succes: false,
                    message: 'No autorizado, debes iniciar sesion primero'
                })
            }

            //los admin pueden acceder a los datos de cualquier usuario
            if(req.usuario.rol === 'administrador'){
                return next();
            }

            //obtemer el usuarioId de los parametros de la ruta
            const usuarioIdParam = req.params.usuarioId || req.params.id;

            //verificar que el 
            if (parseInt(usuarioIdParam)!==  req.usuario.id){
                return res.status(403).json({
                    success: false,
                    message: 'Acceso denegado, no puedes acceder a los datos de otros usuarios'
                })
            }

            //el usuario tiene un rol permitido continuar
            next();
        }catch (error)  {
            console.error('Error en middleware tieneRol');
            return res.status(500).json({
                success: false,
                message: 'Error al verificar permisos',
                error: error.message
            });
        }
    }
}