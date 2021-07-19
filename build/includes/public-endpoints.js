"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getKardsSessionEndpoint = exports.getCompatibleVersions = void 0;
const logger_1 = require("./logger");
const follow_redirects_1 = require("follow-redirects");
const q_1 = __importDefault(require("q"));
const kards_api_error_1 = __importDefault(require("./kards-api-error"));
const keyv_1 = __importDefault(require("keyv"));
const underscore_1 = __importDefault(require("underscore"));
const keyv = new keyv_1.default();
const logger = logger_1.getCurrentLogger('includes-public-endpoints');
const oneDay = 24 * 60 * 60 * 60 * 1000;
var endpoints;
async function refreshPublicEndpoints() {
    logger.silly('refreshPublicEndpoints');
    const deferred = q_1.default.defer();
    const options = {
        host: process.env.kards_hostname,
        path: '/',
        port: 443,
        method: 'GET',
        headers: {
            'Drift-Api-Key': process.env.kards_drift_api_key
        },
        rejectUnauthorized: false
    };
    follow_redirects_1.https.request(options, (res) => {
        var body = '';
        res.on('data', (d) => {
            body += d;
        });
        res.on('end', () => {
            logger.silly(body);
            try {
                const result = JSON.parse(body);
                if (kards_api_error_1.default.isKardsError(result)) {
                    logger.silly('isKardsError');
                    return deferred.reject(new kards_api_error_1.default(result));
                }
                else {
                    if (Object.hasOwnProperty.call(result, 'endpoints')) {
                        logger.silly('hasEndpoints');
                        endpoints = result.endpoints;
                        return deferred.resolve(endpoints);
                    }
                    else {
                        logger.silly('Unknown return');
                        return deferred.reject(new Error('Unknown return result'));
                    }
                }
            }
            catch (e) {
                logger.error(e);
                return deferred.reject(new Error('Unknown return result not json'));
            }
        });
    }).on('error', (e) => {
        return deferred.reject(e);
    }).end();
    return deferred.promise;
}
async function getCompatibleVersions() {
    logger.silly('getCompatibleVersions');
    const deferred = q_1.default.defer();
    keyv.get('kards_versions').then((versions) => {
        if (versions === undefined || !underscore_1.default.isArray(versions)) {
            const options = {
                host: process.env.kards_hostname,
                path: '/config',
                port: 443,
                method: 'GET',
                headers: {
                    'Drift-Api-Key': process.env.kards_drift_api_key
                },
                rejectUnauthorized: false
            };
            follow_redirects_1.https.request(options, (res) => {
                var body = '';
                res.on('data', (d) => {
                    body += d;
                });
                res.on('end', () => {
                    logger.silly(body);
                    try {
                        const result = JSON.parse(body);
                        if (Object.hasOwnProperty.call(result, 'versions')) {
                            logger.silly('hasVersions');
                            keyv.set('kards_versions', result.versions, oneDay).then(() => {
                                return deferred.resolve(result);
                            }).catch((e) => {
                                logger.error(e);
                                return deferred.reject(e);
                            });
                        }
                        else {
                            logger.silly('Unknown return');
                            return deferred.reject(new Error('Unknown return result'));
                        }
                    }
                    catch (e) {
                        logger.error(e);
                        return deferred.reject(new Error('Unknown return result not json'));
                    }
                });
            }).on('error', (e) => {
                return deferred.reject(e);
            }).end();
        }
        else {
            return deferred.resolve(versions);
        }
    }).catch((e) => {
        logger.error(e);
        return deferred.reject(e);
    });
    return deferred.promise;
}
exports.getCompatibleVersions = getCompatibleVersions;
async function getKardsSessionEndpoint() {
    logger.silly('getKardsSessionEndpoint');
    const deferred = q_1.default.defer();
    if (endpoints !== undefined && Object.hasOwnProperty.call(endpoints, 'session') && endpoints.session != null && endpoints.session !== '') {
        logger.silly('session exists');
        logger.silly(endpoints.session);
        return await new Promise((resolve, reject) => {
            if (endpoints !== undefined) {
                return resolve(endpoints.session);
            }
            return reject(new Error('Session invalidated after check'));
        });
    }
    else {
        refreshPublicEndpoints().then((endpoints) => {
            if (Object.hasOwnProperty.call(endpoints, 'session') && endpoints.session != null && endpoints.session !== '') {
                return deferred.resolve(endpoints.session);
            }
            else {
                return deferred.reject(new Error('No session endpoint found'));
            }
        }).catch((e) => {
            return deferred.reject(e);
        });
    }
    return deferred.promise;
}
exports.getKardsSessionEndpoint = getKardsSessionEndpoint;
