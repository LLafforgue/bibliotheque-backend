require('dotenv').config()
const jwt = require('jsonwebtoken');
const User = require('./models/users');

async function createToken(user,type='access') {
  console.log(user);
  const payload = { id: user._id, email: user.email };
  if(type='access'){
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
    return token;
  }
  if(type='password'){
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '15m' });
    return token;
  }
}

module.exports = createToken;