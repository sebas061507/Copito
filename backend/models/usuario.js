/**
 * MODELO usuario
 * define la tabla usuario en la base de daos
 * Almacena los usuarios
 */

//Importar DataType de sequelize 
const { DataTypes } = require('sequelize');

//Importar bcrypt para encriptar conraseñas
const bcrypt = require('bcrypt');

//importar instancia de sequelize
const { sequelize } = require('../config/database');
const { dir } = require('console');

/**
 * Definir el modelo de usuario
 */
const Usuario = sequelize.define('Usuario', {
    //Campos de la tabla
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
        validate: {
            notEmpy: {
                msg: 'El nombre no puede estar vacio'
            },
            len: {
                args: [2, 100],
                msg: 'El nombre debe tener entre 2 y 100 caracteres'
            }
        }
    },

    email: {
        type: DataTypes.STRING(100), 
        allowNull: false,
        unique: {
            msg: 'Este email ya esta registrado'
        },
        validate: {
            isEmail: {
                msg: 'Debe ingresar un email valido'
            },
            notEmpty: {
                msg: 'El email no puede estar vacio'
            }
        }
    },

    password: {
        type: DataTypes.STRING(255), //cadena larga para el hash
        allowNull: false,
        validate: {
            notEmpy: {
                msg: 'La contraseña no puede estar vacia'
            },
            len: {
                args: [6, 255],
                msg: 'La contraseña debe tener al menos 6 caracteres'
            }
        }
    },

//rol del usuario (cliente, auxiliar o admin)
    rol: {
        type: DataTypes.ENUM('cliente', 'auxiliar', 'administrador'), //tres roles posibles
        allowNull: false,
        defaultValue: 'cliente', //por defecto es cliente
        validate: {
            isIn: {
                args: [['cliente', 'auxiliar', 'administrador']],
                msg: 'El rol debe ser cliente, auxiliar o administrador'
            }
        }
    },
//telefono del usuario (opcional)
    telefono: {
        type: DataTypes.STRING(20), 
        allowNull: true, //opcional
        validate: {
            is: {
                args: /^[0-9+\-\s()]*$/, //solo numeros, espacios, guiones o parentesis
                msg: 'El telefono solo puede contener numeros y caracteres validos'
            
            
            },
        }
    },


    /**
     * Direccion del usuario es opcional
     */
    direccion: {
        type: DataTypes.TEXT,
        allowNull: true,
    },

    /**
     * activo estado del usuario
     */
    activo: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true //por defecto esta activo
    }
}, {
    // Opciones del modelo

    tableName: 'usuarios',
    timestamps: true, //Agrega campos de createdAT y updateAT

    /**
     * Scopes consultas predefinidas
     */

    defaultScope: {
        /**
         * por defecto excluir el password en todas las consultas
         */
        attributes : {exclude: ['password']}
    },
    scopes : {
        //scope para incluir el password cuando sea necesario (ejemplo en login)
        withPassword: {
            attributes: {}//incluir todos los atributos
        }

    },
    /**
     * Hooks funciones que se ejecutan en momentos especificos
     */

    hooks: {
        /**
         * beforeCreate se ejecuta antes de crear un usuario
         * encripta la contraseña antes de guardarla en la base de datos
         */
        beforeCreate: async (usuario) => {
            if(usuario.password){
                //generar un salt (semilla aleatoria) con factor de costo de 10
                const salt = await bcrypt.genSalt(10); //encriptar la contraseña con salt
                usuario.password = await bcrypt.hash(usuario.password, salt); //encriptar la contraseña
            }
        },
    /**
     * beforeUpdate se ejecuta antes de actualizar un usuario 
     * encripta la contraseña si fue modificada
     */

        beforeUpdate: async (usuario) => {
            //Verificar si la contraseña fue modificada
            if (usuario.changed('password')) {
                const salt = await bcrypt.genSalt(10); 
                usuario.password = await bcrypt.hash(usuario.password, salt); 
            }
        }
    }
});

// METODOS DE INSTACIA 
/**
 * Metodo para comparar contraseñas
 * compara una contraseña en texto plano con el hash guardado 
 * @param {string} passwordIngresado - contraseña en texto plano
 * @returns {Promise<boolean>} - true si coinciden, false si no
 */
Usuario.prototype.compararPassword = async function(passwordIngresado){
    return await bcrypt.compare(passwordIngresado, this.password);
};

/**
 * Metodo para obtener datos publicos del usuario (sin password)
 * 
 * @returns {Object} - objeto con datos publicos del usuario
 */
Usuario.prototype.toJSON = function() {
    const valores= Object.assign({}, this.get());

    //eliminar la contraseña del objeto 
    delete valores.password;
    return valores;
};

//Exportar modelo usuario
module.exports = Usuario;