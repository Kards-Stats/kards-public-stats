const express = require('express');

const helmet = require('helmet');

const log4js = require('log4js');
const logger = log4js.getLogger('app-main-exec');
const mongoose = require('mongoose');
const { graphqlHTTP } = require('express-graphql');

const { executableSchema } = require('./functions/stats');

const cors = require('cors');

const app = express();
const timeout = require('connect-timeout');

const port = process.env.PORT || 4848;

logger.level = process.env.log_level || 'error';
logger.fatal('DEBUG: FATAL LEVEL');
logger.error('DEBUG: ERROR LEVEL');
logger.info('DEBUG: INFO LEVEL');
logger.debug('DEBUG: DEBUG LEVEL');
logger.trace('DEBUG: TRACE LEVEL');

logger.debug(getMongooseConfig());

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

app.use(timeout('5s'));

app.use('/', cors(), graphqlHTTP({
	schema: executableSchema
}));


app.listen(port, () => {
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
