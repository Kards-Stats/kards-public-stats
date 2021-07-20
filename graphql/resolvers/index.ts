import stats from './stats/index'
import verify from './verify/index'
import { getCurrentLogger } from '../../includes/logger'
import winston from 'winston'
import { GraphQLScalarType, Kind } from 'graphql'
import _ from 'underscore'

const logger: winston.Logger = getCurrentLogger('graphql-r-index')

export default {
  StatsResult: {
    __resolveType: (obj: any) => {
      logger.silly('Resolve StatsResult')
      if (!_.isUndefined(obj.error)) {
        return 'Error'
      }
      if (_.isObject(obj.player)) {
        return 'Stats'
      }
      return null
    }
  },
  UpdateResult: {
    __resolveType: (obj: any) => {
      logger.silly('Resolve StatsResult')
      if (!_.isUndefined(obj.error)) {
        return 'Error'
      }
      if (_.isBoolean(obj.queued)) {
        return 'QueueResult'
      }
      return null
    }
  },
  VerifyResult: {
    __resolveType: (obj: any) => {
      logger.silly('Resolve StatsResult')
      if (!_.isUndefined(obj.error)) {
        return 'Error'
      }
      if (_.isString(obj.token)) {
        return 'VerifyResult'
      }
      return null
    }
  },
  Query: {
    ...stats.statsQueries,
    ...verify.verifyQueries
  },
  Mutation: {
    ...stats.statsMutations
  },
  Date: new GraphQLScalarType({
    name: 'Date',
    description: 'Date custom scalar type',
    parseValue (value) {
      return new Date(value) // value from the client
    },
    serialize (value) {
      return value.getTime() // value sent to the client
    },
    parseLiteral (ast) {
      if (ast.kind === Kind.INT) {
        return parseInt(ast.value, 10) // ast value is always in string format
      }
      return null
    }
  })
}
