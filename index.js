var es    = require('event-stream')
  , clone = require('clone')
  , sass  = require('node-sass')
  , ext   = require('gulp-util').replaceExtension
  ;

module.exports = function (options) {
  var opts = options ? clone(options) : {};

  function nodeSass (file, cb) {
    var newFile = clone(file);

    sass.render({
      data: newFile.contents.toString(),
      success: function (css) {
        newFile.path = ext(newFile.path, '.css')
        newFile.shortened = newFile.shortened && ext(newFile.shortened, '.css');
        newFile.contents = new Buffer(css);

        cb(null, newFile);
      }
    });
  }

  return es.map(nodeSass);
}