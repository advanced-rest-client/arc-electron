
module.exports = function(app, arcApp) {
  app.testsInterface = function(action) {
    switch (action) {
      case 'get-application-settings-file-location':
        return arcApp.wm.startupOptions.settingsFile;
      case 'get-application-workspace-state-file-location':
        return arcApp.wm.startupOptions.workspaceFile;
      case 'get-preferences-settings-location':
        return arcApp.wm.recorder.meta.settingsFile;
    }
  };
};
