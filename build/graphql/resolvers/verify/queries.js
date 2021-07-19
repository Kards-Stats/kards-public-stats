"use strict";
const { Session } = require('../../../includes/session');
const Q = require('q');
const jwt = require('jsonwebtoken');
const logger = require('../../../includes/logger').getCurrentLogger('graphql-r-verify-q');
const session = new Session('*');
const { authenticatedRequest } = require('../../../includes/kards-request');
const hostname = 'https://' + process.env.kards_hostname;
async function verifyPlayer(_, { jti }) {
    logger.silly('verifyPlayer');
    const deferred = Q.defer();
    authenticatedRequest('GET', hostname, session).then((result) => {
        logger.silly('gotResult');
        deferred.resolve(result);
        const token = jwt.sign({
            player_id: result.current_user.player_id,
            user_name: result.current_user.user_name
        }, process.env.SHARED_SECRET_KEY, {
            expiresIn: '1h',
            algorithm: 'HS256'
        });
        deferred.resolve({
            token: token
        });
    }).catch((e) => {
        logger.error(e);
        deferred.resolve({ code: 500, message: 'Not Authenticated' });
    });
    return deferred.promise;
}
module.exports = {
    verifyPlayer: verifyPlayer
};
