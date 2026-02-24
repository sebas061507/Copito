/**
 * Controlador de productos
 * maneja las operaciones crud y activa y/o desactiva productoss
 * solo para administrador
 */

/**
 * importar modelos
 */
const Subcategoria = require ('../models/Subcategoria');
const Categoria = require ('../models/Categoria');
const Producto = require ('../models/producto');


/**
 * obtener todos los productos
 * query params
 * subcategoriaId: filtrar por subcategoria
 * Activo true/false (filtar por estado)
 * incluir subcategoria true / false (incluir subcategorias relacionadas)
 * 
 * @param {Object} req request expre
 * @param {Object} res response express
 */

const getProducto = async (req, res) => {
    try {
        const {subcategoriaId, activo, incluirSubcategoria }= req.query;
        
        // Opciones de consulta
        const opciones = {
            order:[['nombre', 'ASC']] // ordenar de manera alfabetica

        };
        
        //filtros
        const where  = {};
        if (subcategoriaId) where.subcategoriaId = subcategoriaId;
        if (activo !==undefined) where.activo = activo === 'true';

        if (Object.keys(where).length > 0){
            opciones.where = where;
        }

        // incluir subcategoria si se solicita

        if (incluirSubcategoria = 'true'){
            opciones.include == [{
                model: Subcategoria,
                as: 'subcategoria', //campos del alias para la relacion
                attributes: ['id','nombre', 'activo'] // campos de incluir de la subcategoria
            }]
        }

        //Obtener productos
        const productos = await Producto.findAll
        (opciones);

        // respuesta exitosa
        res.json({
            success: true,
            count: productos.length,
            data:{
                productos
            }

        });
    } catch (error){
        console.error('Error en getProducto', error);
        res.status(500).json ({
            success:false,
            message: 'Error al obtener el Producto',
            error: error.message,
        })
    }
};

/**
 * obtener todos los productos por id
 * GET/ api/productos/:id
 * 
 * @param {Object} req request express
 * @param {Object} res response express
 */

const getProductosById = async (req, res) => {
    try {
        const {id}= req.param;
        
        // Buscar productos con subcategoria y contar productos
        const productos = await Producto.findByPk (id,{
            include:[
                {
                    model:Categoria,
                    as: 'categoria',
                    attributes: ['id','nombre,', 'activo']
                },
                {
                    model : Subcategoria,
                    as: 'subcategoria',
                    attributes: ['id']
                }
            ]
        });
        
        if (!productos){
            return res.status(404).json({
                success: false,
                message: 'Producto no encontrada'
            });
        }

        //agregar contador de productos
        const productosJSON = productos.toJSON();
        delete productosJSON;// no enviar la lista completa solo el contador

        //Respuesta exitosa
        res.json({
            success:true,
            data:{
                producto: productosJSON
            }
        });

    } catch (error){
        console.error('Error en getProductosById', error);
        res.status(500).json ({
            success:false,
            message: 'Error al obtener el producto',
            error: error.message,
        })
    }
};

/**
 * Crear un productos
 * POST / api/admin/producto
 * Body: { nombre,descripcion}
 * @param {Object} req request express
 * @param {Object} res response express
 */

