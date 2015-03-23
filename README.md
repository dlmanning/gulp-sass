[![Build Status](https://travis-ci.org/dlmanning/gulp-sass.svg?branch=master)](https://travis-ci.org/dlmanning/gulp-sass)

gulp-sass
=========

[![Join the chat at https://gitter.im/dlmanning/gulp-sass](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/dlmanning/gulp-sass?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

Sass plugin for [gulp](https://github.com/gulpjs/gulp).

# Install

```
npm install gulp-sass --save-dev
```

# Basic Usage

Something like this:

```javascript
var gulp = require('gulp');
var gutil = require('gulp-util');
var sass = require('gulp-sass');

gulp.task('sass', function () {
	gulp.src('./scss/*.scss')
		.pipe(sass().on('error', gutil.log))
		.pipe(gulp.dest('./css'));
});
```

Options passed as a hash into `sass()` will be passed along to [`node-sass`](https://github.com/sass/node-sass).

## Source Maps TODO

gulp-sass can be used in tandem with [gulp-sourcemaps](https://github.com/floridoo/gulp-sourcemaps) to generate source maps for the SASS to CSS compilation. You will need to initialize [gulp-sourcemaps](https://github.com/floridoo/gulp-sourcemaps) prior to running the gulp-sass compiler and write the source maps after.

```javascript
var sourcemaps = require('gulp-sourcemaps');

gulp.src('./scss/*.scss')
  .pipe(sourcemaps.init())
    .pipe(sass())
  .pipe(sourcemaps.write())
  .pipe(gulp.dest('./css'));

// will write the source maps inline in the compiled CSS files
```

By default, [gulp-sourcemaps](https://github.com/floridoo/gulp-sourcemaps) writes the source maps inline in the compiled CSS files. To write them to a separate file, specify a relative file path in the `sourcemaps.write()` function.

```javascript
var sourcemaps = require('gulp-sourcemaps');

gulp.src('./scss/*.scss')
  .pipe(sourcemaps.init())
    .pipe(sass())
  .pipe(sourcemaps.write('./maps'))
  .pipe(gulp.dest('./css'));

// will write the source maps to ./dest/css/maps
```

# Issues

Before submitting an issue, please understand that gulp-sass is only a wrapper for [node-sass](https://github.com/sass/node-sass), which in turn is a node front end for [libsass](https://github.com/sass/libsass). Missing sass features and errors should not be reported here.
