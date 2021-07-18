import winston from 'winston';
import { getCurrentLogger } from './logger';

const logger: winston.Logger = getCurrentLogger('includes-kards-api-error');

export interface KardsApiErrorJson {
    status_code: number,
    message: string,
    error: {
        code: string,
        description: string
    }
}

export default class KardsApiError extends Error {

    status_code: number;
    http_message: string;
    code: string;

    constructor(object: KardsApiErrorJson) {
        super(object.error.description);
        this.name = this.constructor.name;
        this.status_code = object.status_code;
        this.http_message = object.message;
        this.code = object.error.code;
        Error.captureStackTrace(this, this.constructor);
    }

    static isKardsError(object: any): boolean {
        /*
        {
            "error": {
                "code": "user_error",
                "description": "Invalid JTI. Token FfeydDogkuhy3hsCckHN3 does not exist."
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
