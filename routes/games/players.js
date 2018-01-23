// routes/games.js
const router = require('express').Router()
const passport = require('../../config/auth')
const { Game, User } = require('../../models')

const authenticate = passport.authorize('jwt', { session: false })

const loadGame = (req, res, next) => {
  const id = req.params.id

  Game.findById(id)
    .then((game) => {
      req.game = game
      next()
    })
    .catch((error) => next(error))
}

const getPlayers = (req, res, next) => {
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
    .get('/games/:id/players', loadGame, getPlayers, (req, res, next) => {
      if (!req.game || !req.players) { return next() }
      res.json(req.players)
    })

    .post('/games/:id/players', authenticate, loadGame, (req, res, next) => {
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
