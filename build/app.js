"use strict";
const express = require('express');
const helmet = require('helmet');
const { getCurrentLogger } = require('./includes/logger');
const logger = getCurrentLogger('app');
const mongoose = require('mongoose');
const { graphqlHTTP } = require('express-graphql');
const schema = require('./graphql/index');
const cors = require('cors');
const app = express();
const timeout = require('connect-timeout');
const port = process.env.PORT || 80;
logger.error('DEBUG: ERROR LEVEL');
logger.warn('DEBUG: WARN LEVEL');
logger.info('DEBUG: INFO LEVEL');
logger.debug('DEBUG: DEBUG LEVEL');
logger.silly('DEBUG: TRACE LEVEL');
logger.debug(getMongooseConfig());
mongoose.connect(getMongooseConfig(), { useNewUrlParser: true, useUnifiedTopology: true });
configureSecurity();
app.use(timeout('10s'));
app.use('/', cors(), function (request, response, next) {
    response.once('finish', function () {
    });
    return graphqlHTTP({
        schema: schema
    })(request, response, next);
});
app.listen(port, () => {
    console.log('Listening on https://localhost:' + port);
});
function configureSecurity() {
    app.use(helmet());
    app.use(helmet.noCache());
    app.enable('trust proxy');
}
function getMongooseConfig() {
    var userString = '';
    if (process.env.mdb_username !== undefined && process.env.mdb_password !== undefined &&
        process.env.mdb_username !== '' && process.env.mdb_password !== '') {
        userString = `${process.env.mdb_username}:${process.env.mdb_password}@`;
    }
    var prefix = 'mongodb+srv://';
    if (process.env.mdb_prefix !== undefined) {
        prefix = process.env.mdb_prefix;
    }
    const conString = `${prefix}${userString}${process.env.mdb_cluster_url}/${process.env.mdb_database}?retryWrites=true&w=majority&ssl=false`;
    logger.info(conString);
    return conString;
}
