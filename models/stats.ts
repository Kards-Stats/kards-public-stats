import tools from '@kards-stats/kards-tools'
import Q from 'q'
import mongoose from 'mongoose'
import winston from 'winston'

const logger: winston.Logger = tools.includes.getCurrentLogger('models-steam-user')

const Schema = mongoose.Schema

const StatsSchema = new Schema({
  player_id: Number,
  updated: Date,
  stats: [{
    stat_name: String,
    modified: Date,
    stat_int: Number,
    stat_string: String
  }]
})

interface Stat {
  stat_name: string
  modified: Date
  stat_int: number
  stat_string: string
}

export interface RawStat {
  stat_name: string
  modify_date: Date
  stat_int: number
  stat_str: string
}

export interface StatsDocument extends mongoose.Document {
  player_id: number
  updated: number
  stats: Stat[]
}

const StatsModel = mongoose.model('Stats', StatsSchema)

export async function putStats (playerId: number, statsData: RawStat[]): Promise<StatsDocument | null> {
  logger.silly('putStats')
  const deferred = Q.defer()
  StatsModel.findOne({ player_id: playerId }, function (err: mongoose.CallbackError, stats: StatsDocument) {
    logger.silly('findOne')
    if (err != null) { return deferred.reject(err) }
    logger.silly('no error')
    if (stats != null) {
      logger.silly('stats not null')
      var newStats = mergeStats(stats.stats, statsData)
      stats.stats = newStats
      stats.updated = Date.now()
      stats.save(function (err: mongoose.CallbackError) {
        if (err != null) { return deferred.reject(err) }
        return deferred.resolve()
      })
    } else {
      logger.silly('stats null')
      newStats = mergeStats([], statsData)
      var statDoc = new StatsModel({
        player_id: playerId,
        updated: Date.now(),
        stats: newStats
      })
      statDoc.save(function (err: mongoose.CallbackError) {
        if (err != null) { return deferred.reject(err) }
        return deferred.resolve()
      })
    }
  })
  return deferred.promise as any as Promise<StatsDocument | null>
}

function mergeStats (oldStats: Stat[], newStats: RawStat[]): Stat[] {
  logger.silly('mergeStats')
  var returnStats = []
  logger.silly('oldStats')
  logger.silly(oldStats)
  logger.silly(newStats)
  for (var i = 0; i < oldStats.length; i++) {
    var currentStat = oldStats[i].stat_name
    for (var j = 0; j < newStats.length; j++) {
      if (newStats[j].stat_name === currentStat) {
        oldStats[i].stat_string = newStats[j].stat_str
        oldStats[i].stat_int = newStats[j].stat_int
        break
      }
    }
    returnStats.push(oldStats[i])
  }
  logger.silly('newStats')
  for (i = 0; i < newStats.length; i++) {
    currentStat = newStats[i].stat_name
    var exists = false
    for (j = 0; j < oldStats.length; j++) {
      if (oldStats[j].stat_name === currentStat) {
        exists = true
        break
      }
    }
    if (!exists) {
      returnStats.push({
        stat_name: newStats[i].stat_name,
        stat_string: newStats[i].stat_str,
        stat_int: newStats[i].stat_int,
        modified: newStats[i].modify_date
      })
    }
  }
  logger.silly('return')
  return returnStats
}

export async function getStatsById (playerId: number): Promise<StatsDocument | null> {
  logger.silly('getStatsById')
  const deferred = Q.defer()
  StatsModel.findOne({ player_id: playerId }, function (err: mongoose.CallbackError, stats: StatsDocument) {
    if (err != null) { return deferred.reject(err) }
    return deferred.resolve(stats)
  })
  return deferred.promise as any as Promise<StatsDocument | null>
}
