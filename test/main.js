'use strict';

const assert = require('assert').strict;
const fs = require('fs');
const path = require('path');
const Vinyl = require('vinyl');
const rimraf = require('rimraf');
const gulp = require('gulp');
const sourcemaps = require('gulp-sourcemaps');
const postcss = require('gulp-postcss');
const autoprefixer = require('autoprefixer');
const tap = require('gulp-tap');
const globule = require('globule');

const COMPILER = process.argv.includes('--sass') ? 'sass' : 'node-sass';

// eslint-disable-next-line import/no-dynamic-require
const sass = require('../index')(require(COMPILER));

const expectedTestsPath = COMPILER === 'sass' ? 'expected-sass' : 'expected';

const createVinyl = (filename, contents) => {
  const base = path.join(__dirname, 'scss');
  const filePath = path.join(base, filename);

  return new Vinyl({
    cwd: __dirname,
    base,
    path: filePath,
    contents: contents || fs.readFileSync(filePath),
  });
};

const normaliseEOL = (str) => str.toString('utf8').replace(/\r\n/g, '\n');

describe('test helpers', () => {
  it('should normalise EOL', (done) => {
    assert.equal(normaliseEOL('foo\r\nbar'), 'foo\nbar');
    assert.equal(normaliseEOL('foo\nbar'), 'foo\nbar');
    done();
  });
});

