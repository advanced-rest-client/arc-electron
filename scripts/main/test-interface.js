const {RemoteApi} = require('../packages/communication-protocol/main/remote-api');
const remote = new RemoteApi();
module.exports = function(app, arcApp) {
  app.testsInterface = function(action, ...args) {
    switch (action) {
      case 'get-application-settings-file-location':
        return arcApp.wm.startupOptions.settingsFile;
      case 'get-application-workspace-state-file-location':
        return arcApp.wm.startupOptions.workspacePath;
      case 'get-preferences-settings-location':
        return arcApp.prefs.settingsFile;
      case 'update-request-object':
        return remote.updateRequest(args[0], args[1]);
      case 'create-new-tab':
        return remote.newTab();
    }
  };
};
