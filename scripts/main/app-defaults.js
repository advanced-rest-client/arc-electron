const {ThemeDefaults} = require('./defaults/theme-defaults');
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
   *
   * @param {SourcesManager} sm
   * @return {Promise}
   */
  prepareEnvironment(sm) {
    const td = new ThemeDefaults(sm);
    return td.prepareEnvironment();
  }
}
exports.AppDefaults = AppDefaults;
