const fs = require('fs-extra');
const path = require('path');
/**
 * A logic to be executed when the app is being installed from sources (local npm install).
 */
class PrepareApp {
  async run() {
    try {
      await this.analyzeNodeModules();
    } catch (cause) {
      console.error(cause);
      process.exit(-1);
    }
  }
  /**
   * A function that checks whether any of `@advanced-rest-client` or `@api-components`
   * module located in node_modules has inner `node_modules` component.
   * If it has then this function resolves to error (none of the component should have
   * recursive modules dir).
   *
   * @return {Promise}
   */
  async analyzeNodeModules() {
    await this._analyzeNmPath('@advanced-rest-client')
    await this._analyzeNmPath('@api-components');
  }

  async _analyzeNmPath(dir) {
    const loc = path.join(__dirname, '..', 'node_modules', dir);
    const items = await fs.readdir(loc);
    for (let i = 0, len = items.length; i < len; i++) {
      if (items[i] === 'pouchdb-mapreduce-no-ddocs') {
        continue;
      }
      const candidate = path.join(loc, items[i], 'node_modules');
      let has = false;
      try {
        const stat = await fs.stat(candidate);
        if (stat.isDirectory()) {
          has = await this._hasModules(candidate);
        }
      } catch (e) {
        // ...
      }
      if (has) {
        throw new Error(`Nested node_modules directory exists for ${candidate}`);
      }
    }
  }

  async _hasModules(loc) {
    const items = await fs.readdir(loc);
    if (!items.length) {
      return false;
    }
    if (items.length > 1) {
      return true;
    }
    if (items[0][0] === '.') {
      return false;
    }
    return true;
  }
}

new PrepareApp().run();
