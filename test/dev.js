const path = require('path');
const Application = require('spectron').Application;

let electronPath = path.join(__dirname, '..', 'node_modules',
  '.bin', 'electron');
if (process.platform === 'win32') {
  electronPath += '.cmd';
}
const workspaceFilePath = 'test/test-workspace.json';
let appPath = path.join(__dirname, '..', 'main.js');
let app = new Application({
  path: electronPath,
  args: [
    appPath,
    '--workspace-file',
    workspaceFilePath
  ]
});
app.start();
