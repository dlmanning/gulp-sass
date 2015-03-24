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
var gulpSass = function gulpSass(options) {
  'use strict';

  return through.obj(function(file, enc, cb) {
    var opts,
        callback;

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

    callback = function(error, obj) {
      if (error) {
        return cb(new gutil.PluginError(
          PLUGIN_NAME, error.message + '\nLine ' + gutil.colors.cyan(error.line) + ' in ' + gutil.colors.magenta(error.file)
        ));
      }
      // Build Source Maps!
      if (obj.map) {
        // libsass gives us sources' paths relative to file;
        // gulp-sourcemaps needs sources' paths relative to file.base;
        // so alter the sources' paths to please gulp-sourcemaps.
        obj.map = JSON.parse(obj.map.toString());

        if (obj.map.sources) {
          obj.map.sources = obj.map.sources.map(function(source) {
            var abs = path.resolve(path.dirname(file.path), source);
            return path.relative(file.base, abs);
          });

          obj.map = JSON.stringify(obj.map);
          applySourceMap(file, obj.map);
        }
      }

      file.contents = obj.css;
      file.path = gutil.replaceExtension(file.path, '.css');

      cb(null, file);
    };

    sass.render(opts, callback);
  });
};

//////////////////////////////
// Log errors nicely
//////////////////////////////
gulpSass.logError = function logError(error) {
  'use strict';

  gutil.log(gutil.colors.red('Error: ') + error.message);
};

module.exports = gulpSass;
