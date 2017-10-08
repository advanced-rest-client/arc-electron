/*
 * Jexl
 * Copyright (c) 2015 TechnologyAdvice
 */

const browserify = require('browserify');
const gulp = require('gulp');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var uglify = require('gulp-uglify');
var gutil = require('gulp-util');
const coverageEnforcer = require('gulp-istanbul-enforcer');
const istanbul = require('gulp-istanbul');
const mocha = require('gulp-mocha');

gulp.task('dist', function() {
  var b = browserify({
    paths: ['lib']
  });
  b.require('Jexl');
  return b.bundle()
    .pipe(source('jexl.min.js'))
    .pipe(buffer())
    .pipe(uglify())
    .on('error', gutil.log)
    .pipe(gulp.dest('./dist/'));
});

gulp.task('coverage-test', function(cb) {
  var passThresholds = {
    thresholds: {
      statements: 95,
      branches: 88,
      lines: 95,
      functions: 92
    },
    coverageDirectory: 'coverage',
    rootDirectory: ''
  };
  gulp.src(['test/**/*.js'])
    .pipe(mocha())
    .on('end', function() {
      gulp.src(['lib/**/*.js'])
        .pipe(istanbul({
          includeUntested: true
        }))
        .pipe(istanbul.hookRequire())
        .on('finish', function() {
          gulp.src(['test/**/*.js'])
            .pipe(mocha({
              reporter: 'min'
            }))
            .pipe(istanbul.writeReports({
              reporters: ['json', 'lcovonly']
            }))
            .on('finish', function() {
              gulp.src('.')
                .pipe(coverageEnforcer(passThresholds))
                .on('end', cb);
            });
        });
    });
});

gulp.task('default', ['dist']);
