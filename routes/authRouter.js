const express = require('express');
const router = express.Router();
const {checkToken}= require('../middlewares/auth')

const usersRouter = require('./auth/users');
const forgotPasswordRouter = require('./auth/forgotPassword');
router.use('/users', usersRouter);
router.use('/forgotPassword', forgotPasswordRouter);
router.get('/', checkToken,(req,res)=>{
    res.json({result:true, ...req.user})
})


module.exports = router;