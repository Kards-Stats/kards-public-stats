import Q from 'q'
import mongoose from 'mongoose'

const Schema = mongoose.Schema

const PlayerSchema = new Schema({
  name: String,
  tag: Number,
  id: Number
})

export interface PlayerDocument extends mongoose.Document {
  name: string
  tag: number
  id: number
}

const PlayerModel = mongoose.model('Player', PlayerSchema)

export async function getPlayerById (id: number): Promise<PlayerDocument | null> {
  const deferred = Q.defer()
  PlayerModel.findOne({ id: id }, function (err: mongoose.CallbackError, player: PlayerDocument) {
    if (err != null) {
      deferred.reject(err)
    } else {
      deferred.resolve(player)
    }
  })
  return deferred.promise as any as Promise<PlayerDocument | null>
}

export async function getPlayerByName (playerName: string, playerTag: number): Promise<PlayerDocument | null> {
  const deferred = Q.defer()
  PlayerModel.findOne({ name: playerName, tag: playerTag }, function (err: mongoose.CallbackError, player: PlayerDocument) {
    if (err != null) {
      deferred.reject(err)
    } else {
      deferred.resolve(player)
    }
  })
  return deferred.promise as any as Promise<PlayerDocument | null>
}

export async function newPlayer (name: string, tag: number, id: number): Promise<PlayerDocument | null> {
  var data = {
    name: name,
    tag: tag,
    id: id
  }
  var player = new PlayerModel(data)
  return await (player.save() as Promise<any> as Promise<PlayerDocument | null>)
}
