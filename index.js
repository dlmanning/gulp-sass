'use strict';

const path = require('path');
const chalk = require('chalk');
const PluginError = require('plugin-error');
const replaceExtension = require('replace-ext');
const stripAnsi = require('strip-ansi');
const transfob = require('transfob');
const clonedeep = require('lodash.clonedeep');
const applySourceMap = require('vinyl-sourcemaps-apply');

const PLUGIN_NAME = 'gulp-sass';

const MISSING_COMPILER_MESSAGE = `
gulp-sass 5 does not have a default Sass compiler; please set one yourself.
Both the "sass" and "node-sass" packages are permitted.
For example, in your gulpfile:

  const sass = require('gulp-sass')(require('sass'));
`;

/*
  Handles returning the file to the stream
*/
const filePush = (file, sassObj, cb) => {
  // Build Source Maps!
  if (sassObj.map) {
    // Transform map into JSON
    const sassMap = JSON.parse(sassObj.map.toString());
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

  file.contents = sassObj.css;
  file.path = replaceExtension(file.path, '.css');

  if (file.stat) {
    file.stat.atime = file.stat.mtime = file.stat.ctime = new Date();
  }

  cb(null, file);
};

/*
  Handles error message
*/
const handleError = (error, file, cb) => {
  const filePath = (error.file === 'stdin' ? file.path : error.file) || file.path;
  const relativePath = path.relative(process.cwd(), filePath);
  const message = [chalk.underline(relativePath), error.formatted].join('\n');

  error.messageFormatted = message;
  error.messageOriginal = error.message;
  error.message = stripAnsi(message);
  error.relativePath = relativePath;

  return cb(new PluginError(PLUGIN_NAME, error));
};

/*
  Main Gulp Sass function
*/

// eslint-disable-next-line arrow-body-style
const gulpSass = (options, sync) => {
  // eslint-disable-next-line consistent-return
  return transfob((file, enc, cb) => {
    if (file.isNull()) {
      return cb(null, file);
    }

    if (file.isStream()) {
      return cb(new PluginError(PLUGIN_NAME, 'Streaming not supported'));
    }

    if (path.basename(file.path).startsWith('_')) {
      return cb();
    }

    if (!file.contents.length) {
      file.path = replaceExtension(file.path, '.css');
      return cb(null, file);
    }

    const opts = clonedeep(options || {});
    opts.data = file.contents.toString();

    // We set the file path here so that libsass can correctly resolve import paths
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
    } else {
      opts.includePaths = [];
    }

    opts.includePaths.unshift(path.dirname(file.path));

    // Generate Source Maps if the source-map plugin is present
    if (file.sourceMap) {
      opts.sourceMap = file.path;
      opts.omitSourceMapUrl = true;
      opts.sourceMapContents = true;
    }

    if (sync !== true) {
      /*
        Async Sass render
      */
      // eslint-disable-next-line consistent-return
      gulpSass.compiler.render(opts, (error, obj) => {
        if (error) {
          return handleError(error, file, cb);
        }

        filePush(file, obj, cb);
      });
    } else {
      /*
        Sync Sass render
      */
      try {
        filePush(file, gulpSass.compiler.renderSync(opts), cb);
      } catch (error) {
        return handleError(error, file, cb);
      }
    }
  });
};

/*
  Sync Sass render
*/
gulpSass.sync = (options) => gulpSass(options, true);

/*
  Log errors nicely
*/
gulpSass.logError = function logError(error) {
  const message = new PluginError('sass', error.messageFormatted).toString();
  process.stderr.write(`${message}\n`);
  this.emit('end');
};

module.exports = (compiler) => {
  if (!compiler || !compiler.render) {
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
