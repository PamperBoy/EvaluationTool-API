const mongoose = require('../config/database')
const { Schema } = mongoose

const studentSchema = new Schema({
  batchId:            { type: Schema.Types.ObjectId, ref: 'batches' },
  name:               { type: String, required: true },
  profileImage:       { type: String, required: true },
  createdAt:          { type: Date, default: Date.now },
  updatedAt:          { type: Date, default: Date.now },
});

module.exports = mongoose.model('students', studentSchema)
