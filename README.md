# gulp-sass [![Build Status](https://travis-ci.org/dlmanning/gulp-sass.svg?branch=master)](https://travis-ci.org/dlmanning/gulp-sass) [![Join the chat at https://gitter.im/dlmanning/gulp-sass](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/dlmanning/gulp-sass?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

Sass plugin for [Gulp](https://github.com/gulpjs/gulp).

# Install

```
npm install gulp-sass --save-dev
```

# Basic Usage

Something like this will compile your Sass files:

```javascript
var gulp = require('gulp');
var gutil = require('gulp-util');
var sass = require('gulp-sass');

gulp.task('sass', function () {
	gulp.src('./scss/*.scss')
		.pipe(sass().on('error', sass.logError))
		.pipe(gulp.dest('./css'));
});
```

You can also compile synchronously, doing something like this:

```javascript
var gulp = require('gulp');
var gutil = require('gulp-util');
var sass = require('gulp-sass');

gulp.task('sass', function () {
  gulp.src('./scss/*.scss')
    .pipe(sass.sync().on('error', sass.logError))
    .pipe(gulp.dest('./css'));
});
```

## Options

Pass in options just like you would for [`node-sass`](https://github.com/sass/node-sass#options); they will be passed along just as if you were using `node-sass`.

## Source Maps

`gulp-sass` can be used in tandem with [gulp-sourcemaps](https://github.com/floridoo/gulp-sourcemaps) to generate source maps for the Sass to CSS compilation. You will need to initialize [gulp-sourcemaps](https://github.com/floridoo/gulp-sourcemaps) prior to running `gulp-sass` and write the source maps after.

```javascript
var sourcemaps = require('gulp-sourcemaps');

gulp.src('./scss/*.scss')
  .pipe(sourcemaps.init())
    .pipe(sass())
  .pipe(sourcemaps.write())
  .pipe(gulp.dest('./css'));
```

By default, [gulp-sourcemaps](https://github.com/floridoo/gulp-sourcemaps) writes the source maps inline in the compiled CSS files. To write them to a separate file, specify a path relative to the `gulp.dest()` destination in the `sourcemaps.write()` function.

```javascript
var sourcemaps = require('gulp-sourcemaps');

gulp.src('./scss/*.scss')
  .pipe(sourcemaps.init())
    .pipe(sass())
  .pipe(sourcemaps.write('./maps'))
  .pipe(gulp.dest('./css'));
```

# Issues

`gulp-sass` is a very light-weight wrapper around [`node-sass`](https://github.com/sass/node-sass), which in turn is a Node binding for [`libsass`](https://github.com/sass/libsass), which in turn is a port of [`Sass`](https://github.com/sass/sass). Because of this, the issue you're having likely isn't a `gulp-sass` issue, but an issue with one of those three projects.

If you have a feature request/question how Sass works/concerns on how your Sass gets compiled/errors in your compiling, it's likely a `libsass` or `Sass` issue and you should file your issue with one of those projects.

If you're having problems with the options you're passing in, it's likely a `node-sass` or `libsass` issued and you should file your issue with one of those projects.

We may, in the course of resolving issues, direct you to one of these other projects. If we do so, please follow up by searching that project's issue queue (both open and closed) for your problem and, if it doesn't exist, filing an issue with them.
