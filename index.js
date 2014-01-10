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
    // file is on object passed in by gulp
    // file.contents is always a Buffer

    if (path.basename(file.path).indexOf('_') === 0) {
      //gutil.log('[gulp-sass] Partial: ' + path.basename(file.path) + ' ignored');
      return cb();
    }

    if (file.isNull()) {
      gutil.log('[gulp-sass] Empty file: ' + path.basename(file.path) + ' ignored');
      return cb();
    }

    opts.data = file.contents.toString();

    opts.success = function (css) {
      file.path      = ext(file.path, '.css');
      file.shortened = file.shortened && ext(file.shortened, '.css');
      file.contents  = new Buffer(css);
      cb(null, file);
    }

    opts.error = function (err) {
      //return cb(new gutil.PluginError('gulp-imagemin', err));
      gutil.log('[gulp-sass] Error: ' + err);
      return cb();
    }

    sass.render(opts);
  }

  return es.map(nodeSass);
}
