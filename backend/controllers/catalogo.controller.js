/**
 * Controlador del catalogo 
 * permite ver los productos sin iniciar sesion
 * solo para administrador
 */

/**
 * importar modelos
 */
const Producto = require ('../models/producto');
const Categoria = require ('../models/Categoria');
const Subcategoria = require ('../models/Subcategoria');



/**
 * obtener todos los productos al publico 
 * Get/ api/ catalogo/ productos
 * query params
 * categoriaId: filtrar por categoria
 * subcategoriaId: filtrar por subcategoria
 * preciomin, preciomax, rango de precios nombre reciente
 * 
 * @param {Object} req request expre
 * @param {Object} res response express
 * solo muestra los productos activos y con stock
 */

const getProductos = async (req, res) => {
    try {
        const {
            categoriaId,
            subcategoriaId, 
            buscar, 
            precioMin,
            precioMax,
            orden= 'reciente',
            pagina = 1, 
            limite = 12
        }= req.query;

        const {Op} = require('sequelize');

        //filtros base solo para productos activods y con stock
        const where = {
            activo: true,
            stock: {[Op.gt]:0}
        };

        //filtros opcionales
        if (categoriaId) where.categoriaId = categoriaId;
        if (subcategoriaId) where.subcategoriaId = subcategoriaId;

        //busqueda de texto 
        if(buscar) {
            where [Op.or] = [
                {
                    nombre: {[Op.like]: `%${buscar}%`}
                },
                {
                    descripcion: {[Op.like]: `%${buscar}%`}
                }//permite buscar por nombre o descripcion
            ]
        }

        //filtro por rango de precio
        if(precioMin && precioMax) {
            where.precio ={};
            if(precioMin) where.precio[Op.gte] = parseFloat(precioMin);
            if(precioMax) where.precio[Op.lte] = parseFloat(precioMax);
        }

        //ordenamiento
        let order;
        switch (orden) {
            case 'precio asc':
                order = [['precio', 'ASC']];
                break;
            case 'precio desc':
                order = [['precio', 'DESC']];
                break;
            case 'nombre':
                order = [['nombre', 'ASC']];
                break;
            case 'reciente':
                order = [['createdAt', 'DESC']];
                break;
        }

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
        const  {count, rows: productos} = await Producto.findAndCountAll({
            where,
            include: [
                {
                    model: Categoria,
                    as: 'categoria',
                    attributes: ['id', 'nombre'],
                    where: {activo: true}
                },
                {
                    model: Subcategoria,
                    as: 'subcategoria',
                    attributes: ['id', 'nombre'],
                    where: {activo: true}
                }
            ],
            limit: parseInt(limite),
            offset,
            order: [['nombre', 'ASC']]
        });

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
        const {id}= req.params;
        
        // Buscar productos con relacion 
        const producto = await Producto.findOne({
            where: {
                id,
                activo: true
            },
            include:[
                {
                    model:Categoria,
                    as: 'categoria',
                    attributes: ['id','nombre,', 'activo'],
                    where: {activo:true}
                },
                {
                    model : Subcategoria,
                    as: 'subcategoria',
                    attributes: ['id', 'nombre', 'activo'],
                    where: {activo: true}
                }
            ]
        });

        //verificar que el producto exista y esté activo
        if (!producto){
            return res.status(404).json({
                success: false,
                message: 'Producto no encontrado o no disponible'
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
 * obtener todas las categorias al publico 
 * Get/ api/ catalogo/ categorias
 * 
 * @param {Object} req request expre
 * @param {Object} res response express
 * solo muestra los productos activos y con stock
 */
const getCategorias = async (req, res) => {
    try {
        const {Op} = require('sequelize');

        //buscar categorias activas
        const categorias = await Categoria.findAll({
            where: {activo:true},
            attributes: ['id', 'nombre'],
            order: [['nombre', 'ASC']]
        });


        //para cada categoria contar productos activos con stock
        const categoriasConConteo = await Promise.all(
            categorias.map( async (categoria) => {
                const totalProductos = await Producto.count({
                    where: {
                        categoriaId: categoria.id,
                        activo: true,
                        stock: {[Op.gt] : 0}
                    }
                });
                return {
                    ...categoria.toJSON(),
                    totalProductos
                };
            })
        );

        // respuesta exitosa
        res.json({
            success: true,
            data: {
                categorias: categoriasConConteo
            }
        });
    }catch (error){
        console.error('Error en getCategorias', error);
        res.status(500).json ({
            success:false,
            message: 'Error al obtener categorias',
            error: error.message,
        });
    }
};

/**
 * obtener las subcategorias por categorias
 * Get/ api/ catalogo/ categorias/ subcategorias
 * 
 * @param {Object} req request expre
 * @param {Object} res response express
 * solo muestra los productos activos y con stock
 */
const getSubcategoriasPorCategorias = async (req, res) => {
    try {
        const {id} = req.params;
        const {Op} = require('sequelize');


        //verificar que la categoria exista y este activa
        const categoria = await Categoria.findOne({
            where: {
                id,
                activo: true
            }
        });

        if (!categoria) {
            return res.status(404).json({
                success: false,
                message: 'Categoria no encontrada o inactiva'
            });
        }
        //buscar subcategorias activas
        const subcategorias = await Subcategoria.findAll({
            where: {
                categoriaId: id,
                activo:true
            },
            attributes: ['id', 'nombre', 'descripcion'],
            order: [['nombre', 'ASC']]
        });

        //para cada subcategoria contar productos activos con stock
        const subcategoriasConConteo = await Promise.all(
            subcategorias.map( async (subcategoria) => {
                const totalProductosSubcategoria = await Producto.count({
                    where: {
                        subcategoriaId: subcategoria.id,
                        activo: true,
                        stock: {[Op.gt] : 0}
                    }
                });
                return {
                    ...subcategoria.toJSON(),
                    totalProductos: totalProductosSubcategoria
                };
            })
        );

        // respuesta exitosa
        res.json({
            success: true,
            data: {
                categoria: {
                    id: categoria.id,
                    nombre: categoria.nombre
                },
                subcategorias: subcategoriasConConteo
            }
        });
    }catch (error){
        console.error('Error en getSubcategoriasPorCategorias', error);
        res.status(500).json ({
            success:false,
            message: 'Error al obtener subcategorias',
            error: error.message,
        });
    }
};

/**
 * obtener lproductos destacados
 * Get/ api/ catalogo/ destacados
 * 
 * @param {Object} req request expre
 * @param {Object} res response express
 * solo muestra los productos activos y con stock
 */
const getProductosDestacados = async (req, res) => {
    try {
        const {limite = 8} = req.query;
        const {Op} = require('sequelize');


        //obtener productos mas recientes
        const productos = await Producto.findAll({
            where: {
                activo: true,
                stock: {[Op.gt] : 0}
            },
            include:[
                {
                    model: Categoria, 
                    as: 'categoria',
                    attributes: ['id', 'nombre'],
                    where: {activo: true}
                },
                {
                    model: Subcategoria,
                    as: 'subcategoria',
                    attributes: ['id', 'nombre'],
                    where: {activo: true}
                }
            ],
            order: [['createdAt', 'DESC']],
            limit: parseInt(limite)
        });

        //respuesta exitosa
        res.json({
            success: true,
            data: {
                productos
            }
        });
    }catch (error){
        console.error('Error en getProductosDestacados', error);
        res.status(500).json ({
            success:false,
            message: 'Error al obtener productos destacadoss',
            error: error.message,
        });
    }
};

//exportar todos los controladores
module.exports = {
    getProductos,
    getProductoById,
    getCategorias,
    getSubcategoriasPorCategorias,
    getProductosDestacados
};