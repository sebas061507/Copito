/**
 * Controlador de usuarios admin
 * maneja la gestion de usuarios por administradores
 * lista de usuarios activar / desactivar cuentas
 */

/**
 * importar modelos
 */

const Usuario = require ('../models/Usuario');



/**
 * obtener todos los usuarios
 * GET/api/usuarios
 * query params:
 * Activo true/false (filtar por estado)
 * @param {Object} req request expre
 * @param {Object} res response express
 */

const getUsuarios = async (req, res) => {
    try {
        const {rol, activo, buscar, pagina = 1, limite = 10 }= req.query;

        //construir los filtros 
        const where = {};
        if(rol) where.rol = rol;
        if(activo !== undefined) where.activo = activo === 'true';

        //busqueda por texto
        if(buscar){
            const {Op} = require('sequelize');
            where [Op.or] = [
                {nombre: {[Op.like]: `%${buscar}%`}},
                {apellido: {[Op.like]: `%${buscar}%`}},
                {email: {[Op.like]: `%${buscar}%`}}

            ];
        }

        //paaginacion
        const offset = parseInt((pagina) -1) * parseInt(limite);

        //obtener usuarios sin password
        const {count, rows: usuarios} = await Usuario.findAndCountAll({
            where,
            attributes: {exclude: ['password']},
            limit: parseInt(limite),
            offset,
            order: [['nombre', 'ASC']]
        });

        //respuesta exitosa
        res.json({
            success: true,
            data: {
                usuarios,
                paginacion: {
                    total: count,
                    pagina: parseInt(pagina),
                    limite: parseInt(limite),
                    totalPaginas: Math.ceil(count / parseInt(limite))
                }
            }
        });
    } catch (error){
        console.error('Error en getUsuarios', error);
        res.status(500).json ({
            success:false,
            message: 'Error al obtener los usuarios',
            error: error.message,
        })
    }
};

/**
 * obtener un usuario por id
 * GET/ api/admin/usuarios/:id
 * 
 * @param {Object} req request express
 * @param {Object} res response express
 */

