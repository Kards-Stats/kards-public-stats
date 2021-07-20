import { join } from 'path'
import { readdirSync, readFileSync } from 'fs'
import { makeExecutableSchema } from '@graphql-tools/schema'
import resolvers from './resolvers/index'

const gqlFiles = readdirSync(join(__dirname, './types'))

let typeDefs = ''

gqlFiles.forEach((file) => {
  typeDefs += readFileSync(join(__dirname, './types', file), {
    encoding: 'utf8'
  })
})

export default makeExecutableSchema({
  typeDefs,
  resolvers
})
