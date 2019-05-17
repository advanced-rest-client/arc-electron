const fs = require('fs-extra');
const path = require('path');
/**
 * A logic to be executed when the app is being installed from sources (local npm install).
 */
class PrepareApp {
  run() {
    return this.fixMarked()
    .then(() => this.analyzeNodeModules())
    .catch((cause) => {
      console.error(cause);
      process.exit(-1);
    });
  }
  /**
   * Walkaround for https://github.com/PolymerElements/marked-element/issues/100
   * @return {Promise}
   */
  fixMarked() {
    const file = 'web_modules/@polymer/marked-element/marked-element.js';
    return fs.readFile(file, 'utf8')
    .then((content) => {
      content = content.replace('new marked.Renderer()', 'new marked.default.Renderer()');
      content = content.replace('marked(this.markdown', 'marked.default(this.markdown');
      return fs.writeFile(file, content);
    });
  }
  /**
   * A function that checks whether any of `@advanced-rest-client` or `@api-components`
   * module located in node_modules has inner `node_modules` component.
   * If it has then this function resolves to error (none of the component should have
   * recursive modules dir).
   *
   * @return {Promise}
   */
  analyzeNodeModules() {
    return this._analyzeNmPath('@advanced-rest-client')
    .then(() => this._analyzeNmPath('@api-components'));
  }

  _analyzeNmPath(dir) {
    const loc = path.join(__dirname, '..', 'node_modules', dir);
    return fs.readdir(loc)
    .then((items) => {
      for (let i = 0, len = items.length; i < len; i++) {
        const candidate = path.join(loc, items[i], 'node_modules');
        let has = false;
        try {
          const stat = fs.statSync(candidate);
          if (stat.isDirectory()) {
            has = true;
          }
        } catch (e) {}
        if (has) {
          throw new Error(`Nested node_modules directory exists for ${candidate}`);
        }
      }
    });
  }
}

new PrepareApp().run();