const getUsuarioById = async (req, res) => {
    try {
        const {id}= req.params;
        
        // Buscar usuarios
        const usuario = await Usuario.findByPk (id,{
            attributes : {exclude : ['password']}
        });
        
        if (!usuario){
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        
        //Respuesta exitosa
        res.json({
            success:true,
            data:{
                usuario
            }
        });

    } catch (error){
        console.error('Error en getUsuarioById', error);
        res.status(500).json ({
            success:false,
            message: 'Error al obtener el usuario',
            error: error.message,
        })
    }
};

/**
 * Crear nuevo usuario
 * POST / api/admin/usuarios
 * Body: { nombre,apellido, email, password, rol, telefono, direccion}
 * @param {Object} req request express
 * @param {Object} res response express
 */

const crearUsuario = async (req, res) =>{
    try{

        const {nombre, apellido, email, password, rol, telefono, direccion} = res.body;

        if(!nombre || !apellido || email || !password || !rol ) {
            return res.status(400).json({
                success:false,
                message: 'Faltan campos requeridos: nombre, apellido, email, password y/o rol'
            });
        }

        //validar rol
        if (!['cliente', 'auxiliar', 'administrador'].includes(rol)) {
            return res.status(400).json({
                success: false,
                message: 'Rol invalido, debe ser: cliente, auxiliar o administrador'
            });
        }

        // Validar email 
        const usuarioExistente = await Usuario.findOne({where: {email}});

        if (usuarioExistente){
            return res.status(400).json({
                success:false,
                message: 'El email ya esta registrado'
            });
        }

        // crear usuario
        const nuevoUsuario = await Usuario.create({
            nombre,
            apellido,
            email,
            password,
            rol,
            telefono : telefono ||null,
            direccion : direccion ||null, //si no se proporciona se establece como null
            activo:true
        });

        //Respuesta exitosa
        res.status(201).json({
            success:true,
            message: 'Usuario creado exitosamente',
            data:{
                usuario: nuevoUsuario.toJSON()//convertir a json para excluir campos sensibles
            }
        });
    } catch (error){
        console.error('Error en crearUsuario', error)
        if(error.name === 'SequelizeValidationError'){
            return res.status(400).json({
                success: false,
                message:'Error de validacion',
                errors: error.errors.map(e => e.message)
            
            });
        }
        res.status(500).json({
            success:false,
            message: 'Error al crear usuario',
            error:error.message
        })
    }
};

/**
 * Actualiza usuario
 * PUT/ api/ admin/ usuario/:id
 * body: {nombre,apellido, email, password, rol, telefono, direccion}
 * @param {Object} req request express
 * @param {Object} res response express
 */

const actualizaUsuario = async (req, res) =>{
    try{
        const{id} = req.params;
        const {nombre, apellido, email, password, rol, telefono, direccion} =req.body;

        //buscar categoria
        const usuario = await Usuario.findByPk(id, {
            attributes: {exclude: ['password']}
        });
        
        if(!usuario) {
            return res.status(404).json({
                success : false,
                message: 'Usuario no encontrado',
            })
        }
        
        // validar rol si se proporciona
        if (rol && ['cliente', 'auxiliar', 'administrador'].includes(rol)){
                return res.status(400).json({
                    success:false,
                    message:'Rol invalido',
                });
        }

        // Actualizar campos
        if (nombre!==undefined) usuario.nombre = nombre;
        if (apellido!==undefined) usuario.apellido = apellido;
        if (email!==undefined) usuario.email = email;
        if (password!==undefined) usuario.password = password;
        if (rol!==undefined) usuario.rol = rol;
        if (telefono!==undefined) usuario.telefono = telefono;
        if (direccion!==undefined) usuario.direccion = direccion

        // guardar cambios
        await usuario.save();

        // respuesta exitosa
        res.json({
            success: true,
            message: 'Usuario actualizado exitosamente',
            data:{
                usuario : usuario.toJson()
            }
        });
    } catch (error){
        console.error('Error en actualizar usuario:', error)
            return res.status(500).json({
                success:false,
                message: 'Error de validacion',
                errors: error.errors.map(e => e.message)
            });
    }
};

/**
 * Activar/Desactivar usuario
 * PATCH/api/admin/usuario/:id/estado
 * 
 * Al desactivar un usuario se desactiva su carrito
 * @param {Object} req request Express
 * @param {Object} res response Express
 */

const toggleUsuario = async (req, res) => {
    try{
        const {id} =req.params;

        // Buscar usuario
        const usuario = await Usuario.findByPk(id);

        if(!usuario) {
            return res.status(404).json ({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        //no permitir desactivar el admin
        if (usuario.id === req.usuario.id) {
            return res.status(400).json({
                sauccess: false,
                message: 'No puede desactivar su propio usuario'
            });
        }

        usuario.activo = !usuario.activo;
        await usuario.save();

        res.json({
            success: true,
            message: `Usuario ${usuario.activo ? 'activado' : 'desactivado'} exitosamente`,
            data: {
                usuario: usuario.toJSON()
            }
        });
    } catch (error){
        console.error('Error en toggleUsuario:', error);
        res.status(500).json({
            success:false,
            message:'Error al cambiar estado del usuario',
            error: error.message
        });
    }
};

/**
 * Eliminar usuario
 * DELETE /api/admin/usuario/:id
 * @param {Object} req request express
 * @param {Object} res response express
*/

const eliminarUsuario = async (req, res) => {
    try {
        const {id} = req.params;

        // Buscar usuario
        const usuario = await Usuario.findByPk(id);

        if(!usuario) {
            return res.status(404).json ({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        //no permitir desactivar el admin
        if (usuario.id === req.usuario.id) {
            return res.status(400).json({
                success: false,
                message: 'No puede eliminar su propia cuenta'
            });
        }

        
        //eliminar usuario
        await usuario.destroy();

        //respuesta exitosa
        res.json({
            success: true,
            message: 'Usuario eliminado exitosamente',
            data: {
                usuario: usuario.toJSON()
            }
        });
    } catch (error) {
        console.error('Error en eliminarUsuario:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar usuario',
            error: error.message
        });
    }
};

/**
 * obtener estadisticas de usuarios
 * GET/ api/ admin/ usuarios/ :id/ estadisticas
 * @param {Object} req request express
 * @param {Object} res response express
 */
const getEstadisticasUsuarios = async(req, res) =>{
    try {

        //datas de usuarios
        const totalUsuarios = await Usuario.count();
        const totalClientes = await Usuario.count({where: {rol: 'cliente'}});
        const totalAdmins = await Usuario.count({where: {rol: 'administrador'}});
        const usuariosActivos = await Usuario.count({where: {activo: true}});
        const usuariosInactivos = await Usuario.count({where: {activo: false}})

        
        //respuesta exitosa
        res.json({
            success: true,
            data: {
                total: totalUsuarios,
                porRol: {
                    clientes: totalClientes,
                    administradores: totalAdmins
                },
                porEstado: {
                    activos: usuariosActivos,
                    inactivos: usuariosInactivos
                }
            }
        });
    } catch (error) {
        console.error('Error en getEstadisticasUsuarios:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener estadisticas de usuarios',
            error: error.message
        });
    }   
}

//exportar todos los controladores
module.exports = {
    getUsuarios,
    getUsuarioById,
    crearUsuario,
    actualizaUsuario,
    toggleUsuario,
    eliminarUsuario,
    getEstadisticasUsuarios
}