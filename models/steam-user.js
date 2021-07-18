const logger = require('../includes/logger').getCurrentLogger('models-steam-user');

const mongoose = require('mongoose');
const Q = require('q');
const { result } = require('underscore');

const Schema = mongoose.Schema;

const RequiredString = {
	type: String,
	required: true
};

const SteamUserSchema = new Schema({
	username: RequiredString,
	password: RequiredString,
	type: RequiredString,
	steam_id: String,
	ticket: String,
	banned: {
		type: Boolean,
		default: false
	},
	last_steam_login: Date,
	last_kards_login: Date,
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

const SteamUserModel = mongoose.model('SteamUser', SteamUserSchema);

class SteamUserFunctions {

	static getUnbanned(type = '*') {
		logger.silly('getUnbanned');
		const deferred = Q.defer();
		const query = type !== '*' ? { type: type, banned: false } : { banned: false };
		SteamUserModel.find(query, function (err, results) {
			if (err)
				return deferred.reject(err);
			return deferred.resolve(results);
		});
		return deferred.promise;
	}

	static getUser(user) {
		logger.silly('getUser');
		const deferred = Q.defer();
		const query = { username: user };
		SteamUserModel.findOne(query, function (err, results) {
			if (err)
				return deferred.reject(err);
			return deferred.resolve(results);
		});
		return deferred.promise;
	}

	static getOldest(type = '*') {
		logger.silly('getOldest');
		const deferred = Q.defer();
		const query = type !== '*' ? { type: type, banned: false } : { banned: false };
		SteamUserModel.findOne(query, null, { sort: { last_steam_login: 1 } }, function (err, results) {
			if (err)
				return deferred.reject(err);
			return deferred.resolve(results);
		});
		return deferred.promise;
	}

	static addSteamLogin(user, steam_id, ticket) {
		logger.silly('getOldest');
		const deferred = Q.defer();
		const query = { username: user };
		SteamUserModel.findOne(query, function (err, result) {
			if (err)
				return deferred.reject(err);
			result.last_steam_login = new Date();
			result.steam_id = steam_id;
			result.ticket = ticket;
			result.save().then(() => {
				return deferred.resolve(result);
			}).catch((e) => {
				return deferred.reject(e);
			});
		});
		return deferred.promise;
	}

	static setBanned(user, banned) {
		logger.silly('setBanned');
		const deferred = Q.defer();
		const query = { username: user };
		SteamUserModel.findOne(query, function (err, result) {
			if (err)
				return deferred.reject(err);
			result.banned = banned;
			result.steam_id = null;
			result.ticket = null;
			result.save().then(() => {
				return deferred.resolve(result);
			}).catch((e) => {
				return deferred.reject(e);
			});
		});
		return deferred.promise;
	}

	static addKardsLogin(user) {
		logger.silly('getOldest');
		const deferred = Q.defer();
		const query = { username: user };
		SteamUserModel.findOne(query, function (err, result) {
			if (err)
				return deferred.reject(err);
			result.last_kards_login = new Date();
			result.save().then(() => {
				return deferred.resolve(result);
			}).catch((e) => {
				return deferred.reject(e);
			});
		});
		return deferred.promise;
	}
}

module.exports = {
	SteamUserFunctions,
	SteamUserModel,
	SteamUserSchema
};
