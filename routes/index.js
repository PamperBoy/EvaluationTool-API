const batches = require('./batches')
const students = require('./batches/students')
const evaluations = require('./batches/student/evaluations')
const users = require('./users')
const sessions = require('./sessions')

module.exports = {
  batches,
  users,
  sessions,
  students,
  evaluations
}
