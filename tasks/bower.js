const path = require('path');
const {exec} = require('child_process');
const {Glob} = require('glob');
const fs = require('fs-extra');

const defaultPath = path.join('components', 'default');
/**
 * Installs bower components in given directory.
 * The dicectory must contain `bower.js` file.
 *
 * @param {String} cwd Process working directory
 * @return {Promise} Promise resolved when the process complete.
 */
function install(cwd) {
  const opts = {
    cwd: cwd,
    windowsHide: true
  };
  console.log('Installing bower components in', cwd);
  return new Promise((resolve, reject) => {
    exec('bower update', opts, (error, stdout/* , stderr*/) => {
      if (error) {
        console.error(`exec error: ${error}`);
        reject(new Error(error));
        return;
      }
      console.log(stdout);
      resolve();
    });
  });
}

function clearPattern(pattern) {
  console.log('Removing files for pattern', pattern);
  return new Promise((resolve, reject) => {
    const promises = [];
    const mg = new Glob(pattern);
    mg.on('match', (file) => {
      console.log('Removing', file);
      promises.push(fs.remove(file));
    });
    mg.on('end', () => {
      Promise.all(promises)
      .then(() => resolve())
      .catch((cause) => reject(cause));
    });
    mg.on('error', (err) => {
      console.error('Error cleaning data', err);
      reject(new Error(err));
    });
  });
}

function clear() {
  const root = 'components/default/bower_components/**/';
  return clearPattern(root + '{demo,test,docs}/*')
  .then(() => clearPattern(root + '*.md'))
  .then(() => clearPattern(root + '.travis/*'));
}

install(defaultPath)
.then(() => clear())
.then(() => console.log('Installation complete'))
.catch((cause) => console.error(cause));
