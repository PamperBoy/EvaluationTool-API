// routes/games.js
const router = require('express').Router()
const passport = require('../../config/auth')
const { Batch, User, Student, Evaluation} = require('../../models')

const authenticate = passport.authorize('jwt', { session: false })

const loadBatch = (req, res, next) => {
  const id = req.params.id

  Batch.findById(id)
    .then((batch) => {
      req.batch = batch
      next()
    })
    .catch((error) => next(error))
}

const getStudents = (req, res, next) => {
    const id = req.params.id

    Student.find({"batchId": id})
      .sort({ name: 1 })
      .then((students) => {

        let evaluationPromises = []

        students.map(student => {
          evaluationPromises.push(Evaluation.find({"studentId": student._id})
          .sort({ evaluationDate: -1 }))
        })

        return Promise.all(evaluationPromises)
          .then(arrayOfEvaluations => {

            let sortedByStudentId = {}

            arrayOfEvaluations.forEach(evaluations => {

              evaluations.forEach(evaluation => {
                if(!sortedByStudentId[evaluation.studentId]) {
                  sortedByStudentId[evaluation.studentId] = []
                }
                sortedByStudentId[evaluation.studentId].push(evaluation)
              })
            })

            let newStudents = []

            students.map(student => {
              let newStudent = {
                batchId: student.batchId,
                name: student.name,
                profileImage: student.profileImage,
                _id: student._id,
                createdAt: student.createdAt,
                updatedAt: student.updatedAt,
                evaluations: []
              }

              if(sortedByStudentId[student._id]) {
                newStudent.evaluations = sortedByStudentId[student.id]
              }
              newStudents.push(newStudent)
            })
            return newStudents
          })
        })

        .then(students => {
          req.students = students
          next()
        })
        .catch((error) => next(error))
}

module.exports = io => {
  router
    .get('/batches/:id/students', loadBatch, getStudents, (req, res, next) => {
      if (!req.batch || !req.students) { return next() }
      res.json(req.students)
    })

    .get('/batches/:id/students/:id', loadBatch, getStudents, (req, res, next) => {
      const id = req.params.id

      Student.findById(id)
        .then((student) => {
          if (!student) { return next() }
          res.json(student)
        })
        .catch((error) => next(error))
    })

    .post('/batches/:id/students', authenticate, loadBatch, (req, res, next) => {
      const newStudent = {
        batchId: req.batch._id,
        name: req.body.name,
        profileImage: req.body.profileImage
      }

      Student.create(newStudent)
        .then((student) => {
          io.emit('action', {
            type: 'STUDENT_CREATED',
            payload: student
          })
          res.status = 201

          res.json(student)
        })
        .catch((error) => next(error))
      })

      .put('/batches/:id/students/:id', authenticate, getStudents, (req, res, next) => {
        const id = req.params.id
        const studentPut = req.body

        Student.findById(id)
          .then((student) => {
          if (!student) { return next() }

          Student.findByIdAndUpdate(id, { $set: studentPut }, { new: true })
            .then((student) => {
              io.emit('action', {
                type: 'STUDENT_UPDATED',
                payload: student
              })
              res.status = 200
              res.json(student)
            })
            .catch((error) => next(error))
        })
      })

      .patch('/batches/:id/students/:id', authenticate, getStudents, (req, res, next) => {
        const id = req.params.id
        const studentPatch = req.body

        Student.findById(id)
          .then((student) => {
          if (!student) { return next() }

          const updatedStudent = { ...student, ...studentPatch }

          Student.findByIdAndUpdate(id, { $set: updatedStudent }, { new: true })
            .then((student) => {
              io.emit('action', {
                type: 'STUDENT_UPDATED',
                payload: student
              })
              res.status = 200
              res.json(student)
            })
            .catch((error) => next(error))
        })
      })

      .delete('/batches/:id/students/:id', authenticate, (req, res, next) => {
        const id = req.params.id

        Student.findByIdAndRemove(id)
          .then((student) => {
            if (!student) { return next() }
            io.emit('action', {
              type: 'STUDENT_REMOVED',
              payload: id
            })
            res.status = 200
            res.json({
              message: 'Deleted',
              _id: id
            })
          })
          .catch((error) => next(error))
      })

  return router
}
