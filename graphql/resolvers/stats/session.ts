import getMongooseConnector from '../../../models/steam-user'
import { KardsApi, Session } from '@kards-stats/kards-tools/build/kards'
import { Debugger } from '@kards-stats/kards-tools/build/includes'
import { includes } from '@kards-stats/kards-tools'

const logger = includes.logger.getCurrentLogger('graphql-r-stats-session')

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

var api: KardsApi | undefined

export default async function getKardsApi (): Promise<KardsApi> {
  if (api === undefined) {
    const session = new Session('stats-helper', await getMongooseConnector())
    api = new KardsApi(session, debugObj)
  }
  return api
}
