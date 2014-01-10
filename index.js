var map    = require('map-stream')
  , sass  = require('node-sass')
  , gutil   = require('gulp-util')
  ;

module.exports = function (options) {
  var opts = options ? options : {};

  function nodeSass (file, cb) {
    // file is on object passed in by gulp
    // file.contents is always a Buffer

    if (file.isNull()) {
      return cb(null, file);
    }

    opts.data = file.contents.toString();

    opts.success = function (css) {
      file.contents  = new Buffer(css);
      file.path = gutil.replaceExtension(file.path, '.css');
      cb(null, file);
    };

    opts.error = function (err) {
      cb(err);
    };

    sass.render(opts);
  }

  return map(nodeSass);
};
