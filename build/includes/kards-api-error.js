"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = require("./logger");
const logger = logger_1.getCurrentLogger('includes-kards-api-error');
class KardsApiError extends Error {
    constructor(object) {
        super(object.error.description);
        this.name = this.constructor.name;
        this.status_code = object.status_code;
        this.http_message = object.message;
        this.code = object.error.code;
        Error.captureStackTrace(this, this.constructor);
    }
    static isKardsError(object) {
        try {
            const rootKeys = ['error', 'message', 'status_code'];
            var valid = rootKeys.every(key => Object.keys(object).includes(key));
            if (valid) {
                const subKeys = ['code', 'description'];
                return subKeys.every(key => Object.keys(object.error).includes(key));
            }
        }
        catch (e) {
            logger.error(e);
        }
        return false;
    }
}
exports.default = KardsApiError;
