// routes/games.js
const router = require('express').Router()
const passport = require('../../config/auth')
const { Batch, User, Student } = require('../../models')

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
  Promise.all([req.game.playerOneId, req.game.playerTwoId].map(playerId => User.findById(playerId)))
    .then((users) => {
      // Combine player data and user's name
      req.players = users
        .filter(u => !!u)
        .map(u => ({
          userId: u._id,
          name: u.name
        }))
      next()
    })
    .catch((error) => next(error))
}

module.exports = io => {
  router
    .get('/games/:id/students', loadBatch, getStudents, (req, res, next) => {
      if (!req.batch || !req.students) { return next() }
      // res.json(req.players)
      console.log(req)
    })

    .post('/games/:id/students', authenticate, loadBatch, (req, res, next) => {
      if (!req.game) { return next() }

      const userId = req.account._id
      const { playerOneId, playerTwoId } = req.game

      const isPlayerOne = playerOneId && playerOneId.toString() === userId.toString()
      const isPlayerTwo = playerTwoId && playerTwoId.toString() === userId.toString()

      if (isPlayerOne || isPlayerTwo) {
        const error = Error.new('You already joined this game!')
        error.status = 401
        return next(error)
      }

      if (!!playerOneId && !!playerTwoId) {
        const error = Error.new('Sorry game is full!')
        error.status = 401
        return next(error)
      }

      // Add the user to the players
      if (!playerOneId) req.game.playerOneId = userId
      if (!playerTwoId) req.game.playerTwoId = userId

      req.game.save()
        .then((game) => {
          req.game = game
          next()
        })
        .catch((error) => next(error))
    },
    // Fetch new player data
    getPlayers,
    // Respond with new player data in JSON and over socket
    (req, res, next) => {
      io.emit('action', {
        type: 'GAME_PLAYERS_UPDATED',
        payload: {
          game: req.game,
          players: req.players
        }
      })
      res.json(req.players)
    })

    .delete('/games/:id/players', authenticate, (req, res, next) => {
      if (!req.game) { return next() }

      const userId = req.account._id
      const { playerOneId, playerTwoId } = req.game

      const isPlayerOne = playerOneId.toString() === userId.toString()
      const isPlayerTwo = playerTwoId.toString() === userId.toString()

      if (!isPlayerOne || !isPlayerTwo) {
        const error = Error.new('You are not a player in this game!')
        error.status = 401
        return next(error)
      }

      // Add the user to the players
      if (isPlayerOne) req.game.playerOneId = null
      if (isPlayerTwo) req.game.playerTwoId = null

      req.game.save()
        .then((game) => {
          req.game = game
          next()
        })
        .catch((error) => next(error))

    },
    // Fetch new player data
    getPlayers,
    // Respond with new player data in JSON and over socket
    (req, res, next) => {
      io.emit('action', {
        type: 'GAME_PLAYERS_UPDATED',
        payload: {
          game: req.game,
          players: req.players
        }
      })
      res.json(req.players)
    })

  return router
}
