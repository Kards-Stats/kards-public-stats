import { getPlayerById, getPlayerByName, newPlayer } from '../../../models/player'
import { getStatsById } from '../../../models/stats'
import Q from 'q'
import tools from '@kards-stats/kards-tools'
import winston from 'winston'
import { StatsResult } from '../../../types/graphql'
import SteamUserConnector from '../../../models/steam-user'
import _ from 'underscore'

const logger: winston.Logger = tools.includes.getCurrentLogger('graphql-r-stats-q')

const Session = tools.kards.KardsSession
const session = new Session('*', SteamUserConnector)

const hostname = `https://${process.env.kards_hostname ?? ''}`

export async function getByPlayerId (_parent: any, { id }: { id: number }): Promise<StatsResult> {
  logger.silly('getByPlayerId')
  const deferred = Q.defer()
  getPlayerById(id).then((player) => {
    logger.silly('PF get done')
    logger.silly(player)
    if (player == null) {
      getStatsById(id).then((stats) => {
        logger.silly('SF get done')
        logger.silly(stats)
        var value: StatsResult = {
          player: {
            id: id,
            name: '',
            tag: -1
          },
          stats: []
        }
        if (stats != null) {
          value.stats = stats.stats
        }
        deferred.resolve(value)
      }).catch((e) => {
        logger.error(e)
        deferred.resolve({ code: 500, error: 'Unknown' })
      })
    } else {
      getStatsById(player.id).then((stats) => {
        var value: StatsResult = {
          player: player,
          stats: []
        }
        if (stats != null) {
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
  return deferred.promise as any as Promise<StatsResult>
}

export async function getByPlayerName (_parent: any, { name, tag }: { name: string, tag: number }): Promise<StatsResult> {
  logger.silly('getByPlayerName')
  const deferred = Q.defer()
  getPlayerByName(name, tag).then((player) => {
    logger.silly('PF get done')
    logger.silly(player)
    if (player == null) {
      session.getPlayerID().then((playerId) => {
        tools.kards.request.authenticatedPost(hostname + '/players/' + playerId + '/friends', JSON.stringify({
          friend_tag: tag,
          friend_name: name
        }), session).then((friendResult) => {
          if (_.isString(friendResult)) {
            return deferred.resolve({ code: 500, error: 'Unknown friend result return' })
          }
          logger.silly('FR get done')
          logger.silly(friendResult)
          newPlayer(name, tag, friendResult.friend_id).then(() => {
            logger.silly(friendResult)
            getStatsById(friendResult.friend_id).then((stats) => {
              logger.silly('SF get done')
              logger.silly(stats)
              var value: StatsResult = {
                player: {
                  id: friendResult.friend_id,
                  name: name,
                  tag: tag
                },
                stats: []
              }
              if (stats != null) {
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
      getStatsById(player.id).then((stats) => {
        logger.silly(stats)
        var value: StatsResult = {
          player: player,
          stats: []
        }
        if (stats != null) {
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
  return deferred.promise as any as Promise<StatsResult>
}
