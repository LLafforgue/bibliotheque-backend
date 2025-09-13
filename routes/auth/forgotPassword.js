require('dotenv').config();
const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const User = require('../../models/users');
const createToken = require('../../createToken');

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,  
  auth: {
    user: process.env.Mail_address, 
    pass: process.env.Mail_Password     // Votre mot de passe ou mot de passe d'application
  }
});

const mailOptions = (email, link) => {
return {
  from: process.env.Mail_address,
  to: `${email}`,
  subject: 'Test Email',
  text: 'Ceci est un email de test envoyé depuis Node.js avec Nodemailer! Voici le lien pour réinitialiser votre mot de passe: ' + link
}};



router.post('/', async (req, res) => {
  const { email } = req.body;
    if (!email) {
        return res.status(400).json({ result: false, error: 'Email is required' });
    }
    //Check existing mail
    try{
    const user = await User.findOne({ email });
    if (!user) {
        return res.status(404).json({ result: false, error: 'User not found' });
    }
    // Create a password reset token
    const token = await createToken(user, 'password');
    const resetLink = `http://localhost:3000/nvpassword/${token}`;
    // Send email with the reset link
    
        transporter.sendMail(mailOptions(email, resetLink), (error, info) => {
        if (error) {
            console.log('Erreur:', error);
            return res.status(500).json({result:false, error:'email not send'})
        } else {
            console.log('Email envoyé:', info.response);
            res.json({ result: true, message: 'Password reset link sent to email' });
        }
        });
    } catch (error) {
        res.status(500).json({ result: false, error: 'Server error' });
    }
});



module.exports = router;