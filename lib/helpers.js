var path = require('path');
var minimatch = require('minimatch');


/**
 * Function which normalizes a component name
 * 
 * @param {String} componentName
 * @returns {String}
 */
exports.normalizeComponentName = function (componentName) {
	return componentName.replace(/\//, '-');
};


/**
 * Checks whether a given file matches any pattern in a given list of filename patterns
 *
 * @param {String} path - a path to a file
 * @param {Array} pathPatterns - a list of filename patterns
 * @return {Boolean} True if given path matches a pattern in pathPatterns, False otherwise.
 */
exports.pathMatchPatterns = function (absolutePath, pathPatterns) {
	for (var i = 0; i < pathPatterns.length; i += 1) {
		var pathPattern = path.resolve(pathPatterns[i]);

		// Check if is a matching minimatch pattern
		if (minimatch(absolutePath, pathPattern)) {
			return true;
		}

		// Check if starts with pathPattern literal
		if (absolutePath.indexOf(pathPattern) === 0) {
			return true;
		}
	}

	return false;
};


/**
 * Function which strips comments from input string
 * 
 * @param {type} string
 * @returns {undefined}
 */
exports.stripComments = function (string) {
	var strippedString = '';
	var insideString = false;
	var insideComment = false;

	for (var i = 0; i < string.length; i += 1) {
		var curr = string[i];
		var prev = string[i - 1] || null;
		var next = string[i + 1] || null;


		// Check if we are changing insideString state
		if (!insideComment && prev !== '\\') {
			if (curr === insideString) {
				insideString = false;
			} else if (curr === '\'') {
				insideString = '\'';
			} else if (curr === '"') {
				insideString = '"';
			}
		}

		if (insideString) {
			strippedString += curr;
			continue;
		}


		// Check if we are inside a comment
		if (!insideComment) {
			if (curr + next === '//') {
				insideComment = 'single';
				i++;
				continue;
			} else if (curr + next === '/*') {
				insideComment = 'multi';
				i++;
				continue;
			}
		} else {
			if (insideComment === 'single' && curr + next === '\r\n') {
				insideComment = false;
				i++;
			} else if (insideComment === 'single' && curr === '\n') {
				insideComment = false;
			} else if (insideComment === 'multi' && curr + next === '*/') {
				insideComment = false;
				i++;
				continue;
			}
		}

		if (insideComment) {
			continue;
		}


		// Otherwise concat
		strippedString += curr;
	}

	return strippedString;
}