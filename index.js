var es    = require('event-stream')
  , clone = require('clone')
  , sass  = require('node-sass')
  , ext   = require('gulp-util').replaceExtension
  ;

module.exports = function (options) {
  var opts = options ? clone(options) : {};

  function nodeSass (file, cb) {
    // file is on object passed in by gulp
    // file.contents is always a Buffer


    if (file.isNull()) {
      return cb(null, file);
    }

    opts.data = file.contents.toString();

    opts.success = function (css) {
      file.path      = ext(file.path, '.css');
      file.shortened = file.shortened && ext(file.shortened, '.css');
      file.contents  = new Buffer(css);

      cb(null, file);
    }

    opts.error = function (err) {
      cb(err);
    }

    sass.render(opts);
  }

  return es.map(nodeSass);
}
