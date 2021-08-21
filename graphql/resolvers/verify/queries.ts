import { includes } from '@kards-stats/kards-tools'
import { Requester } from '@kards-stats/kards-tools/build/kards'
import { Debugger } from '@kards-stats/kards-tools/build/includes'
import { VerifyResult } from '../../../types/graphql'
import jwt from 'jsonwebtoken'

const logger = includes.logger.getCurrentLogger('graphql-r-verify-q')

const debugObj = new Debugger()
debugObj.on('all', (args: any[]) => {
  var level: string = args[-1]
  args = args.pop()
  switch (level) {
    case 'silly':
      logger.silly(args)
      break
    case 'debug':
      logger.debug(args)
      break
    case 'info':
      logger.info(args)
      break
    case 'warn':
      logger.warn(args)
      break
    case 'error':
      logger.error(args)
      break
    case 'fatal':
      logger.error(args)
      break
  }
})
debugObj.level = debugObj.getLevelFromName('silly')

export async function verifyPlayer (_parent: any, { jti }: { jti: string }): Promise<VerifyResult> {
  logger.silly('verifyPlayer')
  try {
    var result = await Requester.rawRequest('GET', '/', { Authorization: `jti ${jti}` }, undefined, debugObj)
    logger.silly('gotResult')
    if (typeof result === 'string') {
      return { code: 500, error: 'Invalid Result' }
    }
    const token = jwt.sign({
      player_id: result.current_user.player_id,
      user_name: result.current_user.user_name
    }, process.env.SHARED_SECRET_KEY ?? '', {
      expiresIn: '1h',
      algorithm: 'HS256'
    })
    return {
      token: token
    }
  } catch (e) {
    logger.error(e)
    return { code: 500, error: 'Not Authenticated' }
  }
}
