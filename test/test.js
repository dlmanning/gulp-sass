var path = require('path');
var fs = require('fs');

var test = require('tape');

var gulp = require('gulp')
  , util = require('gulp-util')
  , gulpSass = require('../')
  , nodeSass = require('node-sass');
  ;

gulp.src('./scss/*.scss')
    .pipe(gulpSass())
    .pipe(util.buffer(tapeTester));

function tapeTester(err, files) {
  files.forEach(function (item) {
    var fileBaseName = path.basename(item.path, '.css');
    test('Testing: ' + fileBaseName, function (t) {
      var ref = nodeSass.renderSync({
        data: fs.readFileSync('./scss/' + fileBaseName + '.scss').toString()
      })
      t.equal(item.contents.toString(), ref);
      t.end();
    })
  });
}