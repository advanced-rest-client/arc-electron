const fs = require('fs');
const archiver = require('archiver');
const path = require('path');

class ThemeArchive {
  constructor(theme) {
    this.defaultPath = path.join('appresources', 'themes', theme);
    this.bowerZipFile = 'bower_components.zip';
    this.bowerZipPath = path.join(this.defaultPath, this.bowerZipFile);
    this._output = fs.createWriteStream(this.bowerZipPath);
    this._archive = archiver('zip', {
      level: 9
    });
    this._closeHandler = this._closeHandler.bind(this);
    this._errorHandler = this._errorHandler.bind(this);
    this._filterFn = this._filterFn.bind(this);
    this._attachListeners();
    this._archive.pipe(this._output);
  }

  _attachListeners() {
    this._output.once('close', this._closeHandler);
    this._output.on('error', this._errorHandler);
  }

  _closeHandler() {
    console.log('Theme saved in ', this.bowerZipFile, 'file');
    console.log('Written', this._archive.pointer(), 'total bytes');
  }

  _errorHandler(err) {
    throw err;
  }

  bundle() {
    this._archive.directory('bower_components', false, this._filterFn);
    this._archive.finalize();
  }

  _filterFn(data) {
    if (data.name.indexOf('/demo/') !== -1) {
      return false;
    }
    if (data.name.indexOf('/test/') !== -1) {
      return false;
    }
    if (data.name.indexOf('/tests/') !== -1) {
      return false;
    }
    return data;
  }
}
const args = process.argv.splice(2);
var theme;
if (args[0] === 'anypoint') {
  theme = 'anypoint-theme';
} else {
  theme = 'default-theme';
}
const ar = new ThemeArchive(theme);
ar.bundle();
