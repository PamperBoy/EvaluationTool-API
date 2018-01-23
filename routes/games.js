// routes/games.js
const router = require('express').Router()
const passport = require('../config/auth')
const { Game } = require('../models')
const utils = require('../lib/utils')

const authenticate = passport.authorize('jwt', { session: false })

module.exports = io => {
  router
    .get('/games', (req, res, next) => {
      Game.find()
        // Newest games first
        .sort({ createdAt: -1 })
        // Send the data in JSON format
        .then((games) => res.json(games))
        // Throw a 500 error if something goes wrong
        .catch((error) => next(error))
    })
    .get('/games/:id', (req, res, next) => {
      const id = req.params.id

      Game.findById(id)
        .then((game) => {
          if (!game) { return next() }
          res.json(game)
        })
        .catch((error) => next(error))
    })
    .post('/games', authenticate, (req, res, next) => {
      const newGame = {
        userId: req.account._id,
        playerOneId: req.account._id,
        board: [
          null, null, null,
          null, null, null,
          null, null, null
        ]
      }

      Game.create(newGame)
        .then((game) => {
          io.emit('action', {
            type: 'GAME_CREATED',
            payload: game
          })
          res.json(game)
        })
        .catch((error) => next(error))
    })
    .put('/games/:id', authenticate, (req, res, next) => {
      const id = req.params.id
      const updatedGame = req.body

      Game.findByIdAndUpdate(id, { $set: updatedGame }, { new: true })
        .then((game) => {
          io.emit('action', {
            type: 'GAME_UPDATED',
            payload: game
          })
          res.json(game)
        })
        .catch((error) => next(error))
    })
    .patch('/games/:id', authenticate, (req, res, next) => {
      const id = req.params.id
      const userId = req.account._id.toString()
      const usersIntent = req.body // e.g. { claim: squareIndex }

      Game.findById(id)
        .then((game) => {
          if (!game) { return next() }

          if (usersIntent.claim || usersIntent.claim === 0) {
            const playerOneId = game.playerOneId.toString()
            const playerTwoId = game.playerTwoId.toString()

            // your turn?
            const turn = game.board.filter((s) => !!s).length % 2
            const hasTurn = (turn === 0 && playerOneId === userId) ||
              (turn === 1 && playerTwoId === userId)
            if (!hasTurn) {
              const err = new Error('It is not your turn... :/')
              err.status = 422
              return next(err)
            }

            // square available?
            const squareAvailable = usersIntent.claim >= 0 &&
              usersIntent.claim < 9 &&
              !game.board[usersIntent.claim]
            if (!squareAvailable) {
              const err = new Error('That square is already taken lol')
              err.status = 422
              return next(err)
            }

            // are you a winner after this?
            const playerSymbol = turn === 0 ? 'o' : 'x'
            game.board[usersIntent.claim] = playerSymbol

            // is it a draw after this?
            //etc.
          }

          Game.findByIdAndUpdate(id, { $set: game }, { new: true })
            .then((game) => {
              io.emit('action', {
                type: 'GAME_UPDATED',
                payload: game
              })
              res.json(game)
            })
            .catch((error) => next(error))
        })
        .catch((error) => next(error))
    })
    .delete('/games/:id', authenticate, (req, res, next) => {
      const id = req.params.id
      Game.findByIdAndRemove(id)
        .then(() => {
          io.emit('action', {
            type: 'GAME_REMOVED',
            payload: id
          })
          res.status = 200
          res.json({
            message: 'Removed',
            _id: id
          })
        })
        .catch((error) => next(error))
    })

  return router
}
