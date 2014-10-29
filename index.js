var fs    = require('fs')
  , map   = require('map-stream')
  , sass  = require('node-sass')
  , path  = require('path')
  , gutil = require('gulp-util')
  , ext   = gutil.replaceExtension
  , applySourceMap = require('vinyl-sourcemaps-apply')
  ;

module.exports = function (options) {
  var opts = options || {};

  function nodeSass (file, cb) {
    var fileDir = path.dirname(file.path);
    var addedLocalDirPath = false;

    if (file.isNull()) {
      return cb(null, file);
    }
    if (path.basename(file.path).indexOf('_') === 0) {
      return cb();
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

		opts.includePath = opts.includePaths;

    opts.success = function (css, sourceMap) {
      if (typeof opts.onSuccess === 'function') opts.onSuccess(css, sourceMap);

      if (sourceMap) {
        // hack to remove the already added sourceMappingURL from libsass
        css = css.replace(/\/\*#\s*sourceMappingURL\=.*\*\//, '');

        // libsass gives us sources' paths relative to file;
        // gulp-sourcemaps needs sources' paths relative to file.base;
        // so alter the sources' paths to please gulp-sourcemaps.
        sourceMap = JSON.parse(sourceMap);
        sourceMap.sources = sourceMap.sources.map(function(source) {
          var abs = path.resolve(path.dirname(file.path), source);
          return path.relative(file.base, abs);
        });
        sourceMap = JSON.stringify(sourceMap);

        applySourceMap(file, sourceMap);
      }
      handleOutput(css, file, cb);
    };

    opts.error = function (err) {
      if (opts.errLogToConsole) {
        gutil.log('[gulp-sass] ' + err);
        return cb();
      }

      if (typeof opts.onError === 'function') {
        opts.onError(err);
        return cb();
      }

      return cb(new gutil.PluginError('gulp-sass', err));
    };

	if ( opts.sync ) {
	  try {
	    var output = sass.renderSync(opts);
	    opts.success(output, null);
	    handleOutput(output, file, cb);
	  } catch(err) {
	    opts.error(err);
	  }
	} else {
	  sass.render(opts);
	}

    if (addedLocalDirPath) opts.includePaths.pop();

  }

  return map(nodeSass);
};

function handleOutput(output, file, cb) {
  file.path = ext(file.path, '.css');
  file.contents = new Buffer(output);
  cb(null, file);
}

function getSourcesContent (sources) {
  sourcesContent = [];

  for (var i = 0; i < sources.length; i++) {
    sourcesContent[i] = fs.readFileSync(sources[i], { encoding: 'utf8' });
  }

  return sourcesContent;
}
