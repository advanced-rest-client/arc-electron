const fs = require('fs-extra');
const {BrowserWindow} = require('electron');
const path = require('path');
const url = require('url');
/**
 * A class responsible for running the theme editor and communicating with
 * sender window to apply the theme.
 */
class ThemesEditor {
  /**
   * @param {Number} windowId Initiating window ID
   * @param {Object} params Startup parameters send from the application window.
   * - themeId - (optional) ID of theme to edit. If not set it's creating new
   * theme
   * - themesLocation - location of the themes folder on user's filesystem.
   * - theme - (optional) Only when `themeId` is set, theme model
   */
  constructor(windowId, params) {
    this.senderId = windowId;
    this.initParams = params || {};
  }

  run() {
    if (this.initParams.themeId) {
      return this.restoreTheme();
    }
    return this.runEditor();
  }
  // Runs the editor window
  runEditor(opts) {
    opts = opts || {};
    const parent = BrowserWindow.fromId(this.senderId);
    const win = new BrowserWindow({
      parent: parent,
      backgroundColor: '#00A2DF',
      webPreferences: {
        partition: 'persist:arc-window',
        nativeWindowOpen: true
      }
    });
    win.webContents.openDevTools();
    win.webContents.once('did-finish-load', () => {
      if (!this.initParams.styles) {
        return;
      }
      if (!opts.theme) {
        this._initStyles(win);
        return;
      }
      this._initTheme(win, opts);
    });
    var dest = path.join(__dirname, '..', '..', 'src', 'theme-editor.html');
    var full = url.format({
      pathname: dest,
      protocol: 'file:',
      slashes: true
    });
    win.loadURL(full);
  }

  restoreTheme() {
    var theme = this.initParams.theme;
    return fs.readFile(theme.fileLocation, 'utf8')
    .then(content => this.runEditor({
      theme: theme,
      content: content
    }));
  }

  _initStyles(win) {
    let script = 'ThemeEditor.initStyles(';
    script += JSON.stringify(this.initParams.styles);
    script += ');';
    win.webContents.executeJavaScript(script);
  }

  _initTheme(win, opts) {
    // const startPath = process.cwd();
    // process.chdir(opts.theme.path);
    const {Analyzer, FSUrlLoader} = require('polymer-analyzer');
    let analyzer = new Analyzer({
      urlLoader: new FSUrlLoader(opts.theme.path),
    });
    const parse5 = require('parse5');
    const PolymerBundler = require('polymer-bundler');
    const bundler = new PolymerBundler.Bundler({
      analyzer: analyzer,
      inlineScripts: true,
      inlineCss: true,
    });
    bundler.generateManifest([opts.theme.main]).then((manifest) => {
      bundler.bundle(manifest).then((result) => {
        const css = parse5.serialize(result.documents.get(opts.theme.main).ast);
        const shadyCss = require('shady-css-parser');
        const parser = new shadyCss.Parser();
        const rules = parser.parse(css);
        console.log(rules);
        debugger;
      });
    });
    // analyzer.analyze(['./' + opts.theme.main])
    // .then(analysis => {
    //
    //
    // })
    // .catch(cause => {
    //   debugger;
    // });

    // debugger;
    // this._createValuesList(rules);
  }

  _createValuesList(rules) {

  }
}
exports.ThemesEditor = ThemesEditor;
