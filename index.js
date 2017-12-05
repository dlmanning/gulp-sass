'use strict';

var gutil = require('gulp-util');
var through = require('through2');
var clonedeep = require('lodash.clonedeep');
var path = require('path');
var applySourceMap = require('vinyl-sourcemaps-apply');

var PLUGIN_NAME = 'gulp-sass';

//////////////////////////////
// Main Gulp Sass function
//////////////////////////////
var gulpSass = function gulpSass(options, sync) {
  return through.obj(function(file, enc, cb) {
    var opts,
        filePush,
        errorM,
        callback,
        result;

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

    //////////////////////////////
    // Handles returning the file to the stream
    //////////////////////////////
    filePush = function filePush(sassObj) {
      file.contents = sassObj.css;
      file.path = gutil.replaceExtension(file.path, '.css');

      cb(null, file);
    };

    //////////////////////////////
    // Handles error message
    //////////////////////////////
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
      //////////////////////////////
      // Async Sass render
      //////////////////////////////
      callback = function(error, obj) {
        if (error) {
          return errorM(error);
        }
        filePush(obj);
      };

      gulpSass.compiler.render(opts, callback);
    }
    else {
      //////////////////////////////
      // Sync Sass render
      //////////////////////////////
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

//////////////////////////////
// Sync Sass render
//////////////////////////////
gulpSass.sync = function sync(options) {
  return gulpSass(options, true);
};

//////////////////////////////
// Log errors nicely
//////////////////////////////
gulpSass.logError = function logError(error) {
  var message = new gutil.PluginError('sass', error.messageFormatted).toString();
  process.stderr.write(message + '\n');
  this.emit('end');
};

//////////////////////////////
// Store compiler in a prop
//////////////////////////////
gulpSass.compiler = require('node-sass');

module.exports = gulpSass;
