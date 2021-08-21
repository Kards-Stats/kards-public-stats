import { connectors } from '@kards-stats/kards-tools'
import mongoose from 'mongoose'

export default async function getMongooseConnector (): Promise<connectors.MongoDBSteamUserConnector> {
  if (mongoose.connection === null || mongoose.connection.readyState !== 1) {
    return await new Promise<connectors.MongoDBSteamUserConnector>((resolve, reject) => {
      mongoose.connection.once('open', () => {
        return resolve(new connectors.MongoDBSteamUserConnector('SteamUser', mongoose.connection))
      })
      mongoose.connection.once('error', (e) => {
        return reject(e)
      })
    })
  }
  return new connectors.MongoDBSteamUserConnector('SteamUser', mongoose.connection)
}
// export default new tools.connectors.MongoDBSteamUserConnector('SteamUser')
