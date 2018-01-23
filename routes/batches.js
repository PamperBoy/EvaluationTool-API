// routes/games.js
const router = require('express').Router()
const passport = require('../config/auth')
const { Batch } = require('../models')
const utils = require('../lib/utils')

const authenticate = passport.authorize('jwt', { session: false })

module.exports = io => {
  router
    .get('/batches', (req, res, next) => {
      Batch.find()
        // Newest games first
        .sort({ createdAt: -1 })
        // Send the data in JSON format
        .then((games) => res.json(games))
        // Throw a 500 error if something goes wrong
        .catch((error) => next(error))
    })
    .get('/batches/:id', (req, res, next) => {
      const id = req.params.id

      Batch.findById(id)
        .then((batch) => {
          if (!batch) { return next() }
          res.json(batch)
        })
        .catch((error) => next(error))
    })
    .post('/batches', authenticate, (req, res, next) => {
      const newBatch = {
        batchNumber: req.body.batchNumber,
        startDate: req.body.startDate,
        endDate: req.body.endDate
      }

      Batch.create(newBatch)
        .then((batch) => {
          io.emit('action', {
            type: 'BATCH_CREATED',
            payload: batch
          })
          res.json(batch)
        })
        .catch((error) => next(error))
    })

  return router
}
