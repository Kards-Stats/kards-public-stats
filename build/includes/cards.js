"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Cards = void 0;
require("cross-fetch/polyfill");
const core_1 = require("@apollo/client/core");
const cache_1 = require("@apollo/client/cache");
const logger_1 = require("./logger");
const q_1 = __importDefault(require("q"));
const keyv_1 = __importDefault(require("keyv"));
const logger = logger_1.getCurrentLogger('includes-card');
const oneDay = 24 * 60 * 60 * 60 * 1000;
let uri = process.env.graphql_uri;
if (uri === undefined) {
    if (process.env.NODE_ENV === 'production') {
        uri = 'https://kards-dt-backend.herokuapp.com/';
    }
    else {
        uri = 'https://localhost:3101/graphql';
    }
}
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
class Cards {
    constructor(version) {
        logger.info(`Generating for ${version}`);
        this.keyv = new keyv_1.default({ namespace: version.toString() });
        this.keyv.on('error', err => logger.error(`Connection Error for Keyv on: ${version}`, err));
        this.version = version;
        this.client = new core_1.ApolloClient({
            uri: uri,
            cache: new cache_1.InMemoryCache(),
            defaultOptions: defaultOptions
        });
    }
    async getCard(gameID) {
        const deferred = q_1.default.defer();
        this.getCards().then((cards) => {
            if (cards !== undefined) {
                if (gameID.endsWith('_cam1')) {
                    gameID = gameID.split('_cam1')[0];
                    logger.info(`Found card with _cam1, new name ${gameID}`);
                }
                for (var card of cards.cards) {
                    if (card.game_id === gameID) {
                        return deferred.resolve(card);
                    }
                }
            }
            return deferred.resolve(undefined);
        }).catch((e) => {
            logger.error(e);
            return deferred.reject(e);
        });
        return deferred.promise;
    }
    async getCards() {
        const deferred = q_1.default.defer();
        this.keyv.get(`card_list_${this.version}`).then((cards) => {
            if (cards === undefined) {
                logger.silly('no cards');
                this.client.query({
                    query: core_1.gql `
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
                    if ((result.error != null) || (result.errors != null)) {
                        logger.error((result.error != null) || result.errors);
                        return deferred.reject((result.error != null) || result.errors);
                    }
                    else if (result.data.allCards.cards === undefined || result.data.allCards.cards.length < 1) {
                        logger.warn(`No cards found for version ${this.version}`);
                        return deferred.resolve(undefined);
                    }
                    else {
                        const data = {
                            count: result.data.allCards.cards.length,
                            cards: result.data.allCards.cards
                        };
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
            }
            else {
                return deferred.resolve(cards);
            }
        }).catch((e) => {
            return deferred.reject(e);
        });
        return deferred.promise;
    }
}
exports.Cards = Cards;
