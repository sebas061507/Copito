/**
 * Rutas del cliente
 * rutas publicas para los clientes autenticar
 */
const express = require('express');
const router = express.Router();

// importar los mddlewares 
const { verificarAuth } = require('../middleware/auth');
const { esAdmin, esAdminOAuxiliar} = require('../middleware/checkRole');


// importar controladores
const catalogoController = require('../controllers/catalogo.controller');
const carritoController = require('../controllers/carrito.controller');
const pedidoController = require('../controllers/pedido.controller');


//rutas publicas catalogo
// GET/ api/catalogo/productos
router.get('/catalogo/productos', catalogoController.getProductos);

// GET/ api/catalogo/productos
router.get('/catalogo/productos/:id', catalogoController.getProductoById);

// POST/ api/catalogo/categorias
router.get('/catalogo/categorias', catalogoController.getCategorias);

// PUT/ api/catalogo/categoria/:id/subcategorias
router.get('/catalogo/categoria/:id/subcategorias', catalogoController.getSubcategoriasPorCategorias);

// PATCH/ api/catalogo/destacados
router.get('/catalogo/ destacados', catalogoController.getProductosDestacados);

//rutas del carrito
// GET/ api/cliente/carrito
router.get('/cliente/carrito',verificarAuth, carritoController.getCarrito);

// POST/ api/cliente/carrito
router.post('/cliente/carrito',verificarAuth, carritoController.agregarAlCarrito);

// PUT/ api/cliente/carrito/:id
router.put('/cliente/carrito/:id',verificarAuth, carritoController.actualizarItemCarrito);

// DELETE/ api/cliente/carrito/:id
//vaciar carrito
router.delete('/cliente/carrito/:id',verificarAuth, carritoController.eliminarItemCarrito);

// DELETE/ api/cliente/carrito/:id
//vaciar carrito
router.delete('/cliente/carrito/:id/vaciar',verificarAuth, carritoController.vaciarCarrito);


// Rutas de p-clientes
// GET/ api/cliente/pedidos
router.get('/cliente/pedidos',verificarAuth, pedidoController.getMisPedidos);

// GET/ api/cliente/pedidos/:id
router.get('/cliente/pedidos/:id',verificarAuth, pedidoController.getPedidoById);

// POST/ api/cliente/pedidos
router.post('/cliente/pedidos',verificarAuth, pedidoController.crearPedido);

// PUT/ api/cliente/pedidos/:id
router.put('/subcategorias',verificarAuth, pedidoController.cancelarPedido);


module.exports = router;