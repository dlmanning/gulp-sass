'use strict';

var should = require('should');
var Vinyl = require('vinyl');
var path = require('path');
var fs = require('fs');
var sass = require('../index');
var rimraf = require('rimraf');
var gulp = require('gulp');
var sourcemaps = require('gulp-sourcemaps');
var postcss = require('gulp-postcss');
var autoprefixer = require('autoprefixer-core');
var tap = require('gulp-tap');
var globule = require('globule');

var createVinyl = function createVinyl(filename, contents) {
  var base = path.join(__dirname, 'scss');
  var filePath = path.join(base, filename);

  return new Vinyl({
    'cwd': __dirname,
    'base': base,
    'path': filePath,
    'contents': contents || fs.readFileSync(filePath)
  });
};

var normaliseEOL = function(str) {
  if (typeof(str) === 'object') {
    str = str.toString('utf8');
  }

  return str.replace(/\r\n/g, '\n');
}

describe('test helpers', function() {
  it('should normalise EOL', function(done) {
    should.equal(normaliseEOL('foo\r\nbar'), 'foo\nbar');
    should.equal(normaliseEOL('foo\nbar'), 'foo\nbar');
    done();
  });
});

describe('gulp-sass -- async compile', function() {
  it('should pass file when it isNull()', function(done) {
    var stream = sass();
    var emptyFile = {
      'isNull': function () {
        return true;
      }
    };
    stream.on('data', function(data) {
      data.should.equal(emptyFile);
      done();
    });
    stream.write(emptyFile);
  });

  it('should emit error when file isStream()', function (done) {
    var stream = sass();
    var streamFile = {
      'isNull': function () {
        return false;
      },
      'isStream': function () {
        return true;
      }
    };
    stream.on('error', function(err) {
      err.message.should.equal('Streaming not supported');
      done();
    });
    stream.write(streamFile);
  });

  it('should compile an empty sass file', function(done) {
    var sassFile = createVinyl('empty.scss');
    var stream = sass();
    stream.on('data', function(cssFile) {
      should.exist(cssFile);
      should.exist(cssFile.path);
      should.exist(cssFile.relative);
      should.exist(cssFile.contents);
      should.equal(path.basename(cssFile.path), 'empty.css');
      String(normaliseEOL(cssFile.contents)).should.equal(
        normaliseEOL(fs.readFileSync(path.join(__dirname, 'expected', 'empty.css'), 'utf8'))
      );
      done();
    });
    stream.write(sassFile);
  });

  it('should compile a single sass file', function(done) {
    var sassFile = createVinyl('mixins.scss');
    var stream = sass();
    stream.on('data', function(cssFile) {
      should.exist(cssFile);
      should.exist(cssFile.path);
      should.exist(cssFile.relative);
      should.exist(cssFile.contents);
      String(normaliseEOL(cssFile.contents)).should.equal(
        normaliseEOL(fs.readFileSync(path.join(__dirname, 'expected', 'mixins.css'), 'utf8'))
      );
      done();
    });
    stream.write(sassFile);
  });

  it('should compile multiple sass files', function(done) {
    var files = [
      createVinyl('mixins.scss'),
      createVinyl('variables.scss')
    ];
    var stream = sass();
    var mustSee = files.length;
    var expectedPath = path.join('expected', 'mixins.css');

    stream.on('data', function(cssFile) {
      should.exist(cssFile);
      should.exist(cssFile.path);
      should.exist(cssFile.relative);
      should.exist(cssFile.contents);
      if (cssFile.path.indexOf('variables') !== -1) {
        expectedPath = path.join('expected', 'variables.css');
      }
      String(normaliseEOL(cssFile.contents)).should.equal(
        normaliseEOL(fs.readFileSync(path.join(__dirname, expectedPath), 'utf8'))
      );
      mustSee--;
      if (mustSee <= 0) {
        done();
      }
    });

    files.forEach(function (file) {
      stream.write(file);
    });
  });

  it('should compile files with partials in another folder', function(done) {
    var sassFile = createVinyl('inheritance.scss');
    var stream = sass();
    stream.on('data', function(cssFile) {
      should.exist(cssFile);
      should.exist(cssFile.path);
      should.exist(cssFile.relative);
      should.exist(cssFile.contents);
      String(normaliseEOL(cssFile.contents)).should.equal(
        normaliseEOL(fs.readFileSync(path.join(__dirname, 'expected', 'inheritance.css'), 'utf8'))
      );
      done();
    });
    stream.write(sassFile);
  });

  it('should handle sass errors', function(done) {
    var errorFile = createVinyl('error.scss');
    var stream = sass();

    stream.on('error', function(err) {
      // Error must include message body
      err.message.indexOf('property "font" must be followed by a \':\'').should.not.equal(-1);
      // Error must include file error occurs in
      err.message.indexOf('test', 'scss', 'error.scss').should.not.equal(-1);
      // Error must include line and column error occurs on
      err.message.indexOf('on line 2').should.not.equal(-1);
      // Error must include relativePath property
      err.relativePath.should.equal(path.join('test', 'scss', 'error.scss'));
      done();
    });
    stream.write(errorFile);
  });

  it('should preserve the original sass error message', function(done) {
    var errorFile = createVinyl('error.scss');
    var stream = sass();

    stream.on('error', function(err) {
      // Error must include original error message
      err.messageOriginal.indexOf('property "font" must be followed by a \':\'').should.not.equal(-1);
      // Error must not format or change the original error message
      err.messageOriginal.indexOf('on line 2').should.equal(-1);
      done();
    });
    stream.write(errorFile);
  });

   it('should compile a single sass file if the file name has been changed in the stream', function(done) {
    var sassFile = createVinyl('mixins.scss');
    var stream;

    // Transform file name
    sassFile.path = path.join(path.join(__dirname, 'scss'), 'mixin--changed.scss');

    stream = sass();
    stream.on('data', function(cssFile) {
      should.exist(cssFile);
      should.exist(cssFile.path);
      cssFile.path.split(path.sep).pop().should.equal('mixin--changed.css');
      should.exist(cssFile.relative);
      should.exist(cssFile.contents);
      String(normaliseEOL(cssFile.contents)).should.equal(
        normaliseEOL(fs.readFileSync(path.join(__dirname, 'expected', 'mixins.css'), 'utf8'))
      );
      done();
    });
    stream.write(sassFile);
  });

  it('should preserve changes made in-stream to a Sass file', function(done) {
    var sassFile = createVinyl('mixins.scss');
    var stream;

    // Transform file name
    sassFile.contents = new Buffer('/* Added Dynamically */' + sassFile.contents.toString());

    stream = sass();
    stream.on('data', function(cssFile) {
      should.exist(cssFile);
      should.exist(cssFile.path);
      should.exist(cssFile.relative);
      should.exist(cssFile.contents);
      String(normaliseEOL(cssFile.contents)).should.equal('/* Added Dynamically */\n' +
        normaliseEOL(fs.readFileSync(path.join(__dirname, 'expected', 'mixins.css'), 'utf8'))
      );
      done();
    });
    stream.write(sassFile);
  });

  it('should work with gulp-sourcemaps', function(done) {
    var sassFile = createVinyl('inheritance.scss');

    // Expected sources are relative to file.base
    var expectedSources = [
      'inheritance.scss',
      'includes/_cats.scss',
      'includes/_dogs.sass',
    ];

    var stream;

    sassFile.sourceMap = '{' +
      '"version": 3,' +
      '"file": "scss/subdir/multilevelimport.scss",' +
      '"names": [],' +
      '"mappings": "",' +
      '"sources": [ "scss/subdir/multilevelimport.scss" ],' +
      '"sourcesContent": [ "@import ../inheritance;" ]' +
    '}';

    stream = sass();
    stream.on('data', function(cssFile) {
      should.exist(cssFile.sourceMap);
      cssFile.sourceMap.sources.should.eql(expectedSources);
      done();
    });
    stream.write(sassFile);
  });

  it('should compile a single indented sass file', function(done) {
    var sassFile = createVinyl('indent.sass');
    var stream = sass();
    stream.on('data', function(cssFile) {
      should.exist(cssFile);
      should.exist(cssFile.path);
      should.exist(cssFile.relative);
      should.exist(cssFile.contents);
      String(normaliseEOL(cssFile.contents)).should.equal(
        normaliseEOL(fs.readFileSync(path.join(__dirname, 'expected', 'indent.css'), 'utf8'))
      );
      done();
    });
    stream.write(sassFile);
  });

  it('should parse files in sass and scss', function(done) {
    var files = [
      createVinyl('mixins.scss'),
      createVinyl('indent.sass')
    ];
    var stream = sass();
    var mustSee = files.length;
    var expectedPath = path.join('expected', 'mixins.css');

    stream.on('data', function(cssFile) {
      should.exist(cssFile);
      should.exist(cssFile.path);
      should.exist(cssFile.relative);
      should.exist(cssFile.contents);
      if (cssFile.path.indexOf('indent') !== -1) {
        expectedPath = path.join('expected', 'indent.css');
      }
      String(normaliseEOL(cssFile.contents)).should.equal(
        normaliseEOL(fs.readFileSync(path.join(__dirname, expectedPath), 'utf8'))
      );
      mustSee--;
      if (mustSee <= 0) {
        done();
      }
    });

    files.forEach(function (file) {
      stream.write(file);
    });
  });
});

