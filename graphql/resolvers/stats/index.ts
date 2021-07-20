import { getByPlayerId, getByPlayerName } from './queries'
import { updateByPlayerId, updateByPlayerName } from './mutations'

export default {
  statsMutations: {
    statsById: updateByPlayerId,
    statsByName: updateByPlayerName
  },
  statsQueries: {
    statsById: getByPlayerId,
    statsByName: getByPlayerName
  }
}
