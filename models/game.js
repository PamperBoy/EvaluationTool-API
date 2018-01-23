// models/game.js
const mongoose = require('../config/database')
const { Schema } = mongoose

const gameSchema = new Schema({
  board: [String],
  playerOneId: { type: Schema.Types.ObjectId, ref: 'users' },
  playerTwoId: { type: Schema.Types.ObjectId, ref: 'users' },
  draw: { type: Boolean, default: false },
  winnerId: { type: Schema.Types.ObjectId, ref: 'users' },
  userId: { type: Schema.Types.ObjectId, ref: 'users' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('games', gameSchema)