describe('gulp-sass -- async compile', () => {
  it('should pass file when it isNull()', (done) => {
    const stream = sass();
    const emptyFile = {
      isNull: () => true,
    };
    stream.on('data', (data) => {
      assert.deepEqual(data, emptyFile);
      done();
    });
    stream.write(emptyFile);
  });

  it('should emit error when file isStream()', (done) => {
    const stream = sass();
    const streamFile = {
      isNull: () => false,
      isStream: () => true,
    };
    stream.on('error', (err) => {
      assert.equal(err.message, 'Streaming not supported');
      done();
    });
    stream.write(streamFile);
  });

  it('should compile an empty sass file', (done) => {
    const sassFile = createVinyl('empty.scss');
    const stream = sass();
    stream.on('data', (cssFile) => {
      assert.ok(cssFile);
      assert.ok(cssFile.path);
      assert.ok(cssFile.relative);
      assert.ok(cssFile.contents);
      assert.equal(path.basename(cssFile.path), 'empty.css');

      const actual = fs.readFileSync(path.join(__dirname, expectedTestsPath, 'empty.css'), 'utf8');
      assert.equal(String(normaliseEOL(cssFile.contents)), normaliseEOL(actual));
      done();
    });
    stream.write(sassFile);
  });

  it('should compile a single sass file', (done) => {
    const sassFile = createVinyl('mixins.scss');
    const stream = sass();
    stream.on('data', (cssFile) => {
      assert.ok(cssFile);
      assert.ok(cssFile.path);
      assert.ok(cssFile.relative);
      assert.ok(cssFile.contents);

      const actual = fs.readFileSync(path.join(__dirname, expectedTestsPath, 'mixins.css'), 'utf8');
      assert.equal(String(normaliseEOL(cssFile.contents)), normaliseEOL(actual));
      done();
    });
    stream.write(sassFile);
  });

  it('should compile multiple sass files', (done) => {
    const files = [
      createVinyl('mixins.scss'),
      createVinyl('variables.scss'),
    ];
    const stream = sass();
    let mustSee = files.length;
    let expectedPath = path.join(expectedTestsPath, 'mixins.css');

    stream.on('data', (cssFile) => {
      assert.ok(cssFile);
      assert.ok(cssFile.path);
      assert.ok(cssFile.relative);
      assert.ok(cssFile.contents);
      if (cssFile.path.includes('variables')) {
        expectedPath = path.join(expectedTestsPath, 'variables.css');
      }

      const actual = fs.readFileSync(path.join(__dirname, expectedPath), 'utf8');
      assert.equal(String(normaliseEOL(cssFile.contents)), normaliseEOL(actual));

      mustSee -= 1;
      if (mustSee <= 0) {
        done();
      }
    });

    files.forEach((file) => {
      stream.write(file);
    });
  });

  it('should compile files with partials in another folder', (done) => {
    const sassFile = createVinyl('inheritance.scss');
    const stream = sass();
    stream.on('data', (cssFile) => {
      assert.ok(cssFile);
      assert.ok(cssFile.path);
      assert.ok(cssFile.relative);
      assert.ok(cssFile.contents);

      const actual = fs.readFileSync(path.join(__dirname, expectedTestsPath, 'inheritance.css'), 'utf8');
      assert.equal(String(normaliseEOL(cssFile.contents)), normaliseEOL(actual));
      done();
    });
    stream.write(sassFile);
  });

  it('should emit logError on sass error', (done) => {
    const errorFile = createVinyl('error.scss');
    const stream = sass();

    stream.on('error', sass.logError);
    stream.on('end', done);
    stream.write(errorFile);
  });

  it('should handle sass errors', (done) => {
    const errorFile = createVinyl('error.scss');
    const stream = sass();

    stream.on('error', (err) => {
      // Error must include message body
      const messageBody = COMPILER === 'sass'
        ? 'Error: expected "{"'
        : 'property "font" must be followed by a \':\'';
      assert.equal(err.message.includes(messageBody), true);
      // Error must include file error occurs in
      assert.equal(err.message.includes(path.normalize('test/scss/error.scss')), true);
      // Error must include relativePath property
      assert.equal(err.relativePath, path.join('test', 'scss', 'error.scss'));
      done();
    });
    stream.write(errorFile);
  });

  it('should preserve the original sass error message', (done) => {
    const errorFile = createVinyl('error.scss');
    const stream = sass();

    stream.on('error', (err) => {
      // Error must include original error message
      const message = COMPILER === 'sass'
        ? 'expected "{"'
        : 'property "font" must be followed by a \':\'';
      assert.equal(err.messageOriginal.includes(message), true);
      // Error must not format or change the original error message
      assert.equal(err.messageOriginal.includes('on line 2'), false);
      done();
    });
    stream.write(errorFile);
  });

  it('should compile a single sass file if the file name has been changed in the stream', (done) => {
    const sassFile = createVinyl('mixins.scss');
    // Transform file name
    sassFile.path = path.join(path.join(__dirname, 'scss'), 'mixin--changed.scss');

    const stream = sass();
    stream.on('data', (cssFile) => {
      assert.ok(cssFile);
      assert.ok(cssFile.path);
      assert.equal(cssFile.path.split(path.sep).pop(), 'mixin--changed.css');
      assert.ok(cssFile.relative);
      assert.ok(cssFile.contents);

      const actual = fs.readFileSync(path.join(__dirname, expectedTestsPath, 'mixins.css'), 'utf8');
      assert.equal(String(normaliseEOL(cssFile.contents)), normaliseEOL(actual));
      done();
    });
    stream.write(sassFile);
  });

  it('should preserve changes made in-stream to a Sass file', (done) => {
    const sassFile = createVinyl('mixins.scss');
    // Transform file name
    sassFile.contents = Buffer.from(`/* Added Dynamically */${sassFile.contents.toString()}`);

    const stream = sass();
    stream.on('data', (cssFile) => {
      assert.ok(cssFile);
      assert.ok(cssFile.path);
      assert.ok(cssFile.relative);
      assert.ok(cssFile.contents);

      const actual = fs.readFileSync(path.join(__dirname, expectedTestsPath, 'mixins.css'), 'utf8');
      assert.equal(String(normaliseEOL(cssFile.contents)), `/* Added Dynamically */\n${normaliseEOL(actual)}`);
      done();
    });
    stream.write(sassFile);
  });

  it('should work with gulp-sourcemaps', (done) => {
    const sassFile = createVinyl('inheritance.scss');

    sassFile.sourceMap = '{'
      + '"version": 3,'
      + '"file": "scss/subdir/multilevelimport.scss",'
      + '"names": [],'
      + '"mappings": "",'
      + '"sources": [ "scss/subdir/multilevelimport.scss" ],'
      + '"sourcesContent": [ "@import ../inheritance;" ]'
    + '}';

    // Expected sources are relative to file.base
    const expectedSources = [
      'inheritance.scss',
      'includes/_cats.scss',
      'includes/_dogs.sass',
    ];

    const stream = sass();
    stream.on('data', (cssFile) => {
      assert.ok(cssFile.sourceMap);
      assert.deepEqual(cssFile.sourceMap.sources.sort(), expectedSources.sort());
      done();
    });
    stream.write(sassFile);
  });

  it('should compile a single indented sass file', (done) => {
    const sassFile = createVinyl('indent.sass');
    const stream = sass();
    stream.on('data', (cssFile) => {
      assert.ok(cssFile);
      assert.ok(cssFile.path);
      assert.ok(cssFile.relative);
      assert.ok(cssFile.contents);

      const actual = fs.readFileSync(path.join(__dirname, expectedTestsPath, 'indent.css'), 'utf8');
      assert.equal(String(normaliseEOL(cssFile.contents)), normaliseEOL(actual));
      done();
    });
    stream.write(sassFile);
  });

  it('should parse files in sass and scss', (done) => {
    const files = [
      createVinyl('mixins.scss'),
      createVinyl('indent.sass'),
    ];
    const stream = sass();
    let mustSee = files.length;
    let expectedPath = path.join(expectedTestsPath, 'mixins.css');

    stream.on('data', (cssFile) => {
      assert.ok(cssFile);
      assert.ok(cssFile.path);
      assert.ok(cssFile.relative);
      assert.ok(cssFile.contents);
      if (cssFile.path.includes('indent')) {
        expectedPath = path.join(expectedTestsPath, 'indent.css');
      }

      const actual = fs.readFileSync(path.join(__dirname, expectedPath), 'utf8');
      assert.equal(String(normaliseEOL(cssFile.contents)), normaliseEOL(actual));

      mustSee -= 1;
      if (mustSee <= 0) {
        done();
      }
    });

    files.forEach((file) => {
      stream.write(file);
    });
  });
});

