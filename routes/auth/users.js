var express = require('express');
var router = express.Router();

require('../../models/connection');
const User = require('../../models/users');
const bcrypt = require('bcrypt');
const createToken = require('../../createToken');



// sign Up
router.post('/register', async (req, res) => {
  if (Object.keys(User.schema.paths).some(el=>!req.body[el]||!req.body[el].length)) {
    return res.status(400).json({ result: false, error: 'Missing or empty fields' });
  }

  if(!(req.body.password.length>=8&&/[A-Z0-9](\*|$|#|@|\+|_)/.test(req.body.password)))
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

        const token = createToken(saved.email, saved._id);
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


module.exports = router;
