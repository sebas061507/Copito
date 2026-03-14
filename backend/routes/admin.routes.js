/**
 * Rutas del administrador
 * agrupa todas las rutas de gestion del admin
 */
const express = require('express');
const router = express.Router();

// importar los mddlewares 
const { verificarAuth } = require('../middleware/auth');
const { esAdmin, esAdminOAuxiliar, soloAdministrador} = require('../middleware/checkRole');

// importar configuracion de multer para la subida de imagenes
const { upload } = require('../config/multer');

// importar controladores
const categoriaController = require('../controllers/categoria.controller');
const subcategoriaController = require('../controllers/subcategoria.controller');
const productoController = require('../controllers/productos.controller');
const usuarioController = require('../controllers/usuario.controller');
const pedidoController = require('../controllers/pedido.controller');

// restricciones de acceso a las rutas admin
router.use(verificarAuth, esAdminOAuxiliar);

// Rutas de categorias
// GET/ api/admin/categorias
router.get('/categorias', categoriaController.getCategorias);

// GET/ api/admin/categorias/:id
router.get('/categorias/:id', categoriaController.getCategoriasById);

// GET/ api/admin/categorias/:id/stats
router.get('/categorias/:id/stats', categoriaController.getEstadisticasCategorias);

// POST/ api/admin/categorias
router.post('/categorias', categoriaController.crearCategoria);

// PUT/ api/admin/categorias/:id
router.put('/categorias/:id', categoriaController.actualizaCategoria);

// PATCH/ api/admin/categorias/:id/toggle desactivar o activar categoria
router.patch('/categorias/:id/toggle', categoriaController.toggleCategoria);

// DELETE/ api/admin/categorias
router.delete('/categorias/:id', soloAdministrador,categoriaController.eliminarCategoria);



// Rutas de subcategorias
// GET/ api/admin/subcategorias
router.get('/subcategorias', subcategoriaController.getSubcategorias);

// GET/ api/admin/subcategorias/:id
router.get('/subcategorias/:id', subcategoriaController.getSubcategoriasById);

// GET/ api/admin/subcategorias/:id/stats
router.get('/subcategorias/:id/stats', subcategoriaController.getEstadisticasSubcategoria);

// POST/ api/admin/subcategorias
router.post('/subcategorias', subcategoriaController.crearSubcategoria);

// PUT/ api/admin/subcategorias
router.put('/subcategorias', subcategoriaController.actualizarSubcategoria);

// PATCH/ api/admin/subcategorias/:id/toggle desactivar o activar categoria
router.patch('/subcategorias/:id/toggle', subcategoriaController.toggleSubcategoria);

// DELETE/ api/admin/subcategorias
router.delete('/subcategorias/:id', soloAdministrador,subcategoriaController.eliminarSubcategoria);


// Rutas de productos
// GET/ api/admin/productos
router.get('/productos', productoController.getProductos);

// GET/ api/admin/productos/:id
router.get('/productos/:id', productoController.getProductoById);


// POST/ api/admin/Productos
router.post('/productos', productoController.crearProducto);

// PUT/ api/admin/productos
router.put('/productos/:id', productoController.actualizarProducto);

// PATCH/ api/admin/productos/:id/toggle desactivar o activar productos
router.patch('/productos/:id/toggle', productoController.toggleProducto);

// PATCH/ api/admin/productos/:id/toggle desactivar o activar productos
router.patch('/productos/:id/stock', productoController.actualizarStock);

// DELETE/ api/admin/productos
router.delete('/productos/:id', soloAdministrador,productoController.eliminarProducto);

//RUTAS DE USUARIOS
// GET/ api/admin/usuarios/stats
router.get('/usuarios/stats', usuarioController.getEstadisticasUsuarios);

// GET/ api/admin/usuarios
router.get('/usuarios', usuarioController.getUsuarios);

// GET/ api/admin/usuarios/:id
router.get('/usuarios/:id', usuarioController.getUsuarioById);

// POST/ api/admin/usuarios
router.post('/usuarios', soloAdministrador, usuarioController.crearUsuario);

// PUT/ api/admin/usuarios/:id
router.put('/usuarios/:id',soloAdministrador, usuarioController.actualizaUsuario);

// PATCH/ api/admin/usuarios/:id/toggle desactivar o activar usuarios
router.patch('/usuarios/:id/toggle',soloAdministrador, usuarioController.toggleUsuario);

// DELETE/ api/admin/usuarios
router.delete('/usuarios/:id', soloAdministrador,usuarioController.eliminarUsuario);

//RUTAS DE PEDIDOS
// GET/ api/admin/pedidos
router.get('/pedidos', pedidoController.getAllPedidos);

// GET/ api/admin/pedidos/:id
router.get('/pedidos/:id', pedidoController.getPedidoById);

// GET/ api/admin/pedidos/:id/stats
router.get('/pedidos/:id/stats', pedidoController.getEstadisticasPedidos);

// POST/ api/admin/pedidos
router.post('/pedidos', pedidoController.crearPedido);

// PUT/ api/admin/pedidos/:id
router.put('/pedidos/:id', pedidoController.actualizarEstadoPedido);

module.exports = router;