const mongoose = require('../config/database')
const { Schema } = mongoose

const batchSchema = new Schema({
  classNumber:        { type: Number },
  startDate:          { type: Date },
  endDate:            { type: Date },
  createdAt:          { type: Date, default: Date.now },
  updatedAt:          { type: Date, default: Date.now },
});

module.exports = mongoose.model('batches', batchSchema)
