"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Version = void 0;
require("cross-fetch/polyfill");
const core_1 = require("@apollo/client/core");
const cache_1 = require("@apollo/client/cache");
const logger_1 = require("./logger");
const q_1 = __importDefault(require("q"));
const keyv_1 = __importDefault(require("keyv"));
const logger = logger_1.getCurrentLogger('includes-version');
const oneDay = 24 * 60 * 60 * 60 * 1000;
const uri = process.env.kards_graphql_uri ?? 'https://api.kards.com/graphql';
const defaultOptions = {
    watchQuery: {
        fetchPolicy: 'no-cache',
        errorPolicy: 'ignore'
    },
    query: {
        fetchPolicy: 'no-cache',
        errorPolicy: 'all'
    }
};
class Version {
    constructor() {
        logger.info('Generating version');
        this.keyv = new keyv_1.default();
        this.keyv.on('error', err => logger.error('Connection Error for Keyv on version', err));
        this.client = new core_1.ApolloClient({
            uri: uri,
            cache: new cache_1.InMemoryCache(),
            defaultOptions: defaultOptions
        });
    }
    async getVersion() {
        const deferred = q_1.default.defer();
        this.keyv.get('kards_version').then((version) => {
            if (version === undefined) {
                logger.silly('no version');
                this.client.query({
                    query: core_1.gql `
                        query {
                            currentGameVersion {
                                id
                            }
                        }
                    `
                }).then((result) => {
                    logger.debug(result);
                    if ((result.error != null) || (result.errors != null) || result.data.error !== undefined) {
                        logger.error((result.error != null) ?? result.errors ?? result.data.error);
                        return deferred.reject((result.error != null) ?? result.errors ?? result.data.error);
                    }
                    else if (result.data.currentGameVersion === undefined || result.data.currentGameVersion.id === undefined) {
                        logger.warn('No kards version found');
                        return deferred.resolve(undefined);
                    }
                    else {
                        this.keyv.set('kards_version', result.data.currentGameVersion.id, oneDay).then(() => {
                            return deferred.resolve(result.data.currentGameVersion.id);
                        }).catch((e) => {
                            return deferred.reject(e);
                        });
                    }
                }).catch((e) => {
                    logger.error(e);
                    return deferred.reject(e);
                });
            }
            else {
                return deferred.resolve(version);
            }
        }).catch((e) => {
            return deferred.reject(e);
        });
        return deferred.promise;
    }
}
exports.Version = Version;
