var express = require('express');
var router = express.Router();
const jwt = require('jsonwebtoken')
require('../../models/connection');
const User = require('../../models/users');
const bcrypt = require('bcrypt');
const createToken = require('../../createToken');
const pattern = /^(?=.*[A-Z])(?=.*\d)(?=.*[&*$#@+_]).{8,}$/;



// sign Up
router.post('/register', async (req, res) => {
  console.log(req.body)
  console.log(Object.keys(User.schema.paths).slice(0,3))
  if (Object.keys(User.schema.paths).slice(0,4).some(el=>!req.body[el]||!req.body[el].length)) {
    return res.status(400).json({ result: false, error: 'Missing or empty fields' });
  }

  if(!(pattern.test(req.body.password)))
    return res.status(400).json({ result: false, error: 'Invalid password' })

  // Check if the user has not already been registered
  const data = await User.findOne({ email: req.body.email })
  if (data === null) {
    try{
      const hash = bcrypt.hashSync(req.body.password, 10);

      const newUser = new User({
        username: req.body.username,
        firstname: req.body.firstname,
        email: req.body.email,
        password: hash,
      });

      const saved = await newUser.save()
        console.log('User saved: '+saved);
        // Create a token
        const {email} = req.body;
        const token = createToken({saved, email});
        saved.token = token;

      res.status(201).json({ result: true, data: saved });
      } catch (error){
        console.log('An error appears: '+error)
        res.status(500).json({result: false, error});
        }
      }else {
      // User already exists in database
      res.status(400).json({ result: false, error: 'User already exists' });
    }
  });

// sign In
router.post('/login', async (req, res) => {

  //check fields
  const {password, email}=req.body;

  if (!password||!email) {
    res.json({ result: false, error: 'Missing or empty fields' });
    return;
  }

  try{

  // Check if the user exists in database
  const data = await User.findOne({ email: req.body.email });
    if (data && bcrypt.compareSync(req.body.password, data.password)){
      const token = await createToken(data._id, data.email);
      res.json({ result: true, data, token });
      return;
    }else{
      res.status(401).json({ result: false, error: 'User not found or wrong password' });
    }
    }catch(err){
      console.log('An error appears: '+err)
      res.status(500).json({result: false, error:'Server error'})
  };
});

// reset password
router.put('/:token', async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!token || !password) {
    return res.status(400).json({ result: false, error: 'Missing or empty fields' });
  }
  if(!(pattern.test(password)))
    return res.status(400).json({ result: false, error: 'Invalid password' })

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(404).json({ result: false, error: 'User not found' });
    }
    const hash = bcrypt.hashSync(password, 10);
    user.password = hash;
    await user.save();
    res.json({ result: true, message: 'Password updated successfully' });
  } catch (error) {
    if (error?.name === 'TokenExpiredError') {
      return res.status(401).json({ result: false, error: 'Token expired' });
    }
    res.status(500).json({ result: false, error: 'Server error' });
  };
});

module.exports = router;
