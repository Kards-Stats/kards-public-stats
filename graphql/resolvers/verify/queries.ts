import Q from 'q'
import tools from '@kards-stats/kards-tools'
import winston from 'winston'
import { VerifyResult } from '../../../types/graphql'
import jwt from 'jsonwebtoken'
import _ from 'underscore'

const logger: winston.Logger = tools.includes.getCurrentLogger('graphql-r-verify-q')

export async function verifyPlayer (_parent: any, { jti }: { jti: string }): Promise<VerifyResult> {
  logger.silly('verifyPlayer')
  const deferred = Q.defer()
  tools.kards.request.kardsRequest('GET', {
    Authorization: 'jti ' + jti,
    'Drift-Api-Key': process.env.kards_drift_api_key
  }, '/').then((result) => {
    logger.silly('gotResult')
    if (_.isString(result)) {
      return deferred.resolve({ code: 500, message: 'Invalid Result' })
    }
    deferred.resolve(result)
    const token = jwt.sign({
      player_id: result.current_user.player_id,
      user_name: result.current_user.user_name
    }, process.env.SHARED_SECRET_KEY ?? '', {
      expiresIn: '1h',
      algorithm: 'HS256'
    })
    return deferred.resolve({
      token: token
    })
  }).catch((e) => {
    logger.error(e)
    return deferred.resolve({ code: 500, message: 'Not Authenticated' })
  })
  return deferred.promise as any as Promise<VerifyResult>
}
