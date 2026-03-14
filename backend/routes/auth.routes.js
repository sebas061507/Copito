/**
 * rutas de autenticacion
 * define los endpoints para registro, login, y gestion de perfil de usuario
 */

//importar routes de expr3ss
const express = require('express');
const router = express.Router();

//importar controladores de autenticacion
const{
    registrar,
    iniciarSesion,
    getMe,
    updateMe,
    changePassword
} = require('../controllers/auth.controller');

//importar middleware 
const {verificarAuth} = require('../middleware/auth');

//rutas publicas

// se expone el endpoint en español y en inglés para compatibilidad
router.post('/registro', registrar);
router.post('/register', registrar);

router.post('/login', iniciarSesion);

//rutas protegidas

router.get('/me', verificarAuth, getMe);

router.put('/me', verificarAuth, updateMe);

router.patch('/change-password', verificarAuth, changePassword);

//exportar router
module.exports = router;