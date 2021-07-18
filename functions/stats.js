const { getCurrentLogger } = require('../includes/logger');
const logger = getCurrentLogger('functions-stats');
const jwt = require('jsonwebtoken');
const {
    GraphQLScalarType
} = require('graphql');

const { makeExecutableSchema } = require('@graphql-tools/schema');

const { PlayerFunctions } = require('../models/player');
const { StatsFunctions } = require('../models/stats');
const { Session } = require('../includes/session');
const Q = require('q');

const waitTime = 10 * 60 * 1000;

const session = new Session('*');

const { authenticatedRequest, authenticatedPost } = require('../includes/kards-request');

const hostname = 'https://' + process.env.kards_hostname;

function getByPlayerId(id) {
    logger.silly('getByPlayerId');
    const deferred = Q.defer();
    PlayerFunctions.getById(id).then((player) => {
        logger.silly('PF get done');
        logger.silly(player);
        if (!player) {
            StatsFunctions.getById(id).then((stats) => {
                logger.silly('SF get done');
                logger.silly(stats);
                var value = {
                    player: {
                        id: id,
                        name: '',
                        tag: -1
                    },
                    stats: []
                };
                if (stats) {
                    value.stats = stats.stats;
                }
                deferred.resolve(value);
            }).catch((e) => {
                logger.error(e);
                deferred.resolve({ code: 500, message: 'Unknown' });
            });
        } else {
            StatsFunctions.getById(player.id).then((stats) => {
                var value = {
                    player: player,
                    stats: []
                };
                if (stats) {
                    value.stats = stats.stats;
                }
                deferred.resolve(value);
            }).catch((e) => {
                logger.error(e);
                deferred.resolve({ code: 500, message: 'Unknown' });
            });
        }
    }).catch((e) => {
        logger.error(e);
        deferred.resolve({ code: 500, message: 'Unknown' });
    });
    return deferred.promise;
}

function getByPlayerName(name, tag) {
    logger.silly('getByPlayerName');
    const deferred = Q.defer();
    PlayerFunctions.getByName(name, tag).then((player) => {
        logger.silly('PF get done');
        logger.silly(player);
        if (!player) {
            session.getPlayerID().then((player_id) => {
                authenticatedPost(hostname + '/players/' + player_id + '/friends', JSON.stringify({
                    friend_tag: tag,
                    friend_name: name
                }), session).then((friend_result) => {
                    logger.silly('FR get done');
                    logger.silly(friend_result);
                    PlayerFunctions.newPlayer(name, tag, friend_result.friend_id);
                    logger.silly(friend_result);
                    StatsFunctions.getById(friend_result.friend_id).then((stats) => {
                        logger.silly('SF get done');
                        logger.silly(stats);
                        var value = {
                            player: {
                                id: friend_result.friend_id,
                                name: name,
                                tag: tag
                            },
                            stats: []
                        };
                        if (stats) {
                            value.stats = stats.stats;
                        }
                        logger.silly(value);
                        return deferred.resolve(value);
                    }).catch((e) => {
                        logger.error(e);
                        return deferred.resolve({ code: 500, message: 'Unknown' });
                    });
                }).catch((e) => {
                    logger.error(e);
                    if (e.status_code == 404) {
                        return deferred.resolve({ code: 404, message: 'Player not found' });
                    } else if (e.status_code == 401) {
                        return deferred.resolve({ code: 401, message: 'Backend temporarily unavailable' });
                    }
                    return deferred.resolve({ code: 500, message: 'Unknown' });
                });
            }).catch((e) => {
                logger.error(e);
                return deferred.resolve({ code: 500, message: e.error });
            });
        } else {
            StatsFunctions.getById(player.id).then((stats) => {
                logger.silly(stats);
                var value = {
                    player: player,
                    stats: []
                };
                if (stats) {
                    value.stats = stats.stats;
                }
                return deferred.resolve(value);
            }).catch((e) => {
                logger.error(e);
                return deferred.resolve({ code: 500, message: 'Unknown' });
            });
        }
    }).catch((e) => {
        logger.error(e);
        return deferred.resolve({ code: 500, message: 'Unknown' });
    });
    return deferred.promise;
}

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

