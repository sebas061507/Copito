/**
 * Modelo pedido
 * Define la tabla pedido en la base de datos
 * almacena información sobre los pedidos realizados por usuarios
 */

//importar DataTypes de Sequelize para definir los tipos de datos de los campos
const { DataTypes } = require("sequelize");

//Importar la instancia de Sequelize para definir el modelo
const sequelize = require("../config/database");

/**
 * Definir el modelo de pedido
*/

const Pedido = sequelize.define("Pedido",
    {
    //campos de la tabla carritos
    //Id Identificador único del carrito, es la clave primaria y se auto-incrementa
    id: {
      type: DataTypes.INTEGER, //Tipo de dato entero
      primaryKey: true, //Clave primaria
      autoIncrement: true, //Auto-incremental
      allowNull: false, //No permite valores nulos
    },

    //UsuarioId ID del usuario que realiuzo el pedido
    usuarioId: {
      type: DataTypes.INTEGER, //Tipo de dato entero
      allowNull: false, //No permite valores nulos
        references: {
        model: "Usuarios", //Referencia a la tabla de usuarios
        key: "id", //Clave foránea en la tabla de usuarios
    },
      onUpdate: "CASCADE", //Si se actualiza el ID del usuario, se actualiza el ID del carrito
      onDelete: "RESTRICT", //No se puede eliminar un usuario con pedidos
        validate: {
        notEmpty: {
          msg: "Debe especificar el ID del usuario del carrito", //Mensaje de error personalizado si se intenta crear un carrito sin ID de usuario
        },
    },
    },

    //Total monto del pedido
    total: {
        type: DataTypes.DECIMAL(10,2),
        allowNull: false,
        validate: {
            isDecimal: {
                msg: 'El total debe ser un numero decimal valido'
            }
        },
        min: {
            arg: [0],
            msg: 'El total no puede ser negativo'
        }
    },

    /**
     * Estado- estado actual del pedido
     * valores posibles: 
     * pendiente: pedido creado, esperando pago
     * pagado: pedido pagado, en preparacion 
     * enviado: pedido enviado al cliente
     * cancelado: pedido cancelado   
     */
    estado: {
        type: DataTypes.ENUM('Pendiente','Pagado', 'Enviado', 'Cancelado'),
        allowNull: false,
        defaultValue: 'pendiente',
        validate: {
            isIn: {
                args: [['pendiente', 'pagado', 'enviado', 'cancelado']],
            }
        }
    },
    //Direccio de envio del pedido
    direccionEnvio: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
            notEmpty: {
                msg: 'La dirreccion de envio es obligatoria'
            }
        }
    },

    //telefono de contacto para el envio
    telefono: {
        type:  DataTypes.STRING(20),
        allowNull: false,
        validate: {
            notEmpty: {
                msg: 'El telefono de contacto es obligatorio'
            }
        }
    },

    //notas adicionales del pedido (opcional)
    notas: {
        type: DataTypes.TEXT,
        allowNull: true,
    },

    //Fecha de pago 
    fechaPago: {
        type: DataTypes.DATE,
        allowNull: true
    },

        //Fecha de envio 
    fechaEnvio: {
        type: DataTypes.DATE,
        allowNull: true
    },

        //Fecha de entrega
    fechaEntrega: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    // Opciones de modelo

    tableName: "pedidos",
    timestamps: true,
    //indices para mejorar las busquedas
    indexes: [
      {
        fields: ["usuarioId"], //Índice para buscar carrito por usuario
      },

      {
        fields: ["estado"], //Índice para buscar pedido por usuario
      },

      {
        fields: ["createdAt"], //Índice para buscar pedido por fecha
      },
    ],
    /**
     * Hooks acciones automaticas que se ejecutan en ciertos momentos del ciclo de vida de un modelo, en este caso se define un hook "beforeUpdate" que se ejecuta antes de actualizar un registro de categoría, este hook verifica si el campo "activo" ha cambiado a false (desactivado) y si es así, desactiva todas las subcategorías asociadas a esa categoría para mantener la integridad de los datos.
     */

    hooks: {
      /**
       * beforeCreate se ejecuta antes de crear un nuevo registro de categoría, este hook verifica si el campo "activo" está establecido en false (desactivado) y si es así, lanza un error para evitar que se creen categorías desactivadas, esto ayuda a mantener la integridad de los datos y evitar problemas con productos que pertenecen a subcategorías desactivadas.
       * verifica que la categoria no se cree con el campo "activo" establecido en false, lo que podría causar problemas de integridad de datos si se crean subcategorías o productos asociados a una categoría que ya está desactivada.
       */
      /**beforeCreate: async (itemcarrito) => {
        const producto = require("./producto");
        //Buscar el producto asociado a este item de carrito para verificar su estado
        const prducto = await producto.findByPk(itemcarrito.productoId);

        if (!prducto) {
          throw new Error(
            "El producto asociado a este item de carrito no existe", //Mensaje de error personalizado si se intenta crear un item de carrito con un producto que no existe
          );
        }

        if (!prducto.activo) {
          throw new Error(
            "No se puede crear un item de carrito para un producto desactivado", //Mensaje de error personalizado si se intenta crear un item de carrito para un producto que está desactivado
          );
        }

        if (!producto.hayStock(itemcarrito.cantidad)) {
          throw new Error(
            `Stock insuficiente, solo hay ${prducto.stock} unidades disponibles`, //Mensaje de error personalizado si se intenta crear un item de carrito con una cantidad que excede el stock disponible del producto
          );
        }

        //Guardar el precio unitario del producto al momento de agregarlo al carrito para mantener el precio aunque el producto cambie de precio en el futuro
        itemcarrito.precioUnitario = prducto.precio;
      },
      /**
       * afterUpdate se ejecuta despues de actualizar un pedido
       * actualiza las fechas segun el estado
       */
      afterUpdate: async (pedido) => {
        //si el estado cambio a pagado guarda la fecha de pago

        if (pedido.changed("estado")&& pedido.estado === 'pagado') {
          pedido.fechaPago = new Date();
          await pedido.save({ hooks:false });//guardar sin ejecutar hooks

          
 
        }
        //si el estado cambia a enviado guarda la fecha de envio
        if (pedido.changed('estado') && pedido.estado === 'enviado' && !pedido.fechaEnvio){
          pedido.fechaEnvio = new Date();
          await pedido.save({ hooks:false }); //guardar sin ejecutar hooks 
          }

        //si el estado cambia a enviado guarda la fecha de envio
        if (pedido.changed('estado') && pedido.estado === 'entregado' && !pedido.fechaEntrega){
          pedido.fechaEntrega = new Date();
          await pedido.save({ hooks:false }); //guardar sin ejecutar hooks 
        }
      },

    },

    /**
     * beforeDestroy: se ejecuta antes de eliminar un pedido
     */
    beforeDestroy: async (pedido) => {
      throw new Error('No se puede eliminar pedidos, use el estado camcelado en su lugar');
    }
  },
);

