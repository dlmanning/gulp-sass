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

    if (sync !== true) {
      callback = function(error, obj) {
        if (error) {
          return cb(new gutil.PluginError(
            PLUGIN_NAME, error.message + ' ' + gutil.colors.cyan('line ' + error.line) + ' in ' + gutil.colors.magenta(error.file)
          ));
        }
        // Build Source Maps!
        if (obj.map) {
          applySourceMap(file, JSON.parse(obj.map.toString()));
        }

        file.contents = obj.css;
        file.path = gutil.replaceExtension(file.path, '.css');

        cb(null, file);
      };

      sass.render(opts, callback);
    }
    else {
      try {
        result = sass.renderSync(opts);

        // Build Source Maps!
        if (result.map) {
          applySourceMap(file, JSON.parse(result.map.toString()));
        }

        file.contents = result.css;
        file.path = gutil.replaceExtension(file.path, '.css');

        cb(null, file);
      }
      catch(error) {
        return cb(new gutil.PluginError(
          PLUGIN_NAME, error.message + ' ' + gutil.colors.cyan('line ' + error.line) + ' in ' + gutil.colors.magenta(error.file)
        ));
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
  gutil.log(gutil.colors.red('[gulp-sass] ') + error.message);
};

module.exports = gulpSass;
