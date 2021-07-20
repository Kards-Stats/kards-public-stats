export type Maybe<T> = T | null
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] }
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> }
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> }
/** All built-in and custom scalars, mapped to their actual values */
export interface Scalars {
  ID: string
  String: string
  Boolean: boolean
  Int: number
  Float: number
  Date: any
}

export interface Error {
  __typename?: 'Error'
  code: Scalars['Int']
  error: Scalars['String']
}

export interface Mutation {
  __typename?: 'Mutation'
  statsById: UpdateResult
  statsByName: UpdateResult
}

export interface MutationStatsByIdArgs {
  id: Scalars['Int']
}

export interface MutationStatsByNameArgs {
  name: Scalars['String']
  tag: Scalars['Int']
}

export interface Player {
  __typename?: 'Player'
  id: Scalars['Int']
  name: Scalars['String']
  tag: Scalars['Int']
}

export interface Query {
  __typename?: 'Query'
  statsById: StatsResult
  statsByName: StatsResult
  verifyPlayer: VerifyResult
}

export interface QueryStatsByIdArgs {
  id: Scalars['Int']
}

export interface QueryStatsByNameArgs {
  name: Scalars['String']
  tag: Scalars['Int']
}

export interface QueryVerifyPlayerArgs {
  jti: Scalars['String']
}

export interface QueueResult {
  __typename?: 'QueueResult'
  queued?: Maybe<Scalars['Boolean']>
}

export interface SimplePagination {
  __typename?: 'SimplePagination'
  total: Scalars['Int']
  page_size: Scalars['Int']
  offset: Scalars['Int']
}

export interface Stat {
  __typename?: 'Stat'
  stat_name: Scalars['String']
  modified: Scalars['Date']
  stat_int?: Maybe<Scalars['Int']>
  stat_string?: Maybe<Scalars['String']>
}

export interface Stats {
  __typename?: 'Stats'
  player: Player
  stats?: Maybe<Array<Maybe<Stat>>>
}

export type StatsResult = Stats | Error

export type UpdateResult = QueueResult | Error

export type VerifyResult = VerifyToken | Error

export interface VerifyToken {
  __typename?: 'VerifyToken'
  token: Scalars['String']
}
