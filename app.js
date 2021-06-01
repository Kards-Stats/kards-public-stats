const express = require('express');
const https = require('https');
const fs = require('fs');

const helmet = require('helmet');

const log4js = require('log4js');
const logger = log4js.getLogger('app-main-exec');
const mongoose = require('mongoose');
const { graphqlHTTP } = require('express-graphql');

const constants = require('./config/constants');

const { executableSchema } = require('./functions/stats');

const app = express();

const httpsOptions = {
	key: fs.readFileSync('./security/cert.key'),
	cert: fs.readFileSync('./security/cert.pem')
};

const server = https.createServer(httpsOptions, app);

const port = process.env.PORT || 4848;

logger.level = process.env.log_level || 'error';
logger.fatal('DEBUG: FATAL LEVEL');
logger.error('DEBUG: ERROR LEVEL');
logger.info('DEBUG: INFO LEVEL');
logger.debug('DEBUG: DEBUG LEVEL');
logger.trace('DEBUG: TRACE LEVEL');

mongoose.connect(getMongooseConfig(), { useNewUrlParser: true, useUnifiedTopology: true });

configureSecurity();
/*
app.get('/test', (request, response) => {
	response.json({ test: true });
});

app.use(express.static('public', { index: null }));
*/
/*
app.use(function (req, res, next) {
	logger.trace(req);
    let originalSend = res.send;
    res.send = function (data) {
        logger.trace(data);
        originalSend.apply(res, Array.from(arguments));
    }
    next();
});
*/

app.use('/graphql', graphqlHTTP({
	schema: executableSchema,
	graphiql: true,
}));


server.listen(port, () => {
	console.log('Listening on https://localhost:' + port);
});

function configureSecurity() {
	app.use(helmet());
	app.use(helmet.noCache());
	app.enable('trust proxy');
}

function getMongooseConfig() {
	return 'mongodb+srv://' + process.env.mdb_username + ':' + process.env.mdb_password + '@' + process.env.mdb_cluster_url + '/' + process.env.mdb_database + '?retryWrites=true&w=majority';
}
