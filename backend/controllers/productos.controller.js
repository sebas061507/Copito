/**
 * Controlador de productos
 * maneja las operaciones crud y activa y/o desactiva productoss
 * solo para administrador
 */

/**
 * importar modelos
 */
const Producto = require ('../models/producto');
const Categoria = require ('../models/Categoria');
const Subcategoria = require ('../models/Subcategoria');

//importar path y fs para manejo de imagenes
const path = require('path');
const fs = require('fs');

/**
 * obtener todos los productos
 * query params
 * categoriaId: filtrar por categoria
 * subcategoriaId: filtrar por subcategoria
 * Activo true/false (filtar por estado)
 * 
 * @param {Object} req request expre
 * @param {Object} res response express
 */

const getProductos = async (req, res) => {
    try {
        const {
            categoriaId,
            subcategoriaId, 
            activo, 
            conStock, 
            buscar, 
            pagina = 1, 
            limite = 100, 
            incluirSubcategoria 
        }= req.query;

        //construir filtross
        const where = {};
        if (categoriaId) where.categoriaId = categoriaId;
        if (subcategoriaId) where.subcategoriaId = subcategoriaId;
        if (activo !== undefined) where.activo = activo === 'true';
        if (conStock === 'true') where.stock = {[ require ('sequelize').Op.gt]: 0};

        //paginacion
        const offset = (parseInt(pagina- 1))  * parseInt(limite);
        
        // Opciones de consulta
        const opciones = {
            where,
            include: [
                {
                    model: Categoria,
                    as: 'categoria',
                    attributes: ['id', 'nombre']
                },
                {
                    model: Subcategoria,
                    as: 'subcategoria',
                    attributes: ['id', 'nombre']
                }
            ],
            limit: parseInt(limite),
            offset,
            order: [['nombre', 'ASC']] // ordenar de manera alfabetica
        };

        //obtener productos y total
        const {count, rows: productos} = await Producto.findAndCountAll(opciones);

        // respuesta exitosa
        res.json({
            success: true,
            count: productos.length,
            data:{
                productos,
                paginacion:{
                    total: count,
                    pagina: parseInt(pagina),
                    limite: parseInt(limite),
                    totalPaginas: Math.ceil(count / parseInt(limite))
                }
            }

        });
    } catch (error){
        console.error('Error en getProducto', error);
        res.status(500).json ({
            success:false,
            message: 'Error al obtener productos',
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

const getProductoById = async (req, res) => {
    try {
        const {id}= req.param;
        
        // Buscar productos con relacion 
        const producto = await Producto.findByPk (id,{
            include:[
                {
                    model:Categoria,
                    as: 'categoria',
                    attributes: ['id','nombre,', 'activo']
                },
                {
                    model : Subcategoria,
                    as: 'subcategoria',
                    attributes: ['id', 'nombre', 'activo']
                }
            ]
        });
        
        if (!producto){
            return res.status(404).json({
                success: false,
                message: 'Producto no encontrado'
            });
        }

        //Respuesta exitosa
        res.json({
            success:true,
            data:{
                producto
            }
        });

    } catch (error){
        console.error('Error en getProductoById', error);
        res.status(500).json ({
            success:false,
            message: 'Error al obtener el producto',
            error: error.message,
        })
    }
};

/**
 * Crear un producto
 * POST / api/admin/producto
 * Body: { nombre,descripcion}
 * @param {Object} req request express
 * @param {Object} res response express
 */

const crearProducto = async (req, res) =>{
    try{
        const {nombre,
            descripcion, 
            precio, 
            stock, 
            categoriaId,
            subcategoriaId} = res.body;

        //validacion 1 verificar campos requeridos
        if(!nombre || !precio || !stock || !categoriaId ||subcategoriaId) {
            return res.status(404).json({
                success:false,
                message: 'Faltan campos requeridos: nombre, precio, categoriaId, subcategoriaId'
            });
        }

        //validacion 2 verifica si la categoria esta activa
        const categoria = await Categoria.findByPk(categoriaId);

        if (!categoria){
            return res.status(400).json({
                success:false,
                message: `La categoria con id ${categoriaId} no existe`
            });
        }
        if (!categoria.activo){
            return res.status(400).json({
                success:false,
                message: `La categoria "${categoria.nombre}" no esta activa`
            });
        }

        // Validacion 3 verificar que la subcategoria exista y pertenezca a una categoria
        const subcategoria = await Subcategoria.findByPk(subcategoriaId);

        if (!subcategoria){
            return res.status(400).json({
                success:false,
                message: `No existe una subcategoria con id ${subcategoriaId}`
            });
        }
        if (!subcategoria.activo){
            return res.status(400).json({
                success:false,
                message: `La subcategoria con id ${subcategoria.nombre} no esta activa`
            });
        }
        if (!subcategoria.categoriaId !== parseInt(categoriaId)){
            return res.status(400).json({
                success:false,
                message: `La subcategoria ${subcategoria.nombre} no pertenece a la categoria con id ${categoriaId}`
            });
        }

        //validar  precio del producto
        if ( parseFloat(precio ) < 0){
            return res.status(400).json({
                success:false,
                message: 'El precio del producto debe ser mayor a 0'
            });
        }

        //validar el stock
        if (parseInt(stock) < 0){
            return res.status(400).json({
                success:false,
                message: 'El stock del producto debe ser mayor a 0'
            });
        }

        //obtener images
        const imagen = req.file ? req.file.filename : null;

        // crear producto
        const nuevoProducto = await Producto.create({
            nombre,
            descripcion: descripcion || null,
            precio : parseFloat(precio),
            stock : parseInt(stock),
            categoriaId: parseInt(categoriaId),
            subcategoriaId: parseInt(subcategoriaId),
            imagen, 
            subcategoriaId,
            activo:true
        });

        //RECARGAR CON RELACIONES
        await nuevoProducto.reload({
            include: [
                {
                    model: Categoria,
                    as: 'categoria',
                    attributes: ['id', 'nombre']
                },
                {
                    model: Subcategoria,
                    as: 'subcategoria',
                    attributes: ['id', 'nombre']
                }
            ]
                
        });

        //respuesta exitosa
        res.status(201).json({
            success:true,
            message: 'Producto creado exitosamente',
            data:{
                producto: nuevoProducto
            }
        });
    } catch (error){
        console.error('Error en crearProducto:', error);
        if(error.name === 'SequelizeValidationError'){
            return res.status(400).json({
                success: false,
                message:'Error de validacion',
                errors: error.errors.map(e => e.message)
            });
        }

        //si hubo un error eliminar imagen si se subio una imagen
        if (req.file){
            const imagePath = path.join(__dirname, '..', 'uploads', req.file.filename);
            try {
                await fs.unlink(imagePath);
            } catch (error) {
                console.error('Error al eliminar la imagen:', error);
            }
        }

        if (error.name === 'SequelizeValidationError'){
            return res.status(400).json({
                success: false,
                message: 'Error de validacion',
                errors: error.errors.map(e => e.message)
            });
        }

        res.status(500).json({
            success:false,
            message: 'Error al crear producto',
            error:error.message
        });
    }
};
/**
 * Actualiza producto
 * PUT/ api/ admin/ producto/:id
 * body:{ nombre, descripcion}
 * @param {Object} req request express
 * @param {Object} res response express
 */

const actualizarProducto = async (req, res) =>{
    try{
        const{id} = req.param;
        const {nombre,
            descripcion, 
            precio, 
            stock, 
            categoriaId,
            subcategoriaId,
            activo} =req.body;

        //buscar producto
        const producto = await Producto.findByPk(id);
        
        if(!producto) {
            return res.status(404).json({
                success : false,
                message: 'Producto no encontrado',
            })
        }

        // validacion 1 si se cambia la subcategoria verificar que exista y este activa y este asociada a una categoria
        if (subcategoriaId && subcategoriaId !== producto.subcategoriaId){
            const nuevaSubcategoria = await Subcategoria.findByPk(subcategoriaId);

            if ( nuevaSubcategoria) {
                return res.status(400).json({
                    success:false,
                    message:`No existe la subcategoria con el id ${subcategoriaId}`,
                });
            }

            if (!nuevaSubcategoria.activo) {
                return res.status(400).json({
                    success:false,
                    message:`La subcategoria "${nuevaSubcategoria.nombre}" no esta activa`,
                });
            }
            if (!nuevaSubcategoria.categoriaId !== parseInt(categoriaId)){
            return res.status(400).json({
                success:false,
                message: `La subcategoria ${nuevaSubcategoria.nombre} no pertenece a la categoria con id ${categoriaId}`
            });
        } 

        //validacion si se cambia el nombre verificar que no exista la subcategoria
        if (nombre && nombre !== producto.nombre){
            const subcategoriaFinal = subcategoriaId || producto.subcategoriaId;

            const productoConMismoNombre = await Producto.findOne({ where:{nombre, subcategoriaId: subcategoriaFinal}});
            if ( productoConMismoNombre) {
                return res.status(400).json({
                    success: false,
                    message: `Ya existe un producto con el nombre "${nombre}"`,
                });
            }
        } 

        // Actualizar campos
        if (nombre!==undefined) producto.nombre = nombre;
        if (descripcion!==undefined) producto.descripcion = descripcion;
        if (subcategoriaId!==undefined) producto.subcategoriaId = subcategoriaId;
        if (activo!==undefined) producto.activo = activo;

        // guardar cambios
        await producto.save();

        // respuesta exitosa
        res.json({
            success: true,
            message: 'Producto actualizado exitosamente',
            data:{
                producto: producto
            }
        });
    }catch (error){
        console.error('Error en actualizarProducto:', error);
        if(error.name === 'SequelizeValidationError'){
            return res.status(400).json({
                success:false,
                message: 'Error de validacion',
                errors: error.errors.map(e => e.message)
            });
        }
        res.status(500).json({
            success:false,
            message :'Error al actualizar Producto',
            error: error.message
        });
    }
};

/**
 * Activar/Desactivar producto
 * PATCH/api/admin/producto/:id/estado
 *
 * @param {Object} req request Express
 * @param {Object} res response Express
 */

const toggleProducto = async (req, res) => {
    try{
        const {id} =req.params;

        // Buscar producto
        const producto = await Producto.findByPk(id);

        if(!producto) {
            return res.status(404).json ({
                success: false,
                message: 'Producto no encontrado'
            });
        }
        
        //Alternar estado activo
        const nuevoEstado = !producto.activo;
        producto.activo = nuevoEstado;

        // Guardar cambios
        await producto.save();

        /**contar cuantos registros se afectaron
        const productosAfectados = await
        Producto.count ({where:{categoriaId:id}
        });*/

        //Respuesta exitosa
        res.json({
            success:true,
            message: `Producto ${nuevoEstado ? 'activado': 'desactivado'} exitosamente`,
            /**data:{
                afectados:{
                    subcategoria: producto,
                    productosAfectados
                }
            }*/
        });
    } catch (error){
        console.error('Error en toggleProducto:', error);
        res.status(500).json({
            success:false,
            message:'Error al cambiar estado de producto',
            error: error.message
        });
    }
};

/**
 * Eliminar producto
 * DELETE /api/admin/producto/:id
 * @param {Object} req request express
 * @param {Object} res response express
*/

const eliminarProducto = async (req, res) => {
    try {
        const {id} = req.params;

        //Buscar producto
        const producto = await Producto.findByPk(id);

        if (!producto) {
            return res.status(404).json({
                success: false,
                message: 'Producto no encontrada'
            });
        }

        // Validacion verifica que no este en detalles de pedido
        const detallesPedido = await DetallePedido.count({
            where: {subcategoriaId: id}
        });

        if (detallesPedido> 0) {
            return res.status(400).json({
                success: false,
                message: `No se puede eliminar el producto porque esta asociado a ${detallesPedido} detalles de pedido asociados usa PATCH/ api/ admin/ subcategorias/ :id toogle para desactivar en lugar de eliminar elos productos`
            });
        }

        //eliminar subcategoria
        await producto.destroy();

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
    getSubcategorias: getProductos,
    getSubcategoriasById: getProductoById,
    crearSubcategoria: crearProducto,
    actualizarSubcategoria: actualizarProducto,
    toggleSubcategoria: toggleProducto,
    eliminarSubcategoria: eliminarProducto,
    getEstadisticasSubcategoria
}