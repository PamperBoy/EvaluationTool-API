// routes/games.js
const router = require('express').Router()
const passport = require('../../../config/auth')
const { User, Student, Evaluation } = require('../../../models')

const authenticate = passport.authorize('jwt', { session: false })

const loadStudent = (req, res, next) => {
  const id = req.params.id

  Student.findById(id)
    .then((student) => {
      req.student = student
      next()
    })
    .catch((error) => next(error))
}

const getEvaluations = (req, res, next) => {
  const id = req.params.id

  Evaluation.find({"studentId": id})
    .sort({ evaluationDate: -1 })

    .then((evaluations) => {
      req.evaluations = evaluations
      next()
    })
    .catch((error) => next(error))
}

module.exports = io => {
  router
    .get('/batches/:id/students/:id/evaluations', loadStudent, getEvaluations, (req, res, next) => {
      if (!req.student || !req.evaluations) { return next() }
      res.json(req.evaluations)
    })

    .post('/batches/:id/students/:id/evaluations', authenticate, loadStudent, (req, res, next) => {
      const newEvaluation = {
        studentId: req.student._id,
        reporter: req.account._id,
        evaluationDate: req.body.evaluationDate,
        evaluationGrade: req.body.evaluationGrade,
        evaluationRemark: req.body.evaluationRemark,
      }

      Evaluation.create(newEvaluation)
        .then((evaluation) => {
          res.status = 201

          res.json(evaluation)
        })
        .catch((error) => next(error))
      })


      .put('/batches/:id/students/:id/evaluations/:id', authenticate, getEvaluations, (req, res, next) => {
        const id = req.params.id
        const evaluationPut = req.body

        Evaluation.findById(id)
          .then((evaluation) => {
          if (!evaluation || !evaluation.reporter === req.account._id) { return next() }

          Evaluation.findByIdAndUpdate(id, { $set: evaluationPut }, { new: true })
            .then((evaluation) => {
              io.emit('action', {
                type: 'EVALUATION_UPDATED',
                payload: evaluation
              })
              res.status = 200
              res.json(evaluation)
            })
            .catch((error) => next(error))
        })
      })

      .patch('/batches/:id/students/:id/evaluations/:id', authenticate, getEvaluations, (req, res, next) => {
        const id = req.params.id
        const evaluationPatch = req.body

        Evaluation.findById(id)
          .then((evaluation) => {
          if (!evaluation || !evaluation.reporter === req.account._id) { return next() }

          const updatedEvaluation = { ...evaluation, ...evaluationPatch }

          Evaluation.findByIdAndUpdate(id, { $set: updatedEvaluation }, { new: true })
            .then((evaluation) => {
              io.emit('action', {
                type: 'EVALUATION_UPDATED',
                payload: evaluation
              })
              res.status = 200
              res.json(evaluation)
            })
            .catch((error) => next(error))
        })
      })

      .delete('/batches/:id/students/:id/evaluations/:evaluationId', authenticate, (req, res, next) => {
        const id = req.params.evaluationId

        Evaluation.findByIdAndRemove(id)
          .then((evaluation) => {
            if (!evaluation || !evaluation.reporter === req.account._id) { return next() }
            io.emit('action', {
              type: 'EVALUATION_REMOVED',
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
