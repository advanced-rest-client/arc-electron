'use strict';

const  gulp = require('gulp');

// ARC components defaul tasks
require('./tasks/lint-task.js');
require('./tasks/release.js');

gulp.task('default', function() {
  console.log('');
  console.log('  Component\'s tasks:');
  console.log('  $ gulp lint # run lint test');
  console.log('  $ gulp release # builds and releases the element, requires GITHUB_TOKEN variable');
  console.log('  $ gulp changelog # builds changelog, eslint style');
  console.log('  $ gulp github-release # create GitHub release, requires GITHUB_TOKEN variable');
  console.log('  $ gulp bump-version # bumps minor version');
  console.log('  $ gulp commit-changes # commits changes with predefined message');
  console.log('  $ gulp create-new-tag # creates a tag');
});
