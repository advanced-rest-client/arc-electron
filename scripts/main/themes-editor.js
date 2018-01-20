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
      if (!this.initParams.theme) {
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
  /**
   * Inits the theme editor as a new theme (without reading theme file contents)
   *
   * @param {BrowserWindow} win Created windown.
   */
  _initStyles(win) {
    let script = 'ThemeEditor.initStyles(';
    script += JSON.stringify(this.initParams.styles);
    script += ');';
    win.webContents.executeJavaScript(script);
  }
  /**
   * Initializes the editor as a existing theme.
   * It reads theme file content, parses CSS and updates variables model.
   *
   * @param {BrowserWindow} win Created windown.
   */
  _initTheme(win) {
    var theme = this.initParams.theme;
    this._processThemeFile(theme.path, theme.main)
    .then(styles => this._updateStylesModel(this.initParams.styles, styles))
    .then(() => this._initStyles(win));
  }

  _processThemeFile(themeLocation, themeFile) {
    const {Analyzer, FSUrlLoader} = require('polymer-analyzer');
    const PolymerBundler = require('polymer-bundler');
    let analyzer = new Analyzer({
      urlLoader: new FSUrlLoader(themeLocation),
    });
    const bundler = new PolymerBundler.Bundler({
      analyzer: analyzer,
      inlineScripts: true,
      inlineCss: true,
    });
    return bundler.generateManifest([themeFile])
    .then(manifest => bundler.bundle(manifest))
    .then(result => this._parseStyles(result.documents.get(themeFile).ast))
    .then(cssRules => this._cssRulesToList(cssRules));
  }

  _parseStyles(ast) {
    const parse5 = require('parse5');
    const css = parse5.serialize(ast);
    const shadyCss = require('shady-css-parser');
    const parser = new shadyCss.Parser();
    return parser.parse(css);
  }

  _cssRulesToList(cssRules, result) {
    result = result || {};
    cssRules.rules.forEach(rule => this._parseCss(rule, result));
    return result;
  }

  _parseCss(rule, result) {
    switch (rule.type) {
      case 'ruleset': this._parseCss(rule.rulelist, result); break;
      case 'rulelist': this._cssRulesToList(rule, result); break;
      case 'declaration': this._processCssDeclaration(rule, result); break;
    }
  }

  _processCssDeclaration(declaration, result) {
    var name = declaration.name;
    if (!name) {
      return;
    }
    // if (name[0] !== '-' && name[1] !== '-') {
    //   return;
    // }
    var value = declaration.value;
    if (!value) {
      return;
    }
    switch (value.type) {
      case 'expression':
        result[name] = value.text;
        return;
      case 'rulelist':
        let values = {};
        this._cssRulesToList(value, values);
        let style = Object.keys(values).map(key => {
          return key + ': ' + values[key] + ';';
        }).join('\n');
        result[name] = style;
        return;
    }
  }

  _updateStylesModel(model, styles) {
    for (let i = 0, len = model.length; i < len; i++) {
      if (model[i].hasMixins) {
        for (let j = 0, len2 = model[i].mixins.length; j < len2; j++) {
          let name = model[i].mixins[j].name;
          if (styles[name]) {
            model[i].mixins[j].value = styles[name];
          }
        }
      }

      if (model[i].hasVariables) {
        for (let j = 0, len2 = model[i].variables.length; j < len2; j++) {
          let name = model[i].variables[j].name;
          if (styles[name]) {
            model[i].variables[j].value = styles[name];
          }
        }
      }
    }
  }
}
exports.ThemesEditor = ThemesEditor;
