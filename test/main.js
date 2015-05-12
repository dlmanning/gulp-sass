'use strict';

var should = require('should');
var gutil = require('gulp-util');
var path = require('path');
var fs = require('fs');
var sass = require('../index');
var gulp = require('gulp');
var sourcemaps = require('gulp-sourcemaps');
var postcss = require('gulp-postcss');
var autoprefixer = require('autoprefixer-core');
var tap = require('gulp-tap');

var createVinyl = function createVinyl(filename, contents) {
  var base = path.join(__dirname, 'scss');
  var filePath = path.join(base, filename);

  return new gutil.File({
    'cwd': __dirname,
    'base': base,
    'path': filePath,
    'contents': contents || fs.readFileSync(filePath)
  });
};

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

  it('should compile a single sass file', function(done) {
    var sassFile = createVinyl('mixins.scss');
    var stream = sass();
    stream.on('data', function(cssFile) {
      should.exist(cssFile);
      should.exist(cssFile.path);
      should.exist(cssFile.relative);
      should.exist(cssFile.contents);
      String(cssFile.contents).should.equal(
        fs.readFileSync(path.join(__dirname, 'expected/mixins.css'), 'utf8')
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
    var expectedPath = 'expected/mixins.css';

    stream.on('data', function(cssFile) {
      should.exist(cssFile);
      should.exist(cssFile.path);
      should.exist(cssFile.relative);
      should.exist(cssFile.contents);
      if (cssFile.path.indexOf('variables') !== -1) {
        expectedPath = 'expected/variables.css';
      }
      String(cssFile.contents).should.equal(
        fs.readFileSync(path.join(__dirname, expectedPath), 'utf8')
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
      String(cssFile.contents).should.equal(
        fs.readFileSync(path.join(__dirname, 'expected/inheritance.css'), 'utf8')
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
      err.message.indexOf('test/scss/error.scss').should.not.equal(-1);
      // Error must include line and column error occurs on
      err.message.indexOf('2:7').should.not.equal(-1);
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
      cssFile.path.split('/').pop().should.equal('mixin--changed.css');
      should.exist(cssFile.relative);
      should.exist(cssFile.contents);
      String(cssFile.contents).should.equal(
        fs.readFileSync(path.join(__dirname, 'expected/mixins.css'), 'utf8')
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
      String(cssFile.contents).should.equal('/* Added Dynamically */\n' +
        fs.readFileSync(path.join(__dirname, 'expected/mixins.css'), 'utf8')
      );
      done();
    });
    stream.write(sassFile);
  });

  it('should work with gulp-sourcemaps', function(done) {
    var sassFile = createVinyl('inheritance.scss');

    // Expected sources are relative to file.base
    var expectedSources = [
      'includes/_cats.scss',
      'includes/_dogs.sass',
      'inheritance.scss'
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
      String(cssFile.contents).should.equal(
        fs.readFileSync(path.join(__dirname, 'expected/indent.css'), 'utf8')
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
    var expectedPath = 'expected/mixins.css';

    stream.on('data', function(cssFile) {
      should.exist(cssFile);
      should.exist(cssFile.path);
      should.exist(cssFile.relative);
      should.exist(cssFile.contents);
      if (cssFile.path.indexOf('indent') !== -1) {
        expectedPath = 'expected/indent.css';
      }
      String(cssFile.contents).should.equal(
        fs.readFileSync(path.join(__dirname, expectedPath), 'utf8')
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
      String(cssFile.contents).should.equal(
        fs.readFileSync(path.join(__dirname, 'expected/mixins.css'), 'utf8')
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
    var expectedPath = 'expected/mixins.css';

    stream.on('data', function(cssFile) {
      should.exist(cssFile);
      should.exist(cssFile.path);
      should.exist(cssFile.relative);
      should.exist(cssFile.contents);
      if (cssFile.path.indexOf('variables') !== -1) {
        expectedPath = 'expected/variables.css';
      }
      String(cssFile.contents).should.equal(
        fs.readFileSync(path.join(__dirname, expectedPath), 'utf8')
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
      String(cssFile.contents).should.equal(
        fs.readFileSync(path.join(__dirname, 'expected/inheritance.css'), 'utf8')
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
      done();
    });
    stream.write(errorFile);
  });

  it('should work with gulp-sourcemaps', function(done) {
    var sassFile = createVinyl('inheritance.scss');

    // Expected sources are relative to file.base
    var expectedSources = [
      'includes/_cats.scss',
      'includes/_dogs.sass',
      'inheritance.scss'
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
    var expectedSources = [
      'includes/_cats.scss',
      'includes/_dogs.sass',
      'inheritance.scss'
    ];

    gulp.src(path.join(__dirname, '/scss/inheritance.scss'))
      .pipe(sourcemaps.init())
      .pipe(sass.sync())
      .pipe(tap(function(file) {
        should.exist(file.sourceMap);
        file.sourceMap.sources.should.eql(expectedSources);
      }))
      .pipe(postcss([autoprefixer()]))
      .pipe(sourcemaps.write())
      .pipe(gulp.dest(path.join(__dirname, '/results/')))
      .pipe(tap(function(file) {
        should.exist(file.sourceMap);
        file.sourceMap.sources.should.eql(expectedSources);
      }))
      .on('end', done);
  });
});
