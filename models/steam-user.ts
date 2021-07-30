import { connectors } from '@kards-stats/kards-tools'
import mongoose from 'mongoose'

export default new connectors.MongoDBSteamUserConnector('SteamUser', mongoose.connection)
// export default new tools.connectors.MongoDBSteamUserConnector('SteamUser')
