/**
 * asociaciones entre modelos 
 * este archivo define todass las relaciones entre los modelos de sequelize
 * debe ejecutarse despues de importar los modelos
 */

//importar todos los modelos 

const Usuario = require('./Usuario');
const Categoria = require('./Categoria');
const Subcategoria = require('./Subcategoria');
const Producto = require('./producto');
const Carrito = require('./carrito');
const Pedido = require('./Pedido');
const DetallePedido= require('./detallePedido');

/**
 * definir asociaciones 
 * tipos de relaciones sequelize
 * hasOne 1-1
 * belongsTo 1-1
 * hasMany 1-N
 * belongsToMany N-N
 */
 
/**
 * categoria-sucategoria
 * una categoria tiene muchas subcategorias
 * una subcategoria pertenece a una categoria 
 */
Categoria.hasMany(Subcategoria, {
    foreignKey: 'categoriaId',//campo que conecta las tablas 
    as: 'subcategorias', //alias para la relacion
    onDelete: 'CASCADE', //si se elimina una categoria se eliminan subcategorias
    onUpdate: 'CASCADE' //si se actualiza una categoria se actualizan subcategorias
});
Subcategoria.belongsTo(Categoria, {
    foreignKey: 'categoriaId',
    as: 'categoria',
    onDelete: 'CASCADE', //si se elimina una categoria se eliminan subcategorias
    onUpdate: 'CASCADE' //si se actualiza una categoria se actualizan subcategorias
});

/**
 * categoria-producto
 * una categoria tiene muchos productos
 * un producto pertenece a una categoria 
 */
Categoria.hasMany(Producto, {
    foreignKey: 'categoriaId',//campo que conecta las tablas 
    as: 'productos', //alias para la relacion
    onDelete: 'CASCADE', //si se elimina una categoria se eliminan productos
    onUpdate: 'CASCADE' //si se actualiza una categoria se actualizan productos
});
Producto.belongsTo(Categoria, {
    foreignKey: 'categoriaId',
    as: 'categoria',
    onDelete: 'CASCADE', //si se elimina una categoria se eliminan productos
    onUpdate: 'CASCADE' //si se actualiza una categoria se actualizan productos
});

/**
 * subcategoria-producto
 * una subcategoria tiene muchos productos
 * un producto pertenece a una subcategoria 
 */
Subcategoria.hasMany(Producto, {
    foreignKey: 'subcategoriaId',//campo que conecta las tablas 
    as: 'productos', //alias para la relacion
    onDelete: 'CASCADE', //si se elimina una subcategoria se eliminan productos
    onUpdate: 'CASCADE' //si se actualiza una subcategoria se actualizan productos
});
Producto.belongsTo(Subcategoria, {
    foreignKey: 'subcategoriaId',
    as: 'subcategoria',
    onDelete: 'CASCADE', //si se elimina una subcategoria se eliminan productos
    onUpdate: 'CASCADE' //si se actualiza una subcategoria se actualizan productos
});

/**
 * usuario-carrito
 * un usuario tiene muchos carritos
 * un carrito pertenece a un usuario
 */
Usuario.hasMany(Carrito, {
    foreignKey: 'usuarioId',//campo que conecta las tablas 
    as: 'carrito', //alias para la relacion
    onDelete: 'CASCADE', //si se elimina usuario se elimina carrito
    onUpdate: 'CASCADE' //si se actualiza un usuario se actualiza carrito
});
Carrito.belongsTo(Usuario, {
    foreignKey: 'usuarioId',
    as: 'usuario',
    onDelete: 'CASCADE', //si se elimina usuario se elimina carrito
    onUpdate: 'CASCADE' //si se actualiza un usuario se actualiza carrito
});

/**
 * producto-carrito
 * un producto tiene muchos carritos
 * un carrito pertenece a un producto
 */
