const { join } = require('path');
const { readdirSync, readFileSync } = require('fs');
const { makeExecutableSchema } = require('@graphql-tools/schema');
const resolvers = require('./resolvers/index');

const gqlFiles = readdirSync(join(__dirname, './types'));

let typeDefs = '';

gqlFiles.forEach((file) => {
	typeDefs += readFileSync(join(__dirname, './types', file), {
		encoding: 'utf8'
	});
});

module.exports = makeExecutableSchema({
	typeDefs,
	resolvers
});