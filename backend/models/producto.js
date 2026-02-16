/**
 * MODELO PRODUCTO
 * define la tabla producto en la base de daos
 * Almacena los productos
 */

//Importar DataTypes de sequelize 
const { DataTypes } = require('sequelize');

//importar instancia de sequelize
const { sequelize } = require('../config/database');

/**
 * Definir el modelo de Producto
 */
const Producto = sequelize.define('Producto', {
    //Campos de la tablas
    //Id Identificador unico (PRIMARY KEY)
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },

    nombre: {
        type: DataTypes.STRING(200), 
        allowNull: false,
        validate: {
            notEmpy: {
                msg: 'El nombre del producto no puede estar vacio'
            },
            len: {
                args: [3, 200],
                msg: 'El nombre debe tener entre 3 y 200 caracteres'
            }
        }
    },

    /**
     * Descripcion detallada del producto 
     */
    descripcion: {
        type: DataTypes.TEXT,
        allowNull: true,
    },

    //Precio del producto 
    precio: {
        type: DataTypes.DECIMAL(10,2), //Hasta 99,999,999.99
        allowNull: false,
        validate: {
            isDecimal: {
                msg: 'El precio debe ser un numero decimal valido'
            },
            min: {
                args: [0],
                msg: 'El precio no puede ser negativo'
            }
        }
    },

    //stock del producto cantidad disponible en inventario
    stock: {
        type: DataTypes.INTEGER, 
        allowNull: false,
        defaultValue: 0,
        validate: {
            isInt: {
                msg: 'El stock debe ser un numero entero'
            },
            min: {
                args: [0],
                msg: 'El stock no puede ser negativo'
            }
        }
    },

    /**
     * imagen Nombre del archivo de la imagen
     * se guarda solo el nombre ejemplo: coca-cola-producto.jpg
     * la ruta seria uploads/coca-cola-producto.jpg
     */
    imagen: {
        type: DataTypes.STRING(255),
        allowNull: true, //la imagen puede ser opcional
        validate: {
            is: {
                args: /\.(jpg|jpeg|png|gif)$/i,
                msg: 'la imagen debe ser un archivo JPG, JPEG, PNG o GIF'
            }
        }
    },
    /**
     * categoriaId - ID de la categoria a la que pertenece (FOREIGN KEY)
     * Esta es la relacion con la tabla categoria
     */

    subcategoriaId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'subcategorias', //nombre de la tabla relacionada
            key: 'id' //campo de la tabla relacioonada
        },
        onUpdate: 'CASCADE', // si se actualiza el id, actualizar aca tambien
        onDelete: 'CASCADE', // si se elimina la categoria eliminar la subcategoria
        validate: {
            notNull: {
                msg: 'Debe seleccionar una categoria'
            }
        }
    },
    /**
     * categoriaId - ID de la categoria a la que pertenece (FOREIGN KEY)
     * Esta es la relacion con la tabla categoria
     */
    categoriaId: {
        type: DataTypes.INTERGER,
        allowNull: false,
        references: {
            model: 'categorias', //nombre de la tabla relacionada
            key: 'id' //campo de la tabla relacioonada
        },
        onUpdate: 'CASCADE', // si se actualiza el id, actualizar aca tambien
        onDelete: 'CASCADE', // si se elimina la categoria eliminar la subcategoria
        validate: {
            notNull: {
                msg: 'Debe seleccionar una categoria'
            }
        }
    },

    /**
     * activo estado de la subcategoria 
     * si es false los productos de esta subcategoria se ocultan
     */
    activo: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    }

}, {
    // Opciones del modelo

    tableName: 'productos',
    timestamps: true, //Agrega campos de createdAT y updateAT

    /**
     * indixces compuestos para optimizar busquedas
     */
    indixes: [
        {
            //Indice para buscar productos por subcategoria
            fields: ['subcategoriaId']
        },
        {
            //Indice para buscar productos por subcategoria
            fields: ['categoriaId']
        },

        {
            //Indice para buscar productos activos
            fields: ['activo']
        },
        {
            //Indice para buscar productos por nombre
            fields: ['nombre']
        },
    ],

    /**
     * Hooks Acciones automaticas 
     */

    hooks: {
        /**
         * beforeCreate - se ejecuta antes de crear un producto
         * valida que la subcategoria y que la categoria este activa
         */
        beforeCreate: async (producto) => {
            const Categoria = require('./categoria'); //No lee la ruta con C nayuscula
            const Subcategoria = require('./Subcategoria');

            //Buscar subcategoria padre
            const subcategoria = await Subcategoria.findByPk(producto.subcategoriaId);

            if (!subcategoria) {
                throw new Error('La subcategoria seleccionada no existe');
            }

            if (!subcategoria.activo) {
                throw new Error('No se puede crear un producto en una subcategoria inactiva');
            }

            //Buscar categoria padre
            const categoria = await Categoria.findByPk(producto.categoriaId);

            if (!categoria) {
                throw new Error('La categoria seleccionada no existe');
            }

            if (!categoria.activo) {
                throw new Error('No se puede crear un producto en la categoria seleccionada no existe');
            }

            //validar que la subcategoria le pertenece a una categoria
            if (subcategoria.categoriaId !== producto.categoriaId) {
                throw new Error ('La subcategoria no pertenece a la categoria seleccionada')
            }
        },

        /**
         * beforeDestroy: se ejecuta antes de eliminar un producto
         * Elimina la imagen del servidor si existe 
         */

        beforeDestroy: async (producto) => {
            if (producto.imagen) {
                const { deleteFile } = require('../config/multer');
                // intenta eliminar la imagen del servidor
                const eliminado = await deleteFile (producto.imagen);

                if (eliminado) {
                    console.log(`Imagen eliminada: ${producto.imagen}`);
                }
            }
        }

    }
});

// METODOS DE INSTACIA 
/**
 * Metodo para ontener la URL completa de la imagen
 * 
 * @returns {string|null} - url de la imagen
 */
Producto.prototype.obtenerUrlImagen = function() {
    if (this.imagen) {
        return null;
    }

    const baseURL = process.env.FRONTEND_URL || 'https://localhost:5000' ;
    return `${baseURL}/uploads/${this.imagen}`;
};

/**
 * metodo para verificar si hay stock disponible
 * 
 * @param {number} cantidad - cantidad a verificar 
 * @returns {boolean} - true si hay stock suficiente false si no
 */
Producto.prototype.hayStock = function(cantidad = 3) {
    return this.stock >= cantidad;
};

/**
 * Metodo para reducir el stock 
 * util para despues de una venta 
 * @param {number} cantidad - cantidad a reducir
 * @returns {Promise<Producto>} - producto actualizado
 */
Producto.prototype.reducirStock = async function (cantidad) {
    if (this.hayStock(cantidad)) {
        throw new Error ('Stock insuficiente');
    }
    this.stock -= cantidad;
    return await this.save();
};

/**
 * Metofo para aumnetar el stock
 * util al cancelar una venta o reccibir inventario
 * @param {number} cantidad - cantidad a aumentra
 * @returns {Promise<Producto>} producto actualizado
 */
Producto.prototype.aumenarStock = async function (cantidad) {
    this.stock += cantidad;
    return await this.save();
};

//Exportar modelo Producto
module.exports = Producto;