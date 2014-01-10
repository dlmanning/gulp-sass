var should = require('should');
var gutil = require('gulp-util');
var sass = require('../');
var fs = require('fs');

require('mocha');

describe('gulp-sass', function(){

  it('should render sass .scss to CSS .css', function(done){
    var S = sass();
    var fakeFile = new gutil.File({
      base: 'test/scss',
      cwd: 'test/',
      path: 'test/scss/normal.scss',
      contents: fs.readFileSync('test/scss/normal.scss')
    });

    S.once('data', function(newFile){
      should.exist(newFile);
      should.exist(newFile.contents);
      String(newFile.contents).should.equal(fs.readFileSync('test/css/normal.css', 'utf8'));
      done();
    });
    S.write(fakeFile);
  });

  it('should use mixins', function(done){
    var S = sass();
    var fakeFile = new gutil.File({
      base: 'test/scss',
      cwd: 'test/',
      path: 'test/scss/mixins.scss',
      contents: fs.readFileSync('test/scss/mixins.scss')
    });

    S.once('data', function(newFile){
      should.exist(newFile);
      should.exist(newFile.contents);
      String(newFile.contents).should.equal(fs.readFileSync('test/css/mixins.css', 'utf8'));
      done();
    });
    S.write(fakeFile);
  });

  it('should use nesting correctly', function(done){
    var S = sass();
    var fakeFile = new gutil.File({
      base: 'test/scss',
      cwd: 'test/',
      path: 'test/scss/nesting.scss',
      contents: fs.readFileSync('test/scss/nesting.scss')
    });

    S.once('data', function(newFile){
      should.exist(newFile);
      should.exist(newFile.contents);
      String(newFile.contents).should.equal(fs.readFileSync('test/css/nesting.css', 'utf8'));
      done();
    });
    S.write(fakeFile);
  });

  it('should handle inheritance correctly', function(done){
    var S = sass();
    var fakeFile = new gutil.File({
      base: 'test/scss',
      cwd: 'test/',
      path: 'test/scss/inheritance.scss',
      contents: fs.readFileSync('test/scss/inheritance.scss')
    });

    S.once('data', function(newFile){
      should.exist(newFile);
      should.exist(newFile.contents);
      String(newFile.contents).should.equal(fs.readFileSync('test/css/inheritance.css', 'utf8'));
      done();
    });
    S.write(fakeFile);
  });


});