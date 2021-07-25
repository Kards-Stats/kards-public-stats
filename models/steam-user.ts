import tools from '@kards-stats/kards-tools'
import mongoose from 'mongoose'

export default new tools.connectors.MongoDBSteamUserConnector('SteamUser', mongoose.connection)
// export default new tools.connectors.MongoDBSteamUserConnector('SteamUser')
