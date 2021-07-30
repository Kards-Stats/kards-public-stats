import express from 'express'
import helmet from 'helmet'
import { includes } from '@kards-stats/kards-tools'
import winston from 'winston'
import mongoose from 'mongoose'
import noCache from 'nocache'
import { graphqlHTTP } from 'express-graphql'
import schema from './graphql/index'
import cors from 'cors'
import timeout from 'connect-timeout'

const logger: winston.Logger = includes.logger.getCurrentLogger('app')

const app = express()

const port = process.env.PORT ?? 80

logger.error('DEBUG: ERROR LEVEL')
logger.warn('DEBUG: WARN LEVEL')
logger.info('DEBUG: INFO LEVEL')
logger.debug('DEBUG: DEBUG LEVEL')
logger.silly('DEBUG: TRACE LEVEL')

logger.debug(getMongooseConfig())

mongoose.connect(getMongooseConfig(), { useNewUrlParser: true, useUnifiedTopology: true }).then(() => {
  configureSecurity()
  app.use(timeout('10s'))
  configureDev()
  app.use('/', function (request, response, next): void {
    // logger.info(response);
    response.once('finish', function () {
      // logger.info(response);
    })
    graphqlHTTP({
      schema: schema
    })(request, response).then(() => {
      next()
    }).catch((e) => {
      logger.error(e)
      response.json({ code: 500, error: 'GraphQL failed' })
    })
  })

  app.listen(port, () => {
    console.log(`Listening on https://localhost:${port}`)
  })
}).catch((e) => {
  logger.error('Unable to connect to mongodb')
  logger.error(e)
  process.exit(1)
})

function configureSecurity (): void {
  app.use(helmet())
  app.enable('trust proxy')
}

function configureDev (): void {
  if (process.env.NODE_ENV === 'development') {
    app.use(noCache())
    app.use(cors())
  }
}

function getMongooseConfig (): string {
  var userString = ''
  if (process.env.mdb_username !== undefined && process.env.mdb_password !== undefined &&
    process.env.mdb_username !== '' && process.env.mdb_password !== '') { userString = `${process.env.mdb_username}:${process.env.mdb_password}@` }
  var prefix = 'mongodb+srv://'
  if (process.env.mdb_prefix !== undefined) { prefix = process.env.mdb_prefix }
  const conString = `${prefix}${userString}${process.env.mdb_cluster_url ?? 'localhost'}/${process.env.mdb_database ?? ''}?retryWrites=true&w=majority&ssl=false`
  logger.info(conString)
  return conString
  // return 'mongodb://192.168.0.18:27017/?readPreference=primary&appname=MongoDB%20Compass&ssl=false';
  // return 'mongodb+srv://' + process.env.mdb_username + ':' + process.env.mdb_password + '@' + process.env.mdb_cluster_url + '/' + process.env.mdb_database + '?retryWrites=true&w=majority';
}
