/**
 * Controlador de usuario
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
        const {id}= req.param;
        
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

        if(!nombre || !apellido || email || !password || !rol || telefono || !direccion) {
            return res.status(400).json({
                success:false,
                message: 'Faltan campos requeridos: nombre, apellido, email, password, rol, direccion'
            });
        }

        //validar rol
        if (!['cliente', 'auxiliar', 'administrador'].includes(rol)) {
            return res.status(400).json({
                succes: false,
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
        console.error('Error en actualizar usuario:', error);
        if(error.name === 'SequelizeValidationError'){
            return res.status(400).json({
                success:false,
                message: 'Error de validacion',
                errors: error.errors.map(e => e.message)
            });
        }
    }
};

/**
 * Activar/Desactivar categoria
 * PATCH/api/admin/categorias/:id/estado
 * 
 * Al desactivar una categoria se desactivan todas las subcategorias relacionadas
 * al desactivar una subcategoria se desactivan todos los productos
 * 
 * @param {Object} req request Express
 * @param {Object} res response Express
 */

const toggleCategoria = async (req, res) => {
    try{
        const {id} =req.params;

        // Buscar categoria
        const categoria = await Categoria.findByPk(Id);

        if(!categoria) {
            return res.status(404).json ({
                success: false,
                message: 'Categoria no encontrada'
            });
        }
        
        //Alternar estado activo
        const nuevoEstado = !categoria.activo;
        categoria.activo = nuevoEstado;

        // Guardar cambios
        await categoria.save();

        //contar cuantos registros se afectaron
        const subcategoriasAfectadas = await
        Subcategoria.count ({where:{categoriaId:id}
        });

        const productosAfectados = await Producto.count ({where:{categoriaId:id}
        });

        //Respuesta exitosa
        res.json({
            success:true,
            message: `Categoria ${nuevoEstado ? 'activada': 'desactivada'} exitosamente`,
            data:{
                categoria,
                afectados:{
                    Subcategoria:
                    subcategoriasAfectadas,
                    productos: productosAfectados
                }
            }
        });
    } catch (error){
        console.error('Error en toggleCategoria:', error);
        res.status(500).json({
            success:false,
            message:'Error al cambiar estado de categoria',
            error: error.message
        });
    }
};

/**
 * Eliminar categoria
 * DELETE /api/admin/categoria/:id
 * Solo permite eliminsr si no tiene subcategorias 
 * ni productos relacionados
 * @param {Object} req request express
 * @param {Object} res response express
*/

const eliminarCategoria = async (req, res) => {
    try {
        const {id} = req.params;

        //Buscar categoria
        const categoria = await Categoria.findByPk(id);

        if (!categoria) {
            return res.status(404).json({
                success: false,
                message: 'Categoria no encontrada'
            });
        }

        // Validacion varifica que no tenga subcategorias
        const subcategorias = await Subcategoria.count({
            where: {categoriaId: id}
        });

        if (subcategorias > 0) {
            return res.status(400).json({
                success: false,
                message: `No se puede eliminar la categoria porque tiene ${subcategorias} subcategorias asociadas usa PATCH/ api/ admin/ categorias/ :id toogle para desactivar en lugar de eliminar la subcategoria`
            });
        }

        // Validacion varifica que no tenga productos
        const productos = await Producto.count({
            where: {categoriaId: id}
        });

        if (productos > 0) {
            return res.status(400).json({
                success: false,
                message: `No se puede eliminar el producto porque tiene ${productos} productos asociados usa PATCH/ api/ admin/ categorias/ :id toogle para desactivar en lugar de eliminar el producto`
            });
        }

        //eliminar categoria
        await categoria.destroy();

        //respuesta exitosa
        res.json({
            success: true,
            message: 'Categoria eliminada exitosamente'
        });
    } catch (error) {
        console.error('Error en eliminarCategoria:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar categoria',
            error: error.message
        });
    }
};

/**
 * obtener estadisticas de una categoria
 * GET/ api/ admin/ categorias/ :id/ estadisticas
 * retorna
 * total de subcategorias activas/ inactivas
 * total de productos activos/ inactivos
 * valor total del inventario
 * stock total
 * @param {Object} req request express
 * @param {Object} res response express
 */
const getEstadisticasCategorias = async(req, res) =>{
    try {
        const { id } = req.params;

        //verificar que la categoria exista
        const categoria = await Categoria.findByPk(id);

        if (!categoria) {
            return res.status(404).json ({
                success: false,
                message: 'Categoria no encontrada'
            });
        }

        //contar subcategorias 
        const totalSubcategorias = await Subcategoria.count({
            where: { categoriaId: id}
        });

        const subcategoriasActivas = await Subcategoria.count({
            where: { categoriaId: id, activo: true}
        });

        //contar productos
        const totalProductos = await Producto.count({
            where: { categoriaId: id}
        });

        const productosActivos = await Producto.count({
        where: { categoriaId: id, activo: true}
        });

        //obtener productos para calcular estadisticas 
        const productos = await Producto.findAll({
            where: { categoriaId: id},
            attributes: ['precio', 'stock']
        });

        //calcular estadisticas de inventario
        let valorTotalInventario = 0;
        let stockTotal = 0;

        productos.forEach(producto => {
            valorTotalInventario += parseFloat(producto.precio )* producto.stock;
            stockTotal += producto.stock;
        
        });

        //respuesta exitosa
        res.json({
            success: true,
            data: {
                categoria:{
                    id: categoria.Id,
                    nombre: categoria.nombre,
                    activo: categoria.activo
                },
                estadisticas:{
                    subcategorias: {
                        total: totalSubcategorias,
                        activas: subcategoriasActivas,
                        inactivas: totalSubcategorias - subcategoriasActivas
                    },
                    productos: {
                        total: totalProductos,
                        activos: productosActivos,
                        inactivos: totalProductos - productosActivos
                    },
                    inventario: {
                        stockTotal,
                        valorTotal: valorTotalInventario.toFixed(2)//quitar decimales,
                    }   
                }
            }
        });
    } catch (error) {
        console.error('Error en getEstadisticasXCategorias:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener estadisticas de categoria',
            error: error.message
        });
    }   
}

//exportar todos los controladores
module.exports = {
    getCategorias: getUsuarios,
    getCategoriasById: getUsuarioById,
    crearCategoria: crearUsuario,
    actualizaCategoria: actualizaUsuario,
    toggleCategoria,
    eliminarCategoria,
    getEstadisticasCategorias
}