const { ThemeDefaults } = require('./defaults/theme-defaults');
const { WorkspaceDefaults } = require('./defaults/workspace-defaults');
/**
 * Class responsible for keeping application base environment stable.
 *
 * It copies default resources to it's default locations and sets up
 * the application environment.
 */
class AppDefaults {
  /**
   * Prepares environemt files while opening the application.
   * Copies application themes to themes location.
   * @return {Promise}
   */
  async prepareEnvironment() {
    const td = new ThemeDefaults();
    await td.prepareEnvironment();
    const wd = new WorkspaceDefaults();
    await wd.prepareEnvironment();
  }
}
exports.AppDefaults = AppDefaults;
