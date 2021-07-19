"use strict";
const { statsMutations, statsQueries } = require('./stats/index');
const { verifyQueries } = require('./verify/index');
const _ = require('underscore');
const { GraphQLScalarType, Kind } = require('graphql');
module.exports = {
    StatsResult: {
        __resolveType: obj => {
            if (!_.isUndefined(obj.error)) {
                return 'Error';
            }
            if (_.isObject(obj.player)) {
                return 'Stats';
            }
            return null;
        }
    },
    UpdateResult: {
        __resolveType: obj => {
            if (!_.isUndefined(obj.error)) {
                return 'Error';
            }
            if (_.isBoolean(obj.queued)) {
                return 'QueueResult';
            }
            return null;
        }
    },
    Query: {
        ...statsQueries,
        ...verifyQueries
    },
    Mutation: {
        ...statsMutations
    },
    Date: new GraphQLScalarType({
        name: 'Date',
        description: 'Date custom scalar type',
        parseValue(value) {
            return new Date(value);
        },
        serialize(value) {
            return value.getTime();
        },
        parseLiteral(ast) {
            if (ast.kind === Kind.INT) {
                return parseInt(ast.value, 10);
            }
            return null;
        }
    })
};
