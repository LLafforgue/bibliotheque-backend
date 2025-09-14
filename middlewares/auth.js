require('dotenv').config();
const User = require('../models/users');
const jwt = require('jsonwebtoken');

async function checkToken(req, res, next) {
  
  const auth = req.headers.authorization;
  const token = auth && auth.split(' ')[1];

  if (!token) {
    return res.status(400).json({ result:false, error: 'no token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ result:false, error: 'no consistant user' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(500).json({ result:false, error: 'Server error during token validation' });
  }
}



module.exports = { checkToken };
