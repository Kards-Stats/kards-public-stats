const { statsMutations, statsQueries } = require('./stats/index');
const { verifyQueries } = require('./verify/index');
const _ = require('underscore');
const { GraphQLScalarType } = require('graphql');
//const logger = require('../../includes/logger').getCurrentLogger('graphql-r-index');

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
};