const crearSubcategoria = async (req, res) =>{
    try{
        const {nombre,descripcion, categoriaId} = res.body;

        //validacion 1 verificar nombre
        if(!nombre || !categoriaId) {
            return res.status(404).json({
                success:false,
                message: 'El nombre y el categoriaId es obligatorio'
            });
        }

        //2 validar  si la categoria existe
        const categoria = await Categoria.findByPk(categoriaId);
        if (!categoria){
            return res.status(400).json({
                success:false,
                message: `No existe la categoria con id ${categoriaId}`
            });
        }

        //validacion 3 verifica si la categoria esta activa
        if (!categoria.activo){
            return res.status(400).json({
                success:false,
                message: `La categoria ${categoria.nombre} no esta activa, activela primero`
            });
        }


        // Validacion 4: subcategoria duplicada
        const subcategoriaExistente = await Subcategoria.findOne({where: {nombre, categoriaId}});
        if (subcategoriaExistente){
            return res.status(400).json({
                success:false,
                message: `Ya existe una subcategoria con el nombre "${nombre}""`
            });
        }

        // crear subcategoria
        const nuevaSubcategoria = await Subcategoria.create({
            nombre,
            descripcion: descripcion || null, // si no se proporciona la descripcion se establece como null
            categoriaId,
            activo:true
        });

        //obtener subcategoria con los datos de la categoria 
        const subcategoriaConCategoria = await Subcategoria.findByPk(nuevaSubcategoria.id,{
            include: [{
                model: Categoria,
                as: 'categoria',
                attributes: ['id', 'nombre']
            }]
        });


        //Respuesta exitosa
        res.status(201).json({
            success:true,
            message: 'Subcategoria creada exitosamente',
            data:{
                categoria: subcategoriaConCategoria
            }
        });
    } catch (error){
        console.error('Error en crearSubcategoria:', error);
        if(error.name === 'SequelizeValidationError'){
        return res.status(400).json({
            success: false,
            message:'Error de validacion',
            errors: error.errors.map(e => e.message)
        
        });
    }
    res.status(500).json({
        success:false,
        message: 'Error al crear subcategoria',
        error:error.message
    })
}
};

/**
 * Actualiza subcategoria
 * PUT/ api/ admin/ subcategoria/:id
 * body:{ nombre, descripcion}
 * @param {Object} req request express
 * @param {Object} res response express
 */

const actualizarSubcategoria = async (req, res) =>{
    try{
        const{id} = req.param;
        const {nombre, descripcion, categoriaId, activo} =req.body;

        //buscar subcategoria
        const subcategoria = await Subcategoria.findByPk(id);
        
        if(!subcategoria) {
            return res.status(404).json({
                success : false,
                message: 'Subcategoria no encontrada',
            })
        }

        // validacion 1 si se cambia la categoria verificar que exista y este activa
        if (categoriaId && categoriaId !== subcategoria.categoriaId){
            const nuevaCategoria = await Categoria.findByPk(categoriaId);

            if ( nuevaCategoria) {
                return res.status(400).json({
                    success:false,
                    message:`No existe la categoria con el id ${categoriaId}`,
                });
            }

            if (!nuevaCategoria.activo) {
                return res.status(400).json({
                    success:false,
                    message:`La categoria "${nuevaCategoria.nombre}" no esta activa`,
                });
            }
        } 

        //validacion si se cambia el nombre verificar que no exista la categoria
        if (nombre && nombre !== subcategoria.nombre){
            const categoriaFinal = categoriaId || subcategoria.categoriaId;

            const subcategoriaConMismoNombre = await Subcategoria.findOne({ where:{nombre, categoriaId: categoriaFinal}});
            if ( subcategoriaConMismoNombre) {
                return res.status(400).json({
                    success: false,
                    message: `Ya existe una subcategoria con el nombre "${nombre}"`,
                });
            }
        } 

        // Actualizar campos
        if (nombre!==undefined) subcategoria.nombre = nombre;
        if (descripcion!==undefined) subcategoria.descripcion = descripcion;
        if (categoriaId!==undefined) subcategoria.categoriaId = categoriaId;
        if (activo!==undefined) subcategoria.activo = activo;

        // guardar cambios
        await subcategoria.save();

        // respuesta exitosa
        res.json({
            success: true,
            message: 'Subcategoria actualizada exitosamente',
            data:{
                subcategoria: subcategoria
            }
        });
    }catch (error){
        console.error('Error en actualizar subcategoria:', error);
        if(error.name === 'SequelizeValidationError'){
            return res.status(400).json({
                success:false,
                message: 'Error de validacion',
                errors: error.errors.map(e => e.message)
            });
        }
        res.status(500).json({
            success:false,
            message :'Error al actualizar subcategoria',
            error: error.message
        });
    }
};

/**
 * Activar/Desactivar subcategoria
 * PATCH/api/admin/subcategorias/:id/estado
 * 
 * Al desactivar una subcategoria se desactivan todos productos relacionados
 * 
 * @param {Object} req request Express
 * @param {Object} res response Express
 */

