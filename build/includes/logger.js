"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrentLogger = exports.getLogger = void 0;
const logger = __importStar(require("winston"));
require("winston-daily-rotate-file");
const cluster_1 = require("cluster");
const underscore_1 = __importDefault(require("underscore"));
const triple_beam_1 = require("triple-beam");
const SPLAT_STRING = triple_beam_1.SPLAT;
const loggers = new Map();
function formatObject(param) {
    if (underscore_1.default.isObject(param)) {
        return JSON.stringify(param);
    }
    return param;
}
const all = logger.format((info) => {
    if (info instanceof Error) {
        return Object.assign({
            message: info.message,
            stack: info.stack
        }, info);
    }
    const splat = info[SPLAT_STRING] ?? [];
    const message = formatObject(info.message);
    const rest = splat.map(formatObject).join(' ');
    info.message = `${message} ${rest}`;
    return info;
});
function getConfig(label) {
    return {
        levels: {
            error: 1,
            warn: 2,
            info: 3,
            debug: 4,
            silly: 5
        },
        format: logger.format.combine(all(), logger.format.json()),
        transports: [
            new logger.transports.Console({
                level: process.env.console_level ?? process.env.log_level ?? 'error',
                format: logger.format.combine(logger.format.colorize(), logger.format.timestamp({ format: 'DD-MM-YYYY HH:mm:ss' }), logger.format.label({ label: label }), logger.format.errors({ stack: true }), logger.format.printf((msg) => {
                    const msgTyped = msg;
                    return `[${msgTyped.timestamp}][${msgTyped.label}][${msgTyped.level}]: ${msgTyped.message}`;
                }))
            }),
            new logger.transports.DailyRotateFile({
                level: process.env.log_level ?? 'info',
                filename: [process.cwd(), 'logs/console.rotating.log'].join('/'),
                datePattern: 'YYYY-MM-DD',
                maxSize: '20m',
                maxFiles: '14d',
                format: logger.format.combine(logger.format.timestamp({ format: 'DD-MM-YYYY HH:mm:ss' }), logger.format.label({ label: label }), logger.format.errors({ stack: true }), logger.format.printf((msg) => {
                    const msgTyped = msg;
                    return `[${msgTyped.timestamp}][${msgTyped.label}][${msgTyped.level}]: ${msgTyped.message}`;
                }))
            })
        ]
    };
}
function getLogger(fork, name) {
    const builtName = `${fork} - ${name}`;
    if (loggers.has(builtName)) {
        return loggers.get(builtName);
    }
    const result = logger.createLogger(getConfig(builtName));
    loggers.set(builtName, result);
    return result;
}
exports.getLogger = getLogger;
function getCurrentLogger(name) {
    let fork = process.env.name;
    if (fork === undefined && !cluster_1.isMaster) {
        fork = `Fork ${process.env.FORK_ID ?? ''}`;
    }
    if (fork === undefined) {
        fork = 'master';
    }
    const logger = getLogger(fork, name);
    if (logger === null) {
        throw new Error('No Logger available');
    }
    return logger;
}
exports.getCurrentLogger = getCurrentLogger;
