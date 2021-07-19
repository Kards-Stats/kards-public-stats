"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = require("./logger");
const q_1 = __importDefault(require("q"));
const kards_request_1 = require("./kards-request");
const underscore_1 = __importDefault(require("underscore"));
const logger = logger_1.getCurrentLogger('includes-endpoints');
var endpoints;
async function refreshAuthEndpoints(session) {
    logger.silly('refreshAuthEndpoints');
    const deferred = q_1.default.defer();
    kards_request_1.authenticatedRequest('GET', '/', session).then((result) => {
        if (typeof result === 'object' && underscore_1.default.has(result, 'endpoints')) {
            endpoints = result.endpoints;
            deferred.resolve(endpoints);
        }
        else {
            deferred.reject(new Error('Unknown return result'));
        }
    }).catch((e) => {
        deferred.reject(e);
    });
    return deferred.promise;
}
async function getAllEndpoints(session) {
    logger.silly('getAllEndpoints');
    const deferred = q_1.default.defer();
    if (endpoints !== undefined && Object.hasOwnProperty.call(endpoints, 'my_client') && endpoints.my_client != null && endpoints.my_client !== '') {
        logger.silly('endpoints exists');
        return await new Promise((resolve, reject) => {
            if (endpoints !== undefined) {
                return resolve(endpoints);
            }
            return reject(new Error('Session invalidated after check'));
        });
    }
    else {
        refreshAuthEndpoints(session).then((returnedEndpoints) => {
            if (returnedEndpoints === undefined) {
                if (endpoints !== undefined && Object.hasOwnProperty.call(endpoints, 'my_client') && endpoints.my_client != null && endpoints.my_client !== '') {
                    return deferred.resolve(endpoints);
                }
            }
            else if (Object.hasOwnProperty.call(returnedEndpoints, 'my_client') && returnedEndpoints.my_client != null && returnedEndpoints.my_client !== '') {
                return deferred.resolve(returnedEndpoints);
            }
            return deferred.reject(new Error('No endpoints found'));
        }).catch((e) => {
            return deferred.reject(e);
        });
    }
    return deferred.promise;
}
exports.default = getAllEndpoints;
