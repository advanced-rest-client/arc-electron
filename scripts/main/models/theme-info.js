const {ArcPreferences} = require('../../packages/arc-preferences');
/**
 * A preferences class to store and read theme info file.
 */
class ThemeInfo extends ArcPreferences {
  constructor() {
    super({
      file: process.env.ARC_THEMES_SETTINGS
    });
  }

  defaultSettings() {
    return Promise.resolve([]);
  }
}
module.exports.ThemeInfo = ThemeInfo;