Producto.hasMany(Carrito, {
    foreignKey: 'productoId',//campo que conecta las tablas 
    as: 'carrito', //alias para la relacion
    onDelete: 'CASCADE', //si se elimina carrito se elimina productos
    onUpdate: 'CASCADE' //si se actualiza un producto se actualiza carrito
});
Carrito.belongsTo(Producto, {
    foreignKey: 'productoId',
    as: 'productos',
    onDelete: 'CASCADE', //si se elimina producto se elimina carrito
    onUpdate: 'CASCADE' //si se actualiza un producto se actualiza carrito
});

/**
 * usuario-pedido
 * un usuario tiene muchos pedidos
 * un pedido pertenece a un usuario
 */
Usuario.hasMany(Pedido, {
    foreignKey: 'usuarioId',//campo que conecta las tablas 
    as: 'pedidos', //alias para la relacion
    onDelete: 'RESTRICT', //si se elimina usuario no se eliminan pedidos
    onUpdate: 'CASCADE' //si se actualiza un usuario se actualizan pedidos
});
Pedido.belongsTo(Usuario, {
    foreignKey: 'usuarioId',
    as: 'usuario',
    onDelete: 'RESTRICT', //si se elimina usuario no se eliminan pedidos
    onUpdate: 'CASCADE' //si se actualiza un usuario se actualiza pedidos
});

/**
 * Pedido-detallePedido
 * un pedido tiene muchos detalles
 * un detalle pertenece a un pedido
 */
Pedido.hasMany(DetallePedido, {
    foreignKey: 'pedidoId',//campo que conecta las tablas 
    as: 'detallePedidos', //alias para la relacion
    onDelete: 'CASCADE', //si se elimina pedido se elimina detalles
    onUpdate: 'CASCADE' //si se actualiza un pedido se actualiza detalles
});
DetallePedido.belongsTo(Pedido, {
    foreignKey: 'pedidoId',//campo conector de tablas 
    as: 'pedidos', //alias para la relacion
    onDelete: 'CASCADE', //si se elimina pedido se elimina detalles
    onUpdate: 'CASCADE' //si se actualiza un pedido se actualiza detalles
});

/**
 * producto-detallePedido
 * un producto estar en muchos detalles 
 * un detalle tiene un producto
 */
Producto.hasMany(DetallePedido, {
    foreignKey: 'productoId',//campo que conecta las tablas 
    as: 'detallePedidos', //alias para la relacion
    onDelete: 'RESTRICT', //no se pede eliminar un producto si esta en un detalle de pedido
    onUpdate: 'CASCADE' //si se actualiza un producto se actualiza detalle
});
DetallePedido.belongsTo(Producto, {
    foreignKey: 'productoId',//campo conector de las tablas
    as: 'producto', //alias de la relacion
    onDelete: 'RESTRICT', //no se puede eliminar un producto si esta en un detalle de pedido
    onUpdate: 'CASCADE' //si se actualiza un producto se actualiza detalle
});

/**
 * relacion muchos a muchos 
 * pedido y producto tiene una relacion muchos a muchos a travez de detalle de pedido
 */

/**
 * pedido-producto
 * un pedido puede tener muchos productos
 * un producto esta en muchos pedidos
 */
Pedido.belongsToMany(Producto, {
    through: DetallePedido, //tabla intermedia
    foreignKey: 'pedidoId',//campo que conecta las tablas 
    otherKey: 'productoId',//campo que conecta las tablas 
    as: 'productos' //alias para la relacion
});
Producto.belongsToMany(Pedido, {
    through: DetallePedido, //tabla intermedia
    foreignKey: 'productoId',//campo conector de las tablas
    otherKey: 'pedidoId',//campo conector de las tablas
    as: 'pedidos', //alias de la relacion
});

/**
 * exportar funcion de inicializacion
 * funcion para inicializar todas las asociaciones 
 * se llama desde server.js despues de cargar los modelos 
 */
const initAssociations = () => {
    console.log('Asociaciones entre los modelos establecidas correctamente')
};

//exportar los modelos 
module.exports = {
    Usuario,
    Categoria,
    Subcategoria,
    Producto,
    Carrito,
    Pedido,
    DetallePedido,
    initAssociations
};