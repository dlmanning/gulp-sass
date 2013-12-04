gulp-sass
=========

SASS plugin for [gulp](https://github.com/wearefractal/gulp).

#Install

```
npm install gulp-sass
```

#Usage

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

Options passed as a hash into ```sass()``` will be passed along to [```node-sass```](https://github.com/andrew/node-sass)

