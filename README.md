# gulp-sass-extended 

[![fork of gulp-sass](https://img.shields.io/badge/Fork_of-gulp--sass-blue.svg)](https://github.com/dlmanning/gulp-sass)


> __This project is an fork of gulp-sass__  
> so look at first original version - [https://github.com/dlmanning/gulp-sass](https://github.com/dlmanning/gulp-sass)

## Options and features

They work the same as [the original >](https://github.com/dlmanning/gulp-sass#options)

## Extended options

### `addVariables`

type `Object`  
default `undefined`  

Add your custom vars in gulp task.

> This option is useful only if you calculate some conditions and want to add result values to sass render.  
Static properties are easier to set in the files themselves.

Little details about values for this option:

- each property - will be Sass variable;
- if inner property will be an array - it's make [Sass list](http://sass-lang.com/documentation/file.SASS_REFERENCE.html#lists),
- if object - [Sass map](http://sass-lang.com/documentation/file.SASS_REFERENCE.html#maps)
- *__Note__ You should not have more than one level of nesting in objects and arrays. Otherwise you will receive incorrect data*



Usage example

```js
var gulp = require('gulp');
var sassExtended = require('gulp-sass-extended');


gulp.task('styles', function() {
	
	var taskOptions = {
		// original gulp-sass options
		// ...
		addVariables: {
			PRODUCTION: yourProductionValue,
			someOtherDynamicVar: calculatedValue, // '12px' for example
			myColorsMap: {
				color1: 'blue',
				color2: 'yellow',
			},
			pointList: [
				'1024px',
				'1280px',
				'1366px'
			]
		}
	};
	
	return gulp.src('./src/styles/*.scss')
		.pipe( sassExtended(taskOptions) )
		.pipe( gulp.dest('./dist/css') );
});
```

In *.scss files before send to node-sass render, will be added part of code with your vars in file content beginning 

```scss
/* generated */ $PRODUCTION: true;
/* generated */ $someOtherDynamicVar: 12px;
/* generated */ $myColorsMap: (color1: blue, color2: yellow);
/* generated */ $pointList: (1024px, 1280px, 1366px);
/// then your code from file
```

If the content of your *.scss contains the `@charset` directive, the variables will be inserted after this directive

##### _Impact on sourcemaps_

You will notice some inconsistencies in line numbers in sourcemaps and in the original files. The more you add variables, the greater this discrepancy, because you will shift down the main content of the file.


### `errorHandler(error, throughCallback)`

type `function`  
default `undefined`  

- `error {:Error}` emitted by `node-sass` - see https://github.com/sass/node-sass#error-object
- `throughCallback {:function}` - callback which you must call after doing your actions, first argument - your new error data;

Add your custom method to handle errors.


### `afterRender(result, renderedFile)`

type `function`  
default `undefined`  

- `result {:Object}` - result of the `node-sass` render call - see https://github.com/sass/node-sass#result-object
- `renderedFile {:Buffer}` - .scss file which was rendered;

Do with it whatever you want on your own risk )))) 
 
Remember that `result` is a reference to an object that will be further processed taking into account the use of sourcemaps and saving new css files  
 _And the changes inside it will also be in the main object_

## Tests

Here only original tests from the gulp-sass

## Contributing

__This project is an fork of gulp-sass__  
so look at first original - [gulp-sass/CONTRIBUTING.md](https://github.com/dlmanning/gulp-sass/blob/master/CONTRIBUTING.md)

If you have problems with the tools that were added in `gulp-sass-extended` version then go here [gulp-sass-extended/issues](https://github.com/dutchenkoOleg/gulp-sass-extended/issues)
