# gulp-sass ![Build status](https://img.shields.io/travis/dlmanning/gulp-sass) [![Join the chat at https://gitter.im/dlmanning/gulp-sass](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/dlmanning/gulp-sass?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge) ![Node support](https://img.shields.io/node/v/gulp-sass) ![NPM package version](https://img.shields.io/npm/v/gulp-sass?label=npm%20version)

Sass plugin for [Gulp](https://github.com/gulpjs/gulp).

**_Before filing an issue, please make sure you have [updated to the latest version of `gulp-sass`](https://github.com/dlmanning/gulp-sass/wiki/Update-to-the-latest-Gulp-Sass) and have gone through our [Common Issues and Their Fixes](https://github.com/dlmanning/gulp-sass/wiki/Common-Issues-and-Their-Fixes) section._**

**Migrating your existing project to version 5? Please read our (short!) [migration guide](#migrating-to-version-5).**

## Support

Only [Active LTS and Current releases][1] are supported.

[1]: https://github.com/nodejs/Release#release-schedule

## Installation

To use `gulp-sass`, you must install both `gulp-sass` itself *and* a Sass compiler. `gulp-sass` supports both [Dart Sass][] and [Node Sass][], but Node Sass is [deprecated](https://sass-lang.com/blog/libsass-is-deprecated). We recommend that you use Dart Sass for new projects, and migrate Node Sass projects to Dart Sass when possible.

Whichever compiler you choose, it's best to install these as dev dependencies:

```
npm install sass gulp-sass --save-dev
```

## Usage

**Note:** These examples assume you're using Gulp 4. For examples that work with Gulp 3, [check the docs for an earlier version of `gulp-sass`](https://github.com/dlmanning/gulp-sass/tree/v4.1.1).

`gulp-sass` runs inside of Gulp tasks. No matter what else you do with `gulp-sass`, you must first import it into your gulpfile, making sure to pass it the compiler of your choice. From there, create a Gulp task that calls either `sass()` (to asynchronously render your CSS), or `sass.sync()` (to render it synchronously). Then, export your task with the `export` keyword. We'll show some examples of how to do that.

**⚠️ Note:** With Dart Sass, **synchronous rendering is twice as fast as asynchronous rendering**. The Sass team is exploring ways to improve asynchronous rendering with Dart Sass, but for now you will get the best performance from `sass.sync()`

### Render your CSS

To render your CSS with a build task, then watch your files for changes, you might write something like this.:

```javascript
'use strict';

var gulp = require('gulp');
var sass = require('gulp-sass')(require('sass'));

function buildStyles() {
  return gulp.src('./sass/**/*.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(gulp.dest('./css'));
};

exports.buildStyles = buildStyles;
exports.watch = function () {
  gulp.watch('./sass/**/*.scss', ['sass']);
};
```

With synchronous rendering, that Gulp task looks like this:

``` javascript
function buildStyles() {
  return gulp.src('./sass/**/*.scss')
    .pipe(sass.sync().on('error', sass.logError))
    .pipe(gulp.dest('./css'));
};
```

### Render with options

To change the final output of your CSS, you can pass an options object to your renderer. `gulp-sass` supports [Node Sass's render options](https://github.com/sass/node-sass#options), with two unsupported exceptions:

- The `data` option, which is used by `gulp-sass` internally.
- The `file` option, which has undefined behavior that may change without notice.

For example, to compress your CSS, you can call `sass({outputStyle: 'compressed'}`. In the context of a Gulp task, that looks like this:

```javascript
function buildStyles() {
  return gulp.src('./sass/**/*.scss')
    .pipe(sass({outputStyle: 'compressed'}).on('error', sass.logError))
    .pipe(gulp.dest('./css'));
};

exports.buildStyles = buildStyles;
```

Or this for synchronous rendering:

```javascript
function buildStyles() {
  return gulp.src('./sass/**/*.scss')
    .pipe(sass.sync({outputStyle: 'compressed'}).on('error', sass.logError))
    .pipe(gulp.dest('./css'));
};

exports.buildStyles = buildStyles;
```

### Include a source map

`gulp-sass` can be used in tandem with [`gulp-sourcemaps`](https://github.com/floridoo/gulp-sourcemaps) to generate source maps for the Sass-to-CSS compilation. You will need to initialize `gulp-sourcemaps` _before_ running `gulp-sass`, and write the source maps after.

```javascript
var sourcemaps = require('gulp-sourcemaps');

function buildStyles() {
  return gulp.src('./sass/**/*.scss')
    .pipe(sourcemaps.init())
    .pipe(sass().on('error', sass.logError))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('./css'));
}

exports.buildStyles = buildStyles;
```

By default, `gulp-sourcemaps` writes the source maps inline, in the compiled CSS files. To write them to a separate file, specify a path relative to the `gulp.dest()` destination in the `sourcemaps.write()` function.

```javascript
var sourcemaps = require('gulp-sourcemaps');

function buildStyles() {
  return gulp.src('./sass/**/*.scss')
    .pipe(sourcemaps.init())
    .pipe(sass().on('error', sass.logError))
    .pipe(sourcemaps.write('./maps'))
    .pipe(gulp.dest('./css'));
};

exports.buildStyles = buildStyles;
```

<h2 id="migrating-to-version-5">Migrating to version 5</h2>

`gulp-sass` version 5 requires Node 12 or later, and introduces some breaking changes. Additionally, changes in Node itself mean that we should no longer use Node fibers to speed up asynchronous rendering with Dart Sass.

### Setting a Sass compiler

As of version 5, `gulp-sass` _does not include a default Sass compiler_, so you must install one (either `node-sass` or `sass`) along with `gulp-sass`.

```
npm install sass gulp-sass --save-dev
```

Then, you must explicitly set that compiler in your gulpfille. Instead of setting a `compiler` prop on the `gulp-sass` instance, you pass the compiler into a function call when instantiating `gulp-sass`.

These changes look something like this:

``` diff
- var sass = require('gulp-sass'));
- var compiler = require('sass');
- sass.compiler = compiler;
+ var sass = require('gulp-sass')(require('sass'));
```

### What about fibers?

We used to recommend Node fibers as a way to speed up asynchronous rendering with Dart Sass. Unfortunately, [Node fibers are discontinued](https://sass-lang.com/blog/node-fibers-discontinued). The Sass team is exploring its optons for future performance improvements, but for now you will get the best performance from `sass.sync()`.

## Issues

`gulp-sass` is a light-weight wrapper around either [Dart Sass][] or [Node Sass][] (which in turn is a Node binding for [LibSass][]. Because of this, the issue you're having likely isn't a `gulp-sass` issue, but an issue with one those projects or with [Sass][] as a whole.

If you have a feature request/question how Sass works/concerns on how your Sass gets compiled/errors in your compiling, it's likely a Dart Sass or LibSass issue and you should file your issue with one of those projects.

If you're having problems with the options you're passing in, it's likely a Dart Sass or Node Sass issue and you should file your issue with one of those projects.

We may, in the course of resolving issues, direct you to one of these other projects. If we do so, please follow up by searching that project's issue queue (both open and closed) for your problem and, if it doesn't exist, filing an issue with them.

[Dart Sass]: http://sass-lang.com/dart-sass
[LibSass]: https://sass-lang.com/libsass
[Node Sass]: https://github.com/sass/node-sass
[Sass]: https://sass-lang.com
