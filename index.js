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
    
    var newFile = clone(file);

    opts.data = newFile.contents.toString();

    opts.success = function (css) {
      newFile.path      = ext(newFile.path, '.css');
      newFile.shortened = newFile.shortened && ext(newFile.shortened, '.css');
      newFile.contents  = new Buffer(css);

      cb(null, newFile);
    }

    opts.error = function (err) {
      cb(err);
    }

    sass.render(opts);
  }

  return es.map(nodeSass);
}