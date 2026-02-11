/**
 * Modelo de categoria para  la base de datos 
 * Define la tabla categporia en la base de datos
 * Almacena las categorias de los productos
 */

//Importar DataTypes de sequelize
const { DataTypes } = require('sequelize');

//Importar instancia de sequelize
const { sequelize }=require('../config/dataBase');

/**
 * Definir el modelo de categoria
 */
const Categoria = sequelize.define('Categoria',{
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
            msg:'Ya existe una categoria con ese nombre'
        },
        validate:{
            notEmpty:{
                msg:'El nombre de la categoría no puede estar vacío'
            },
            len:{
                args: [2,100],
                msg: 'El nombre debe tener entre 2 y 100 caracteres'
            }
        }
    },
    /**
     * Descrpción de la categoria
     */
    descripcion: {
        type: DataTypes.TEXT,
        allowNull: true,
    },

    /**
     * activo estado de la categoria
     * si es false la categoria y todas las sus subcategorias y productos se ocultan
     */
    activo: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    }
},
    //opciones del modelo

    tableName:'categorias',
    timestamps: true, //agrega campos de createdAt y updateAt

    /**
     * Hooks Acciones automaticas
     */

    hooks:{
        /**
         * afterUpdater: se ejecuta despues de actualizar una categoria
         * se desactiva una categoria y se desactivan todas sus subcategorias y productos
         */
        afterUpdate: async(categoria, options)=>{
            //Verificar si el campo activo cambio
            if(categoria.changed('activo')&&
            !categoria.activo){
                console.log(`Desactivando categoria: ${categoria.nombre}`);

                //Importar modelos (aqui para evitar dependencias circulares)
                const Subcategoria = require('./Subcategoria');
                const Producto = require('./Producto');

                try{
                    //paso 1 desactivar las subcategorias de esta categoria
                    const subcategorias = await Subcategoria.finAll({
                        where: {categoriaId: categoria.id}
                    });

                    for (const subcategoria of subcategorias){
                        await subcategoria.update({
                            activo: false},
                            {transaction: options.transaction});
                        console.log(`Subcategoria desactivada: ${subcategoria.nombre}`);
                    }

                    //paso 2 desactivar los productos de esta categoria

                    const productos = await Producto.finAll({
                        where: {categoriaId: categoria.id}
                    });

                    for (const producto of productos){
                        await producto.update({
                            activo: false},
                            {transaction: options.transaction});
                        console.log(`Producto desactivada: ${producto.nombre}`);
                    }
                    
                    console.log(`Categoria y elementos relacionados desactivados correctamente`);
            
                } catch (error){
                    console.error('Error al desactivar elementos relacionados', error.message);
                    throw error;
                }
            }
            //Si se activa una categoria no se activan automaticamente las subcategorias y productos
        }
    }
});

//METODOS DE INSTANCIA
/**
 * Metodo para contar subcategorias de esta categoria
 * 
 * @returns {Promise<number>} -numero de subcategorias
 */
Categoria.prototype.contarSubcategorias = async function () {
    const Subcategoria= require ('./Subcategoria');
    return await Subcategoria.count({ wehere: {categoriaId: this.id}});
};

/**
 * Metodo parta contar productos de esta categoria
 * 
 * @returns {Promise<number>} -numero de subcategorias
 */
Categoria.prototype.contarSubcategorias = async function () {
    const Producto= require ('./Producto');
    return await Producto.count({ wehere: {categoriaId: this.id}});
};

//Exportar modelo de categoria
module.exports = Categoria