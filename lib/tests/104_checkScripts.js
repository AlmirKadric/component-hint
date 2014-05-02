var path = require('path');
var helpers = require('../helpers.js');


// Regular expression which detects single quoted text
var singleQuotedText = '\'[^\'\\\\]*(?:\\\\.[^\'\\\\]*)*\'';

// Regular expression which detexts double quoted text
var doubleQuotedText = '"[^"\\\\]*(?:\\\\.[^"\\\\]*)*"';

// Regular expression which detects any kind of 'require()' statement usages
var requireAnyTextRegexStr = [ '[^)]*', singleQuotedText, doubleQuotedText ];
var requireRegex = new RegExp('(^|[\ \t])(window\.)?require\\((' + requireAnyTextRegexStr.join('|') + ')*\\)', 'g');

// Regular expression which detects require statments with non-variable paths
var requireDefinedRegexStr = [ singleQuotedText, doubleQuotedText ];
var definedRequireRegex = new RegExp('(^|[\ \t])(window\.)?require\\((' + requireDefinedRegexStr.join('|') + ')\\)', 'g');


/**
 * This test will run on the fly and will:
 * 
 * @param {Object} componentData
 * @param {Object} componentHint
 * @param {Function} cb
 * @returns {undefined}
 */
exports.onTheFlyTest = function (componentData, componentHint, cb) {
	var componentName = componentData.name;
	var componentPath = componentData.path;
	var eventChannel = componentData.channel;

	var scriptFiles = componentData.scripts;

	var definedScripts = componentHint.definedScripts[componentName] = {};
	var usedScripts = componentHint.usedScripts[componentName] = [];
	var usedDeps = definedScripts.usedDeps = [];

	componentHint.mainScripts[componentName] = componentData.json.main;
	definedScripts.name = componentData.json.name;
	definedScripts.path = componentPath;
	definedScripts.channel = eventChannel;
	definedScripts.externalDeps = componentData.json.dependencies || {};
	definedScripts.localDeps = componentData.json.local || [];


	for (var scriptFilename in scriptFiles) {
		if (!scriptFiles.hasOwnProperty(scriptFilename)) {
			continue;
		}

		// Add script to list of defined scripts
		var scriptPath = path.join(componentName, scriptFilename);
		//definedScripts.push(scriptPath);

		// Check if script is in component folder
		var relativePath = path.relative(componentPath, path.resolve(componentPath, scriptFilename));
		if (relativePath[0] === '.' && relativePath[1] === '.') {
			componentHint.emit('lint.warning', componentPath, 'Component script resides outside of component path: ' + relativePath);
		}

		// Get all instances of require
		var commentStrippedScript = helpers.stripComments(scriptFiles[scriptFilename]);
		var requireStrings = commentStrippedScript.match(requireRegex);
		if (!requireStrings) {
			continue;
		}

		// Parse each require statment and check for issues
		for (var requireI = 0; requireI < requireStrings.length; requireI += 1) {
			var requireString = requireStrings[requireI];

			// Check if this require contains any variables
			if (!requireString.match(definedRequireRegex)) {
				componentHint.emit('lint.warning', componentPath, 'Require statement could not be validated, contains non-string expression: ' + requireString);
				continue;
			}

			// Extract inner require string
			var innerString = requireString.replace(requireRegex, '$3').replace(/^['"'](.*)['"']$/g, '$1');
			var componentString = innerString.replace(/^\.\.\//g, '');

			// Resolve component script path
			var depName, resolvedPath;
			if (componentString[0] === '.' && componentString[1] === '/') {
				resolvedPath = path.join(componentName, componentString).replace(/(\.js)?$/,'.js');
				depName = componentName;
			} else {
				resolvedPath = ((componentString.match(/\//g) !== null) ? componentString.replace(/(\.js)?$/,'.js') : componentString);
				depName = componentString.replace(/^([^\/]*)\/.*/, '$1');
			}

			// Add to list of used deps
			if (depName !== componentName && usedScripts.indexOf(depName) < 0) {
				usedDeps.push(depName);
			}

			// Add to list of used scripts
			if (usedScripts.indexOf(resolvedPath) < 0) {
				usedScripts.push(resolvedPath);
			}
		}
	}

	return cb();
};