describe('gulp-sass -- sync compile', function() {
  beforeEach(function(done) {
    rimraf(path.join(__dirname, 'results'), done);
  });

  it('should pass file when it isNull()', function(done) {
    var stream = sass.sync();
    var emptyFile = {
      'isNull': function () {
        return true;
      }
    };
    stream.on('data', function(data) {
      data.should.equal(emptyFile);
      done();
    });
    stream.write(emptyFile);
  });

  it('should emit error when file isStream()', function (done) {
    var stream = sass.sync();
    var streamFile = {
      'isNull': function () {
        return false;
      },
      'isStream': function () {
        return true;
      }
    };
    stream.on('error', function(err) {
      err.message.should.equal('Streaming not supported');
      done();
    });
    stream.write(streamFile);
  });

  it('should compile a single sass file', function(done) {
    var sassFile = createVinyl('mixins.scss');
    var stream = sass.sync();
    stream.on('data', function(cssFile) {
      should.exist(cssFile);
      should.exist(cssFile.path);
      should.exist(cssFile.relative);
      should.exist(cssFile.contents);
      String(normaliseEOL(cssFile.contents)).should.equal(
        normaliseEOL(fs.readFileSync(path.join(__dirname, 'expected', 'mixins.css'), 'utf8'))
      );
      done();
    });
    stream.write(sassFile);
  });

  it('should compile multiple sass files', function(done) {
    var files = [
      createVinyl('mixins.scss'),
      createVinyl('variables.scss')
    ];
    var stream = sass.sync();
    var mustSee = files.length;
    var expectedPath = path.join('expected', 'mixins.css');

    stream.on('data', function(cssFile) {
      should.exist(cssFile);
      should.exist(cssFile.path);
      should.exist(cssFile.relative);
      should.exist(cssFile.contents);
      if (cssFile.path.indexOf('variables') !== -1) {
        expectedPath = path.join('expected', 'variables.css');
      }
      String(normaliseEOL(cssFile.contents)).should.equal(
        normaliseEOL(fs.readFileSync(path.join(__dirname, expectedPath), 'utf8'))
      );
      mustSee--;
      if (mustSee <= 0) {
        done();
      }
    });

    files.forEach(function (file) {
      stream.write(file);
    });
  });

  it('should compile files with partials in another folder', function(done) {
    var sassFile = createVinyl('inheritance.scss');
    var stream = sass.sync();
    stream.on('data', function(cssFile) {
      should.exist(cssFile);
      should.exist(cssFile.path);
      should.exist(cssFile.relative);
      should.exist(cssFile.contents);
      String(normaliseEOL(cssFile.contents)).should.equal(
        normaliseEOL(fs.readFileSync(path.join(__dirname, 'expected', 'inheritance.css'), 'utf8'))
      );
      done();
    });
    stream.write(sassFile);
  });

  it('should handle sass errors', function(done) {
    var errorFile = createVinyl('error.scss');
    var stream = sass.sync();

    stream.on('error', function(err) {
      err.message.indexOf('property "font" must be followed by a \':\'').should.not.equal(-1);
      err.relativePath.should.equal(path.join('test', 'scss', 'error.scss'));
      done();
    });
    stream.write(errorFile);
  });

  it('should work with gulp-sourcemaps', function(done) {
    var sassFile = createVinyl('inheritance.scss');

    // Expected sources are relative to file.base
    var expectedSources = [
      'inheritance.scss',
      'includes/_cats.scss',
      'includes/_dogs.sass',
    ];

    var stream;

    sassFile.sourceMap = '{' +
      '"version": 3,' +
      '"file": "scss/subdir/multilevelimport.scss",' +
      '"names": [],' +
      '"mappings": "",' +
      '"sources": [ "scss/subdir/multilevelimport.scss" ],' +
      '"sourcesContent": [ "@import ../inheritance;" ]' +
    '}';

    stream = sass.sync();
    stream.on('data', function(cssFile) {
      should.exist(cssFile.sourceMap);
      cssFile.sourceMap.sources.should.eql(expectedSources);
      done();
    });
    stream.write(sassFile);
  });

  it('should work with gulp-sourcemaps and autoprefixer', function(done) {
    var expectedSourcesBefore = [
      'inheritance.scss',
      'includes/_cats.scss',
      'includes/_dogs.sass',
    ];

    var expectedSourcesAfter = [
      'includes/_cats.scss',
      'includes/_dogs.sass',
      'inheritance.scss',
    ];

    gulp.src(path.join(__dirname, 'scss', 'inheritance.scss'))
      .pipe(sourcemaps.init())
      .pipe(sass.sync())
      .pipe(tap(function(file) {
        should.exist(file.sourceMap);
        file.sourceMap.sources.should.eql(expectedSourcesBefore);
      }))
      .pipe(postcss([autoprefixer()]))
      .pipe(sourcemaps.write())
      .pipe(gulp.dest(path.join(__dirname, 'results')))
      .pipe(tap(function(file) {
        should.exist(file.sourceMap);
        file.sourceMap.sources.should.eql(expectedSourcesAfter);
      }))
      .on('end', done);
  });

  it('should work with gulp-sourcemaps and a globbed source', function(done) {
    var files, filesContent, actualContent, expectedContent, globPath;
    globPath = path.join(__dirname, 'scss', 'globbed');
    files = globule.find(path.join(__dirname, 'scss', 'globbed', '**', '*.scss'));
    filesContent = {};

    files.forEach(function(file) {
      var source = path.normalize(path.relative(globPath, file));
      filesContent[source] = fs.readFileSync(file, 'utf8');
    });

    gulp.src(path.join(__dirname, 'scss', 'globbed', '**', '*.scss'))
      .pipe(sourcemaps.init())
      .pipe(sass.sync())
      .pipe(tap(function(file) {
        should.exist(file.sourceMap);
        actualContent = normaliseEOL(file.sourceMap.sourcesContent[0]);
        expectedContent = normaliseEOL(filesContent[path.normalize(file.sourceMap.sources[0])]);
        actualContent.should.eql(expectedContent);
      }))
      .on('end', done);
  });

  it('should work with gulp-sourcemaps and autoprefixer with different file.base', function(done) {
    var expectedSourcesBefore = [
      'scss/inheritance.scss',
      'scss/includes/_cats.scss',
      'scss/includes/_dogs.sass'
    ];

    var expectedSourcesAfter = [
      'scss/includes/_cats.scss',
      'scss/includes/_dogs.sass',
      'scss/inheritance.scss'
    ];

    gulp.src(path.join(__dirname, 'scss', 'inheritance.scss'), { 'base': 'test' })
      .pipe(sourcemaps.init())
      .pipe(sass.sync())
      .pipe(tap(function(file) {
        should.exist(file.sourceMap);
        file.sourceMap.sources.should.eql(expectedSourcesBefore);
      }))
      .pipe(postcss([autoprefixer()]))
      .pipe(tap(function(file) {
        should.exist(file.sourceMap);
        file.sourceMap.sources.should.eql(expectedSourcesAfter);
      }))
      .on('end', done);
  });

  it('should work with empty files', function(done) {
    gulp.src(path.join(__dirname, 'scss', 'empty.scss'))
      .pipe(sass.sync())
      .pipe(gulp.dest(path.join(__dirname, 'results')))
      .pipe(tap(function() {
        try {
          fs.statSync(path.join(__dirname, 'results', 'empty.css'));
        }
        catch (e) {
          should.fail(false, true, 'Empty file was produced');
        }
      }))
      .on('end', done);
  });
});
