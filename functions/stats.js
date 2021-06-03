const log4js = require('log4js');
const logger = log4js.getLogger('kards-requests');
logger.level = process.env.log_level || 'error';
const {
    GraphQLScalarType
} = require('graphql');

const { makeExecutableSchema } = require('@graphql-tools/schema');

const { PlayerFunctions } = require('../models/player');
const { StatsFunctions } = require('../models/stats');

const Q = require('q');

const waitTime = 10 * 60 * 1000;

const { authenticatedGet, authenticatedPost } = require('../includes/kards-request');

const hostname = 'https://' + process.env.kards_hostname;
const player_id = process.env.kards_player_id;

function getByPlayerId(id) {
    logger.trace('getByPlayerId');
    const deferred = Q.defer();
    PlayerFunctions.getById(id).then((player) => {
        logger.trace('PF get done');
        logger.trace(player);
        if (!player) {
            StatsFunctions.getById(id).then((stats) => {
                logger.trace('SF get done');
                logger.trace(stats);
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
                deferred.resolve({ error: 'Unknown' });
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
                deferred.resolve({ error: 'Unknown' });
            });
        }
    }).catch((e) => {
        logger.error(e);
        deferred.resolve({ error: 'Unknown' });
    });
    return deferred.promise;
}

function getByPlayerName(name, tag) {
    logger.trace('getByPlayerName');
    const deferred = Q.defer();
    PlayerFunctions.getByName(name, tag).then((player) => {
        logger.trace('PF get done');
        logger.trace(player);
        if (!player) {
            authenticatedPost(hostname + '/players/' + player_id + '/friends', {
                friend_tag: tag,
                friend_name: name
            }).then((friend_result) => {
                logger.trace('FR get done');
                logger.trace(friend_result);
                PlayerFunctions.newPlayer(name, tag, friend_result.friend_id);
                logger.trace(friend_result);
                StatsFunctions.getById(friend_result.friend_id).then((stats) => {
                    logger.trace('SF get done');
                    logger.trace(stats);
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
                    logger.trace(value);
                    deferred.resolve(value);
                }).catch((e) => {
                    logger.error(e);
                    deferred.resolve({ error: 'Unknown' });
                });
            }).catch((e) => {
                logger.error(e);
                if (e.status_code == 404) {
                    deferred.resolve({ error: 'Player not found' });
                } else if (e.status_code == 401) {
                    deferred.resolve({ error: 'Backend temporarily unavailable' });
                } else {
                    deferred.resolve({ error: 'Unknown' });
                }
            });
        } else {
            StatsFunctions.getById(player.id).then((stats) => {
                logger.trace(stats);
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
                deferred.resolve({ error: 'Unknown' });
            });
        }
    }).catch((e) => {
        logger.error(e);
        deferred.resolve({ error: 'Unknown' });
    });
    return deferred.promise;
}

function internalUpdateStats(player_id) {
    logger.trace('internalUpdateStats');
    authenticatedGet(hostname + '/playerstats/' + player_id).then((player_stats) => {
        StatsFunctions.putStats(player_id, player_stats).catch((e) => {
            logger.error(e);
        });
    }).catch((e) => {
        logger.error(e);
    });
}

function updateByPlayerId(id) {
    logger.trace('updateByPlayerId');
    const deferred = Q.defer();
    StatsFunctions.getById(id).then((stats) => {
        if (stats) {
            logger.trace(stats.updated);
            if ((new Date()) - stats.updated < waitTime) {
                deferred.resolve({ error: 'Wait 10 minnutes before updating' });
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
        deferred.resolve({ error: 'Unknown' });
    });
    return deferred.promise;
}

function updateByPlayerName(name, tag) {
    logger.trace('updateByPlayerName');
    const deferred = Q.defer();
    PlayerFunctions.getByName(name, tag).then((player) => {
        if (!player) {
            authenticatedPost(hostname + '/players/' + player_id + '/friends', {
                friend_tag: tag,
                friend_name: name
            }).then((friend_result) => {
                PlayerFunctions.newPlayer(name, tag, friend_result.friend_id);
                updateByPlayerId(friend_result.friend_id).then((result) => {
                    deferred.resolve(result);
                }).catch((e) => {
                    logger.error(e);
                    deferred.resolve({ error: e.error });
                });
            }).catch((e) => {
                logger.error(e);
                if (e.status_code == 404) {
                    deferred.resolve({ error: 'Player not found' });
                } else if (e.status_code == 401) {
                    deferred.resolve({ error: 'Backend temporarily unavailable' });
                } else {
                    deferred.resolve({ error: 'Unknown' });
                }
            });
        } else {
            updateByPlayerId(player.id).then((result) => {
                deferred.resolve(result);
            }).catch((e) => {
                logger.error(e);
                deferred.resolve({ error: e.error });
            });
        }
    }).catch((e) => {
        logger.error(e);
        deferred.resolve({ error: 'Unknown' });
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
    error: String
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
}

type QueueResult {
    queued: Boolean
}

union UpdateResult = QueueResult | Error

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
            if (obj.error) {
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
            logger.trace('Update Resolve');
            logger.trace(obj);
            if (obj.error) {
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