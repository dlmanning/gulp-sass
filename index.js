var es    = require('event-stream')
  , clone = require('clone')
  , sass  = require('node-sass')
  , path  = require('path')
  , gutil = require('gulp-util')
  , ext   = gutil.replaceExtension
  ;

module.exports = function (options) {
  var opts = options ? clone(options) : {};

  function nodeSass (file, cb) {
    if (path.basename(file.path).indexOf('_') === 0) {
      return cb();
    }

    if (file.isNull()) {
      return cb(null, file);
    }

    opts.data = file.contents.toString();

    opts.success = function (css) {
      file.path      = ext(file.path, '.css');
      file.shortened = file.shortened && ext(file.shortened, '.css');
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

  return es.map(nodeSass);
};
