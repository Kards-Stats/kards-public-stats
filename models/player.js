const mongoose = require('mongoose');
const Q = require('q');
const log4js = require('log4js');
const logger = log4js.getLogger('player-model');
logger.level = process.env.log_level || 'error';

const Schema = mongoose.Schema;

const PlayerSchema = new Schema({
	'name': String,
	'tag': Number,
	'id': Number
});

const PlayerModel = mongoose.model('Player', PlayerSchema);

class PlayerFunctions {

	static getById(id) {
		const deferred = Q.defer();
		PlayerModel.findOne({ id: id }, function (err, player) {
			if (err) {
				deferred.reject(err);
			} else {
				deferred.resolve(player);
			}
		});
		return deferred.promise;
	}
	
	static getByName(player_name, player_tag) {
		const deferred = Q.defer();
		PlayerModel.findOne({ name: player_name, tag: player_tag }, function (err, player) {
			if (err) {
				deferred.reject(err);
			} else {
				deferred.resolve(player);
			}
		});
		return deferred.promise;
	}

	static newPlayer(name, tag, id) {
		var data = {
			'name': name,
			'tag': tag,
			'id': id
		};
		var player = new PlayerModel(data);
		return player.save();
	}

}

module.exports = {
	PlayerFunctions: PlayerFunctions,
	PlayerModel: PlayerModel,
	PlayerSchema: PlayerSchema
};
