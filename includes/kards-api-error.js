const log4js = require('log4js');
const logger = log4js.getLogger('kards-api-error');
logger.level = process.env.log_level || 'error';

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
        /*
        {
            "error": {
                "code": "user_error",
                "description": "Invalid JTI. Token FreydDogypoo3hsCckHN3 does not exist."
            },
            "message": "Unauthorized",
            "status_code": 401
        }
        */
        try {
            const rootKeys = ['error', 'message', 'status_code'];
            var valid = rootKeys.every(key => Object.keys(object).includes(key));
            if (valid) {
                const subKeys = ['code', 'description'];
                return subKeys.every(key => Object.keys(object.error).includes(key));
            }
        } catch (e) {
            logger.error(e);
        }
        return false;
    }
}

module.exports = {
    KardsApiError: KardsApiError
};