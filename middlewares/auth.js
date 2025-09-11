const User = require('../models/users');

async function checkToken(req, res, next) {
  const auth = req.headers.authorization;
  const token = auth && auth.split(' ')[1];

  if (!token) {
    return res.status(400).json({ error: 'no token' });
  }

  try {
    const user = await User.findOne({ token });
    if (!user) {
      return res.status(401).json({ error: 'no consistant user' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(500).json({ error: 'Server error during token validation' });
  }
}



module.exports = { checkToken };
