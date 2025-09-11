const mongoose = require('mongoose');
const { token } = require('morgan');

const userSchema = mongoose.Schema({
  username: String,
  firstname: String,
  email: { type: String, validate: {
   validator: function(value) {
     return /\S+@\S+\.\S+/.test(value);
   },
   message: 'Email invalide.'}},
  password: String,
});

const User = mongoose.model('users', userSchema);

module.exports = User;