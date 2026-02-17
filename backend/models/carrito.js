/**
 * Modelo de carrito para la base de datos utilizando Sequelize
 * Define la estructura de la tabla "carritos" y sus relaciones con otros modelos
 * almacena información sobre los carritos de compras de los usuarios en la aplicación
 */

//importar DataTypes de Sequelize para definir los tipos de datos de los campos
const { DataTypes } = require("sequelize");

//Importar la instancia de Sequelize para definir el modelo
const sequelize = require("../config/database");
const { table, timeStamp } = require("console");

/**
 * Definir el modelo de categoría utilizando sequelize.define()
 * El primer argumento es el nombre del modelo (en singular), el segundo argumento es un objeto que define los campos y sus tipos de datos, y el tercer argumento es un objeto de opciones para configurar el modelo.
 * En este caso, se define un modelo llamado "Categoria" con los campos id (clave primaria, auto-incremental), nombre (cadena de texto, no nulo) y descripcion (cadena de texto).
 */

const Carrito = sequelize.define(
  "carrito",
  {
    //campos de la tabla carritos
    //Id Identificador único del carrito, es la clave primaria y se auto-incrementa
    id: {
      type: DataTypes.INTEGER, //Tipo de dato entero
      primaryKey: true, //Clave primaria
      autoIncrement: true, //Auto-incremental
      allowNull: false, //No permite valores nulos
    },

    //UsuarioId ID del usuario dueño del carrito
    usuarioId: {
      type: DataTypes.INTEGER, //Tipo de dato entero
      allowNull: false, //No permite valores nulos
      references: {
        model: "Usuarios", //Referencia a la tabla de usuarios
        key: "id", //Clave foránea en la tabla de usuarios
      },
      onUpdate: "CASCADE", //Si se actualiza el ID del usuario, se actualiza el ID del carrito
      onDelete: "CASCADE", //Si se elimina el usuario, se elimina el carrito
      validate: {
        notEmpty: {
          msg: "Debe especificar el ID del usuario del carrito", //Mensaje de error personalizado si se intenta crear un carrito sin ID de usuario
        },
      },
    },

    // ProductoID Id del producto en el carrito
    productoId: {
      type: DataTypes.INTEGER, //Tipo de dato entero
      allowNull: false, //No permite valores nulos
      references: {
        model: "Productos", //Referencia a la tabla de productos
        key: "id", //Clave foránea en la tabla de productos
      },
      onUpdate: "CASCADE", //Si se actualiza el ID del producto, se actualiza el ID del carrito
      onDelete: "CASCADE", //Se elimina el producto del carrito
      validate: {
        notEmpty: {
          msg: "Debe especificar un producto del carrito", //Mensaje de error personalizado si se intenta crear un carrito sin ID de producto
        },
      },
    },

    // Cantidad de este producto en el carrito
    cantidad: {
      type: DataTypes.INTEGER, //Tipo de dato entero
      allowNull: false, //No permite valores nulos
      defaultValue: 1, //Valor por defecto de la cantidad
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
     * Precio unitario del producto al momento de agregarlo al carrito
     * se guarda para mantener el precio aunque el producto cambie de precio en el futuro
     */
    precioUnitario: {
      type: DataTypes.DECIMAL(10, 2), //Tipo de dato decimal con 10 dígitos en total y 2 decimales
      allowNull: false, //No permite valores nulos
      validate: {
        isDecimal: {
          msg: "El precio unitario debe ser un número decimal", //Mensaje de error personalizado si se intenta crear un carrito sin precio unitario
        },
        min: {
          args: [0], //Valor mínimo del precio unitario
          msg: "El precio unitario debe ser mayor o igual a 0", //Mensaje de error personalizado si se intenta crear un carrito con un precio unitario negativo
        },
      },
    },
  },
  {
    // Opciones de modelo
    tableName: "carritos",
    timestamps: true,
    //indices para mejorar las busquedas
    indexes: [
      {
        fields: ["usuarioId"], //Índice para buscar carrito por usuario
      },

      {
        //Indice compuesto: Un usuario no puede tener el mismo producto duplicado
        unique: true,
        fields: ["usuarioId", "productoId"],
        name: "usuario_producto_unique",
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
      beforeCreate: async (itemcarrito) => {
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
       * beforeUpdate se ejecuta antes de actualizar un carrito, este hook verifica si el campo "activo" ha cambiado a false (desactivado) y si es así, desactiva todas las subcategorías asociadas a esa categoría para mantener la integridad de los datos, esto ayuda a evitar problemas con productos que pertenecen a subcategorías desactivadas.
       * verifica si el campo "activo" ha cambiado a false (desactivado) y si es así, desactiva todas las subcategorías asociadas a esa categoría para mantener la integridad de los datos, esto ayuda a evitar problemas con productos que pertenecen a subcategorías desactivadas.
       * Si se activa una categoría (activo cambia a true), no se activan automáticamente las subcategorías o productos asociados, esto se deja a discreción del administrador para evitar activar subcategorías o productos que podrían no estar listos para ser activados.
       */
      BeforeUpdate: async (itemcarrito) => {
        //Verificar si el campo "cantidad" ha cambiado a false (desactivado)

        if (itemcarrito.changed("cantidad")) {
          const producto = require("./producto");
          const prducto = await producto.findByPk(itemcarrito.productoId);
          if (!prducto) {
            throw new Error(
              "El producto asociado a este item de carrito no existe", //Mensaje de error personalizado si se intenta actualizar un item de carrito con un producto que no existe
            );
          }

          if (!producto.hayStock(itemcarrito.cantidad)) {
            throw new Error(
              `Stock insuficiente, solo hay ${prducto.stock} unidades disponibles`, //Mensaje de error personalizado si se intenta actualizar un item de carrito con una cantidad que excede el stock disponible del producto
            );
          }
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
carrito.prototype.calcularSubtotal = function () {
  return parseFloat(this.precioUnitario) * this.cantidad;
};

/**
 * Metodo para actualizar la cantidad de un item de carrito, este método verifica si el nuevo valor de cantidad es válido (un número entero mayor o igual a 1) y si hay suficiente stock disponible del producto asociado antes de actualizar la cantidad en el carrito, esto ayuda a mantener la integridad de los datos y evitar problemas con productos que podrían no tener suficiente stock para satisfacer la cantidad solicitada.
 * @param {number} nuevaCantidad - La nueva cantidad que se desea establecer para este item de carrito
 * @returns {Promise} Item actualizado con la nueva cantidad si la actualización fue exitosa, o un error si la nueva cantidad no es válida o si no hay suficiente stock disponible del producto asociado.
 */
carrito.prototype.actualizarCantidad = async function (nuevaCantidad) {
  const producto = require("./producto");

  const producto = await producto.findByPk(this.productoId);

  if (!prducto.hayStock(nuevaCantidad)) {
    throw new Error(
      `Stock insuficiente, solo hay ${prducto.stock} unidades disponibles`,
    );
  }
  this.cantidad = nuevaCantidad;
  return await this.save();
};

/**
 * Metodo para obtener el carrito completo de un usuario, este método busca todos los items de carrito asociados al ID del usuario proporcionado, incluyendo la información del producto asociado a cada item de carrito, esto permite obtener una vista completa del carrito de compras de un usuario, incluyendo los detalles de cada producto agregado al carrito.
 * @param {number} usuarioId - El ID del usuario para el cual se desea obtener el carrito completo
 * @returns {Promise} Un array de items de carrito con la información del producto asociado a cada item, o un error si no se encuentra ningún item de carrito para el usuario proporcionado.
 */
carrito.obtenerCarritoUsuario = async function (usuarioId) {
  const producto = require("./producto");
  return await carrito.findAll({
    where: { usuarioId },
    include: [
      {
        model: producto,
        as: 'producto'
      },
    ],
    order: [['createdAt', 'DESC']] //Ordenar por fecha de creación, el item más reciente primero
  });
};

/**
 * Metodo para calcular el total del carrito de un usuario, este método busca todos los items de carrito asociados al ID del usuario proporcionado, calcula el subtotal de cada item (precio unitario * cantidad) y luego suma todos los subtotales para obtener el total del carrito, esto permite obtener el monto total que el usuario tendría que pagar por los productos agregados a su carrito de compras.
 * @param {number} usuarioId - El ID del usuario para el cual se desea calcular el total del carrito
 * @returns {Promise<number>} El total del carrito calculado a partir de los items de carrito asociados al usuario, o un error si no se encuentra ningún item de carrito para el usuario proporcionado.
 */
carrito.calcularTotalCarrito = async function (usuarioId) {
  const items = await carrito.findAll({ where: { usuarioId } });

  let total = 0;
  for (const item of items) {
    total += item.calcularSubtotal(); //Suma el subtotal de cada item al total
  }
  return total;
};

/**
 * metodo
 * @param {number} usuarioId
 * @return {Promise<number>}
 */
Carrito.vaciarCarrito = async function (paramusuarioId) {
    return await this.detroy({
        where: { usuarioId }
    });
};

//Exportar modelo
module.exports = Carrito;