const path = require('path');
const Application = require('spectron').Application;

var electronPath = path.join(__dirname, '..', 'node_modules', '.bin', 'electron');
if (process.platform === 'win32') {
  electronPath += '.cmd';
}

var appPath = path.join(__dirname, '..', 'main.js');
var app = new Application({
  path: electronPath,
  args: [appPath]
});
app.start();
