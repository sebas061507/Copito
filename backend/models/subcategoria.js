/**
 * Modelo de subcategoria para  la base de datos 
 * Define la tabla subcategoria en la base de datos
 * Almacena las subcategorias de los productos
 */

//Importar DataTypes de sequelize
const { DataTypes } = require('sequelize');

//Importar instancia de sequelize
const { sequelize }=require('../config/dataBase');
const { type } = require('os');

/**
 * Definir el modelo de categoria
 */
const Subcategoria = sequelize.define('Subcategoria',{
    //Campos de la tabla 
    //Id Identificador unico (PRIMARY KEY)
    id:{
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },

    nombre:{
        type: DataTypes.STRING(100),
        allowNull: false,
        ubique:{
            msg:'Ya existe una subcategoria con ese nombre'
        },
        validate:{
            notEmpty:{
                msg:'El nombre de la subcategoría no puede estar vacío'
            },
            len:{
                args: [2,100],
                msg: 'El nombre debe tener entre 2 y 100 caracteres'
            }
        }
    },
    /**
     * Descrpción de la subcategoria
     */
    descripcion: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    /**
     * CategoriaId-id de la categoria a la que pertenece la subcategoria  (FOREIGN KEY)
     * Esta es la relacion con la tabla categoria
     */
    categoriaId:{
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'categorias', //nombre de la tabla relacionada
            key:'id'//campo de la tabla relacionada
        },
        onUpdate: 'CASCADE', //si se actualiza el id, actualiza aca tambien
        onDelete: 'CASCADE',//Si se elimina la categoria elimina las subcategorias
        validate: {
            notNull:{
                msg: 'Debe seleccionar una categoria'
            }
        }
    }
    /**
     * activo estado de la subcategoria
     * si es false los productos de esta subcategoria se ocultan
     */
    activo: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    }
},
    //opciones del modelo

    tableName:'subcategorias',
    timestamps: true, //agrega campos de createdAt y updateAt

    /**
     * indices compuestos para optimizar busquedas 
     */
    indexes : [
        {
            //inidce para buscar subcategorias por categoria
            fields: ['categoriaId']
        },
        {
            //indice compuesto: nombre unico por categoria
            //permite que dos categorias diferentes tengan subcategorias con el mismo nombre 
            unique: true,
            fields: ['nombre', 'categoriaId'],
            name: 'nombre_categoria_unique',
        }
    ],
    /**
     * Hooks Acciones automaticas
     */

    hooks:{
        /**
         * beforeCreate - se ejecuta antes de crear una subcategoria
         * verifica que la categoria padre este activa
         */
        beforeCreate: async(subcategoria)=>{
            const Categoria= require('./categoria');

            //Buscar categoria padre 
            const categoria = await Categoria.finbyPk(subcategoria, categoriaId);

            if (!categoria){
                throw new Error('La categoria seleccionada no existe');
            }

            if (!categoria.activo){
                throw new Error('No se puede crear una subcategoria en una categoria inactiva');
            }
        },

        /**
         * afterUpdate: se ejecutra despues de actualizar uba subcategoria
         * si se desactiva una subcategoria se desactivan todos los productos
         */
        afterUpdate: async(subcategoriacategoria, options)=>{
            //Verificar si el campo activo cambio
            if(subcategoria.changed('activo')&&
            !subcategoria.activo){
                console.log(`Desactivando subcategoria: ${subcategoria.nombre}`);

                //Importar modelos (aqui para evitar dependencias circulares)
                const Producto = require('./Producto');

                try{
                    //paso 1 desactivar las subcategorias de esta categoria
                    const productos = await Producto.finAll({
                        where: {subcategoriaId: subcategoria.id}
                    });

                    for (const producto of productos){
                        await producto.update({
                            activo: false},
                            {transaction: options.transaction});
                        console.log(`Producto desactivado: ${producto.nombre}`);
                    }
                    console.log ('Subcategoria y productos relacionados desactivados correctamente')
                } catch (error){
                    console.error('Error al desactivar productos relacionados', error.message);
                    throw error;
                }
            //Si se activa una categoria no se activan automaticamente las subcategorias y productos
        }
    }
});

//METODOS DE INSTANCIA
/**
 * Metodo para contar productos de esta subcategoria
 * 
 * @returns {Promise<number>} -numero de productos
 */
Subcategoria.prototype.contarProductoss = async function () {
    const Producto = require ('./Producto');
    return await Producto.count({ where: {subcategoriaId: this.id}});
};

/**
 * metodo para obtener la categoria padre 
 * 
 * @returns {Promise<Categoria>} - categoria padre
 */
Subcategoria.prototype.obtenerCategoria = async function () {
    const Categoria = require('./categoria');
    return await Categoria.finByPk(this.categoriaId)
}

//Exportar modelo de categoria
module.exports = Categoria