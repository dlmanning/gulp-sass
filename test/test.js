var gulp = require('gulp')
  , sass = require('../')
  , fs   = require('fs')
  , should = require('should')
  ;

require('mocha');


describe('gulp-sass', function(){
  beforeEach(function(){
    this.src = gulp.src('./test/scss/*.scss');
    this.src.pause();
    this.dest = gulp.dest('./test/css/');

    this.src
      .pipe(sass())
      .pipe(this.dest);
  });

  afterEach(function(){
    var dir = fs.readdirSync('./test/css');
    for(var file in dir){
      fs.unlinkSync("./test/css/"+dir[file]);
    }
  });

  it('writes .css files', function(done){
    this.dest.on('end', function(){
      var file = fs.readFileSync('./test/css/inheritance.css');
      file.should.not.have.property('length', 0);
      done();
    });
    this.src.resume();
  });

});
