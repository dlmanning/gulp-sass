var gulp = require('gulp')
  , sass = require('../')
  ;

gulp.src('./scss/*.scss')
  .pipe(sass())
  .pipe(gulp.dest('./css/'));