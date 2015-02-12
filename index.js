var fs    = require('fs')
  , map   = require('map-stream')
  , nodeSass  = require('node-sass')
  , path  = require('path')
  , gutil = require('gulp-util')
  , clone = require('clone')
  , ext   = gutil.replaceExtension
  , applySourceMap = require('vinyl-sourcemaps-apply')
  ;

module.exports = function (options) {

  function sass (file, cb) {
    var opts = options ? clone(options) : {};
    var fileDir = path.dirname(file.path);

    if (file.isNull()) {
      return cb(null, file);
    }
    if (path.basename(file.path).indexOf('_') === 0) {
      return cb();
    }

    if (file.sourceMap) {
      opts.sourceMap = file.path;
    }

    opts.data = file.contents.toString();
    opts.file = file.path;

    if (opts.includePaths && Array.isArray(opts.includePaths)) {
      if (opts.includePaths.indexOf(fileDir) === -1) {
        opts.includePaths.push(fileDir);
      }
    } else {
      opts.includePaths = [fileDir];
    }

    opts.success = function (obj) {
      if (typeof opts.onSuccess === 'function') opts.onSuccess(obj);

      if (obj.map && typeof obj.map === 'string') {
        // hack to remove the already added sourceMappingURL from libsass
        obj.css = obj.css.replace(/\/\*#\s*sourceMappingURL\=.*\*\//, '');

        // libsass gives us sources' paths relative to file;
        // gulp-sourcemaps needs sources' paths relative to file.base;
        // so alter the sources' paths to please gulp-sourcemaps.
        obj.map = JSON.parse(obj.map);

        if (obj.map.sources) {
          obj.map.sources = obj.map.sources.map(function(source) {
            var abs = path.resolve(path.dirname(file.path), source);
            return path.relative(file.base, abs);
          });

          obj.map = JSON.stringify(obj.map);
          applySourceMap(file, obj.map);
        }

      }

      handleOutput(obj, file, cb);
    };

    opts.error = function (err) {
      if (opts.errLogToConsole) {
        gutil.log('[gulp-sass] ' + err.message + ' on line ' + err.line + ' in ' + err.file);
        return cb();
      }

      if (typeof opts.onError === 'function') {
        opts.onError(err);
        return cb();
      }
      
      err.lineNumber = err.line;
      err.fileName = err.file;

      return cb(new gutil.PluginError('gulp-sass', err));
    };

    if ( opts.sync ) {
      try {
        var output = nodeSass.renderSync(opts);
        opts.success(output);
        handleOutput(output, file, cb);
      } catch(err) {
        opts.error(err);
      }
    } else {
      nodeSass.render(opts);
    }

  }

  return map(sass);
};

function handleOutput(output, file, cb) {
  file.path = ext(file.path, '.css');
  file.contents = new Buffer(output.css);
  cb(null, file);
}
