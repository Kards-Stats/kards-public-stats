"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Session = void 0;
const logger_1 = require("./logger");
const q_1 = __importDefault(require("q"));
const kards_api_error_1 = __importDefault(require("./kards-api-error"));
const public_endpoints_1 = require("./public-endpoints");
const crypto_1 = __importDefault(require("crypto"));
const kards_request_1 = require("./kards-request");
const steam_user_1 = require("../models/steam-user");
const toad_scheduler_1 = require("toad-scheduler");
const underscore_1 = __importDefault(require("underscore"));
const SteamUser = require("steam-user");
const logger = logger_1.getCurrentLogger('includes-session');
const tenMinutes = 10 * 60 * 60 * 1000;
function randU32Sync() {
    return crypto_1.default.randomBytes(4).readUInt32BE(0);
}
class Session {
    constructor(type) {
        logger.info(`Generating session for ${type}`);
        this.scheduler = new toad_scheduler_1.ToadScheduler();
        this.heartbeatTask = undefined;
        this.heartbeatJob = undefined;
        this.session = undefined;
        this.type = type;
    }
    stopHeartbeat() {
        if (this.heartbeatJob !== undefined) {
            this.heartbeatJob.stop();
            this.heartbeatJob = undefined;
        }
        if (this.heartbeatTask !== undefined) {
            this.heartbeatTask = undefined;
        }
    }
    startHeartbeat() {
        this.stopHeartbeat();
        if (this.session === undefined) {
            return false;
        }
        this.heartbeatTask = new toad_scheduler_1.AsyncTask(`Heartbeat for ${this.session.player_id}`, async () => {
            const deferred = q_1.default.defer();
            if (this.session !== undefined) {
                kards_request_1.kardsRequest('PUT', {
                    'Content-Length': '0',
                    Authorization: 'JWT ' + this.session.jwt,
                    'Drift-Api-Key': process.env.kards_drift_api_key
                }, `/players/${this.session.player_id}/heartbeat`).then((result) => {
                    if (underscore_1.default.isObject(result) && Object.hasOwnProperty.call(result, 'last_heartbeat')) {
                        if (this.session !== undefined) {
                            this.session.last_heartbeat = result.last_heartbeat;
                            return deferred.resolve();
                        }
                        else {
                            logger.error('No session after result');
                            this.scheduler.stop();
                            return deferred.reject('No session after result');
                        }
                    }
                    else {
                        logger.error('No heartbeat result');
                        this.scheduler.stop();
                        return deferred.reject('No heartbeat result');
                    }
                }).catch((e) => {
                    logger.error(e);
                    if (e.status_code === 401) {
                        this.session = undefined;
                    }
                    this.scheduler.stop();
                    return deferred.reject(e);
                });
            }
            else {
                this.scheduler.stop();
                return Promise.resolve();
            }
            return deferred.promise;
        }, (e) => {
            logger.error(e);
        });
        this.heartbeatJob = new toad_scheduler_1.SimpleIntervalJob({ seconds: 30 }, this.heartbeatTask);
        this.scheduler.addSimpleIntervalJob(this.heartbeatJob);
        return true;
    }
    async getJti() {
        const deferred = q_1.default.defer();
        this.getSession().then((session) => {
            return deferred.resolve(session.jti);
        }).catch((e) => {
            logger.error(e);
            return deferred.reject(e);
        });
        return deferred.promise;
    }
    async getPlayerID() {
        const deferred = q_1.default.defer();
        this.getSession().then((session) => {
            return deferred.resolve(session.player_id);
        }).catch((e) => {
            logger.error(e);
            return deferred.reject(e);
        });
        return deferred.promise;
    }
    async getSession(tryNum = 0, username = 'oldest') {
        logger.silly('getSession');
        const deferred = q_1.default.defer();
        if (tryNum > 3) {
            return await Promise.reject(new Error('max retries'));
        }
        if (this.needsNewSession()) {
            logger.silly('new session needed');
            var promise;
            if (username === 'oldest') {
                promise = steam_user_1.SteamUserFunctions.getOldest(this.type);
            }
            else {
                promise = steam_user_1.SteamUserFunctions.getUser(username);
            }
            promise.then((steamUser) => {
                if (steamUser === null) {
                    return deferred.reject(new Error('No more steam accounts to use'));
                }
                if (steamUser.ticket === undefined || steamUser.steam_id === undefined) {
                    logger.silly('steam values empty');
                    this.refreshSteam(steamUser.username).then(() => {
                        this.getSession(tryNum + 1, steamUser.username).then((session) => {
                            return deferred.resolve(session);
                        }).catch((e) => {
                            return deferred.reject(e);
                        });
                    }).catch((e) => {
                        return deferred.reject(e);
                    });
                }
                else {
                    public_endpoints_1.getKardsSessionEndpoint().then((endpoint) => {
                        logger.silly('endpoint: ' + endpoint);
                        var postData = JSON.stringify({
                            provider: 'steam',
                            provider_details: {
                                steam_id: steamUser.steam_id,
                                ticket: steamUser.ticket,
                                appid: process.env.kards_app_id
                            },
                            client_type: 'UE4',
                            build: 'Kards 1.1.4233',
                            platform_type: '',
                            app_guid: 'Kards',
                            version: '?',
                            platform_info: '',
                            platform_version: '',
                            automatic_account_creation: true,
                            username: `steam:${steamUser.steam_id ?? ''}`,
                            password: `steam:${steamUser.steam_id ?? ''}`
                        });
                        kards_request_1.publicPost(kards_request_1.getPath(endpoint), postData).then((result) => {
                            steam_user_1.SteamUserFunctions.addKardsLogin(steamUser.username).then(() => {
                                if (underscore_1.default.isObject(result)) {
                                    this.session = result;
                                    this.startHeartbeat();
                                    return deferred.resolve(this.session);
                                }
                                return deferred.reject(new Error('Result isnt object'));
                            }).catch((e) => {
                                return deferred.reject(e);
                            });
                        }).catch((e) => {
                            console.log(e);
                            if (e instanceof kards_api_error_1.default && e.status_code === 401) {
                                var banned = false;
                                if (e.message.toLowerCase().includes('disabled')) {
                                    banned = true;
                                }
                                steam_user_1.SteamUserFunctions.setBanned(steamUser.username, banned).then(() => {
                                    this.getSession(tryNum + 1).then((session) => {
                                        return deferred.resolve(session);
                                    }).catch((e) => {
                                        return deferred.reject(e);
                                    });
                                }).catch((e) => {
                                    return deferred.reject(e);
                                });
                            }
                            else {
                                logger.silly('Kards session error');
                                return deferred.reject(e);
                            }
                        });
                    }).catch((e) => {
                        return deferred.reject(e);
                    });
                }
            }).catch((e) => {
                logger.error(e);
            });
        }
        else {
            logger.silly('already have session');
            return new Promise((resolve, reject) => {
                if (this.session === undefined) {
                    return reject(new Error('Session invalidated before it was returned'));
                }
                return resolve(this.session);
            });
        }
        return deferred.promise;
    }
    needsNewSession() {
        logger.silly('needsNewSession');
        if (this.session === undefined) {
            logger.silly('no session');
            return true;
        }
        else {
            if (Object.hasOwnProperty.call(this.session, 'last_heartbeat')) {
                logger.silly('has last_heartbeat');
                var lastHeartbeat = new Date(Date.parse(this.session.last_heartbeat));
                if (lastHeartbeat.getTime() + (1000 * 60) > Date.now()) {
                    logger.silly('less than 60 seconds');
                    return false;
                }
                else {
                    return true;
                }
            }
            else {
                logger.silly('no last_heartbeat');
                return true;
            }
        }
    }
    async refreshSteam(username) {
        logger.silly('refreshSteam');
        const deferred = q_1.default.defer();
        steam_user_1.SteamUserFunctions.getUser(username).then((steamUser) => {
            const timeSinceLogin = (new Date()).getTime() - steamUser.last_steam_login.getTime();
            if (timeSinceLogin <= tenMinutes) {
                return deferred.resolve('');
            }
            var steam = new SteamUser();
            steam.on('steamGuard', () => {
                logger.error(`Steam guard left on for user ${steamUser.username}`);
                return deferred.reject(`Steam guard left on for user ${steamUser.username}`);
            });
            logger.silly(steamUser.username);
            logger.silly(steamUser.password);
            steam.logOn({
                accountName: steamUser.username,
                password: steamUser.password,
                logonID: randU32Sync()
            });
            steam.on('loggedOn', (details) => {
                logger.silly('loggedOn');
                steam.getAuthSessionTicket(process.env.kards_app_id, (err, ticket) => {
                    logger.silly('getAuthSessionTicket');
                    if (err !== undefined && err !== null) {
                        return deferred.reject(err);
                    }
                    steam_user_1.SteamUserFunctions.addSteamLogin(steamUser.username, details.client_supplied_steamid, ticket.toString('hex'))
                        .then(() => {
                        return deferred.resolve(ticket.toString('hex'));
                    }).catch((e) => {
                        return deferred.reject(e);
                    });
                });
            });
            steam.on('error', function (error) {
                return deferred.reject(error);
            });
        }).catch((e) => {
            return deferred.reject(e);
        });
        return deferred.promise;
    }
}
exports.Session = Session;
