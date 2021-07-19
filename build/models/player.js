"use strict";
const mongoose = require('mongoose');
const Q = require('q');
const Schema = mongoose.Schema;
const PlayerSchema = new Schema({
    name: String,
    tag: Number,
    id: Number
});
const PlayerModel = mongoose.model('Player', PlayerSchema);
class PlayerFunctions {
    static getById(id) {
        const deferred = Q.defer();
        PlayerModel.findOne({ id: id }, function (err, player) {
            if (err) {
                deferred.reject(err);
            }
            else {
                deferred.resolve(player);
            }
        });
        return deferred.promise;
    }
    static getByName(playerName, playerTag) {
        const deferred = Q.defer();
        PlayerModel.findOne({ name: playerName, tag: playerTag }, function (err, player) {
            if (err) {
                deferred.reject(err);
            }
            else {
                deferred.resolve(player);
            }
        });
        return deferred.promise;
    }
    static newPlayer(name, tag, id) {
        var data = {
            name: name,
            tag: tag,
            id: id
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
