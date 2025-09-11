var express = require('express');
var router = express.Router();
const uid2 = require('uid2');

require('../models/connection');
const User = require('../models/users');
const bcrypt = require('bcrypt');

// sign Up
router.post('/register', async (req, res) => {
  if (Object.keys(User.schema.paths).slice(0,3).some(el=>!req.body[el]||!req.body[el].length)) {
    return res.status(400).json({ result: false, error: 'Missing or empty fields' });
  }

  if(!(req.body.password.length>=8&&/[A-Z0-9](\*|$|#|@|\+|_)/.test(req.body.password)))
    return res.status(400).json({ result: false, error: 'Invalid password' })

  // Check if the user has not already been registered
  const data = await User.findOne({ username: req.body.username })
  if (data === null) {
    try{
      const hash = bcrypt.hashSync(req.body.password, 10);

      const newUser = new User({
        username: req.body.username,
        firstname: req.body.firstname,
        email: req.body.email,
        password: hash,
        token: uid2(32),
      });

      const saved = await newUser.save()
      res.status(201).json({ result: saved });
      } catch (err){
        console.log('An error appears: '+err)
        res.status(500).json({result: err});
        }
      }else {
      // User already exists in database
      res.status(400).json({ error: 'User already exists' });
    }
  });

// sign In
router.post('/login', (req, res) => {
  const {password, username}=req.body;
  if (!password||!username) {
    res.json({ result: false, error: 'Missing or empty fields' });
    return;
  }
  User.findOne({ username: req.body.username }).then(data => {
    if (data && bcrypt.compareSync(req.body.password, data.password)) {
      res.json({ result: true, user: data });
    } else {
      res.json({ result: false, error: 'User not found or wrong password' });
    };
  });
});


module.exports = router;
