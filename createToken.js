require('dotenv').config()
const jwt = require('jsonwebtoken');
const User = require('./models/users');

async function createToken(user) {
  const payload = { id: user._id, email: user.email };
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '12h' });
  return token;
}

module.exports = createToken;