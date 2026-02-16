/**
 * MODELO SUBCATEGORIA
 * define la tabla Subcategoria en la base de daos
 * Almacena las subcategorias de los productos
 */

//Importar DataType de sequelize 
const {DataTypes } = require('sequelize');

//importar instancia de sequelize
const { sequelize } = require('../config/database');

/**
 * Definir el modelo de Subcategoria
 */
const Subcategoria = sequelize.define('Subcategoria', {
    //Campos de la tablas
    //Id Identificador unico (PRIMARY KEY)
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },

    nombre: {
        type: DataTypes.STRING(100), 
        allowNull: false,
        unique: {
            msg: 'Ya existe una subcategoria con ese nombre'
        },
        validate: {
            notEmpty: {
                msg: 'El nombre de la subcategoria no puede estar vacio'
            },
            len: {
                args: [2, 100],
                msg: 'El nombre debe tener netre 2 y 100 caracteres'
            }
        }
    },

    /**
     * Descripcion dee la subcategoria 
     */
    descripcion: {
        type: DataTypes.TEXT,
        allowNull: true,
    },

    /**
     * categoriaId - ID de la categoria a la que pertenece (FOREIGN KEY)
     * Esta es la relacion con la tabla categoria
     */
    categoriaId: {
        type: DataTypes.INTEGER,
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
    // Opciones dek modelo

    tableName: 'subcategorias',
    timestamps: true, //Agrega campos de createdAT y updateAT

    /**
     * indixces compuestos para optimizar busquedas
     */
    indixes: [
        {
            //Indice para buscar subcategorias pro categoria
            fields: ['categoriaId']
        },
        {
            //Indice compuesto: nombre unico por categoria
            //Permite que dos categorias diferentes tengan subcategorias con el mismo nombre
            unique:true,
            fields: ['nombre', 'categoriaId'],
            name: 'nombre:categoria:unique'
        }
    ],

    /**
     * Hooks Acciones automaticas 
     */

    hooks: {
        /**
         * beforeCreate - se ejecuta antes de crear una subcategoria
         * verifica que la categoria padre este activa
         */
        beforeCreate: async (subcategoria) => {
            const Categoria = require('./categoria'); //No lee la ruta con C nayuscula

            //Buscar categoria padre
            const categoria = await Categoria.findByPk(subcategoria.categoriaId);

            if (!categoria) {
                throw new Error('La categoria seleccionada no existe');
            }

            if (!categoria.activo) {
                throw new Error('No se puede crear una subcategoria en una categoria inactiva');
            }
        },
        /**
         * afterUpdate: se ejecuta despues de actualizar una subcategoria
         * si se desactiva una subcategoria se descativan todos sus productos
         */
        afterUpdate: async (subcategoria, options) => {
            //Verificar si el campo activo cambio
            if (subcategoria.changed('activo') && !subcategoria.activo) {
                console.log(`Desactivando subcategoria: ${subcategoria.nombre}`);

                // Importar modelos (aqui para evitat dependecias circulares)
                const Producto = require('./Producto');

                try {
                    // Paso 1 desactivar las subcategorias de esta subcategoria
                    const productos = await Producto.findAll({
                        where: { subcategoriaId: subcategoria.id}
                    });

                    for (const producto of productos) {
                        await producto.update({
                            activo: false}, {transaction: options.transaction});
                            console.log(`Producto desactivado: ${producto.nombre}`);
                }
                console.log(`Subcategoria y productos relacionados desactivados correctamente`);
            } catch (error) {
                console.error('Error al desactivar productos relacionados:', error.message);
                throw error;
            }
        }
                
            // Si se activa una categoria no se activam auomaticamente las subcategorias y productos
        }
    }
});
// METODOS DE INSTACIA 
/**
 * Metodo para contar productos de esta subcategoria
 * 
 * @returns {Promise<number>} - numero de productos
 */
Subcategoria.prototype.contarProductos = async function() {
    const Producto= require('./Producto');
    return await Producto.count({ 
        where: { subcategoriaId: this.id} });
};

/**
 * Metodo para obtener la categoria padre
 * 
 * @param {Promise<Categoria>} - categoria padre
 */
Subcategoria.prototype.obtenerCategoria = async function() {
    const Categoria = require('./categoria'); //No lee la ruta con C nayuscula
    return await Categoria.findByPk(this.categoriaId);
};
//Exportar modelo Subcategoria
module.exports = Subcategoria;