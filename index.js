var gutil = require("gulp-util");
var through = require("through2");
var assign = require("object-assign");
var path  = require('path');
var sass = require("node-sass");

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

    var callback = function(error, obj) {
      if (error) {
        return cb(new gutil.PluginError(
          PLUGIN_NAME, error.message + ' on line ' + error.line + ' in ' + error.file
        ));
      }

      file.contents = new Buffer(obj.css);
      file.path = gutil.replaceExtension(file.path, '.css');
      cb(null, file);
    };

    sass.render(opts, callback);
  });
};
