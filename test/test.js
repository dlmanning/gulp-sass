var gulp = require('gulp')
  , sass = require('../')
  ;

gulp.src('./scss/*.scss')
  .pipe(sass({outputStyle: 'compressed'}))
  .pipe(gulp.dest('./css/'));