import { getCurrentLogger } from './logger';
import * as origHttps from 'https';
import { https } from 'follow-redirects';
import Q from 'q';
import winston from 'winston';
import { Session } from './session';
import KardsApiError from './kards-api-error';
import { Keyable } from './types';
import { OutgoingHttpHeaders } from 'http';

const logger: winston.Logger = getCurrentLogger('includes-kards-request');

export function authenticatedRequest(method: string, path: string, session: Session): Promise<Keyable | string> {
    logger.silly('authenticatedGet');
    const deferred = Q.defer();
    session.getJti().then((jti) => {
        logger.silly('gotJti');
        logger.debug(jti);
        logger.debug(path);
        kardsRequest(method, {
            'Authorization': 'jti ' + jti,
            'Drift-Api-Key': process.env.kards_drift_api_key,
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
    return <Promise<Keyable | string>><any>deferred.promise;
}

export function authenticatedPost(path: string, data: string, session: Session): Promise<Keyable | string> {
    logger.silly('authenticatedGet');
    const deferred = Q.defer();
    session.getJti().then((jti) => {
        logger.silly('gotJti');
        logger.debug(jti);
        logger.debug(path);
        kardsDataRequest('POST', {
            'Content-Type': 'application/json',
            'Authorization': 'jti ' + jti,
            'Content-Length': data.length,
            'Drift-Api-Key': process.env.kards_drift_api_key,
        }, path, data).then((result) => {
            return deferred.resolve(result);
        }).catch((e) => {
            return deferred.reject(e);
        });
    }).catch((e) => {
        return deferred.reject(e);
    });
    return <Promise<Keyable | string>><any>deferred.promise;
}

export function publicGet(path: string): Promise<Keyable | string> {
    const deferred = Q.defer();
    kardsRequest('GET', { 'Drift-Api-Key': process.env.kards_drift_api_key }, path).then((result) => {
        return deferred.resolve(result);
    }).catch((e) => {
        return deferred.reject(e);
    });
    return <Promise<Keyable | string>><any>deferred.promise;
}

export function publicPost(path: string, data: string): Promise<Keyable | string> {
    const deferred = Q.defer();
    kardsDataRequest('POST', {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
        'Drift-Api-Key': process.env.kards_drift_api_key,
    }, path, data).then((result) => {
        return deferred.resolve(result);
    }).catch((e) => {
        return deferred.reject(e);
    });
    return <Promise<Keyable | string>><any>deferred.promise;
}

export function getPath(endpoint: string): string {
    if (endpoint.startsWith('https://'))
        endpoint = endpoint.split('https://')[1];
    if (endpoint.startsWith(process.env.kards_hostname || 'kards.live.1939api.com'))
        endpoint = endpoint.split(process.env.kards_hostname || 'kards.live.1939api.com')[1];
    return endpoint;
}

export function kardsRequest(method: string, headers: OutgoingHttpHeaders, path: string): Promise<Keyable | string> {
    logger.silly('kardsRequest');
    const deferred = Q.defer();
    var options: origHttps.RequestOptions = {
        host: process.env.kards_hostname,
        path: path,
        port: 443,
        method: method,
        headers: headers,
        rejectUnauthorized: false
    };
    https.request(options, (res) => {
        var body = '';
        res.on('data', (d) => {
            body += d;
        });

        res.on('end', () => {
            logger.silly('request end');
            try {
                var json = JSON.parse(body);
                if (KardsApiError.isKardsError(json)) {
                    logger.silly('isKardsError');
                    return deferred.reject(new KardsApiError(json));
                } else {
                    logger.silly('isJsonResult');
                    return deferred.resolve(json);
                }
            } catch {
                logger.silly('isTextResult');
                return deferred.resolve(body);
            }
        });
    }).on('error', (e) => {
        return deferred.reject(e);
    }).end();
    return <Promise<Keyable | string>><any>deferred.promise;
}

function kardsDataRequest(method: string, headers: OutgoingHttpHeaders, path: string, data: string): Promise<Keyable | string> {
    logger.silly('kardsRequest');
    const deferred = Q.defer();
    var options: origHttps.RequestOptions = {
        host: process.env.kards_hostname,
        path: path,
        port: 443,
        method: method,
        headers: headers,
        rejectUnauthorized: false
    };
    const req = https.request(options, (res) => {
        var body = '';
        res.on('data', (d) => {
            body += d;
        });

        res.on('end', () => {
            logger.silly('request end');
            try {
                var json = JSON.parse(body);
                if (KardsApiError.isKardsError(json)) {
                    logger.silly('isKardsError');
                    return deferred.reject(new KardsApiError(json));
                } else {
                    logger.silly('isJsonResult');
                    return deferred.resolve(json);
                }
            } catch {
                logger.silly('isTextResult');
                return deferred.resolve(body);
            }
        });
    })
    req.on('error', (e) => {
        return deferred.reject(e);
    });
    req.write(data);
    req.end();
    return <Promise<Keyable | string>><any>deferred.promise;
}
