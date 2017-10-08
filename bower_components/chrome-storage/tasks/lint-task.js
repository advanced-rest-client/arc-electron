'use strict';

var gulp = require('gulp');
var $ = require('gulp-load-plugins')();

// Lint JavaScript files
function lint() {
  return gulp.src([
      './**/*.js',
      './**/*.html',
      '!./node_modules/**/*.*',
      '!./bower_components/**/*.*',
      '!./demo-app/**/*.*',
      '!./test-app/**/*.*'
    ])
    // JSCS has not yet a extract option
    .pipe($.if('*.html', $.htmlExtract({
      strip: true
    })))
    .pipe($.jshint())
    .pipe($.jscs())
    .pipe($.jscsStylish.combineWithHintResults())
    .pipe($.jshint.reporter('jshint-stylish'))
    .pipe($.jshint.reporter('fail'));
}
gulp.task('lint', lint);

//module.exports = lint;
