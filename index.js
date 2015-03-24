var gutil = require("gulp-util");
var through = require("through2");
var assign = require("object-assign");
var path  = require('path');
var sass = require("node-sass");
var applySourceMap = require('vinyl-sourcemaps-apply');

var PLUGIN_NAME = 'gulp-sass';

module.exports = function(options) {
  return through.obj(function(file, enc, cb) {
    if (file.isNull()) {
      return cb(null, file);
    }
    if (file.isStream()) {
      return cb(new gutil.PluginError(PLUGIN_NAME, 'Streaming not supported'));
    }
    if (path.basename(file.path).indexOf('_') === 0) {
      return cb();
    }

    var opts = assign({}, options);
    opts.file = file.path;

    // Generate Source Maps if plugin source-map present
    if (file.sourceMap) {
      opts.sourceMap = file.path;
    }

    var callback = function(error, obj) {
      if (error) {
        return cb(new gutil.PluginError(
          PLUGIN_NAME, error.message + ' on line ' + error.line + ' in ' + error.file
        ));
      }

      // Build Source Maps!
      if (obj.map) {
        // hack to remove the already added sourceMappingURL from libsass
        obj.css = obj.css.toString().replace(/\/\*#\s*sourceMappingURL\=.*\*\//, '');

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

      file.contents = new Buffer(obj.css);
      file.path = gutil.replaceExtension(file.path, '.css');

      cb(null, file);
    };

    sass.render(opts, callback);
  });
};
