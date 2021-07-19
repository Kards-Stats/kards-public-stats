import { getCurrentLogger } from './logger'
import * as origHttps from 'https'
import { https } from 'follow-redirects'
import Q from 'q'
import KardsApiError from './kards-api-error'
import { Endpoints } from './types'
import winston from 'winston'
import Keyv from 'keyv'
import _ from 'underscore'

const keyv = new Keyv()

const logger: winston.Logger = getCurrentLogger('includes-public-endpoints')

const oneDay: number = 24 * 60 * 60 * 60 * 1000

var endpoints: Endpoints | undefined

async function refreshPublicEndpoints (): Promise<Endpoints> {
  logger.silly('refreshPublicEndpoints')
  const deferred = Q.defer()
  const options: origHttps.RequestOptions = { // TODO user kards-request lib
    host: process.env.kards_hostname,
    path: '/',
    port: 443,
    method: 'GET',
    headers: {
      'Drift-Api-Key': process.env.kards_drift_api_key
    },
    rejectUnauthorized: false
  }
  https.request(options, (res) => {
    var body: string = ''
    res.on('data', (d: string) => {
      body += d
    })

    res.on('end', () => {
      logger.silly(body)
      try {
        const result = JSON.parse(body)
        if (KardsApiError.isKardsError(result)) {
          logger.silly('isKardsError')
          return deferred.reject(new KardsApiError(result))
        } else {
          if (Object.hasOwnProperty.call(result, 'endpoints')) {
            logger.silly('hasEndpoints')
            endpoints = result.endpoints
            return deferred.resolve(endpoints)
          } else {
            logger.silly('Unknown return')
            return deferred.reject(new Error('Unknown return result'))
          }
        }
      } catch (e) {
        logger.error(e)
        return deferred.reject(new Error('Unknown return result not json'))
      }
    })
  }).on('error', (e: Error) => {
    return deferred.reject(e)
  }).end()
  return deferred.promise as any as Promise<Endpoints>
}

export async function getCompatibleVersions (): Promise<string[]> {
  logger.silly('getCompatibleVersions')
  const deferred = Q.defer()
  keyv.get('kards_versions').then((versions) => {
    if (versions === undefined || !_.isArray(versions)) {
      const options: origHttps.RequestOptions = { // TODO user kards-request lib
        host: process.env.kards_hostname,
        path: '/config',
        port: 443,
        method: 'GET',
        headers: {
          'Drift-Api-Key': process.env.kards_drift_api_key
        },
        rejectUnauthorized: false
      }
      https.request(options, (res) => {
        var body: string = ''
        res.on('data', (d: string) => {
          body += d
        })

        res.on('end', () => {
          logger.silly(body)
          try {
            const result = JSON.parse(body)
            if (Object.hasOwnProperty.call(result, 'versions')) {
              logger.silly('hasVersions')
              keyv.set('kards_versions', result.versions, oneDay).then(() => {
                return deferred.resolve(result)
              }).catch((e) => {
                logger.error(e)
                return deferred.reject(e)
              })
            } else {
              logger.silly('Unknown return')
              return deferred.reject(new Error('Unknown return result'))
            }
          } catch (e) {
            logger.error(e)
            return deferred.reject(new Error('Unknown return result not json'))
          }
        })
      }).on('error', (e: Error) => {
        return deferred.reject(e)
      }).end()
    } else {
      return deferred.resolve(versions)
    }
  }).catch((e) => {
    logger.error(e)
    return deferred.reject(e)
  })
  return deferred.promise as any as Promise<string[]>
}

export async function getKardsSessionEndpoint (): Promise<string> {
  logger.silly('getKardsSessionEndpoint')
  const deferred = Q.defer()
  if (endpoints !== undefined && Object.hasOwnProperty.call(endpoints, 'session') && endpoints.session != null && endpoints.session !== '') {
    logger.silly('session exists')
    logger.silly(endpoints.session)
    return await new Promise((resolve, reject) => {
      if (endpoints !== undefined) { return resolve(endpoints.session) }
      return reject(new Error('Session invalidated after check'))
    })
  } else {
    refreshPublicEndpoints().then((endpoints: Endpoints) => {
      if (Object.hasOwnProperty.call(endpoints, 'session') && endpoints.session != null && endpoints.session !== '') {
        return deferred.resolve(endpoints.session)
      } else {
        return deferred.reject(new Error('No session endpoint found'))
      }
    }).catch((e) => {
      return deferred.reject(e)
    })
  }
  return deferred.promise as any as Promise<string>
}
