import 'cross-fetch/polyfill';
import { ApolloClient, gql } from '@apollo/client/core';
import { InMemoryCache, NormalizedCacheObject } from '@apollo/client/cache';
import { DefaultOptions } from '@apollo/client';
import { getCurrentLogger } from './logger';
import Q from 'q';
import winston from 'winston';
import Keyv from 'keyv';

const logger: winston.Logger = getCurrentLogger('includes-version');

const oneDay: number = 24 * 60 * 60 * 60 * 1000;

let uri = process.env.kards_graphql_uri || 'https://api.kards.com/graphql';

const defaultOptions: DefaultOptions = {
    watchQuery: {
        fetchPolicy: 'no-cache',
        errorPolicy: 'ignore'
    },
    query: {
        fetchPolicy: 'no-cache',
        errorPolicy: 'all'
    }
}

export class Version {

    keyv: Keyv;
    client: ApolloClient<NormalizedCacheObject>;

    constructor() {
        logger.info(`Generating version`);
        this.keyv = new Keyv();
        this.keyv.on('error', err => logger.error('Connection Error for Keyv on version', err));
        this.client = new ApolloClient({
            uri: uri,
            cache: new InMemoryCache(),
            defaultOptions: defaultOptions
        });
    }

    getVersion(): Promise<number | undefined> {
        const deferred = Q.defer();
        this.keyv.get(`kards_version`).then((version) => {
            if (version == undefined) {
                logger.silly('no version');
                this.client.query({
                    query: gql`
                        query {
                            currentGameVersion {
                                id
                            }
                        }
                    `
                }).then((result) => {
                    logger.debug(result);
                    if (result.error || result.errors || result.data.error) {
                        logger.error(result.error || result.errors || result.data.error);
                        return deferred.reject(result.error || result.errors || result.data.error);
                    } else if (result.data.currentGameVersion == undefined || result.data.currentGameVersion.id == undefined) {
                        logger.warn(`No kards version found`);
                        return deferred.resolve(undefined);
                    } else {
                        this.keyv.set(`kards_version`, result.data.currentGameVersion.id, oneDay).then(() => {
                            return deferred.resolve(result.data.currentGameVersion.id);
                        }).catch((e) => {
                            return deferred.reject(e);
                        });
                    }
                }).catch((e) => {
                    logger.error(e);
                    return deferred.reject(e);
                });
            } else {
                return deferred.resolve(version);
            }
        }).catch((e) => {
            return deferred.reject(e);
        });
        return <Promise<number | undefined>><any>deferred.promise;
    }

}
