'use strict';

var gutil = require('gulp-util');
var through = require('through2');
var assign = require('object-assign');
var path = require('path');
var sass = require('node-sass');
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
    if (path.basename(file.path).indexOf('_') === 0) {
      return cb();
    }

    opts = assign({}, options);
    opts.data = file.contents.toString();

    if (opts.includePaths) {
      if (typeof opts.includePaths === 'string') {
        opts.includePaths = [opts.includePaths];
      }
    }
    else {
      opts.includePaths = [];
    }

    opts.includePaths.push(path.dirname(file.path));

    // Generate Source Maps if plugin source-map present
    if (file.sourceMap) {
      opts.sourceMap = file.path;
      opts.omitSourceMapUrl = true;
    }

    //////////////////////////////
    // Handles returning the file to the stream
    //////////////////////////////
    filePush = function filePush(sassObj) {
      var sassMap,
          sassMapFile,
          sassFileSrc;

      // Build Source Maps!
      if (sassObj.map) {
        // Transform map into JSON
        sassMap = JSON.parse(sassObj.map.toString());
        // Grab the stdout and transform it into stdin
        sassMapFile = sassMap.file.replace('stdout', 'stdin');
        // Grab the base file name that's being worked on
        sassFileSrc = file.path.split('/').pop();
        // Replace the stdin with the original file name
        sassMap.sources[sassMap.sources.indexOf(sassMapFile)] = sassFileSrc;
        // Replace the map file with the original file name
        sassMap.file = sassFileSrc;
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

      return cb(new gutil.PluginError(
          PLUGIN_NAME, message
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

      sass.render(opts, callback);
    }
    else {
      //////////////////////////////
      // Sync Sass render
      //////////////////////////////
      try {
        result = sass.renderSync(opts);

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
  gutil.log(gutil.colors.red('[' + PLUGIN_NAME + '] ') + error.message);
};

module.exports = gulpSass;