function updateByPlayerId(id) {
    logger.silly('updateByPlayerId');
    const deferred = Q.defer();
    StatsFunctions.getById(id).then((stats) => {
        if (stats) {
            logger.silly(stats.updated);
            if ((new Date()) - stats.updated < waitTime) {
                deferred.resolve({ code: 600, message: 'Wait 10 minnutes before updating' });
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
        deferred.resolve({ code: 500, message: 'Unknown' });
    });
    return deferred.promise;
}

function updateByPlayerName(name, tag) {
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
                        return deferred.resolve({ code: 500, message: e.error });
                    });
                }).catch((e) => {
                    logger.error(e);
                    if (e.status_code == 404) {
                        return deferred.resolve({ code: 404, message: 'Player not found' });
                    } else if (e.status_code == 401) {
                        return deferred.resolve({ code: 401, message: 'Backend temporarily unavailable' });
                    }
                    return deferred.resolve({ code: 500, message: 'Unknown' });
                });
            }).catch((e) => {
                logger.error(e);
                return deferred.resolve({ code: 500, message: e.error });
            });
        } else {
            updateByPlayerId(player.id).then((result) => {
                return deferred.resolve(result);
            }).catch((e) => {
                logger.error(e);
                return deferred.resolve({ code: 500, message: e.error });
            });
        }
    }).catch((e) => {
        logger.error(e);
        deferred.resolve({ code: 500, message: 'Unknown' });
    });
    return deferred.promise;
}

function verifyPlayer(jti) {
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

stats: []
const typeDefs = `
scalar Date

type Player {
    id: String,
    name: String,
    tag: Int
}

type Stats {
    player: Player
    stats: [Stat]
}

type Stat {
    stat_name: String
    modified: Date
    stat_int: Int
    stat_string: String
}

type Error {
    message: String
    code: String
}

union StatsResult = Stats | Error

type Query {
    statsById (
        id: Int
    ): StatsResult
    statsByName (
        name: String
        tag: Int
    ): StatsResult
    verifyPlayer (
        jti: String
    ): VerifyResult
}

type QueueResult {
    queued: Boolean
}

type VerifyToken {
    token: String
}

union UpdateResult = QueueResult | Error
union VerifyResult = VerifyToken | Error

type Mutation {
    statsById (
        id: Int
    ): UpdateResult
    statsByName (
        name: String
        tag: Int
    ): UpdateResult
}

schema {
    query: Query
    mutation: Mutation
}
`;

const resolvers = {
    StatsResult: {
        __resolveType(obj, context, info) {
            if (obj.message) {
                return 'Error';
            }
            if (obj.player) {
                return 'Stats';
            }
            return null;
        }
    },
    UpdateResult: {
        __resolveType(obj, context, info) {
            logger.silly('Update Resolve');
            logger.silly(obj);
            if (obj.message) {
                return 'Error';
            }
            if (obj.queued) {
                return 'QueueResult';
            }
            return null;
        }
    },
    Query: {
        statsById(_, { id }) {
            return getByPlayerId(id);
        },
        statsByName(_, { name, tag }) {
            return getByPlayerName(name, tag);
        },
        verifyPlayer(_, { jti }) {
            return verifyPlayer(jti);
        }
    },
    Mutation: {
        statsById(_, { id }) {
            return updateByPlayerId(id);
        },
        statsByName(_, { name, tag }) {
            return updateByPlayerName(name, tag);
        }
    },
    Date: new GraphQLScalarType({
        name: 'Date',
        description: 'Date custom scalar type',
        parseValue(value) {
            return new Date(value); // value from the client
        },
        serialize(value) {
            return value.getTime(); // value sent to the client
        },
        parseLiteral(ast) {
            if (ast.kind === Kind.INT) {
                return parseInt(ast.value, 10); // ast value is always in string format
            }
            return null;
        }
    })
}

module.exports = {
    getByPlayerId,
    getByPlayerName,
    executableSchema: makeExecutableSchema({
        typeDefs,
        resolvers
    })
};