import { getPlayerById, getPlayerByName, newPlayer } from '../../../models/player'
import { getStatsById } from '../../../models/stats'
import { includes } from '@kards-stats/kards-tools'
import { StatsResult } from '../../../types/graphql'
import getKardsApi from './session'

const logger = includes.logger.getCurrentLogger('graphql-r-stats-q')

export async function getByPlayerId (_parent: any, { id }: { id: number }): Promise<StatsResult> {
  logger.silly('getByPlayerId')
  try {
    var player = await getPlayerById(id)
    logger.silly('PF get done')
    logger.silly(player)
    var name = ''
    var tag = -1
    if (player !== null) {
      id = player.id
      name = player.name
      tag = player.tag
    }
    var stats = await getStatsById(id)
    logger.silly('SF get done')
    logger.silly(stats)
    var value: StatsResult = {
      player: {
        id: id,
        name: name,
        tag: tag
      },
      stats: []
    }
    if (stats !== null) {
      value.stats = stats.stats
    }
    return value
  } catch (e) {
    logger.error(e)
    return { code: 500, error: 'Unknown' }
  }
}

export async function getByPlayerName (_parent: any, { name, tag }: { name: string, tag: number }): Promise<StatsResult> {
  logger.silly('getByPlayerName')
  try {
    var player = await getPlayerByName(name, tag)
    var id: number | undefined
    if (player === null) {
      id = await (await getKardsApi()).player.getPlayerId(name, tag)
      logger.silly('FR get done')
      if (id === undefined) {
        return { code: 404, error: 'Player not found' }
      }
      await newPlayer(name, tag, id)
      logger.silly('NP get done')
    } else {
      id = player.id
    }
    var stats = await getStatsById(id)
    logger.silly('SF get done')
    logger.silly(stats)
    var value: StatsResult = {
      player: {
        id: id,
        name: name,
        tag: tag
      },
      stats: []
    }
    if (stats != null) {
      value.stats = stats.stats
    }
    return value
  } catch (e) {
    logger.error(e)
    return { code: 500, error: 'Unknown' }
  }
}
