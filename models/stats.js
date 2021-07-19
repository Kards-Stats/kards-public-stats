const mongoose = require('mongoose')
const Q = require('q')

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

const StatsModel = mongoose.model('Stats', StatsSchema)

class StatsFunctions {
  static putStats (playerId, statsData) {
    const deferred = Q.defer()
    StatsModel.findOne({ player_id: playerId }, function (err, stats) {
      if (err) { return deferred.reject(err) }
      if (stats) {
        var newStats = StatsFunctions.mergeStats(stats.stats, statsData)
        stats.stats = newStats
        stats.updated = Date.now()
        stats.save(function (err) {
          if (err) { return deferred.reject(err) }
          return deferred.resolve()
        })
      } else {
        newStats = []
        for (var i = 0; i < statsData.length; i++) {
          newStats.push({
            stat_name: statsData[i].stat_name,
            stat_string: statsData[i].stat_str,
            stat_int: statsData[i].stat_int,
            modified: statsData[i].modify_date
          })
        }
        var statDoc = new StatsModel({
          player_id: playerId,
          updated: Date.now(),
          stats: newStats
        })
        statDoc.save(function (err) {
          if (err) { return deferred.reject(err) }
          return deferred.resolve()
        })
      }
    })
    return deferred.promise
  }

  static mergeStats (oldStats, newStats) {
    var returnStats = []
    for (var i = 0; i < oldStats.length; i++) {
      var currentStat = oldStats[i].stat_name
      for (var j = 0; j < newStats.length; i++) {
        if (newStats[j].stat_name === currentStat) {
          oldStats[i].stat_string = newStats[j].stat_string
          oldStats[i].stat_int = newStats[j].stat_int
          break
        }
      }
      returnStats.push(oldStats[i])
    }
    for (i = 0; i < newStats.length; i++) {
      currentStat = newStats[i].stat_name
      var exists = false
      for (j = 0; j < oldStats.length; i++) {
        if (oldStats[j].stat_name === currentStat) {
          exists = true
          break
        }
      }
      if (!exists) {
        returnStats.push({
          stat_name: newStats[i].stat_name,
          stat_string: newStats[i].stat_string,
          stat_int: newStats[i].stat_int,
          modified: newStats[i].modified_date
        })
      }
    }
    return returnStats
  }

  static getById (playerId) {
    const deferred = Q.defer()
    StatsModel.findOne({ player_id: playerId }, function (err, stats) {
      if (err) { return deferred.reject(err) }
      return deferred.resolve(stats)
    })
    return deferred.promise
  }
}

module.exports = {
  StatsFunctions: StatsFunctions,
  StatsModel: StatsModel,
  StatsSchema: StatsSchema
}
