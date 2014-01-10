gulp-sass
=========
[![Build Status](https://travis-ci.org/dlmanning/gulp-sass.png?branch=master)](https://travis-ci.org/dlmanning/gulp-sass)
[![NPM version](https://badge.fury.io/js/gulp-stylus.png)](http://badge.fury.io/js/gulp-stylus)

> Compile [sass](https://github.com/andrew/node-sass) files with [gulp](http://github.com/gulpjs/gulp)

<table>
<tr> 
<td>Package</td><td>gulp-sass</td>
</tr>
<tr>
<td>Description</td>
<td>SASS plugin for gulp</td>
</tr>
<tr>
<td>Node Version</td>
<td>>= 0.8</td>
</tr>
<tr>
<td>Gulp Version</td>
<td>3.x</td>
</tr>
</table>

# Usage

##Install

```
npm install gulp-sass --save
```

#Example

Something like this:

```javascript
var gulp = require('gulp');
var sass = require('gulp-sass')

gulp.task('sass', function () {
	gulp.src('./scss/*.scss')
		.pipe(sass())
		.pipe(gulp.dest('./css'));
});
```

Options passed as a Buffer into ```sass()``` will be passed along to [```node-sass```](https://github.com/andrew/node-sass)

