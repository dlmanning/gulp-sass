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
    const proto = /^file:\/\/?/;
    const leadingSlash = /^\//;
    const sassMap = compileResult.sourceMap;
    const base = path.resolve(file.cwd, file.base);

    if (!sassMap.file) {
      // Convert from absolute path to relative as in gulp-sass 5.0.0
      sassMap.file = file.history[0]
        .replace(base + path.sep, '')
        .replace(proto, '');
    }

    // Transform to relative file paths as in gulp-sass 5.0.0
    sassMap.sources = sassMap.sources.map((src) => {
      // file uses Windows-style path separators, source is a URL.
      const baseUri = base.replace(/\\/g, '/');
      // The current file and its content is included
      // as data:<encoded file contents> in the new Sass JS API.
      // Map it to the original file name (first history entry).
      if (src.startsWith('data:')) {
        return file.history[0]
          .replace(/\\/g, '/')
          .replace(`${baseUri}/`, '')
          .replace(proto, '')
          .replace(leadingSlash, '');
      }
      return src
        .replace(proto, '')
        .replace(`${baseUri}/`, '')
        .replace(leadingSlash, '');
    });

    // Grab the base filename that's being worked on
    const sassFileSrc = file.relative;
    // Replace the map file with the original filename (but new extension)
    sassMap.file = replaceExtension(sassFileSrc, '.css');

    if (file.sourceMap.sourcesContent && !sassMap.sourcesContent) {
      sassMap.sourcesContent = file.sourceMap.sourcesContent;
    }

    // Apply the map
    applySourceMap(file, sassMap);
  }

  if (file.stat) {
    file.stat.atime = file.stat.mtime = file.stat.ctime = new Date();
  }

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
