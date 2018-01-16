const log = require('electron-log');

module.exports = function(app, arcApp) {
  app.testsInterface = function(action, ...args) {
    switch (action) {
      case 'get-application-settings-file-location':
        return arcApp.wm.startupOptions.settingsFile;
      case 'get-application-workspace-state-file-location':
        return arcApp.wm.startupOptions.workspaceFile;
      case 'get-preferences-settings-location':
        log.info('TEST INTERFACE: arcApp.wm.recorder.meta.settingsFile');
        return arcApp.wm.recorder.meta.settingsFile;
      case 'update-request-object':
        log.info('TEST INTERFACE: arcApp.updateRequest');
        return arcApp.updateRequest.apply(arcApp, args);
      case 'create-new-tab':
        log.info('TEST INTERFACE: arcApp.newTab');
        return arcApp.newTab();
    }
  };
};
