"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.kardsRequest = exports.getPath = exports.publicPost = exports.publicGet = exports.authenticatedPost = exports.authenticatedRequest = void 0;
const logger_1 = require("./logger");
const follow_redirects_1 = require("follow-redirects");
const q_1 = __importDefault(require("q"));
const kards_api_error_1 = __importDefault(require("./kards-api-error"));
const logger = logger_1.getCurrentLogger('includes-kards-request');
async function authenticatedRequest(method, path, session) {
    logger.silly('authenticatedGet');
    const deferred = q_1.default.defer();
    session.getJti().then((jti) => {
        logger.silly('gotJti');
        logger.debug(jti);
        logger.debug(path);
        kardsRequest(method, {
            Authorization: 'jti ' + jti,
            'Drift-Api-Key': process.env.kards_drift_api_key
        }, path).then((result) => {
            logger.silly('gotResult');
            return deferred.resolve(result);
        }).catch((e) => {
            logger.silly('gotError');
            return deferred.reject(e);
        });
    }).catch((e) => {
        return deferred.reject(e);
    });
    return deferred.promise;
}
exports.authenticatedRequest = authenticatedRequest;
async function authenticatedPost(path, data, session) {
    logger.silly('authenticatedGet');
    const deferred = q_1.default.defer();
    session.getJti().then((jti) => {
        logger.silly('gotJti');
        logger.debug(jti);
        logger.debug(path);
        kardsDataRequest('POST', {
            'Content-Type': 'application/json',
            Authorization: 'jti ' + jti,
            'Content-Length': data.length,
            'Drift-Api-Key': process.env.kards_drift_api_key
        }, path, data).then((result) => {
            return deferred.resolve(result);
        }).catch((e) => {
            return deferred.reject(e);
        });
    }).catch((e) => {
        return deferred.reject(e);
    });
    return deferred.promise;
}
exports.authenticatedPost = authenticatedPost;
async function publicGet(path) {
    const deferred = q_1.default.defer();
    kardsRequest('GET', { 'Drift-Api-Key': process.env.kards_drift_api_key }, path).then((result) => {
        return deferred.resolve(result);
    }).catch((e) => {
        return deferred.reject(e);
    });
    return deferred.promise;
}
exports.publicGet = publicGet;
async function publicPost(path, data) {
    const deferred = q_1.default.defer();
    kardsDataRequest('POST', {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
        'Drift-Api-Key': process.env.kards_drift_api_key
    }, path, data).then((result) => {
        return deferred.resolve(result);
    }).catch((e) => {
        return deferred.reject(e);
    });
    return deferred.promise;
}
exports.publicPost = publicPost;
function getPath(endpoint) {
    if (endpoint.startsWith('https://')) {
        endpoint = endpoint.split('https://')[1];
    }
    if (endpoint.startsWith(process.env.kards_hostname ?? 'kards.live.1939api.com')) {
        endpoint = endpoint.split(process.env.kards_hostname ?? 'kards.live.1939api.com')[1];
    }
    return endpoint;
}
exports.getPath = getPath;
async function kardsRequest(method, headers, path) {
    logger.silly('kardsRequest');
    const deferred = q_1.default.defer();
    var options = {
        host: process.env.kards_hostname,
        path: path,
        port: 443,
        method: method,
        headers: headers,
        rejectUnauthorized: false
    };
    follow_redirects_1.https.request(options, (res) => {
        var body = '';
        res.on('data', (d) => {
            body += d;
        });
        res.on('end', () => {
            logger.silly('request end');
            try {
                var json = JSON.parse(body);
                if (kards_api_error_1.default.isKardsError(json)) {
                    logger.silly('isKardsError');
                    return deferred.reject(new kards_api_error_1.default(json));
                }
                else {
                    logger.silly('isJsonResult');
                    return deferred.resolve(json);
                }
            }
            catch {
                logger.silly('isTextResult');
                return deferred.resolve(body);
            }
        });
    }).on('error', (e) => {
        return deferred.reject(e);
    }).end();
    return deferred.promise;
}
exports.kardsRequest = kardsRequest;
async function kardsDataRequest(method, headers, path, data) {
    logger.silly('kardsRequest');
    const deferred = q_1.default.defer();
    var options = {
        host: process.env.kards_hostname,
        path: path,
        port: 443,
        method: method,
        headers: headers,
        rejectUnauthorized: false
    };
    const req = follow_redirects_1.https.request(options, (res) => {
        var body = '';
        res.on('data', (d) => {
            body += d;
        });
        res.on('end', () => {
            logger.silly('request end');
            try {
                var json = JSON.parse(body);
                if (kards_api_error_1.default.isKardsError(json)) {
                    logger.silly('isKardsError');
                    return deferred.reject(new kards_api_error_1.default(json));
                }
                else {
                    logger.silly('isJsonResult');
                    return deferred.resolve(json);
                }
            }
            catch {
                logger.silly('isTextResult');
                return deferred.resolve(body);
            }
        });
    });
    req.on('error', (e) => {
        return deferred.reject(e);
    });
    req.write(data);
    req.end();
    return deferred.promise;
}
