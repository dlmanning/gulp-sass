var fs    = require('fs')
  , through2 = require('through2')
  , sass  = require('node-sass')
  , path  = require('path')
  , gutil = require('gulp-util')
  , applySourceMap = require('vinyl-sourcemaps-apply')
  ;

module.exports = function (options) {
  var opts = options || {};

  function nodeSass (file, enc, done) {
    var fileDir = path.dirname(file.path);
    var addedLocalDirPath = false;

    if (file.isNull()) {
      return done(null, file);
    }
    if (path.basename(file.path).indexOf('_') === 0) {
      return done();
    }

    if (file.sourceMap) {
      opts.sourceComments = 'map';
      opts.sourceMap = file.path;
    }

    if (opts.sourceComments === 'map' || opts.sourceComments === 'normal') {
      opts.sourceMap = opts.sourceMap || '';
      opts.file = file.path;
    } else {
      opts.data = file.contents.toString();
    }

    if (opts.includePaths && Array.isArray(opts.includePaths)) {
      if (opts.includePaths.indexOf(fileDir) === -1) {
        opts.includePaths.push(fileDir);
        addedLocalDirPath = true;
      }
    } else {
      opts.includePaths = [fileDir];
    }

    opts.success = function (css, map) {
      var sourceMap;
      if (typeof opts.onSuccess === 'function') opts.onSuccess(css, map);

      if (map) {
        // hack to remove the already added sourceMappingURL from libsass
        css = css.replace(/\n\/\*#\s*sourceMappingURL\=.*\*\//, '');

        applySourceMap(file, map);
      }

      file.path      = gutil.replaceExtension(file.path, '.css');
      file.contents  = new Buffer(css);
      done(null, file);
    };

    opts.error = function (err) {
      /*
       * We should deprecate these opts and just follow
       * the stream API conventions, which emits error event.
       */
      if (opts.errLogToConsole) {
        gutil.log('[gulp-sass] ' + err);
        return done();
      }

      if (typeof opts.onError === 'function') {
        opts.onError(err);
        return done();
      }

      done(new gutil.PluginError('gulp-sass', err));
    };

    sass.render(opts);

    if (addedLocalDirPath) opts.includePaths.pop();
  }

  return through2.obj(nodeSass);
};

function getSourcesContent (sources) {
  sourcesContent = [];

  for (var i = 0; i < sources.length; i++) {
    sourcesContent[i] = fs.readFileSync(sources[i], { encoding: 'utf8' });
  }

  return sourcesContent;
}
