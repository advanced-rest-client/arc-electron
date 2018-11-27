# ARC Electron plug-in manager

Manages ARC application plug-ins.

Currently only themes manager is supported.

## Usage

```
$ npm i @advanced-rest-client/arc-electron-plugin-manager
```

In the main process:

```javascript
const {ThemePluginsManager} = require('@advanced-rest-client/arc-electron-plugin-manager/main');

const manager = new ThemePluginsManager();

// installing themes
await manager.inastall('npm-package-name', 'version');
await manager.inastall('github-owner/github-repo', 'branch/tag/hash');
await manager.inastall('/my/local/package');

// Uninstalling themes
await manager.uninstall('npm-package-name');
await manager.uninstall('github-owner/github-repo');
await manager.uninstall('/my/local/package');

// Check for an update of a specific package
const into = await manager.checkUpdateAvailable('npm-package-name');
if (info) {
  // update available.
}

// Check for any update
const infoMap = await manager.checkForUpdates();
if (Object.keys(infoMap).length) {
  // updates are available
}

// Update list of packages
await manager.update(infoMap);
```
