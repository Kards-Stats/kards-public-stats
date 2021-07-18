import 'cross-fetch/polyfill';
import { ApolloClient, gql } from '@apollo/client/core';
import { InMemoryCache, NormalizedCacheObject } from '@apollo/client/cache';
import { DefaultOptions } from '@apollo/client';
import { getCurrentLogger } from './logger';
import Q from 'q';
import { Card as CardType, Cards as CardsType } from './types';
import winston from 'winston';
import Keyv from 'keyv';

const logger: winston.Logger = getCurrentLogger('includes-card');

const oneDay: number = 24 * 60 * 60 * 60 * 1000;

let uri = process.env.graphql_uri;
if (uri == undefined) {
    if (process.env.NODE_ENV == 'production') {
        uri = 'https://kards-dt-backend.herokuapp.com/';
    } else {
        uri = 'https://localhost:3101/graphql';
    }
}


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

export class Cards {

    keyv: Keyv;
    client: ApolloClient<NormalizedCacheObject>;
    version: number;

    constructor(version: number) {
        logger.info(`Generating for ${version}`);
        this.keyv = new Keyv({ namespace: version.toString() });
        this.keyv.on('error', err => logger.error('Connection Error for Keyv on: ' + version, err));
        this.version = version;
        this.client = new ApolloClient({
            uri: uri,
            cache: new InMemoryCache(),
            defaultOptions: defaultOptions
        });
    }

    getCard(gameID: string): Promise<CardType | undefined> {
        const deferred = Q.defer();
        this.getCards().then((cards) => {
            if (cards != undefined) {
                if (gameID.endsWith('_cam1')) {
                    gameID = gameID.split('_cam1')[0];
                    logger.info(`Found card with _cam1, new name ${gameID}`)
                }
                for (var key in cards.cards) {
                    if (cards.cards[key].game_id == gameID)
                        return deferred.resolve(cards.cards[key]);
                }
            }
            return deferred.resolve(undefined);
        }).catch((e) => {
            logger.error(e);
            return deferred.reject(e);
        });
        return <Promise<CardType | undefined>><any>deferred.promise;
    }

    getCards(): Promise<CardsType | undefined> {
        const deferred = Q.defer();
        this.keyv.get(`card_list_${this.version}`).then((cards) => {
            if (cards == undefined) {
                logger.silly('no cards');
                this.client.query({
                    query: gql`
                        query ($version: Int!) {
                            allCards(version: $version) {
                                ... on CardList {
                                    cards {
                                        card_id
                                        game_id
                                        version
                                        set
                                        type
                                        attack
                                        defense
                                        rarity
                                        faction
                                        kredits
                                        import_id
                                        attributes
                                        operation_cost
                                    }
                                }
                                ... on Error {
                                    code
                                    error
                                }
                            }
                        }
                    `,
                    variables: {
                        version: this.version
                    }
                }).then((result) => {
                    logger.silly(result);
                    if (result.error || result.errors) {
                        // There was an error
                        logger.error(result.error || result.errors);
                        return deferred.reject(result.error || result.errors);
                    } else if (result.data.allCards.cards == undefined || result.data.allCards.cards.length < 1) {
                        // Cards list empty, maybe wrong version
                        logger.warn(`No cards found for version ${this.version}`);
                        return deferred.resolve(undefined);
                    } else {
                        // Cards are ready to be inserted
                        const data: CardsType = {
                            count: result.data.allCards.cards.length,
                            cards: result.data.allCards.cards
                        }
                        this.keyv.set(`card_list_${this.version}`, data, oneDay).then(() => {
                            return deferred.resolve(data);
                        }).catch((e) => {
                            return deferred.reject(e);
                        });
                    }
                }).catch((e) => {
                    logger.error(e);
                    return deferred.reject(e);
                });
            } else {
                return deferred.resolve(cards);
            }
        }).catch((e) => {
            return deferred.reject(e);
        });
        return <Promise<CardsType | undefined>><any>deferred.promise;
    }

}