const toggleSubcategoria = async (req, res) => {
    try{
        const {id} =req.params;

        // Buscar subcategoria
        const subcategoria = await Subcategoria.findByPk(id);

        if(!subcategoria) {
            return res.status(404).json ({
                success: false,
                message: 'Subcategoria no encontrada'
            });
        }
        
        //Alternar estado activo
        const nuevoEstado = !subcategoria.activo;
        subcategoria.activo = nuevoEstado;

        // Guardar cambios
        await subcategoria.save();

        //contar cuantos registros se afectaron
        const productosAfectados = await
        Producto.count ({where:{categoriaId:id}
        });

        //Respuesta exitosa
        res.json({
            success:true,
            message: `Subcategoria ${nuevoEstado ? 'activada': 'desactivada'} exitosamente`,
            data:{
                afectados:{
                    subcategoria,
                    productosAfectados
                }
            }
        });
    } catch (error){
        console.error('Error en toggleSubcategoria:', error);
        res.status(500).json({
            success:false,
            message:'Error al cambiar estado de subcategoria',
            error: error.message
        });
    }
};

/**
 * Eliminar subcategoria
 * DELETE /api/admin/subcategoria/:id
 * Solo permite eliminar si no tiene productos relacionados
 * @param {Object} req request express
 * @param {Object} res response express
*/

const eliminarSubcategoria = async (req, res) => {
    try {
        const {id} = req.params;

        //Buscar subcategoria
        const subcategoria = await Subcategoria.findByPk(id);

        if (!subcategoria) {
            return res.status(404).json({
                success: false,
                message: 'Subcategoria no encontrada'
            });
        }

        // Validacion varifica que no tenga productos
        const productos = await Producto.count({
            where: {subcategoriaId: id}
        });

        if (productos> 0) {
            return res.status(400).json({
                success: false,
                message: `No se puede eliminar la subcategoria porque tiene ${productos} productos asociados usa PATCH/ api/ admin/ subcategorias/ :id toogle para desactivar en lugar de eliminar elos productos`
            });
        }

        //eliminar subcategoria
        await subcategoria.destroy();

        //respuesta exitosa
        res.json({
            success: true,
            message: 'Subcategoria eliminada exitosamente'
        });
    } catch (error) {
        console.error('Error en eliminarSubcategoria:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar subcategoria',
            error: error.message
        });
    }
};

/**
 * obtener estadisticas de una subcategoria
 * GET/ api/ admin/ subcategorias/ :id/ estadisticas
 * retorna
 * total de subcategorias activas/ inactivas
 * total de productos activos/ inactivos
 * valor total del inventario
 * stock total
 * @param {Object} req request express
 * @param {Object} res response express
 */
const getEstadisticasSubcategoria = async(req, res) =>{
    try {
        const { id } = req.params;

        //verificar que la subcategoria exista
        const subcategoria = await Subcategoria.findByPk(id [{
            include: {
                model: Categoria,
                as: 'categoria',
                attributes: ['id', 'nombre']
            }
        }]);

        if (!subcategoria) {
            return res.status(404).json ({
                success: false,
                message: 'Subcategoria no encontrada'
            });
        }

        //contar productos
        const totalProductos = await Producto.count({
            where: { subcategoriaId: id}
        });

        const productosActivos = await Producto.count({
        where: { subcategoriaId: id, activo: true}
        });

        //obtener productos para calcular estadisticas 
        const productos = await Producto.findAll({
            where: { subcategoriaId: id},
            attributes: ['precio', 'stock']
        });

        //calcular estadisticas de inventario
        let valorTotalInventario = 0;
        let stockTotal = 0;

        productos.forEach(producto => {
            valorTotalInventario += parseFloat(producto.precio )* producto.stock;
        });

        //respuesta exitosa
        res.json({
            success: true,
            data: {
                subcategoria:{
                    id: subcategoria.Id,
                    nombre: subcategoria.nombre,
                    activo: subcategoria.activo,
                    categoriaId: subcategoria.categoria,
                },
                estadisticas:{
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
        console.error('Error en getEstadisticasSubcategorias:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener estadisticas de subcategoria',
            error: error.message
        });
    }   
}

//exportar todos los controladores
module.exports = {
    getSubcategorias,
    getSubcategoriasById,
    crearSubcategoria,
    actualizarSubcategoria,
    toggleSubcategoria,
    eliminarSubcategoria,
    getEstadisticasSubcategoria
}