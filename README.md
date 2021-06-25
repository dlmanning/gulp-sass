# gulp-sass [![Build Status](https://travis-ci.org/dlmanning/gulp-sass.svg?branch=master)](https://travis-ci.org/dlmanning/gulp-sass) [![Join the chat at https://gitter.im/dlmanning/gulp-sass](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/dlmanning/gulp-sass?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge) [![npm version](https://badge.fury.io/js/gulp-sass.svg)](http://badge.fury.io/js/gulp-sass)

Sass plugin for [Gulp](https://github.com/gulpjs/gulp).

**_Before filing an issue, please make sure you have [Updated to the latest Gulp Sass](https://github.com/dlmanning/gulp-sass/wiki/Update-to-the-latest-Gulp-Sass) and have gone through our [Common Issues and Their Fixes](https://github.com/dlmanning/gulp-sass/wiki/Common-Issues-and-Their-Fixes) section._**

## Support

Only [Active LTS and Current releases][1] are supported.

[1]: https://github.com/nodejs/Release#release-schedule

## Installation

To use `gulp-sass`, you must install both `gulp-sass` itself *and* a Sass compiler. `gulp-sass` supports both [Dart Sass][] and [Node Sass][], but Node Sass is [deprecated](https://sass-lang.com/blog/libsass-is-deprecated). We recommend that you use Dart Sass for new projects, and migrate Node Sass projects to Dart Sass when possible.

Whichever compiler you choose, it's best to install these as dev dependencies:

```
npm install sass gulp-sass --save-dev
```

## Basic usage: render your Sass

You need to import `gulp-sass` into your gulpfile and pass it the compiler of your choice. From there, you can call `sass()` inside `gulp.pipe()` to asynchronously render your Sass into CSS. To render your CSS synchronously, you can call `sass.sync()`.

**⚠️ Note:** With Dart Sass, asynchronous rendering is much slower than synchronous rendering. If you're using Dart Sass, you're better off using synchronous rendering.

Rendering your Sass in a Gulp task looks something like this:

```javascript
'use strict';

var gulp = require('gulp');
var sass = require('gulp-sass')(require('sass'));

  gulp.task('sass', function() {
    return gulp.src('./sass/**/*.scss')
      .pipe(sass().on('error', sass.logError))
      .pipe(gulp.dest('./css'));
  });

  gulp.task('sass:watch', function() {
    gulp.watch('./sass/**/*.scss', ['sass']);
  });
```

With synchronous rendering, that Gulp task looks like this:

``` javascript
gulp.task('sass', function() {
  return gulp.src('./sass/**/*.scss')
    .pipe(sass.sync().on('error', sass.logError))
    .pipe(gulp.dest('./css'));
});
```

## Render with options

To change the final output of your CSS, you can pass an options object to your renderer. `gulp-sass` supports [Node Sass's render options](https://github.com/sass/node-sass#options), with two unsupported exceptions:

- The `data` option, which is used by `gulp-sass` internally.
- The `file` option, which has undefined behavior that may change without notice.

For example, to compress your CSS, you can call `sass({outputStyle: 'compressed'}`. In the context of a Gulp task, that looks like this:

```javascript
gulp.task('sass', function() {
 return gulp.src('./sass/**/*.scss')
   .pipe(sass({outputStyle: 'compressed'}).on('error', sass.logError))
   .pipe(gulp.dest('./css'));
});
```

Or this for synchronous rendering:

```javascript
gulp.task('sass', function() {
 return gulp.src('./sass/**/*.scss')
   .pipe(sass.sync({outputStyle: 'compressed'}).on('error', sass.logError))
   .pipe(gulp.dest('./css'));
});
```

## Source maps

`gulp-sass` can be used in tandem with [`gulp-sourcemaps`](https://github.com/floridoo/gulp-sourcemaps) to generate source maps for the Sass-to-CSS compilation. You will need to initialize `gulp-sourcemaps` _before_ running `gulp-sass`, and write the source maps after.

```javascript
var sourcemaps = require('gulp-sourcemaps');

gulp.task('sass', function() {
 return gulp.src('./sass/**/*.scss')
  .pipe(sourcemaps.init())
  .pipe(sass().on('error', sass.logError))
  .pipe(sourcemaps.write())
  .pipe(gulp.dest('./css'));
});
```

By default, `gulp-sourcemaps` writes the source maps inline, in the compiled CSS files. To write them to a separate file, specify a path relative to the `gulp.dest()` destination in the `sourcemaps.write()` function.

```javascript
var sourcemaps = require('gulp-sourcemaps');
gulp.task('sass', function() {
 return gulp.src('./sass/**/*.scss')
  .pipe(sourcemaps.init())
  .pipe(sass().on('error', sass.logError))
  .pipe(sourcemaps.write('./maps'))
  .pipe(gulp.dest('./css'));
});
```

## Issues

`gulp-sass` is a light-weight wrapper around either [Dart Sass][] or [Node Sass][] (which in turn is a Node binding for [LibSass][]. Because of this, the issue you're having likely isn't a `gulp-sass` issue, but an issue with one those projects or with [Sass][] as a whole.

If you have a feature request/question how Sass works/concerns on how your Sass gets compiled/errors in your compiling, it's likely a Dart Sass or LibSass issue and you should file your issue with one of those projects.

If you're having problems with the options you're passing in, it's likely a Dart Sass or Node Sass issue and you should file your issue with one of those projects.

We may, in the course of resolving issues, direct you to one of these other projects. If we do so, please follow up by searching that project's issue queue (both open and closed) for your problem and, if it doesn't exist, filing an issue with them.

[Dart Sass]: http://sass-lang.com/dart-sass
[LibSass]: https://sass-lang.com/libsass
[Node Sass]: https://github.com/sass/node-sass
[Sass]: https://sass-lang.com