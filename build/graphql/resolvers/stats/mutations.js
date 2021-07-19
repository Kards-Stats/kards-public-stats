"use strict";
const { PlayerFunctions } = require('../../../models/player');
const { StatsFunctions } = require('../../../models/stats');
const { Session } = require('../../../includes/session');
const Q = require('q');
const logger = require('../../../includes/logger').getCurrentLogger('graphql-r-stats-m');
const waitTime = 10 * 60 * 1000;
const session = new Session('*');
const { authenticatedRequest, authenticatedPost } = require('../../../includes/kards-request');
const hostname = 'https://' + process.env.kards_hostname;
function internalUpdateStats(playerId) {
    logger.silly('internalUpdateStats');
    authenticatedRequest('GET', hostname + '/playerstats/' + playerId, session).then((playerStats) => {
        StatsFunctions.putStats(playerId, playerStats).catch((e) => {
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
            }
            else {
                internalUpdateStats(id);
                deferred.resolve({ queued: true });
            }
        }
        else {
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
            session.getPlayerID().then((playerId) => {
                authenticatedPost(hostname + '/players/' + playerId + '/friends', JSON.stringify({
                    friend_tag: tag,
                    friend_name: name
                }), session).then((friendResult) => {
                    PlayerFunctions.newPlayer(name, tag, friendResult.friend_id);
                    updateByPlayerId(friendResult.friend_id).then((result) => {
                        return deferred.resolve(result);
                    }).catch((e) => {
                        logger.error(e);
                        return deferred.resolve({ code: 500, error: e.error });
                    });
                }).catch((e) => {
                    logger.error(e);
                    if (e.status_code === 404) {
                        return deferred.resolve({ code: 404, error: 'Player not found' });
                    }
                    else if (e.status_code === 401) {
                        return deferred.resolve({ code: 401, error: 'Backend temporarily unavailable' });
                    }
                    return deferred.resolve({ code: 500, error: 'Unknown' });
                });
            }).catch((e) => {
                logger.error(e);
                return deferred.resolve({ code: 500, error: e.error });
            });
        }
        else {
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
