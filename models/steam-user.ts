import { getCurrentLogger } from '../includes/logger'
import Q from 'q'
import mongoose from 'mongoose'
import winston from 'winston'

const logger: winston.Logger = getCurrentLogger('models-steam-user')

const Schema = mongoose.Schema

const RequiredString = {
  type: String,
  required: true
}

const SteamUserSchema = new Schema({
  username: RequiredString,
  password: RequiredString,
  type: RequiredString,
  steam_id: String,
  ticket: String,
  banned: {
    type: Boolean,
    default: false
  },
  last_steam_login: Date,
  last_kards_login: Date
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })

export interface SteamUserDocument extends mongoose.Document {
  username: string
  password: string
  type: string
  steam_id?: string
  ticket?: string
  banned: boolean
  last_steam_login: Date
  last_kards_login: Date
}

const SteamUserModel = mongoose.model('SteamUser', SteamUserSchema)

export async function getUnbanned (type = '*'): Promise<SteamUserDocument[] | null> {
  logger.silly('getUnbanned')
  const deferred = Q.defer()
  const query = type !== '*' ? { type: type, banned: false } : { banned: false }
  SteamUserModel.find(query, function (err: mongoose.CallbackError, results: SteamUserDocument[]) {
    if (err != null) { return deferred.reject(err) }
    return deferred.resolve(results)
  })
  return deferred.promise as any as Promise<SteamUserDocument[] | null>
}

export async function getUser (user: string): Promise<SteamUserDocument | null> {
  logger.silly('getUser')
  const deferred = Q.defer()
  const query = { username: user }
  SteamUserModel.findOne(query, function (err: mongoose.CallbackError, results: SteamUserDocument) {
    if (err != null) { return deferred.reject(err) }
    return deferred.resolve(results)
  })
  return deferred.promise as any as Promise<SteamUserDocument | null>
}

export async function getOldest (type = '*'): Promise<SteamUserDocument | null> {
  logger.silly('getOldest')
  const deferred = Q.defer()
  const query = type !== '*' ? { type: type, banned: false } : { banned: false }
  SteamUserModel.findOne(query, null, { sort: { last_steam_login: 1 } }, function (err: mongoose.CallbackError, result: SteamUserDocument) {
    if (err != null) { return deferred.reject(err) }
    return deferred.resolve(result)
  })
  return deferred.promise as any as Promise<SteamUserDocument | null>
}
export async function addSteamLogin (user: string, steamId: string, ticket: string): Promise<SteamUserDocument | null> {
  logger.silly('getOldest')
  const deferred = Q.defer()
  const query = { username: user }
  SteamUserModel.findOne(query, function (err: mongoose.CallbackError, result: SteamUserDocument) {
    if (err != null) { return deferred.reject(err) }
    result.last_steam_login = new Date()
    result.steam_id = steamId
    result.ticket = ticket
    result.save().then(() => {
      return deferred.resolve(result)
    }).catch((e) => {
      return deferred.reject(e)
    })
  })
  return deferred.promise as any as Promise<SteamUserDocument | null>
}
export async function setBanned (user: string, banned: boolean): Promise<SteamUserDocument | null> {
  logger.silly('setBanned')
  const deferred = Q.defer()
  const query = { username: user }
  SteamUserModel.findOne(query, function (err: mongoose.CallbackError, result: SteamUserDocument) {
    if (err != null) { return deferred.reject(err) }
    result.banned = banned
    result.steam_id = undefined
    result.ticket = undefined
    result.save().then(() => {
      return deferred.resolve(result)
    }).catch((e) => {
      return deferred.reject(e)
    })
  })
  return deferred.promise as any as Promise<SteamUserDocument | null>
}

export async function addKardsLogin (user: string): Promise<SteamUserDocument | null> {
  logger.silly('getOldest')
  const deferred = Q.defer()
  const query = { username: user }
  SteamUserModel.findOne(query, function (err: mongoose.CallbackError, result: SteamUserDocument) {
    if (err != null) { return deferred.reject(err) }
    result.last_kards_login = new Date()
    result.save().then(() => {
      return deferred.resolve(result)
    }).catch((e) => {
      return deferred.reject(e)
    })
  })
  return deferred.promise as any as Promise<SteamUserDocument | null>
}
