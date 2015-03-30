'use strict';

var gutil = require('gulp-util');
var through = require('through2');
var assign = require('object-assign');
var path = require('path');
var sass = require('node-sass');
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

    opts = assign({}, options);
    opts.file = file.path;

    // Generate Source Maps if plugin source-map present
    if (file.sourceMap) {
      opts.sourceMap = file.path;
      opts.omitSourceMapUrl = true;
    }

    //////////////////////////////
    // Handles returning the file to the stream
    //////////////////////////////
    filePush = function filePush(sassObj) {
      // Build Source Maps!
      if (sassObj.map) {
        applySourceMap(file, JSON.parse(sassObj.map.toString()));
      }

      file.contents = sassObj.css;
      file.path = gutil.replaceExtension(file.path, '.css');

      cb(null, file);
    };

    //////////////////////////////
    // Handles error message
    //////////////////////////////
    errorM = function errorM(error) {
      var relativePath = path.relative(process.cwd(), error.file),
          message = '';

      message += gutil.colors.underline(relativePath) + '\n';
      message += gutil.colors.gray('  ' + error.line + ':' + error.column) + '  ';
      message += error.message;

      return cb(new gutil.PluginError(
          PLUGIN_NAME, message
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

      sass.render(opts, callback);
    }
    else {
      //////////////////////////////
      // Sync Sass render
      //////////////////////////////
      try {
        result = sass.renderSync(opts);

        filePush(result);
      }
      catch(error) {
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
  gutil.log(gutil.colors.red('[' + PLUGIN_NAME + '] ') + error.message);
};

module.exports = gulpSass;
