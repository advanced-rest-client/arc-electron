import { BaseThemeManager } from '../../../web_modules/index.js';

export class ElectronThemeManager extends BaseThemeManager {
  /**
   * @param {string} name The theme to install
   * @returns {Promise<void>} 
   */
  async installTheme(name) {
    if (!name) {
      throw new Error('The name is required');
    }
    return ArcEnvironment.ipc.invoke('theme-manager-install-theme', name);
  }

  /**
   * @param {string} name The theme to uninstall
   * @returns {Promise<void>} 
   */
  async uninstallTheme(name) {
    if (!name) {
      throw new Error('The name is required');
    }
    return ArcEnvironment.ipc.invoke('theme-manager-uninstall-theme', name);
  }
}
