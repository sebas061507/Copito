/**
 * controlador de pedidos
 * gestion de pedidos 
 * requiere autenticacion 
 */

//importar modelos
const Pedido = require('../models/Pedido');
const detallePedido = require('../models/detallePedido');
const Carrito = require('../models/Carrito');
const Producto = require('../models/producto');
const Usuario = require('../models/Usuario');
const Categoria = require('../models/Categoria');
const Subcategoria = require('../models/Subcategoria');const Usuario = require('../models/Usuario');

/**
 * Crear pedido desde el carrito (checkout)
 * POST/ api/ cliente/ pedidos
 */

const crearPedido = async (req, res) => {
    const {sequelize} = require('./config/dataBase');
    const t = await sequelize.transaction();

    try {
        const {direccionEnvio, telefono, metodoPago = 'efectivo', notasAdicionales} = req.body;

        //validacion 1 direccion requerida
        if(!direccionEnvio || direccionEnvio.trim() === ''){
            await t.rollback();
            return res.status(400).json({
                success: false,
                message: 'La direccion de envio es requerida'
            });
        }

        //validacion 2 telefono
        if(!telefono || telefono.trim() === ''){
            await t.rollback();
            return res.status(400).json({
                success: false,
                message: 'El telefono es requerido'
            });
        }

        //validacion 3 metodo de pago
        const metodosValidos = ['efectivo', 'tarjeta', 'transferencia'];
        if(!metodosValidos.includes(metodoPago)) {
            await t.rollback();
            return res.status(400).json({
                success: false,
                message: `Metodo de pago no valido. Opciones: ${metodosValidos.join(', ')}`
            })
        }

        //obtener items del carrito
        const carritoItems = await Carrito.findAll({
            where: { usuarioId: req.usuario.id },
            include: [{
                    model: Producto,
                    as: 'producto',
                    attibutes: ['id', 'nombre', 'precio', 'stock', 'imagen', 'activo'],
            }],
            transaction : t
        });

        if(itemsCarrito.length === 0){
            await t.rollback();
            return res.status(400).json({
                success: false,
                message: 'El carrito esta vacio'
            });
        }



        //respuesta exitosa
        res.json({
            succes: true,
            message: 'Pedido creado exitosamente'
        })
    }catch(error){
        console.error('Error en crearPedido');
        res.status(500).json({
            success: false,
            message: 'Error al crear el pedido',
            error: error.message
        });
    }
};