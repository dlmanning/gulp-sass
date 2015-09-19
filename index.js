'use strict';

var gutil = require('gulp-util');
var through = require('through2');
var assign = require('object-assign');
var path = require('path');
var applySourceMap = require('vinyl-sourcemaps-apply');

var PLUGIN_NAME = 'gulp-sass';

//////////////////////////////
// Main Gulp Sass function
//////////////////////////////
var gulpSass = function gulpSass(options, sync) {
  return through.obj(function(file, enc, cb) {
    var opts,
        filePush,
        errorM,
        callback,
        result;

    if (file.isNull()) {
      return cb(null, file);
    }
    if (file.isStream()) {
      return cb(new gutil.PluginError(PLUGIN_NAME, 'Streaming not supported'));
    }
    if (!file.contents.length) {
      return cb(null, file);
    }


    opts = assign({}, options);
    opts.data = file.contents.toString();

    if ((path.basename(file.path).indexOf('_') === 0) && (opts.compilePartials !== true)) {
      return cb();
    }

    // Ensure `indentedSyntax` is true if a `.sass` file
    if (path.extname(file.path) === '.sass') {
      opts.indentedSyntax = true;
    }

    // Ensure file's parent directory in the include path
    if (opts.includePaths) {
      if (typeof opts.includePaths === 'string') {
        opts.includePaths = [opts.includePaths];
      }
    }
    else {
      opts.includePaths = [];
    }

    opts.includePaths.unshift(path.dirname(file.path));

    // Generate Source Maps if plugin source-map present
    if (file.sourceMap) {
      opts.sourceMap = file.path;
      opts.omitSourceMapUrl = true;
      opts.sourceMapContents = true;
    }

    //////////////////////////////
    // Handles returning the file to the stream
    //////////////////////////////
    filePush = function filePush(sassObj) {
      var sassMap,
          sassMapFile,
          sassFileSrc,
          sassFileSrcPath,
          sourceFileIndex;

      // Build Source Maps!
      if (sassObj.map) {
        // Transform map into JSON
        sassMap = JSON.parse(sassObj.map.toString());
        // Grab the stdout and transform it into stdin
        sassMapFile = sassMap.file.replace('stdout', 'stdin');
        // Grab the base file name that's being worked on
        sassFileSrc = file.relative;
        // Grab the path portion of the file that's being worked on
        sassFileSrcPath = path.dirname(sassFileSrc);
        if (sassFileSrcPath) {
          //Prepend the path to all files in the sources array except the file that's being worked on
          for (sourceFileIndex = 0; sourceFileIndex < sassMap.sources.length; sourceFileIndex++) {
            if (sourceFileIndex !== sassMap.sources.indexOf(sassMapFile)) {
              sassMap.sources[sourceFileIndex] = path.join(sassFileSrcPath, sassMap.sources[sourceFileIndex]);
            }
          }
        }
        // Replace the stdin with the original file name
        sassMap.sources[sassMap.sources.indexOf(sassMapFile)] = sassFileSrc;
        // Replace the map file with the original file name (but new extension)
        sassMap.file = gutil.replaceExtension(sassFileSrc, '.css');
        // Apply the map
        applySourceMap(file, sassMap);
      }

      file.contents = sassObj.css;
      file.path = gutil.replaceExtension(file.path, '.css');

      cb(null, file);
    };

    //////////////////////////////
    // Handles error message
    //////////////////////////////
    errorM = function errorM(error) {
      var relativePath = '',
          filePath = error.file === 'stdin' ? file.path : error.file,
          message = '';

      filePath = filePath ? filePath : file.path;
      relativePath = path.relative(process.cwd(), filePath);

      message += gutil.colors.underline(relativePath) + '\n';
      message += gutil.colors.gray('  ' + error.line + ':' + error.column) + '  ';
      message += error.message;

      error.messageFormatted = message;
      error.message = gutil.colors.stripColor(message);

      return cb(new gutil.PluginError(
          PLUGIN_NAME, error
        ));
    };

    if (sync !== true) {
      //////////////////////////////
      // Async Sass render
      //////////////////////////////
      callback = function(error, obj) {
        if (error) {
          return errorM(error);
        }
        filePush(obj);
      };

      gulpSass.compiler.render(opts, callback);
    }
    else {
      //////////////////////////////
      // Sync Sass render
      //////////////////////////////
      try {
        result = gulpSass.compiler.renderSync(opts);

        filePush(result);
      }
      catch(error) {
        return errorM(error);
      }
    }
  });
};

//////////////////////////////
// Sync Sass render
//////////////////////////////
gulpSass.sync = function sync(options) {
  return gulpSass(options, true);
};

//////////////////////////////
// Log errors nicely
//////////////////////////////
gulpSass.logError = function logError(error) {
  var message = new gutil.PluginError('sass', error.messageFormatted).toString();
  process.stderr.write(message + '\n');
  this.emit('end');
};

//////////////////////////////
// Store compiler in a prop
//////////////////////////////
gulpSass.compiler = require('node-sass');

module.exports = gulpSass;
