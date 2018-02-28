const {ipcRenderer} = require('electron');
const log = require('electron-log');
const {ArcPreferencesRenderer} = require('../scripts/renderer/arc-preferences');
const {ThemeLoader} = require('../scripts/renderer/theme-loader');
const path = require('path');
/**
 * Class responsible for initializing the main ARC elements
 * and setup base options.
 * Also serves as a communication bridge etween main process and app window.
 */
class SearchBarInit {
  /**
   *
   * @param {?String} settingsScript Path to current settings script.
   * This property is optional and default location is used if not provided.
   */
  constructor(settingsScript) {
    this.created = false;
    this.settingsScript = settingsScript;
    this.themeLoader = new ThemeLoader();
    this._searchCoundHandler = this._searchCoundHandler.bind(this);
    this._focusHandler = this._focusHandler.bind(this);
  }
  /**
   * Listens for the main script events.
   */
  _listen() {
    ipcRenderer.on('search-count', this._searchCoundHandler);
    ipcRenderer.on('focus-input', this._focusHandler);
  }
  /**
   * Removes listeners for the main script events.
   */
  _unlisten() {
    ipcRenderer.removeListener('search-count', this._searchCoundHandler);
    ipcRenderer.removeListener('focus-input', this._focusHandler);
  }
  /**
   * Initializes search bar window.
   *
   * @return {Promise} Resolved promise when settings are ready.
   */
  initBar() {
    log.info('Initializing search bar window...');
    return this.initPreferences()
    .then((settings) => this.themeBar(settings));
  }
  /**
   * Reads user proferences.
   *
   * @return {Promise} A promise resolved to settings object.
   */
  initPreferences() {
    log.info('Initializing search bar preferences...');
    const prefs = new ArcPreferencesRenderer(this.settingsScript);
    return prefs.loadSettings();
  }
  /**
   * Loads theme for the search bar window.
   * @param {Object} settings Current app settings.
   * @return {Promise} Resolved promise when the theme is loaded.
   */
  themeBar(settings) {
    log.info('Initializing search bar theme.');
    let id;
    if (settings.theme) {
      id = settings.theme;
    } else {
      id = this.themeLoader.defaultTheme;
    }
    this.themeLoader.importFileName = 'import-search-bar.html';
    this.themeLoader.componentsBasePath = path.join('../', 'components');
    return this.themeLoader.activateTheme(id)
    .catch((cause) => {
      if (id === this.themeLoader.default) {
        log.error('Unable to load theme file.', cause);
        return;
      }
      return this.themeLoader.activateTheme(this.themeLoader.defaultTheme);
    })
    .then(() => {
      if (this.themeLoader.activeTheme === this.themeLoader.anypointTheme) {
        this._setupAnypoint();
      }
    })
    .catch((cause) => {
      log.error('Unable to load default theme file.', cause);
    });
  }
  /**
   * Closes the search bar.
   */
  close() {
    ipcRenderer.send('search-bar-close');
  }
  /**
   * Sends the `search-bar-query` event to the main script
   * so the window search handler can perform search operation.
   * @param {String} value Search query
   */
  query(value) {
    ipcRenderer.send('search-bar-query', value);
  }
  /**
   * Sends the `search-bar-query-next` event to the main script
   * so the window search handler can mark next search result.
   */
  highlightNext() {
    ipcRenderer.send('search-bar-query-next');
  }
  /**
   * Sends the `search-bar-query-previous` event to the main script
   * so the window search handler can mark previous search result.
   */
  highlightPrevious() {
    ipcRenderer.send('search-bar-query-previous');
  }
  /**
   * Returns the `<dom-bind>` template element.
   *
   * @return {HTMLElement} Instance of the `dom-bind` template.
   */
  get bar() {
    return document.getElementById('bar');
  }
  /**
   * Handler for the `search-count` event from the main page.
   * Sets `searchCount` and `selected` properties on the search bar
   * template instance.
   *
   * @param {Event} event Event instance.
   * @param {Number} count Search results count
   * @param {Number} selected Currently selected instance.
   */
  _searchCoundHandler(event, count, selected) {
    let bar = this.bar;
    bar.searchCount = count;
    bar.selected = selected;
  }
  /**
   * Setups anypoint styling.
   */
  _setupAnypoint() {
    this.bar.isAnypoint = true;
  }
  /**
   * Focuses on the text input.
   */
  _focusHandler() {
    document.querySelector('paper-input').inputElement.focus();
  }
}
const initScript = new SearchBarInit();
initScript._listen();
initScript.initBar();
