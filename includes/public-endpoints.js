const log4js = require('log4js');
const logger = log4js.getLogger('public-endpoints');
logger.level = process.env.log_level || 'error';

const https = require('https');
const Q = require('q');

const { KardsApiError } = require('./kards-api-error');

var endpoints = {};

function refreshPublicEndpoints() {
    logger.trace('refreshPublicEndpoints');
    const deferred = Q.defer();
    var options = {
        port: 443,
        method: 'GET',
        headers: {
            'Drift-Api-Key': process.env.kards_drift_api_key,
        },
        rejectUnauthorized: false
    };
    https.request('https://' + process.env.kards_hostname, options, (res) => {
        var body = '';
        res.on('data', (d) => {
            body += d;
        });

        res.on('end', () => {
            logger.trace(body);
            try {
                var result = JSON.parse(body);
                if (KardsApiError.isKardsError(result)) {
                    logger.trace('isKardsError');
                    deferred.reject(new KardsApiError(result));
                } else {
                    if (result.hasOwnProperty('endpoints')) {
                        logger.trace('hasEndpoints');
                        endpoints = result.endpoints;
                        deferred.resolve(endpoints);
                    } else {
                        logger.trace('Unknown return');
                        deferred.reject(new Error('Unknown return result'));
                    }
                }
            } catch (e) {
                logger.error(e);
                deferred.reject(new Error('Unknown return result not json'));
            }
        });
    }).on('error', (e) => {
        deferred.reject(e);
    }).end();
    return deferred.promise;
}

function getKardsSessionEndpoint() {
    logger.trace('getKardsSessionEndpoint');
    const deferred = Q.defer();
    if (endpoints.hasOwnProperty('session') && endpoints.session != null && endpoints.session != '') {
        logger.trace('session exists');
        logger.trace(endpoints.session);
        deferred.resolve(endpoints.session);
    } else {
        refreshPublicEndpoints().then((endpoints) => {
            if (endpoints.hasOwnProperty('session') && endpoints.session != null && endpoints.session != '') {
                deferred.resolve(endpoints.session);
            } else {
                deferred.reject('No session endpoint found');
            }
        }).catch((e) => {
            deferred.reject(e);
        });
    }
    return deferred.promise;
}

module.exports = {
	getKardsSessionEndpoint: getKardsSessionEndpoint
};