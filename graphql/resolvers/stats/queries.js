const { PlayerFunctions } = require('../../../models/player')
const { StatsFunctions } = require('../../../models/stats')
const { Session } = require('../../../includes/session')
const Q = require('q')

const logger = require('../../../includes/logger').getCurrentLogger('graphql-r-stats-q')

const session = new Session('*')

const { authenticatedPost } = require('../../../includes/kards-request')

const hostname = 'https://' + process.env.kards_hostname

async function getByPlayerId (_, { id }) {
  logger.silly('getByPlayerId')
  const deferred = Q.defer()
  PlayerFunctions.getById(id).then((player) => {
    logger.silly('PF get done')
    logger.silly(player)
    if (!player) {
      StatsFunctions.getById(id).then((stats) => {
        logger.silly('SF get done')
        logger.silly(stats)
        var value = {
          player: {
            id: id,
            name: '',
            tag: -1
          },
          stats: []
        }
        if (stats) {
          value.stats = stats.stats
        }
        deferred.resolve(value)
      }).catch((e) => {
        logger.error(e)
        deferred.resolve({ code: 500, error: 'Unknown' })
      })
    } else {
      StatsFunctions.getById(player.id).then((stats) => {
        var value = {
          player: player,
          stats: []
        }
        if (stats) {
          value.stats = stats.stats
        }
        deferred.resolve(value)
      }).catch((e) => {
        logger.error(e)
        deferred.resolve({ code: 500, error: 'Unknown' })
      })
    }
  }).catch((e) => {
    logger.error(e)
    deferred.resolve({ code: 500, error: 'Unknown' })
  })
  return deferred.promise
}

async function getByPlayerName (_, { name, tag }) {
  logger.silly('getByPlayerName')
  const deferred = Q.defer()
  PlayerFunctions.getByName(name, tag).then((player) => {
    logger.silly('PF get done')
    logger.silly(player)
    if (!player) {
      session.getPlayerID().then((playerId) => {
        authenticatedPost(hostname + '/players/' + playerId + '/friends', JSON.stringify({
          friend_tag: tag,
          friend_name: name
        }), session).then((friendResult) => {
          logger.silly('FR get done')
          logger.silly(friendResult)
          PlayerFunctions.newPlayer(name, tag, friendResult.friend_id)
          logger.silly(friendResult)
          StatsFunctions.getById(friendResult.friend_id).then((stats) => {
            logger.silly('SF get done')
            logger.silly(stats)
            var value = {
              player: {
                id: friendResult.friend_id,
                name: name,
                tag: tag
              },
              stats: []
            }
            if (stats) {
              value.stats = stats.stats
            }
            logger.silly(value)
            return deferred.resolve(value)
          }).catch((e) => {
            logger.error(e)
            return deferred.resolve({ code: 500, error: 'Unknown' })
          })
        }).catch((e) => {
          logger.error(e)
          if (e.status_code === 404) {
            return deferred.resolve({ code: 404, error: 'Player not found' })
          } else if (e.status_code === 401) {
            return deferred.resolve({ code: 401, error: 'Backend temporarily unavailable' })
          }
          return deferred.resolve({ code: 500, error: 'Unknown' })
        })
      }).catch((e) => {
        logger.error(e)
        return deferred.resolve({ code: 500, error: e.error })
      })
    } else {
      StatsFunctions.getById(player.id).then((stats) => {
        logger.silly(stats)
        var value = {
          player: player,
          stats: []
        }
        if (stats) {
          value.stats = stats.stats
        }
        return deferred.resolve(value)
      }).catch((e) => {
        logger.error(e)
        return deferred.resolve({ code: 500, error: 'Unknown' })
      })
    }
  }).catch((e) => {
    logger.error(e)
    return deferred.resolve({ code: 500, error: 'Unknown' })
  })
  return deferred.promise
}

module.exports = {
  statsById: getByPlayerId,
  statsByName: getByPlayerName
}