describe('gulp-sass -- sync compile', () => {
  beforeEach((done) => {
    rimraf(path.join(__dirname, 'results'), done);
  });

  it('should pass file when it isNull()', (done) => {
    const stream = sass.sync();
    const emptyFile = {
      isNull: () => true,
    };
    stream.on('data', (data) => {
      assert.deepEqual(data, emptyFile);
      done();
    });
    stream.write(emptyFile);
  });

  it('should emit error when file isStream()', (done) => {
    const stream = sass.sync();
    const streamFile = {
      isNull: () => false,
      isStream: () => true,
    };
    stream.on('error', (err) => {
      assert.equal(err.message, 'Streaming not supported');
      done();
    });
    stream.write(streamFile);
  });

  it('should compile a single sass file', (done) => {
    const sassFile = createVinyl('mixins.scss');
    const stream = sass.sync();
    stream.on('data', (cssFile) => {
      assert.ok(cssFile);
      assert.ok(cssFile.path);
      assert.ok(cssFile.relative);
      assert.ok(cssFile.contents);

      const actual = fs.readFileSync(path.join(__dirname, expectedTestsPath, 'mixins.css'), 'utf8');
      assert.equal(String(normaliseEOL(cssFile.contents)), normaliseEOL(actual));
      done();
    });
    stream.write(sassFile);
  });

  it('should compile multiple sass files', (done) => {
    const files = [
      createVinyl('mixins.scss'),
      createVinyl('variables.scss'),
    ];
    const stream = sass.sync();
    let mustSee = files.length;
    let expectedPath = path.join(expectedTestsPath, 'mixins.css');

    stream.on('data', (cssFile) => {
      assert.ok(cssFile);
      assert.ok(cssFile.path);
      assert.ok(cssFile.relative);
      assert.ok(cssFile.contents);

      if (cssFile.path.includes('variables')) {
        expectedPath = path.join(expectedTestsPath, 'variables.css');
      }

      const actual = normaliseEOL(fs.readFileSync(path.join(__dirname, expectedPath), 'utf8'));
      assert.equal(String(normaliseEOL(cssFile.contents)), actual);

      mustSee -= 1;
      if (mustSee <= 0) {
        done();
      }
    });

    files.forEach((file) => {
      stream.write(file);
    });
  });

  it('should compile files with partials in another folder', (done) => {
    const sassFile = createVinyl('inheritance.scss');
    const stream = sass.sync();

    stream.on('data', (cssFile) => {
      assert.ok(cssFile);
      assert.ok(cssFile.path);
      assert.ok(cssFile.relative);
      assert.ok(cssFile.contents);

      const actual = fs.readFileSync(path.join(__dirname, expectedTestsPath, 'inheritance.css'), 'utf8');
      assert.equal(String(normaliseEOL(cssFile.contents)), normaliseEOL(actual));
      done();
    });
    stream.write(sassFile);
  });

  it('should handle sass errors', (done) => {
    const errorFile = createVinyl('error.scss');
    const stream = sass.sync();

    stream.on('error', (err) => {
      // Error must include message body
      const messageBody = COMPILER === 'sass'
        ? 'Error: expected "{"'
        : 'property "font" must be followed by a \':\'';
      assert.equal(err.message.includes(messageBody), true);
      assert.equal(err.relativePath, path.join('test', 'scss', 'error.scss'));
      done();
    });
    stream.write(errorFile);
  });

  it('should emit logError on sass error', (done) => {
    const errorFile = createVinyl('error.scss');
    const stream = sass.sync();

    stream.on('error', sass.logError);
    stream.on('end', done);
    stream.write(errorFile);
  });

  it('should work with gulp-sourcemaps', (done) => {
    const sassFile = createVinyl('inheritance.scss');

    // Expected sources are relative to file.base
    const expectedSources = [
      'inheritance.scss',
      'includes/_cats.scss',
      'includes/_dogs.sass',
    ];

    sassFile.sourceMap = '{'
      + '"version": 3,'
      + '"file": "scss/subdir/multilevelimport.scss",'
      + '"names": [],'
      + '"mappings": "",'
      + '"sources": [ "scss/subdir/multilevelimport.scss" ],'
      + '"sourcesContent": [ "@import ../inheritance;" ]'
    + '}';

    const stream = sass.sync();
    stream.on('data', (cssFile) => {
      assert.ok(cssFile.sourceMap);
      assert.deepEqual(cssFile.sourceMap.sources.sort(), expectedSources.sort());
      done();
    });
    stream.write(sassFile);
  });

  it('should work with gulp-sourcemaps and autoprefixer', (done) => {
    const expectedSourcesBefore = [
      'inheritance.scss',
      'includes/_cats.scss',
      'includes/_dogs.sass',
    ];

    const expectedSourcesAfter = [
      'includes/_cats.scss',
      'includes/_dogs.sass',
      'inheritance.scss',
    ];

    if (COMPILER === 'sass') expectedSourcesAfter.push('inheritance.css');

    gulp.src(path.join(__dirname, 'scss', 'inheritance.scss'))
      .pipe(sourcemaps.init())
      .pipe(sass.sync())
      .pipe(tap((file) => {
        assert.ok(file.sourceMap);
        assert.deepEqual(file.sourceMap.sources.sort(), expectedSourcesBefore.sort());
      }))
      .pipe(postcss([autoprefixer()]))
      .pipe(sourcemaps.write())
      .pipe(gulp.dest(path.join(__dirname, 'results')))
      .pipe(tap((file) => {
        assert.ok(file.sourceMap);
        assert.deepEqual(file.sourceMap.sources.sort(), expectedSourcesAfter.sort());
      }));
    done();
  });

  it('should work with gulp-sourcemaps and a globbed source', (done) => {
    const globPath = path.join(__dirname, 'scss', 'globbed');
    const files = globule.find(path.join(__dirname, 'scss', 'globbed', '**', '*.scss'));
    const filesContent = {};

    files.forEach((file) => {
      const source = path.normalize(path.relative(globPath, file));
      filesContent[source] = fs.readFileSync(file, 'utf8');
    });

    gulp.src(path.join(__dirname, 'scss', 'globbed', '**', '*.scss'))
      .pipe(sourcemaps.init())
      .pipe(sass.sync())
      .pipe(tap((file) => {
        assert.ok(file.sourceMap);
        const actual = normaliseEOL(file.sourceMap.sourcesContent[0]);
        const expected = normaliseEOL(filesContent[path.normalize(file.sourceMap.sources[0])]);
        assert.deepEqual(actual, expected);
      }));
    done();
  });

  it('should work with gulp-sourcemaps and autoprefixer with different file.base', (done) => {
    const expectedSourcesBefore = [
      'scss/inheritance.scss',
      'scss/includes/_cats.scss',
      'scss/includes/_dogs.sass',
    ];

    const expectedSourcesAfter = [
      'scss/includes/_cats.scss',
      'scss/includes/_dogs.sass',
      'scss/inheritance.scss',
    ];

    if (COMPILER === 'sass') expectedSourcesAfter.push('scss/inheritance.css');

    gulp.src(path.join(__dirname, 'scss', 'inheritance.scss'), { base: 'test' })
      .pipe(sourcemaps.init())
      .pipe(sass.sync())
      .pipe(tap((file) => {
        assert.ok(file.sourceMap);
        assert.deepEqual(file.sourceMap.sources.sort(), expectedSourcesBefore.sort());
      }))
      .pipe(postcss([autoprefixer()]))
      .pipe(tap((file) => {
        assert.ok(file.sourceMap);
        assert.deepEqual(file.sourceMap.sources.sort(), expectedSourcesAfter.sort());
      }));
    done();
  });

  it('should work with empty files', (done) => {
    gulp.src(path.join(__dirname, 'scss', 'empty.scss'))
      .pipe(sass.sync())
      .pipe(gulp.dest(path.join(__dirname, 'results')))
      .pipe(tap(() => {
        try {
          fs.statSync(path.join(__dirname, 'results', 'empty.css'));
        } catch (error) {
          assert.fail('Empty file was not produced!');
        }
      }));
    done();
  });
});
