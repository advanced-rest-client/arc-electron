'use strict';

var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
var del = require('del');
var runSequence = require('run-sequence');
var path = require('path');
var tinylr = require('tiny-lr');
const copyTask = require('./copy-task.js');

var element = __dirname.split(path.sep).pop();

// copy and prepare dependencies
var bowerTask = function(destDir) {
  return gulp.src([
      'bower_components/**/*'
    ]).pipe($.if('*.html', $.crisper()))
    .pipe(gulp.dest(path.join(destDir, 'components')));
};

// Create Chrome App to test/demo the custom element
var createAppTask = function(type, destDir) {
  return gulp.src([
      './chrome-app/**'
    ]).pipe($.replace('_element_', element))
    .pipe($.replace('_type_', type))
    .pipe(gulp.dest(destDir));
};

// Setup tiny-lr and watch for changes to rebuild the apps
var watchTask = function(type, destDir) {
  var lr = tinylr();
  lr.listen(35729);

  gulp.watch(['./*', './' + type + '/**'], ['copy-live:' + type]);
  gulp.watch(['./chrome-app/**'], ['app:' + type]);
  gulp.watch(['bower_components/**'], ['bower:' + type]);

  gulp.watch([destDir + '/**'], $.batch({
    timeout: 500
  }, function(events, cb) {
    var paths = [];
    events.on('data', function(evt) {
      paths.push(evt.path);
    }).on('end', function() {
      lr.changed({
        body: {
          files: paths
        }
      });
      cb();
    });
  }));
};

gulp.task('copy:test', copyTask.bind(null, 'test', 'test-app', false, element));
gulp.task('copy:demo', copyTask.bind(null, 'demo', 'demo-app', false, element));
gulp.task('copy-live:test', copyTask.bind(null, 'test', 'test-app', true, element));
gulp.task('copy-live:demo', copyTask.bind(null, 'demo', 'demo-app', true, element));

gulp.task('bower:test', bowerTask.bind(null, 'test-app'));
gulp.task('bower:demo', bowerTask.bind(null, 'demo-app'));

gulp.task('app:test', createAppTask.bind(null, 'test', 'test-app'));
gulp.task('app:demo', createAppTask.bind(null, 'demo', 'demo-app'));

gulp.task('watch:test', watchTask.bind(null, 'test', 'test-app'));
gulp.task('watch:demo', watchTask.bind(null, 'demo', 'demo-app'));

// Clean Output Directory
gulp.task('clean:test', del.bind(null, ['test-app']));
gulp.task('clean:demo', del.bind(null, ['demo-app']));

// Main Gulp tasks
gulp.task('build:test', ['clean:test'], function(cb) {
  runSequence(
    ['copy:test', 'bower:test'],
    'app:test',
    cb
  );
});

gulp.task('build:demo', ['clean:demo'], function(cb) {
  runSequence(
    ['copy:demo', 'bower:demo'],
    'app:demo',
    cb
  );
});

gulp.task('live:test', ['clean:test'], function(cb) {
  runSequence(
    ['copy-live:test', 'bower:test'],
    'app:test',
    'watch:test',
    cb
  );
});

gulp.task('live:demo', ['clean:demo'], function(cb) {
  runSequence(
    ['copy-live:demo', 'bower:demo'],
    'app:demo',
    'watch:demo',
    cb
  );
});
