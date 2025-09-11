const mongoose = require('mongoose');


const rubriqueSchema = mongoose.Schema({
  name: String,
  createdAt: {type: Date, default: Date.now },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
  liens: [{ type: mongoose.Schema.Types.ObjectId, ref: 'liens' }],
  position: Number
});

const Rubrique = mongoose.model('rubriques', rubriqueSchema);

module.exports = Rubrique;