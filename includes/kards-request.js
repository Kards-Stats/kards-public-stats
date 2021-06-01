const log4js = require('log4js');
const logger = log4js.getLogger('kards-requests');
logger.level = process.env.log_level || 'error';

const https = require('https');
const Q = require('q');

const { getJti } = require('./session');
const { KardsApiError } = require('./kards-api-error');

function authenticatedGet(endpoint) {
    logger.trace('authenticatedGet');
    const deferred = Q.defer();
    getJti().then((jti) => {
        logger.trace('gotJti');
        logger.trace(jti);
        logger.trace(endpoint);
        var options = {
            port: 443,
            method: 'GET',
            headers: {
                'Authorization': 'jti ' + jti,
                'Drift-Api-Key': process.env.kards_drift_api_key,
            },
            rejectUnauthorized: false
        };
        kardsRequestGet(options, endpoint).then((result) => {
            logger.trace('gotResult');
            deferred.resolve(result);
        }).catch((e) => {
            logger.trace('gotError');
            deferred.reject(e);
        });
    });
    return deferred.promise;
}

function authenticatedPost(endpoint, data) {
    logger.trace('authenticatedPost');
    const deferred = Q.defer();
    getJti().then((jti) => {
        logger.trace('gotJti');
        logger.trace(jti);
        logger.trace(endpoint);
        var options = {
            port: 443,
            method: 'POST',
            headers: {
                'Authorization': 'JTI ' + jti,
                'Content-Length': JSON.stringify(data).length,
                'Content-Type': 'application/json',
                'Drift-Api-Key': process.env.kards_drift_api_key,
            },
            rejectUnauthorized: false
        };
        kardsRequestPost(options, endpoint, data).then((result) => {
            logger.trace('gotResult');
            deferred.resolve(result);
        }).catch((e) => {
            logger.trace('gotError');
            deferred.reject(e);
        });
    });
    return deferred.promise;
}

function publicGet(endpoint) {
    const deferred = Q.defer();
    var options = {
        port: 443,
        method: 'GET',
        headers: {
            'Drift-Api-Key': process.env.kards_drift_api_key,
        },
        rejectUnauthorized: false
    };
    kardsRequestGet(options, endpoint).then((result) => {
        deferred.resolve(result);
    }).catch((e) => {
        deferred.reject(e);
    });
    return deferred.promise;
}

function kardsRequestGet(options, endpoint) {
    logger.trace('kardsRequestGet');
    const deferred = Q.defer();
    https.request(endpoint, options, (res) => {
        var body = '';
        res.on('data', (d) => {
            body += d;
        });

        res.on('end', () => {
            logger.trace('request end');
            try {
                var json = JSON.parse(body);
                if (KardsApiError.isKardsError(json)) {
                    logger.trace('isKardsError');
                    deferred.reject(new KardsApiError(json));
                } else {
                    logger.trace('isJsonResult');
                    deferred.resolve(json);
                }
            } catch {
                logger.trace('isTextResult');
                deferred.resolve(body);
            }
        });
    }).on('error', (e) => {
        logger.error(e);
        deferred.reject(e);
    }).end();
    return deferred.promise;
}

function kardsRequestPost(options, endpoint, data) {
    logger.trace('kardsRequestPost');
    logger.trace(JSON.stringify(data));
    logger.trace(options);
    logger.trace(endpoint);
    const deferred = Q.defer();
    var req = https.request(endpoint, options, (res) => {
        var body = '';
        res.on('data', (d) => {
            logger.trace('request data');
            body += d;
        });

        res.on('end', () => {
            logger.trace('request end');
            try {
                var json = JSON.parse(body);
                if (KardsApiError.isKardsError(json)) {
                    logger.trace('isKardsError');
                    deferred.reject(new KardsApiError(json));
                } else {
                    logger.trace('isJsonResult');
                    deferred.resolve(json);
                }
            } catch {
                logger.trace('isTextResult');
                deferred.resolve(body);
            }
        });
    })
    req.on('error', (e) => {
        logger.error(e);
        deferred.reject(e);
    })
    req.write(JSON.stringify(data));
    req.end();
    return deferred.promise;
}
module.exports = {
    authenticatedGet: authenticatedGet,
    authenticatedPost: authenticatedPost,
    publicGet: publicGet
};