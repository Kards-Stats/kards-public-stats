const mongoose = require('mongoose');
const Q = require('q');
const { getCurrentLogger } = require('../includes/logger');
const logger = getCurrentLogger('user-model');

const Schema = mongoose.Schema;

const StatsSchema = new Schema({
	'player_id': Number,
	'updated': Date,
	'stats': [{
		'stat_name': String,
		'modified': Date,
		'stat_int': Number,
		'stat_string': String
	}]
});

const StatsModel = mongoose.model('Stats', StatsSchema);

class StatsFunctions {

	static putStats(player_id, stats_data) {
		const deferred = Q.defer();
		StatsModel.findOne({ player_id: player_id }, function (err, stats) {
			if (err)
				return deferred.reject(err);
			if (stats) {
				var new_stats = StatsFunctions.mergeStats(stats.stats, stats_data);
				stats.stats = new_stats;
				stats.updated = Date.now();
				stats.save(function(err) {
					if (err)
						return deferred.reject(err);
					return deferred.resolve();
				});
			} else {
				var new_stats = [];
				for (var i = 0; i< stats_data.length; i++) {
					new_stats.push({
						stat_name: stats_data[i].stat_name,
						stat_string: stats_data[i].stat_str,
						stat_int: stats_data[i].stat_int,
						modified: stats_data[i].modify_date,
					});
				}
				var stat_doc = new StatsModel({
					player_id: player_id,
					updated: Date.now(),
					stats: new_stats
				});
				stat_doc.save(function(err) {
					if (err)
						return deferred.reject(err);
					return deferred.resolve();
				});
			}
		});
		return deferred.promise;
	}

	static mergeStats(old_stats, new_stats) {
		var return_stats = [];
		for (var i = 0; i < old_stats.length; i++) {
			var current_stat = old_stats[i].stat_name;
			for (var j = 0; j < new_stats.length; i++) {
				if (new_stats[j].stat_name == current_stat) {
					old_stats[i].stat_string = new_stats[j].stat_string;
					old_stats[i].stat_int = new_stats[j].stat_int;
					break;
				}
			}
			return_stats.push(old_stats[i]);
		}
		for (var i = 0; i < new_stats.length; i++) {
			var current_stat = new_stats[i].stat_name;
			var exists = false;
			for (var j = 0; j < old_stats.length; i++) {
				if (old_stats[j].stat_name == current_stat) {
					exists = true;
					break;
				}
			}
			if (!exists)
				return_stats.push({
					stat_name: new_stats[i].stat_name,
					stat_string: new_stats[i].stat_string,
					stat_int: new_stats[i].stat_int,
					modified: new_stats[i].modified_date,
				});
		}
		return return_stats;
	}

	static getById(player_id) {
		const deferred = Q.defer();
		StatsModel.findOne({ player_id: player_id }, function (err, stats) {
			if (err)
				return deferred.reject(err);
			return deferred.resolve(stats);
		});
		return deferred.promise;
	}

}

module.exports = {
	StatsFunctions: StatsFunctions,
	StatsModel: StatsModel,
	StatsSchema: StatsSchema
};
