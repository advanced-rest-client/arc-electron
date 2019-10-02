/**
 * A class responsible for upgrading the app in the renderer process.
 */
class UpgradeHelper {
  /* global versionInfo, ipc */
  constructor(upgrades) {
    if (!(upgrades instanceof Array)) {
      upgrades = undefined;
    }
    if (!upgrades) {
      upgrades = [];
    }
    this.upgrades = upgrades;
  }
  /**
   * Check if upgrades are required.
   * @return {Boolean} True if there are upgrades required for this version of the app.
   */
  upgradeRequired() {
    const queue = this.getUpgrades();
    return queue.length > 0;
  }

  getUpgrades() {
    const ver = versionInfo.appVersion;
    if (!ver) {
      return false;
    }
    const queue = [];

    const parts = ver.split('.');
    const majorUpgrade = this.__getUpgrade(parts[0]);
    if (majorUpgrade) {
      queue[queue.length] = majorUpgrade;
    }

    const minorUpgrade = this.__getUpgrade(parts[0] + parts[1]);
    if (minorUpgrade) {
      queue[queue.length] = minorUpgrade;
    }

    const pathUpgrade = this.__getUpgrade(parts[0] + parts[1] + parts[2]);
    if (pathUpgrade) {
      queue[queue.length] = pathUpgrade;
    }

    const fullv = ver.replace(/[.-]/g, '');
    if (fullv !== pathUpgrade) {
      const channelUpgrade = this.__getUpgrade(fullv);
      if (channelUpgrade) {
        queue[queue.length] = channelUpgrade;
      }
    }
    return queue;
  }

  __getUpgrade(version) {
    if (this.upgrades.indexOf(version) !== -1) {
      return;
    }
    const fullName = 'upgrade' + version;
    if (typeof this[fullName] === 'function') {
      return {
        version: version,
        fn: fullName
      };
    }
  }

  upgrade(upgradeList) {
    if (!upgradeList || !upgradeList.length) {
      return Promise.resolve();
    }
    const promises = [];
    for (let i = 0, len = upgradeList.length; i < len; i++) {
      const item = upgradeList[i];
      if (typeof this[item.fn] === 'function') {
        const result = this[item.fn]();
        if (result instanceof Promise) {
          promises.push(result);
        }
      }
    }
    return Promise.all(promises)
    .catch((cause) => {
      console.error('Upgrade incloplete', cause);
    });
  }

  /**
   * Upgrade for version 13 includes:
   * - datastore indexes upgrade
   *
   * @return {Promise}
   */
  upgrade13() {
    return this._upgrade13Indexes();
  }

  _upgrade13Indexes() {
    const app = document.body.querySelector('arc-electron');
    if (!app) {
      console.warn('Upgrade manager cannot find app.');
      return;
    }
    const indexer = app.shadowRoot.querySelector('url-indexer');
    console.info('Upgrading saved requests index....');
    return indexer.reindexSaved()
    .then(() => {
      console.info('Saved requests index ready');
      console.info('Upgrading history requests index....');
      return indexer.reindexHistory();
    })
    .then(() => {
      console.info('History requests index ready');
      this.upgrades.push('13');
      ipc.send('update-app-preference', 'upgrades', this.upgrades);
    })
    .catch((cause) => {
      console.error('Requests index upgrade error', cause);
    });
  }
}
module.exports.UpgradeHelper = UpgradeHelper;
