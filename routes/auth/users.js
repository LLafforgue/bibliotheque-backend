var express = require('express');
var router = express.Router();
require('../../models/connection');
const {register, login, resetPassword} = require('../../controllers/usersControllers')




// sign Up
router.post('/register', register);

// sign In
router.post('/login', login);

// reset password
router.put('/:token', resetPassword);

module.exports = router;
