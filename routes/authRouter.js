const express = require('express');
const router = express.Router();
const {checkToken}= require('../middlewares/auth')

const usersRouter = require('./auth/users');
const forgotPasswordRouter = require('./auth/forgotPassword');
router.use('/users', usersRouter);
router.use('/forgotPassword', forgotPasswordRouter);
router.get('/', checkToken)


module.exports = router;