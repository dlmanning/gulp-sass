'use strict';

const path = require('path');
const { Transform } = require('stream');
const picocolors = require('picocolors');
const PluginError = require('plugin-error');
const replaceExtension = require('replace-ext');
const stripAnsi = require('strip-ansi');
const clonedeep = require('lodash.clonedeep');
const applySourceMap = require('vinyl-sourcemaps-apply');

const PLUGIN_NAME = 'gulp-sass';

const MISSING_COMPILER_MESSAGE = `
gulp-sass no longer has a default Sass compiler; please set one yourself.
Both the "sass" and "node-sass" packages are permitted.
For example, in your gulpfile:

  const sass = require('gulp-sass')(require('sass'));
`;

const transfob = (transform) => new Transform({ transform, objectMode: true });

/**
 * Handles returning the file to the stream
 */
const filePush = (file, compileResult, callback) => {
  file.contents = Buffer.from(compileResult.css);
  file.path = replaceExtension(file.path, '.css');

  // Build Source Maps!
  if (compileResult.sourceMap) {
    const sassMap = compileResult.sourceMap;
    if (!sassMap.file) {
      sassMap.file = file.path;
    }

    // Grab the stdout and transform it into stdin
    const sassMapFile = sassMap.file.replace(/^stdout$/, 'stdin');
    // Grab the base filename that's being worked on
    const sassFileSrc = file.relative;
    // Grab the path portion of the file that's being worked on
    const sassFileSrcPath = path.dirname(sassFileSrc);

    if (sassFileSrcPath) {
      const sourceFileIndex = sassMap.sources.indexOf(sassMapFile);
      // Prepend the path to all files in the sources array except the file that's being worked on
      sassMap.sources = sassMap.sources.map((source, index) => (
        index === sourceFileIndex
          ? source
          : path.join(sassFileSrcPath, source)
      ));
    }

    // Remove 'stdin' from souces and replace with filenames!
    sassMap.sources = sassMap.sources.filter((src) => src !== 'stdin' && src);

    // Replace the map file with the original filename (but new extension)
    sassMap.file = replaceExtension(sassFileSrc, '.css');
    // Apply the map
    applySourceMap(file, sassMap);
  }

  if (file.stat) {
    file.stat.atime = file.stat.mtime = file.stat.ctime = new Date();
  }

  // Pass along some potentially useful data.
  file.sassStats = sassObject.stats;

  callback(null, file);
};

/**
 * Handles error message
 */
const handleError = (error, file, callback) => {
  const filePath = (error.file === 'stdin' ? file.path : error.file) || file.path;
  const relativePath = path.relative(process.cwd(), filePath);
  const message = `${picocolors.underline(relativePath)}\n${error.message}`;

  error.messageFormatted = message;
  error.messageOriginal = error.message;
  error.message = stripAnsi(message);
  error.relativePath = relativePath;

  return callback(new PluginError(PLUGIN_NAME, error));
};

/**
 * Main Gulp Sass function
 */

// eslint-disable-next-line arrow-body-style
const gulpSass = (options, sync) => {
  return transfob((file, encoding, callback) => {
    if (file.isNull()) {
      callback(null, file);
      return;
    }

    if (file.isStream()) {
      callback(new PluginError(PLUGIN_NAME, 'Streaming not supported'));
      return;
    }

    if (path.basename(file.path).startsWith('_')) {
      callback();
      return;
    }

    if (!file.contents.length) {
      file.path = replaceExtension(file.path, '.css');
      file.sassStats = null;
      callback(null, file);
      return;
    }

    const opts = clonedeep(options || {});

    // Ensure `indented` if a `.sass` file
    if (path.extname(file.path) === '.sass') {
      opts.syntax = 'indented';
    }

    // Ensure file's parent directory in the include path
    if (opts.loadPaths) {
      if (typeof opts.loadPaths === 'string') {
        opts.loadPaths = [opts.loadPaths];
      }
    } else {
      opts.loadPaths = [];
    }

    opts.loadPaths.unshift(path.dirname(file.path));

    // Generate Source Maps if the source-map plugin is present
    if (file.sourceMap) {
      opts.sourceMap = true;
      opts.sourceMapIncludeSources = true;
    }

    const fileContents = file.contents.toString();
    if (sync !== true) {
      /**
       * Async Sass compile
       */
      gulpSass.compiler
        .compileStringAsync(fileContents, opts)
        .then((compileResult) => {
          filePush(file, compileResult, callback);
        })
        .catch((error) => {
          handleError(error, file, callback);
        });
    } else {
      /**
       * Sync Sass compile
       */
      try {
        filePush(file, gulpSass.compiler.compileString(fileContents, opts), callback);
      } catch (error) {
        handleError(error, file, callback);
      }
    }
  });
};

/**
 * Sync Sass compile
 */
gulpSass.sync = (options) => gulpSass(options, true);

/**
 * Log errors nicely
 */
gulpSass.logError = function logError(error) {
  const message = new PluginError('sass', error).toString();
  process.stderr.write(`${message}\n`);
  this.emit('end');
};

module.exports = (compiler) => {
  if (!compiler || !compiler.compile) {
    const message = new PluginError(
      PLUGIN_NAME,
      MISSING_COMPILER_MESSAGE,
      { showProperties: false },
    ).toString();
    process.stderr.write(`${message}\n`);
    process.exit(1);
  }

  gulpSass.compiler = compiler;
  return gulpSass;
};
