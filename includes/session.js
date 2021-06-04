const log4js = require('log4js');
const logger = log4js.getLogger('session');
logger.level = process.env.log_level || 'error';

const SteamUser = require('steam-user');
const https = require('https');
const Q = require('q');

const { getKardsSessionEndpoint } = require('./public-endpoints');
const { KardsApiError } = require('./kards-api-error');

const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

var steamTicket = '';
var steamId = '';

var session = {};

function getJti() {
    const deferred = Q.defer();
    getSession().then((session) => {
        deferred.resolve(session.jti)
    }).catch((e) => {
        logger.error(e);
        deferred.reject(e);
    });
    return deferred.promise;
}

function getSession(tryNum = 0) {
    logger.trace('getSession');
    const deferred = Q.defer();
    if (tryNum > 3) {
        return new Promise((resolve, reject) => {
            reject({ error: 'max retries' })
        })
    }
    needsNewSession().then((newSessionNeeded) => {
        if (newSessionNeeded) {
            logger.trace('new session needed');
            if (steamTicket == '' || steamId == '') {
                logger.trace('steam values empty');
                refreshSteam().then(() => {
                    getSession(tryNum + 1).then((session) => {
                        deferred.resolve(session);
                    }).catch((e) => {
                        deferred.reject(e);
                    });
                }).catch((e) => {
                    deferred.reject(e);
                });
            } else {
                logger.trace('has steam values');
                getKardsSessionEndpoint().then((endpoint) => {
                    logger.trace('endpoint: ' + endpoint);
                    var postData = JSON.stringify({
                        "provider":"steam",
                        "provider_details": {
                            "steam_id": steamId,
                            "ticket": steamTicket,
                            "appid": process.env.kards_app_id
                        },
                        "client_type":"UE4",
                        "build":"Kards 1.1.4233",
                        "platform_type":"",
                        "app_guid":"Kards",
                        "version":"?",
                        "platform_info": "",
                        "platform_version":"",
                        "automatic_account_creation":true,
                        "username": "steam:" + steamId,
                        "password": "steam:" + steamId
                    })
                    var options = {
                        port: 443,
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Content-Length': postData.length,
                            'Drift-Api-Key': process.env.kards_drift_api_key,
                        },
                        rejectUnauthorized: false
                    };
                    var req = https.request(endpoint, options, (res) => {
                        var body = '';
                        res.on('data', (d) => {
                            body += d;
                        });
                
                        res.on('end', () => {
                            try {
                                var json = JSON.parse(body);
                                if (json.status_code == 401) {
                                    refreshSteam().then(() => {
                                        getSession(tryNum + 1).then((session) => {
                                            deferred.resolve(session);
                                        }).catch((e) => {
                                            deferred.reject(e);
                                        });
                                    }).catch((e) => {
                                        deferred.reject(e);
                                    });
                                } else if (KardsApiError.isKardsError(json)) {
                                    deferred.reject(new KardsApiError(json));
                                } else {
                                    deferred.resolve(json);
                                }
                            } catch {
                                deferred.reject(new Error('Unknown return result'));
                            }
                        });
                    });
                    req.on('error', (e) => {
                        steamTicket = '';
                        steamId = '';
                        session = {};
                        deferred.reject(e);
                    });
                    req.write(postData);
                    req.end();
                }).catch((e) => {
                    deferred.reject(e);
                });
            }
        } else {
            logger.trace('already have session');
            deferred.resolve(session);
        }
    }).catch((e) => {
        deferred.reject(e);
    });
    logger.trace('target');
    return deferred.promise;
}

function needsNewSession() {
    logger.trace('needsNewSession');
    const deferred = Q.defer();
    if (session.hasOwnProperty('last_heartbeat')) {
        logger.trace('has last_heartbeat');
        var lastHeartbeat = new Date(Date.parse(session.last_heartbeat));
        if (lastHeartbeat.getTime() + (1000 * 30) > Date.now()) {
            logger.trace('less than 30 seconds');
            // less than 30 seconds since heartbeat
            deferred.resolve(false);
        } else {
            logger.trace('try heartbeat again');
            var options = {
                port: 443,
                method: 'PUT',
                headers: {
                    'Authorization': 'jti ' + session.jti,
                    'Drift-Api-Key': process.env.kards_drift_api_key,
                },
                rejectUnauthorized: false
            };
            var req = https.request(session.heartbeat_url, options, (res) => {
                var body = '';
                res.on('data', (d) => {
                    body += d;
                });
        
                res.on('end', () => {
                    logger.trace('heartbeat end, result follows');
                    logger.trace(body);
                    try {
                        var json = JSON.parse(body);
                        deferred.resolve(KardsApiError.isKardsError(json));
                    } catch {
                        deferred.resolve(body != 'OK');
                    }
                });
            });
            req.on('error', (e) => {
                steamTicket = '';
                deferred.reject(e);
            });
            req.end();
        }
    } else {
        logger.trace('no last_heartbeat');
        deferred.resolve(true);
    }
    return deferred.promise;
}

function refreshSteam() {
    logger.trace('refreshSteam');
    const deferred = Q.defer();
    var steam = new SteamUser();

    steam.on('steamGuard', function(domain, callback, lastCodeWrong) {
        logger.trace('steamGuard');
        if (lastCodeWrong) {
            console.log('Last code entered wasnt accepted');
        }
        var question = 'Please enter 2FA code from steam app: '
        if (domain) {
            question = 'Please enter email code sent to x@' + domain + ': ';
        }
        rl.question(question, function(code) {
            return callback(code);
        });
    });

    logger.trace(process.env.steam_username);
    logger.trace(process.env.steam_password);
    steam.logOn({
        accountName: process.env.steam_username,
        password: process.env.steam_password
    });

    steam.on('loggedOn', function(details, parental) {
        logger.trace('loggedOn');
        logger.debug(details);
        steamId = details.client_supplied_steamid;
        /*
        steam.gamesPlayed({
            game_id: 544810,
            game_extra_info: 'Kards Virtual'
        });
        */
        steam.getAuthSessionTicket(process.env.kards_app_id, function(err, ticket) {
            logger.trace('getAuthSessionTicket');
            if (err) {
                deferred.reject(err);
            } else {
                steamTicket = ticket.toString('hex');
                logger.debug(steamTicket);
                deferred.resolve(steamTicket);
            }
        });
    });

    steam.on('error', function(error) {
        deferred.reject(error);
    });
    return deferred.promise;
}

module.exports = {
	getJti
};