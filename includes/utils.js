const _ = require('underscore');
const log4js = require('log4js');
const logger = log4js.getLogger('admin');

logger.level = process.env.log_level || 'error';

/**
 * Sanitizes a JSON object to remove empty or null fields.
 * This does NOT deep check sub arrays or objects
 *
 * @returns {JSON} Sanitized JSON Object
 *
 * @param {JSON} jsonObject
 */
function sanitizeJSON(jsonObject) {
	if (_.isUndefined(jsonObject)
		|| _.isNull(jsonObject)
		|| _.isEmpty(jsonObject)) {
		return {};
	}
	for (var key in jsonObject) {
		var val = jsonObject[key];
		if (_.isBoolean(val)) {
			continue;
		}
		if (_.isUndefined(val)
			|| _.isNull(val)
			|| _.isEmpty(val)
			|| val === 0) {
			delete jsonObject[key];
		}
	}
	return jsonObject;
}

/**
 * Generates a Unique ID for use as a filename
 */
function generateString(format) {
	if (!_.isString(format)) {
		format = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx';
	}
	return format.replace(/[xy]/g, function (c) {
		var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
		return v.toString(16);
	});
}

function getPagination(page, size) {
	const limit = size ? +size : 15;
	const offset = page ? page * limit : 0;

	return { limit, offset };
}

function cloneObject(object) {
	var result = {};
	for (var key in object) {
		if (object[key] instanceof Array) {
			result[key] = cloneArray(object[key]);
		} else if (object[key] instanceof Object) {
			result[key] = cloneObject(object[key]);
		} else {
			result[key] = object[key];
		}
	}
	return result;
}

function cloneArray(array) {
	var result = [];
	array.forEach(function (item) {
		if (item instanceof Array) {
			result.push(cloneArray(item));
		} else if (item instanceof Object) {
			result.push(cloneObject(item));
		} else {
			result.push(item);
		}
	});
	return result;
}

module.exports = {
	generateString: generateString,
	getPagination: getPagination,
	sanitizeJSON: sanitizeJSON,
	cloneObject: cloneObject,
	cloneArray: cloneArray
};
