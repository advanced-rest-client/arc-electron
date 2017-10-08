'use strict';

var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
var path = require('path');

// Copy and prepare custom element
function copyTask(type, destDir, live, element) {
  // All files necessary for the element + test/demo files
  // This will have to be extended, e.g. if your element uses images
  let copy = gulp.src([
    './*.html',
    './*.js',
    './*.css',
    './' + type + '/**',
    '!./gulpfile.js',
    '!./index.html',
  ], {
    base: './'
  });

  // Run all html files through crisper for CSP
  copy = copy.pipe($.if('*.html', $.crisper()));

  if (live) {
    // Insert live-reload script into main demo/test files
    copy = copy.pipe(
      $.if(
        '**/index.html',
        $.insertLines({
          before: /<\/head>/,
          lineBefore: '<script src="../../chrome-app-livereload/livereload.js?host=localhost' +
            '&amp;port=35729"></script>'
        })
      )
    );
  }

  if (type === 'test') {
    // Scripts necessary for WCT that need to be loaded explicitely for Chrome Apps
    let wctScripts = [
      '<script src="../../stacky/lib/parsing.js"></script>',
      '<script src="../../stacky/lib/formatting.js"></script>',
      '<script src="../../stacky/lib/normalization.js"></script>',
      '<script src="../../async/lib/async.js"></script>',
      '<script src="../../lodash/lodash.js"></script>',
      '<script src="../../mocha/mocha.js"></script>',
      '<script src="../../chai/chai.js"></script>',
      '<script src="../../sinonjs/sinon.js"></script>',
      '<script src="../../sinon-chai/lib/sinon-chai.js"></script>',
      '<script src="../../accessibility-developer-tools/dist/js/axs_testing.js"></script>',
      '<script src="prepare_wct.js"></script>'
    ].join('\n');

    // Insert WCT Scripts in test files before WCT is loaded
    copy = copy.pipe(
      $.if('*.html', $.insertLines({
        before: /<script\ src="..\/..\/web-component-tester\/browser.js/,
        lineBefore: wctScripts
      }))
    );
  }

  // Put everything into ./{{dest}}/components/{your-element}/
  copy = copy.pipe(
    gulp.dest(path.join(destDir, 'components', element))
  );

  return copy.pipe($.size({
    title: 'copy:app'
  }));
}

module.exports = copyTask;