//METODOS DE INSTANCIA
/**
 * Método para cambiar el estado del pedido 
 * 
 * @param {string} nuevoEstado - nuevo estado del pedido
 * @returns {number} - Subtotal (precio * cantidad)
 */

Pedido.prototype.cambiarEstado = async function (nuevoEstado){
  const estadosValidos = ['pendiente', 'pagado', 'enviado', 'cancelado'];

  if (!estadosValidos.includes(nuevoEstado)){
    throw new Error('estado invalido')
  }

  this.estado = nuevoEstado;
  return await this.save();
};

/**
 * Metodo para verificar si el pedido puede ser cancelado
 * solo se pueden cancelar si el esta en estado pendiente o pagado
 * @returns {boolean} true si puede cancelarse false si no
 */

Pedido.prototype.puedeSerCancelado = function(){
  return ['pendiente', 'pagado'].includes(this.estado);
};

/**
 * metodo para cancelar el pedido
 * @returns {Promise<Pedido>} pedido cancelado
 */
Pedido.prototype.cancelar = async function () {
  if(!this.puedeSerCancelado()){
    throw new Error('Este pedido no puede ser cancelado');
  }


  //Importar modelos 
  const DetallePedido = require ('.//detallePedido');
  const Producto = require ('.//producto');

  //Obtener detalles del pedido
  const detalles = await DetallePedido.findAll({
    where: { pedidoId: this.id }
  });

  //devolver el stock de cada producto
  for(const detalle of detalles){
    const producto = await Producto.findByPk(detalle.productoId);
    if(producto){
      await producto.aumentarStock(detalle.cantidad);
      console.log(`Stock devuelto: ${detalle.cantidad} X ${producto.nombre}`);
    }
  }

  //Cambiar estado a cancelado
  this.estado = 'cancelado';
  return await this.save();
};


/**
 * Metodo para obtener detalles del pedido con productos
 * @returns {Promise<Array>} - detalle del peidod
 */
Pedido.prototype.obtenerDetalle = async function (){
  const DetallePedido = require('./detallePedido');
  const Producto = require('./producto');

  return await DetallePedido.findAll({
    where: { pedidoId: this.id },
    include: [
      {
        model: Producto,
        as: 'producto'
      },
    ]
  });
};

/**
 * Metodo para obtener pedidos por estado 
 * @param {string} estado - estado a filtrar
 * @returns {Promise<Array>} Pedidos filtrados 
 */
Pedido.obtenerPedidosPorEstado = async function (estado) {
  const Usuario = require('./Usuario');
  return await this.findAll({
    where: { estado },
    include:[
      {
        model: Usuario,
        as: 'usuario',
        attributes: ['id','nombre', 'email', 'telefono']
      }
    ],
    order: [['createdAt', 'DESC']]
  });
};

/**
 * metodo para obtener el historial de pedidos de un usuario
 * @param {number} usuarioId - id usuario
 * @return {Promise<number>} - pedidos del usuario
 */
Pedido.obtenerHistorialUsuario = async function (usuarioId) {
    return await this.findAll({
        where: { usuarioId },
        order: [['createdAt', 'DESC']]
    });
};

//Exportar modelo
module.exports = Pedido;