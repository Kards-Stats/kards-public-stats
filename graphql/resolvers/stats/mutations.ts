import { getPlayerByName, newPlayer } from '../../../models/player'
import { getStatsById, putStats, RawStat } from '../../../models/stats'
import { includes } from '@kards-stats/kards-tools'
import { UpdateResult } from '../../../types/graphql'
import getKardsApi from './session'

const logger = includes.logger.getCurrentLogger('graphql-r-stats-m')

const waitTime = 10 * 60 * 1000

async function internalUpdateStats (playerId: number): Promise<void> {
  logger.silly('internalUpdateStats')
  try {
    var playerStats = await (await getKardsApi()).request.authenticatedGet(`/playerstats/${playerId}`)
    if (typeof playerStats === 'string') {
      throw new Error('Invalid playerstats result')
    }
    await putStats(playerId, playerStats as RawStat[])
    return
  } catch (e) {
    logger.error(e)
    throw e
  }
}

export async function updateByPlayerId (_parent: any, { id }: { id: number }): Promise<UpdateResult> {
  logger.silly('updateByPlayerId')
  try {
    var stats = await getStatsById(id)
    if (stats !== null && (new Date()).getTime() - stats.updated < waitTime) {
      return { code: 600, error: 'Wait 10 minnutes before updating' }
    }
    await internalUpdateStats(id)
    return { queued: true }
  } catch (e) {
    logger.error(e)
    return { code: 500, error: 'Unknown' }
  }
}

export async function updateByPlayerName (_parent: any, { name, tag }: { name: string, tag: number }): Promise<UpdateResult> {
  logger.silly('updateByPlayerName')
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
    return await updateByPlayerId(_parent, { id: id })
  } catch (e) {
    logger.error(e)
    return { code: 500, error: 'Unknown' }
  }
}
