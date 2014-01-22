var map    = require('map-stream')
  , sass  = require('node-sass')
  , path  = require('path')
  , gutil = require('gulp-util')
  , ext   = gutil.replaceExtension
  ;

module.exports = function (options) {
  var opts = options ? options : {};

  function nodeSass (file, cb) {

    if (file.isNull()) {
      return cb(null, file);
    }
    if (path.basename(file.path).indexOf('_') === 0) {
      return cb();
    }

    opts.file = path.relative(file.cwd, file.path).replace(/\\/g, '/');

    var fileDir = path.dirname(file.path);

    if (opts.includePaths && Array.isArray(opts.includePaths)) {
      if (opts.includePaths.indexOf(fileDir) === -1) {
        opts.includePaths.push(fileDir)
      }
    } else {
      opts.includePaths = [fileDir];
    }

    opts.success = function (css) {
      file.path      = ext(file.path, '.css');
      file.contents  = new Buffer(css);
      cb(null, file);
    };

    opts.error = function (err) {
      if (opts.errLogToConsole) {
        gutil.log('[gulp-sass] ' + err);
        return cb();
      }
      return cb(new gutil.PluginError('gulp-sass', err));
    };

    sass.render(opts);
  }

  return map(nodeSass);
};
