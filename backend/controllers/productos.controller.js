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
            limite = 10, 
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
            subcategoriaId,
            categoriaId,
            activo} =req.body;

        //buscar producto
        const producto = await Producto.findByPk(id);
        
        if(!producto) {
            return res.status(404).json({
                success : false,
                message: 'Producto no encontrado'
            })
        }

        // validacion 1 si se cambia la categoria y subcategoria verificar que existan y esten activas
        if (subcategoriaId && subcategoriaId !== producto.categoriaId){
            const categoria = await Categoria.findByPk(categoriaId);

            if (!categoria || !categoria.activo) {
                return res.status(400).json({
                    success:false,
                    message:'Categoria invalida o inactiva'
                });
            }

            const subcategoria = await Subcategoria.findByPk(subcategoriaId);

            if (!subcategoria || !subcategoria.activo) {
                return res.status(400).json({
                    success:false,
                    message:'Subategoria invalida o inactiva'
                });
            }

            const catId = categoriaId || producto.categoriaId
            if (!subcategoria.categoriaId !== parseInt(catId)) {
                return res.status(400).json({
                    success:false,
                    message:'La subcategoria no pertenece a la categoria seleccionada'
                });
            }
        }
            //validar precio y stock
            if (precio !== undefined && parseFloat(precio) < 0){
                return res.status(400).json({
                    success: false,
                    message: 'El precio del producto debe ser mayor a 0'
                });
            }
            if (stock !== undefined &&parseInt(stock) < 0){
                return res.status(400).json({
                    success:false,
                    message: 'El stock del producto debe ser mayor a 0'
                });
            }

            //manejar imagen 
            if (req.file){
                //elimina imagen anterior
                if (producto.imagen){
                    const rutaImagenAnterior = path.join(__dirname, '../uploads', producto.imagen);
                    try {
                        await fs.unlink(rutaImagenAnterior);
                    } catch (error) {
                        console.error('Error al eliminar la imagen anterior:', error);
                    }
                }
                producto.imagen = req.file.filename;
            }

        // Actualizar campos
        if (nombre!==undefined) producto.nombre = nombre;
        if (descripcion!==undefined) producto.descripcion = descripcion;
        if (precio!==undefined) producto.precio = parseFloat(precio);
        if (stock!==undefined) producto.stock = parseInt(stock);
        if (categoriaId!==undefined) producto.categoriaId = parseInt(categoriaId);
        if (subcategoriaId!==undefined) producto.subcategoriaId = parseInt(subcategoriaId);
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
        if(req.file){
            const rutaImagen = path.join(__dirname, '../uploads', req.file.filename);
            try {
                await fs.unlink(rutaImagen);
            } catch (error) {
                console.error('Error al eliminar la imagen:', error);
            }
        }
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

        producto.activo = !producto.activo;
        await producto.save();
        
        //Respuesta exitosa
        res.json({
            success:true,
            message: `Producto ${producto.activo ? 'activado': 'desactivado'} exitosamente`,
            data:{
                producto
            }
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

const eliminarProducto = async (req,res) => {
    try {
        const { id } = req.params;

        //Buscar producto 
        const producto = await Producto.findByPK(id);

        if (!producto) {
            return res.status(404).json({
                success: false,
                message: 'Producto no encontrada'
            });
        }

        //El hook beforeDestroy se encarga de eliminar la imagen
        //Eiminar producto
        await producto.destroy();

        //Respuesta exitosa
        res.json({
            success: true,
            message: 'Producto eliminado exitosamente'
        });

    } catch (error) {
        console.error ('Error al eliminar producto', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar producto', 
            error: error.message
        });
    }
};

/**
 * Actualizar stock de un producto
 * 
 * PATCH api/admin/productos/:id/stock
 * body: {cantidad, operacion: 'aumentar' | 'reducir', | 'establecer' }
 * @param {Object} req request Express
 * @param {Object} res response Express
 */
const actualizarStock =  async (req, res) => {
    try {
        const { id } = req.params
        const { cantidad, operacion } = req.body;

        if (!cantidad || !operacion) {
            return res.status(400).json({
                success: false,
                message: 'Se requiere cantidad y operacion'
            });
        }
        const cantidadNUm = parseInt(cantidad);
        if (cantidadNUm < 0) {
            return res.status(400).json({
                success: false,
                message: 'La cantidad no puede ser negativa'
            });
        }
        const producto = await Producto.findByPK(id);

        if (!producto) {
            return res.status(404).json({
                success: false,
                message: 'Producto no encontrado'
            });
        }

        let nuevoStock;

        switch (operacion) {
            case 'aumentar':
                nuevoStock = producto.aumentarStock(cantidadNUm);
                break;
            case 'reducir':
                if (cantidadNUm > producto.stock) {
                    return res.status(400).json({
                        success: false,
                        message: `No hay suficiente stock. Stock actual: ${producto.stock}`
                    });
                }
                nuevoStock = producto.reducirStock(cantidadNUm);
                break;
            case 'establecer':
                nuevoStock = cantidadNUm;
                break;
            default: 
                return res.status(400).json({
                    success: false,
                    message: 'Operacion invalida usa aumentar, reducir o establecer'
                });
            }

            producto.stock = nuevoStock;
            await producto.save();

            res.json({
                success: true, 
                message: `Stock ${oprecion === 'aumentar' ? 'aumentado' : operacion === 'reducir' ? 'reducido' : 'establecido'} exitosamente`,
                data: {
                    productoId : producto.id,
                    nombre: producto.nombre,
                    stockAnterior: operacion === 'establecer' ? null : (operacion === 'aumentar' ? producto.stock - cantidadNUm : producto.stock + cantidadNUm),
                    stockNuevo: producto.stock
                }
            });
        } catch (error) {
            console.error('Error en actualizarStock', error);
            res.status(500).json({
                success: false,
                message: 'Error al actualizar stock',
                error: error.message
            });
        }
};

//exportar todos los controladores
module.exports = {
    getProductos,
    getProductoById,
    crearProducto,
    actualizarProducto,
    toggleProducto,
    eliminarProducto,
    actualizarStock
};