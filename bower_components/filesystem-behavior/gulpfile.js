'use strict';

var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
var connect = require('gulp-connect');

require('./tasks/release.js');

// Lint JavaScript files
gulp.task('lint', function() {
  return gulp.src([
      './*.js',
      './*.html',
      'gulpfile.js'
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
});
gulp.task('connect', function() {
  connect.server({
    root: [__dirname + '/', __dirname + '../'],
    livereload: true,
    port: 8888
  });
});
gulp.task('html', function() {
  gulp.src(['./*.html', './*.js'])
    .pipe(connect.reload());
});
gulp.task('watch', function() {
  gulp.watch(['./*.html','./*.js'], ['html']);
});
gulp.task('webserver', ['connect', 'watch']);
