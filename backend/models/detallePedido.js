/**
 * Modelo detalle pedido
 * Define la tabla Detalle Pedido en la base de datos
 * almacena los productos incluidos en cada pedido
 * relacion muchos a muchos entre pedido y producto
 */

//importar DataTypes de Sequelize para definir los tipos de datos de los campos
const { DataTypes } = require("sequelize");

//Importar la instancia de Sequelize para definir el modelo
const sequelize = require("../config/database");


/**
 * Definir el modelo detalle de pedido
*/

const DetallePedido = sequelize.define('DetallePedido',
    {
    //campos de la tabla carritos
    //Id Identificador único del detalle del pedido, es la clave primaria y se auto-incrementa
    id: {
      type: DataTypes.INTEGER, //Tipo de dato entero
      primaryKey: true, //Clave primaria
      autoIncrement: true, //Auto-incremental
      allowNull: false, //No permite valores nulos
    },

    //pedidoId ID del detalle
    pedidoId: {
      type: DataTypes.INTEGER, //Tipo de dato entero
      allowNull: false, //No permite valores nulos
        references: {
        model: 'Pedidos', //Referencia a la tabla de pedidos
        key: "id", //Clave foránea en la tabla de pedidos
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE", //Si se elimina el pedido eliminar detalles
        validate: {
        notEmpty: {
        msg: "Debe especificar un pedido", //Mensaje de error personalizado si se intenta crear un carrito sin ID de usuario
        },
        },
    },

    // ProductoID Id del producto incluido en el producto
    productoId: {
      type: DataTypes.INTEGER, //Tipo de dato entero
        allowNull: false, //No permite valores nulos
        references: {
        model: "Productos", //Referencia a la tabla de productos
        key: "id", //Clave foránea en la tabla de productos
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT", //No se puede eliminar productos con pedidos
        validate: {
        notEmpty: {
        msg: "Debe especificar un producto", //Mensaje de error personalizado si se intenta crear un carrito sin ID de producto
        },
        },
    },

    // Cantidad de este producto en el pedido
    cantidad: {
        type: DataTypes.INTEGER, //Tipo de dato entero
        allowNull: false, //No permite valores nulos
        validate: {
        isInt: {
            msg: "La cantidad debe ser un número entero", //Mensaje de error personalizado si se intenta crear un carrito sin cantidad
        },
        min: {
            args: [1], //Valor mínimo de la cantidad
            msg: "La cantidad debe ser al menos 1", //Mensaje de error personalizado si se intenta crear un carrito con una cantidad menor a 1
        },
        },
    },

    /**
     * Precio del producto al momento de agregarlo al pedido
     * se guarda para mantener el historial aunque el producto cambie de precio
     */
    precioUnitario: {
      type: DataTypes.DECIMAL(10, 2), //Tipo de dato decimal con 10 dígitos en total y 2 decimales
      allowNull: false, //No permite valores nulos
        validate: {
        min: {
          args: [0], //Valor mínimo del precio unitario
          msg: "El precio no puede ser negativo", //Mensaje de error personalizado si se intenta crear un carrito con un precio unitario negativo
        },
        },
    },

    /**
     * Subtotal de este item (precio*cantidad)
     * se calcula automaticamente antes de guardar
     */
    subtotal:{
        type: DataTypes.DECIMAL(10,2),
        allowNull: false,
        validate: {
            min: {
                args: [0],
                msg: 'El subtotal no puede ser negativo'
            }
        }
    }
}, {
    // Opciones de modelo
    tableName: "detalle_pedidos",
    timestamps: false, //no necesita createdAt/updateAt
    //indices para mejorar las busquedas
    indexes: [
        {
        fields: ["pedidoId"], //Índice para buscar detalles por pedido
        },
        {
        fields: ["productoId"], //Índice para buscar detalles por producto
        },
    ],

    /**
     * Hooks acciones automaticas que se ejecutan en ciertos momentos del ciclo de vida de un modelo, en este caso se define un hook "beforeUpdate" que se ejecuta antes de actualizar un registro de categoría, este hook verifica si el campo "activo" ha cambiado a false (desactivado) y si es así, desactiva todas las subcategorías asociadas a esa categoría para mantener la integridad de los datos.
     */

    hooks: {
    /**
     * beforeCreate se ejecuta antes de crear un detalle de pedido
     * calcula el subtotal auto
    */
        beforeCreate: (detalle) => {
            //calcular el subtotal precio*cantidad
            detalle.subtotal = parseFloat (detalle.precioUnitario) * detalle.cantidad;
        },
        /**
       * beforeUpdate se ejecuta antes de actualizar  detalle de pedido
       * recalcula el subtotal si cambio precio o cantidad
       */
        beforeUpdate: (detalle) => {
        //Verificar si el campo "cantidad" ha cambiado

        if (detalle.changed("precioUnitario")|| detalle.changed('cantidad')) {
            detalle.subtotal = parseFloat (detalle.precioUnitario) * detalle.cantidad;
        }
      },
    },
  },
);

//METODOS DE INSTANCIA
/**
 * Método de instancia para obtener el número de subcategorías activas asociadas a esta categoría
 * @returns {number} - Subtotal de productos asociados a esta subcategoría (precio unitario * cantidad)
 */
DetallePedido.prototype.calcularSubtotal = function(){
    return parseFloat (this.precioUnitario) * this.cantidad;
}

/**
 * Metodo para actualizar la cantidad de un item de carrito, este método verifica si el nuevo valor de cantidad es válido (un número entero mayor o igual a 1) y si hay suficiente stock disponible del producto asociado antes de actualizar la cantidad en el carrito, esto ayuda a mantener la integridad de los datos y evitar problemas con productos que podrían no tener suficiente stock para satisfacer la cantidad solicitada.
 * @param {number} pedidoId -id del pedido
 * @param {Array} itemsCarrito - items del carrito
 * @returns {Promise<Array>} Item actualizado con la nueva cantidad si la actualización fue exitosa, o un error si la nueva cantidad no es válida o si no hay suficiente stock disponible del producto asociado.
 */
DetallePedido.crearDesdeCarrito = async function (pedidoId, itemsCarrito) {
    const  detalles = [];
    for (const item of itemsCarrito){
        const detalle = await this.create({
            pedidoId: pedidoId,
            productoId: item.productoId,
            cantidad: item.cantidad,
            precioUnitario: item.precioUnitario,
        });
        detalles.push(detalle);
    }
    return detalles;
};

/**
 * Metodo para calcular el total de un pedido desde sus detalles
 * @param {number} pedidoId - El ID del pedido
 * @returns {Promise<number>} total calculado
 */
DetallePedido.calcularTotalPedido = async function (pedidoId) {
    const detalles= await this.findAll({
        where: {pedidoId}
    });

    let total = 0;
    for (const detalle of detalles){
        total += parseFloat (detalle.subtotal);
    }
return total;
};


/**
 * Metodo para obtener resumen de los productos mas vendidos
 * @param {number} limite - numero de productos a retornar
 * @returns {Promise<number>} total del carrito
 */
DetallePedido.obtenerMasVendidos = async function (limite=10) {
    const { sequelize } = require ('../config/database');
    return await this.findAll({
        attributes: [
            'productoId',
            [sequelize.fn('SUM', sequelize.col('cantidad')), 'totalVendido'],
        ],
        group: ['productoId'],
        order: [[sequelize.fn('SUM', sequelize.col('cantidad')), 'DESC']],
        limit: limite
    });
};



//Exportar modelo
module.exports = DetallePedido;