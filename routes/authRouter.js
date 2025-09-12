const express = require('express');
const router = express.Router();

const usersRouter = require('./auth/users');
const forgotPasswordRouter = require('./auth/forgotPassword');
router.use('/users', usersRouter);
router.use('/forgotPassword', forgotPasswordRouter);


module.exports = router;