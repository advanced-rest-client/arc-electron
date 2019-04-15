const fs = require('fs-extra');
/**
 * A logic to be executed when the app is being installed from sources (local npm install).
 */
class PrepareApp {
  run() {
    return this.fixMarked()

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
}

new PrepareApp().run();
