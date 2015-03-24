var gutil = require('gulp-util');
var through = require('through2');
var assign = require('object-assign');
var path = require('path');
var sass = require('node-sass');
var applySourceMap = require('vinyl-sourcemaps-apply');

var PLUGIN_NAME = 'gulp-sass';

module.exports = function(options) {
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
          PLUGIN_NAME, error.message + ' on line ' + error.line + ' in ' + error.file
        ));
      }

      if (obj.map) {
          applySourceMap(file, JSON.parse(obj.map.toString()));
        }

      file.contents = obj.css;
      file.path = gutil.replaceExtension(file.path, '.css');

      cb(null, file);
    };

    sass.render(opts, callback);
  });
};
