require('dotenv').config();
const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');

const transporter = nodemailer.createTransport({
  service: 'gmail', 
  auth: {
    user: process.env.Mail_address, 
    pass: 'votre-mot-de-passe'     // Votre mot de passe ou mot de passe d'application
  }
});

module.exports = router;