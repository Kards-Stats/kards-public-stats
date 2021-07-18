const { PlayerFunctions } = require('../../../models/player');
const { StatsFunctions } = require('../../../models/stats');
const { Session } = require('../../../includes/session');
const Q = require('q');

const logger = require('../../../includes/logger').getCurrentLogger('graphql-r-stats-m');

const waitTime = 10 * 60 * 1000;

const session = new Session('*');

const { authenticatedRequest, authenticatedPost } = require('../../../includes/kards-request');

const hostname = 'https://' + process.env.kards_hostname;

function internalUpdateStats(player_id) {
    logger.silly('internalUpdateStats');
    authenticatedRequest('GET', hostname + '/playerstats/' + player_id, session).then((player_stats) => {
        StatsFunctions.putStats(player_id, player_stats).catch((e) => {
            logger.error(e);
        });
    }).catch((e) => {
        logger.error(e);
    });
}

async function updateByPlayerId(_, { id }) {
    logger.silly('updateByPlayerId');
    const deferred = Q.defer();
    StatsFunctions.getById(id).then((stats) => {
        if (stats) {
            logger.silly(stats.updated);
            if ((new Date()) - stats.updated < waitTime) {
                deferred.resolve({ code: 600, error: 'Wait 10 minnutes before updating' });
            } else {
                internalUpdateStats(id);
                deferred.resolve({ queued: true });
            }
        } else {
            internalUpdateStats(id);
            deferred.resolve({ queued: true });
        }
    }).catch((e) => {
        logger.error(e);
        deferred.resolve({ code: 500, error: 'Unknown' });
    });
    return deferred.promise;
}

async function updateByPlayerName(_, { name, tag }) {
    logger.silly('updateByPlayerName');
    const deferred = Q.defer();
    PlayerFunctions.getByName(name, tag).then((player) => {
        if (!player) {
            session.getPlayerID().then((player_id) => {
                authenticatedPost(hostname + '/players/' + player_id + '/friends', JSON.stringify({
                    friend_tag: tag,
                    friend_name: name
                }), session).then((friend_result) => {
                    PlayerFunctions.newPlayer(name, tag, friend_result.friend_id);
                    updateByPlayerId(friend_result.friend_id).then((result) => {
                        return deferred.resolve(result);
                    }).catch((e) => {
                        logger.error(e);
                        return deferred.resolve({ code: 500, error: e.error });
                    });
                }).catch((e) => {
                    logger.error(e);
                    if (e.status_code == 404) {
                        return deferred.resolve({ code: 404, error: 'Player not found' });
                    } else if (e.status_code == 401) {
                        return deferred.resolve({ code: 401, error: 'Backend temporarily unavailable' });
                    }
                    return deferred.resolve({ code: 500, error: 'Unknown' });
                });
            }).catch((e) => {
                logger.error(e);
                return deferred.resolve({ code: 500, error: e.error });
            });
        } else {
            updateByPlayerId(player.id).then((result) => {
                return deferred.resolve(result);
            }).catch((e) => {
                logger.error(e);
                return deferred.resolve({ code: 500, error: e.error });
            });
        }
    }).catch((e) => {
        logger.error(e);
        deferred.resolve({ code: 500, error: 'Unknown' });
    });
    return deferred.promise;
}

module.exports = {
	statsById: updateByPlayerId,
	statsByName: updateByPlayerName
};