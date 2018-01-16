const bootstrap = require('./test-bootstrap.js');
const workspaceFilePath = 'test/restore.workspace.json';
const opts = {
  args: [
    '--workspace-file',
    workspaceFilePath
  ]
};
const app = bootstrap.getApp(opts);
app.start()
.then(() => app.client.waitUntilWindowLoaded(10000))
.then(() => {
  global._testApp = app;
});
