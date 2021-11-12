import { ThemeBindings, Events,  Constants } from '../../../web_modules/index.js';
import { ElectronThemeManager } from './ElectronThemeManager.js';

/** @typedef {import('@advanced-rest-client/events').Theme.ArcThemeStore} ArcThemeStore */
/** @typedef {import('@advanced-rest-client/events').Theme.InstalledTheme} InstalledTheme */
/** @typedef {import('@advanced-rest-client/events').Theme.SystemThemeInfo} SystemThemeInfo */

/**
 * The base class for application themes bindings.
 */
export class ThemeBindingsElectron extends ThemeBindings {
  /**
   * @param {string} protocol The protocol to use when requesting for a theme.
   * @param {string} baseUri The base URI to use when requesting for a theme.
   */
  constructor(protocol, baseUri) {
    super();
    this.themes = new ElectronThemeManager({
      protocol,
      baseUri,
    });
    ArcEnvironment.ipc.on('theme-manager-theme-activated', this.themeActivatedHandler.bind(this));
    ArcEnvironment.ipc.on('system-theme-changed', this.systemThemeChangeHandler.bind(this));
    ArcEnvironment.ipc.on('theme-property-changed', this.themePropertyChangeHandler.bind(this));
  }

  /**
   * @returns {Promise<ArcThemeStore>}
   */
  // @ts-ignore
  async readState() {
    ArcEnvironment.logger.silly('listing application themes');
    return ArcEnvironment.ipc.invoke('theme-manager-read-themes');
  }

  /**
   * Activates the theme. It stores theme id in user preferences and loads the
   * theme.
   * @param {string} name Theme name to activate
   * @return {Promise<void>} Promise resolved when the theme is activated
   */
  async activate(name) {
    ArcEnvironment.logger.info(`activating theme: ${name}`);
    return ArcEnvironment.ipc.invoke('theme-manager-activate-theme', name);
  }

  /**
   * @returns {Promise<SystemThemeInfo>} 
   */
  async readSystemThemeInfo() {
    return ArcEnvironment.ipc.invoke('theme-manager-system-theme');
  }

  /**
   * @param {boolean} status 
   */
  async setSystemPreferred(status) {
    return ArcEnvironment.ipc.invoke('theme-manager-update-property', 'systemPreferred', status);
  }

  /**
   * Handler for the theme activated event. Updates the theme in the current window.
   * @param {*} e
   * @param {string} id
   */
  async themeActivatedHandler(e, id) {
    const settings = await this.readState();
    if (settings.systemPreferred) {
      await this.themes.loadSystemPreferred();
      return;
    }
    await this.themes.loadTheme(id);
    Events.Theme.themeActivated(window, id);
  }

  /**
   * Handler for system theme change event dispatched by the IO thread.
   * Updates theme depending on current setting.
   *
   * @param {any} e
   * @param {SystemThemeInfo} info true when Electron detected dark mode
   * @returns {Promise<void>}
   */
  async systemThemeChangeHandler(e, info) {
    const settings = await this.readState();
    if (!settings.systemPreferred) {
      return;
    }
    this.compatibility = false;
    const id = info.shouldUseDarkColors ? Constants.darkTheme : Constants.defaultTheme;
    try {
      await this.themes.loadTheme(id);
      Events.Theme.themeActivated(window, id);
    } catch (err) {
      ArcEnvironment.logger.error(err);
    }
  }

  async themePropertyChangeHandler(e, prop, value) {
    if (prop === 'systemPreferred') {
      if (value) {
        await this.themes.loadSystemPreferred();
      } else {
        await this.themes.loadUserPreferred();
      }
    }
  }
}
