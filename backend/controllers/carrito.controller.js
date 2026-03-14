/**
 * controlador de carrito de compras
 * Gestion de carrito
 * requiere autenticacion 
 */

//Importar modelos
const Carrito = require('../models/Carrito');
const Producto = require('../models/producto');
const Categoria = require('../models/Categoria');
const Subcategoria = require('../models/Subcategoria');

/**
 * obtener carrito del usuario autenticado
 * GET /api/carrito
 * @param {Object} req request de Express con req.usuario del middleware
 * @param {Object} res response de Express
 */
const getCarrito = async (req, res) => {
    try {
        //obtener items del carrito con los productos relacionados
        const itemsCarrito = await Carrito.findAll({
            where: { usuarioId: req.usuario.id },
            include: [
                {
                    model: Producto,
                    as: 'productos',
                    attributes: [ 'id', 'nombre', 'descripcion', 'precio', 'stock', 'imagen', 'activo'],
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
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        //Calcular el total del carrito
        let total = 0;
        itemsCarrito.forEach(item => {
            total += parseFloat(item.precioUnitario) * item.cantidad;
        });

        //respiuesta exitosa
        res.json({
            success: true,
            data: {
                items: itemsCarrito,
                resumen: {
                    totaItems: itemsCarrito.length,
                    cantidadTotal: itemsCarrito.reduce((sum, item) => sum + item.cantidad, 0),
                    totalCarrito: total.toFixed(2)
                }
            }
        });
    }catch (error) {
        console.error('Error en getCarrito:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener el carrito',
            error: error.message
        });
    }
};

/**
 * agregar producto a carrito
 * POST /api /carrito
 * @param {Object} req request de express 
 * @param {Object} res response express
 */
const agregarAlCarrito = async (req, res) => {
    try {
        const { productoId, cantidad=1 } = req.body;

        //validar campos requeridos
        if (!productoId) {
            return res.status(400).json({
                success: false,
                message: 'El productoId es requerido'
            
            });
        }

        //validacion 2 cantidad valida
        const cantidadNum = parseInt(cantidad);
        if (cantidadNum < 1) {
            return res.status(400).json({
                success: false,
                message: 'La cantidad debe ser minimo 1'
            });
        }

        //validacion 3: producto existe y esta activo
        const producto = await Producto.findByPk(productoId);
        if (!producto) {
            return res.status(404).json({
                success: false,
                message: 'Producto no encontrado'
            });
        }
        if (!producto.activo) {
            return res.status(400).json({
                success: false,
                message: 'Producto no disponible'
            });
        }

        //validacion 4 verificar si ya existe en el carrito
        const itemExistente = await Carrito.findOne({
            where : {
                usuarioId: req.usuario.id,
                productoId
            }
        });

        if (itemExistente) {
            //actualizar cantidad
            const nuevaCantidad = itemExistente.cantidad + cantidadNum;

            //validar stock disponible
            if (nuevaCantidad > producto.stock) {
                return res.status(400).json({
                    success: false,
                    message: `No hay suficiente stock. Disponible: ${producto.stock}, en carrito: ${itemExistente.cantidad}`
                });
            }

            itemExistente.cantidad = nuevaCantidad;
            await itemExistente.save();

            //Recargar producto
            await itemExistente.reload({
                include: [{
                    model: Producto,
                    as: 'productos',
                    attributes : ['id', 'nombre', 'precio', 'stock', 'imagen']
                }]
            });

            return res.json({
                success: true,
                message: 'Cantidad actualizada en el carrito',
                data: {
                    item: itemExistente
                }
            })
        }

        //validacion 5: stock disponible
        if (cantidadNum > producto.stock) {
            return res.status(400).json({
                success: false,
                message: `Stock insuficiente. Disponible: ${producto.stock}`
            
            })
        }

        //crear un nuevo item en el carrito
        const nuevoItem = await Carrito.create({
            usuarioId: req.usuario.id,
            productoId,
            cantidad: cantidadNum,
            precioUnitario: producto.precio
        });

        //recargar con producto
        await nuevoItem.reload({
            include: [{
                model: Producto,
                as: 'productos',
                attributes: ['id', 'nombre', 'precio', 'stock', 'imagen']
            }]
        });

        // respuesta exitosa
        res.status(201).json({
            success: true,
            message: 'Producto agregado al carrito',
            data: {
                item: nuevoItem
            }
        })

    }catch (error) {
        console.error('Error en agregarAlCarrito:', error);
        res.status(500).json({
            success: false,
            message: 'Error al agregar al carrito',
            error: error.message
        });
    }
};

/**
 * actualizar cantidad de item del carrito
 * PUT /api /carrito/ :id
 * body {cantidad}
 * @param {Object} req request express
 * @param {Object} res response express
 */
const actualizarItemCarrito = async (req, res) => {
    try {
        const { id } = req.params;
        const { cantidad } = req.body;

        //validar cantidad
        const cantidadNum = parseInt(cantidad);
        if (cantidadNum < 1){
            return res.status(400).json({
                success: false,
                message: 'La cantidad debe ser minimo 1'
            
            });
        }

        //buscar item del carrito
        const item = await Carrito.findOne({
            where: {
                id,
                usuarioId: req.usuario.id, //solo puede modificar su propio carrito
            },
            include: [{
                model: Producto,
                as: 'productos',
                attributes: ['id', 'nombre', 'precio', 'stock', 'imagen']
            }]
        });

        if (!item){
            return req.status(404).json({
                success: false,
                message: 'Item del carrito no encontrado'
            });
        }

        //validar stock disponible
        if (cantidadNum > item.producto.stock) {
            return res.status(400).json({
                success: false,
                message: `Stock insuficiente. Disponible: ${item.producto.stock}`
            });
        }

        //actualizar cantidad
        item.cantidad = cantidadNum;
        await item.save();

        //respuesta exitosa
        res.json({
            success: true,
            message: 'Cantidad actualizada correctamente',
            data: {
                item
            }
        });
    }catch (error){
        console.error('Error en actualizarItemCarrito:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar el carrito',
            error: error.message
        });
    }
};

/**
 * eliminar item del carrito
 * DELETE/ api/ carrito/ :id
 * @param {Object} req request exppress
 * @param {Object} res response express
 */

const eliminarItemCarrito = async (req, res) => {
    try {
        const { id } = req.params;

        //buscar item del carrito
        const item = await Carrito.findOne({
            where: {
                id,
                usuarioId: req.usuario.id
            }
        });

        if (!item){
            return res.status(404).json({
                success: false,
                message: 'Item no encontrado en el carrito'
            });
        }

        //eliminar
        await item.destroy();

        res.json({
            success: true,
            message: 'Item eliminado del carrito exitosamente'
        });

    }catch (error){
        console.error('Error en eliminarItemCarrito:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar el carrito',
            error: error.message
        });
    }
};

/**
 * vaciar todo el carrito
 * DELETE/ api/ carrito/ vaciar
 */

const vaciarCarrito = async (req, res) => {
    try{
        //eliminar todos los items del usuario
        const itemsEliminados = await Carrito.destroy({
            where: {
                usuarioId: req.usuario.id
            }
        });
        //respuesta exitosa
        res.json({
            success: true,
            message: 'Carrito vaciado exitosamente',
            data: {
                itemsEliminados: itemsEliminados
            }
        });
    }catch (error){
        console.error('Error en vaciarCarrito:', error);
        res.status(500).json({
            success: false,
            message: 'Error al vaciar el carrito',
            error: error.message
        });
    }
};

//exportar todos los controladores
module.exports = {
    getCarrito,
    agregarAlCarrito,
    actualizarItemCarrito,
    eliminarItemCarrito,
    vaciarCarrito
}