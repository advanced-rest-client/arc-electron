
module.exports = function(app, arcApp) {
  app.testsInterface = function(action, ...args) {
    switch (action) {
      case 'get-application-settings-file-location':
        return arcApp.wm.startupOptions.settingsFile;
      case 'get-application-workspace-state-file-location':
        return arcApp.wm.startupOptions.workspaceFile;
      case 'get-preferences-settings-location':
        return arcApp.wm.recorder.meta.settingsFile;
      case 'update-request-object':
        return arcApp.remote.updateRequest(args[0], args[1]);
      case 'create-new-tab':
        return arcApp.remote.newTab();
      case 'get-tabs-count':
        return arcApp.remote.getTabsCount();
    }
  };
};
