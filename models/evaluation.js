const mongoose = require('../config/database')
const { Schema } = mongoose

const evaluationSchema = new Schema({
  studentId:          { type: Schema.Types.ObjectId, ref: 'students' },
  reporter:           { type: Schema.Types.ObjectId, ref: 'users' },
  evaluationDate:     { type: Date, required: true },
  evaluationGrade:    { type: String, required: true },
  evaluationRemark:   { type: String, required: true },
  createdAt:          { type: Date, default: Date.now },
  updatedAt:          { type: Date, default: Date.now },
})

module.exports = mongoose.model('evaluations', evaluationSchema)
