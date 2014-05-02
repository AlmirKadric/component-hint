var path = require('path');
var helpers = require('../helpers.js');

/**
 * This test will run during the post stage and will
 * 
 * @param {Object} componentHint
 * @param {Function} cb
 * @returns {undefined}
 */
exports.postStageTest = function (componentHint, cb) {
	var mainScripts = componentHint.mainScripts;
	var definedScripts = componentHint.definedScripts;
	var usedScripts = componentHint.usedScripts;

	for (var depName in definedScripts) {
		if (!definedScripts.hasOwnProperty(depName)) {
			continue;
		}

		var componentData = definedScripts[depName];
		var componentPath = componentData.path;
		var eventChannel = componentData.channel;
		var usedDeps = componentData.usedDeps;
		var localDeps = componentData.localDeps.slice(0);

		var externalDeps = [];
		for (var externalDep in componentData.externalDeps) {
			if (!componentData.externalDeps.hasOwnProperty(externalDep)) {
				continue;
			}
			var normalizedName = helpers.normalizeComponentName(externalDep);
			externalDeps.push(definedScripts[normalizedName].name);
		}

		// Check if there all required components are in either the external or local deps list
		for (var usedDepsI = 0; usedDepsI < usedDeps.length; usedDepsI += 1) {
			var usedDep = usedDeps[usedDepsI];
			var externalIndex = externalDeps.indexOf(usedDep);
			var localIndex = localDeps.indexOf(usedDep);

			if (externalIndex >= 0) {
				externalDeps.splice(externalIndex, 1);
			} else if (localIndex >= 0) {
				localDeps.splice(localIndex, 1);
			} else {
				componentHint.emit(eventChannel, componentPath, 'Required dependency not defined: ' + usedDep);
			}
		}

		// Check if there are any defined external deps which aren't used
		for (var externalI = 0; externalI < externalDeps.length; externalI += 1) {
			componentHint.emit(eventChannel, componentPath, 'External dependency defined, but never used: ' + externalDeps[externalI]);
		}

		// Check if there are any defined local deps which aren't used
		for (var localI = 0; localI < localDeps.length; localI += 1) {
			componentHint.emit(eventChannel, componentPath, 'Local dependency defined, but never used: ' + localDeps[localI]);
		}
	}

/*
	// Check if there are any defined scripts which aren't used
	for (var usedI = 0; usedI < usedScripts.length; usedI += 1) {
		var usedScript = usedScripts[usedI].split('/');
		var depName = usedScript.shift();
		var depScript = usedScript.join('/') || mainScripts[depName];
		var resolvedPath = path.join(depName, depScript);

		var definedIndex = definedScripts.indexOf(resolvedPath);
		if (definedIndex >= 0) {
			definedScripts.splice(definedIndex, 1);
		}
	}

	for (var definedI = 0; definedI < definedScripts.length; definedI += 1) {
		var componentPath = definedScripts[definedI];
		var scriptPath = definedScripts[definedI];
		componentHint.emit('lint.warning', componentPath, 'Component script defined, but never used: ' + scriptPath);
	}
*/


	return cb();
};