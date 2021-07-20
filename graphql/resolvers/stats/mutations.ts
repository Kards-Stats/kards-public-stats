import { getPlayerByName, newPlayer } from '../../../models/player'
import { getStatsById, putStats, RawStat } from '../../../models/stats'
import { Session } from '../../../includes/session'
import Q from 'q'
import { getCurrentLogger } from '../../../includes/logger'
import winston from 'winston'
import { authenticatedPost, authenticatedRequest } from '../../../includes/kards-request'
import { UpdateResult } from '../../../types/graphql'
import _ from 'underscore'

const logger: winston.Logger = getCurrentLogger('graphql-r-stats-m')

const waitTime = 10 * 60 * 1000

const session = new Session('*')

const hostname = `https://${process.env.kards_hostname ?? ''}`

async function internalUpdateStats (playerId: number): Promise<void> {
  logger.silly('internalUpdateStats')
  const deferred = Q.defer()
  authenticatedRequest('GET', `${hostname}/playerstats/${playerId}`, session).then((playerStats) => {
    logger.debug('got internal stats')
    // logger.silly(playerStats)
    if (_.isString(playerStats)) {
      logger.silly('istats is string')
      return deferred.reject(new Error('Invalid playerstats result'))
    }
    putStats(playerId, playerStats as RawStat[]).then(() => {
      logger.silly('istats put')
      return deferred.resolve()
    }).catch((e) => {
      logger.error(e)
      return deferred.reject(e)
    })
  }).catch((e) => {
    logger.error(e)
    return deferred.reject(e)
  })
  return deferred.promise as any as Promise<void>
}

export async function updateByPlayerId (_parent: any, { id }: { id: number }): Promise<UpdateResult> {
  logger.silly('updateByPlayerId')
  const deferred = Q.defer()
  getStatsById(id).then((stats) => {
    if (stats != null) {
      logger.silly(stats.updated)
      if ((new Date()).getTime() - stats.updated < waitTime) {
        return deferred.resolve({ code: 600, error: 'Wait 10 minnutes before updating' })
      } else {
        internalUpdateStats(id).then(() => {
          return deferred.resolve({ queued: true })
        }).catch((e) => {
          logger.error(e)
          return deferred.resolve({ code: 500, error: 'Unknown' })
        })
      }
    } else {
      internalUpdateStats(id).then(() => {
        return deferred.resolve({ queued: true })
      }).catch((e) => {
        logger.error(e)
        return deferred.resolve({ code: 500, error: 'Unknown' })
      })
    }
  }).catch((e) => {
    logger.error(e)
    return deferred.resolve({ code: 500, error: 'Unknown' })
  })
  return deferred.promise as any as Promise<UpdateResult>
}

export async function updateByPlayerName (_parent: any, { name, tag }: { name: string, tag: number }): Promise<UpdateResult> {
  logger.silly('updateByPlayerName')
  const deferred = Q.defer()
  getPlayerByName(name, tag).then((player) => {
    if (player == null) {
      session.getPlayerID().then((playerId) => {
        authenticatedPost(hostname + '/players/' + playerId + '/friends', JSON.stringify({
          friend_tag: tag,
          friend_name: name
        }), session).then((friendResult) => {
          if (_.isString(friendResult)) {
            return deferred.reject({ code: 500, error: 'Invalid playerstats result' })
          }
          newPlayer(name, tag, friendResult.friend_id).then(() => {
            updateByPlayerId(_parent, { id: friendResult.friend_id }).then((result) => {
              return deferred.resolve(result)
            }).catch((e) => {
              logger.error(e)
              return deferred.resolve({ code: 500, error: e.error })
            })
          }).catch((e) => {
            logger.error(e)
            return deferred.resolve({ code: 500, error: e.error })
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
      updateByPlayerId(_parent, { id: player.id }).then((result) => {
        return deferred.resolve(result)
      }).catch((e) => {
        logger.error(e)
        return deferred.resolve({ code: 500, error: e.error })
      })
    }
  }).catch((e) => {
    logger.error(e)
    deferred.resolve({ code: 500, error: 'Unknown' })
  })
  return deferred.promise as any as Promise<UpdateResult>
}
