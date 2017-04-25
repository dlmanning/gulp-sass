'use strict';

/**
 * Gulp plugin for sass.
 * Extended version of {@link [gulp-sass](https://github.com/dlmanning/gulp-sass)}.
 * @module gulp-sass-extended
 */

var gutil = require('gulp-util');
var through = require('through2');
var clonedeep = require('lodash.clonedeep');
var path = require('path');
var applySourceMap = require('vinyl-sourcemaps-apply');

/**
 * The name of plugin
 * @private
 * @const {string}
 */
var PLUGIN_NAME = 'gulp-sass-extended';

/**
 * Main plugin function
 * @method
 * @param {Object} options - plugin options
 * @param {boolean} [sync] - use node-sass `renderSync` method
 * @returns {DestroyableTransform} through2.obj
 */
var gulpSass = function gulpSass(options, sync) {
	return through.obj(function (file, enc, cb) {
		// create variables for work
		var opts, // re-tuned options
			filePush, // fn for pushing transformed files back to stream
			errorM,   // error method
			callback, // callback for node-sass `render` method
			result;   // result of node-sass

		if (file.isNull()) {
			return cb(null, file);
		}
		if (file.isStream()) {
			return cb(new gutil.PluginError(PLUGIN_NAME, 'Streaming not supported'));
		}
		if (path.basename(file.path).indexOf('_') === 0) {
			return cb();
		}
		if (!file.contents.length) {
			file.path = gutil.replaceExtension(file.path, '.css');
			return cb(null, file);
		}


		opts = clonedeep(options || {});
		opts.data = file.contents.toString();

		// we set the file path here so that libsass can correctly resolve import paths
		opts.file = file.path;

		// Ensure `indentedSyntax` is true if a `.sass` file
		if (path.extname(file.path) === '.sass') {
			opts.indentedSyntax = true;
		}

		// Ensure file's parent directory in the include path
		if (opts.includePaths) {
			if (typeof opts.includePaths === 'string') {
				opts.includePaths = [opts.includePaths];
			}
		}
		else {
			opts.includePaths = [];
		}

		opts.includePaths.unshift(path.dirname(file.path));

		// Generate Source Maps if plugin source-map present
		if (file.sourceMap) {
			opts.sourceMap = file.path;
			opts.omitSourceMapUrl = true;
			opts.sourceMapContents = true;
		}

		// Handles returning the file to the stream
		// ============
		filePush = function filePush(sassObj) {
			var sassMap,
				sassMapFile,
				sassFileSrc,
				sassFileSrcPath,
				sourceFileIndex;

			// Build Source Maps!
			if (sassObj.map) {
				// Transform map into JSON
				sassMap = JSON.parse(sassObj.map.toString());
				// Grab the stdout and transform it into stdin
				sassMapFile = sassMap.file.replace(/^stdout$/, 'stdin');
				// Grab the base file name that's being worked on
				sassFileSrc = file.relative;
				// Grab the path portion of the file that's being worked on
				sassFileSrcPath = path.dirname(sassFileSrc);
				if (sassFileSrcPath) {
					//Prepend the path to all files in the sources array except the file that's being worked on
					sourceFileIndex = sassMap.sources.indexOf(sassMapFile);
					sassMap.sources = sassMap.sources.map(function (source, index) {
						return (index === sourceFileIndex) ? source : path.join(sassFileSrcPath, source);
					});
				}

				// Remove 'stdin' from souces and replace with filenames!
				sassMap.sources = sassMap.sources.filter(function (src) {
					if (src !== 'stdin') {
						return src;
					}
				});

				// Replace the map file with the original file name (but new extension)
				sassMap.file = gutil.replaceExtension(sassFileSrc, '.css');
				// Apply the map
				applySourceMap(file, sassMap);
			}

			file.contents = sassObj.css;
			file.path = gutil.replaceExtension(file.path, '.css');

			cb(null, file);
		};

		// Handles error message
		// ============
		errorM = function errorM(error) {
			var relativePath = '',
				filePath = error.file === 'stdin' ? file.path : error.file,
				message = '';

			filePath = filePath ? filePath : file.path;
			relativePath = path.relative(process.cwd(), filePath);

			message += gutil.colors.underline(relativePath) + '\n';
			message += error.formatted;

			error.messageFormatted = message;
			error.messageOriginal = error.message;
			error.message = gutil.colors.stripColor(message);

			error.relativePath = relativePath;

			return cb(new gutil.PluginError(
				PLUGIN_NAME, error
			));
		};

		if (sync !== true) {
			// Async Sass render
			// ============
			callback = function (error, obj) {
				if (error) {
					return errorM(error);
				}
				filePush(obj);
			};

			gulpSass.compiler.render(opts, callback);
		}
		else {
			// Sync Sass render
			// ============
			try {
				result = gulpSass.compiler.renderSync(opts);

				filePush(result);
			}
			catch (error) {
				return errorM(error);
			}
		}
	});
};

// Sync Sass render
// ============
gulpSass.sync = function sync(options) {
	return gulpSass(options, true);
};

// Log errors nicely
// ============
gulpSass.logError = function logError(error) {
	var message = new gutil.PluginError('sass', error.messageFormatted).toString();
	process.stderr.write(message + '\n');
	this.emit('end');
};

// Store compiler in a prop
// ============
gulpSass.compiler = require('node-sass');

module.exports = gulpSass;
