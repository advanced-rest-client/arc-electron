const builder = require('electron-builder');
const path = require('path');
class ArcBuilder {
  constructor() {
    this.tag = process.env.TRAVIS_TAG;
    this.branch = process.env.TRAVIS_BRANCH;
    this.os = process.env.TRAVIS_OS_NAME;
  }
  /**
   * Runs the build depending on the branch, tag, and OS.
   * @return {Promise}
   */
  run() {
    this.setupVariables();
    if (this.tag) {
      return this.buildTag();
    }
    switch (this.branch) {
      case 'develop':
        return this.nightlyBuild();
      case 'beta':
        return this.betaBuild();
    }
    return Promise.resolve();
  }

  setupVariables() {
    if (this.os === 'osx') {
      process.env.CSC_LINK = path.join('tasks', 'mac-app-distribution-cert.p12');
      process.env.CSC_IDENTITY_AUTO_DISCOVERY = false;
    } else {
      process.env.WIN_CSC_LINK = path.join('tasks', 'advancedrestclient.pfx');
    }
  }

  nightlyBuild() {
    console.log('Creating nightly build.');
    const cnf = this.nightlyConfig();
    return builder.build(cnf)
    .then(() => {
      console.log('Build succesful.');
    });
  }

  betaBuild() {
    return Promise.resolve();
  }

  buildTag() {
    return Promise.resolve();
  }

  nightlyConfig() {
    const config = {
      config: 'tasks/travis-nightly-builder.yml'
    };
    switch (this.os) {
      case 'osx':
        config.mac = ['dmg', 'zip'];
        break;
      case 'linux':
        config.win = ['nsis'];
        config.linux = ['deb', 'rpm', 'tar.gz', 'AppImage'];
        break;
    }
    return config;
  }
}
const instance = new ArcBuilder();
instance.run()
.catch((cause) => {
  console.error(cause);
  process.exit(1);
});
