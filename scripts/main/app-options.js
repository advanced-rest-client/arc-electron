const log = require('electron-log');
log.transports.file.level = 'info';

/**
 * A class describing and processing application initial options.
 */
class AppOptions {
  /**
   * List of command line options with mapping to properties.
   *
   * @return {Array<Object>} List of app config options
   */
  get availableOptions() {
    return [{
      // Path to the settings file. Overrides default location.
      name: '--settings-file',
      shortcut: '-s',
      type: String,
      property: 'settingsFile'
    }, {
      // Path to the workspace state file. Overrides default location.
      name: '--workspace-file',
      shortcut: '-w',
      type: String,
      property: 'workspaceFile'
    }];
  }
  /**
   * Produces list of startup options.
   * @return {Object} Map of configured options.
   */
  getOptions() {
    var result = {};
    for (let prop in this) {
      result[prop] = this[prop];
    }
    return result;
  }
  /**
   * Parses startup options.
   */
  parse() {
    for (var i = 0; i < process.argv.length; i++) {
      if (i === 0) {
        continue;
      }
      let arg = process.argv[i];
      if (arg[0] !== '-') {
        log.warn('Unknown startup option ', arg);
        continue;
      }
      let def = this.findDefinnition(arg);
      if (!def) {
        log.warn('Unknown startup option ', arg);
        continue;
      }
      def = this.getPropertyDefinition(arg, def, process.argv[i + 1]);
      this.setProperty(def);
    }
  }
  /**
   * Finds an option definition from an argument.
   *
   * @param {String} arg Argument passed to the application.
   * @return {Object} Option definition or undefined if not found.
   */
  findDefinnition(arg) {
    var eqIndex = arg.indexOf('=');
    if (eqIndex !== -1) {
      arg = arg.substr(0, eqIndex);
    }
    if (arg.indexOf('--') === 0) {
      return this.availableOptions.find(item => item.name === arg);
    } else if (arg.indexOf('-') === 0) {
      return this.availableOptions.find(item => item.shortcut === arg);
    }
  }

  getPropertyDefinition(arg, def, nextValue) {
    def.skipNext = false;
    if (def.type === Boolean) {
      def.value = true;
      return def;
    }
    var value;
    if (arg.indexOf('=') !== -1) {
      value = this.getArgValue(arg);
    } else {
      value = nextValue;
      def.skipNext = true;
    }
    if (def.type === Number) {
      def.value = Number(value);
    } else {
      def.value = value;
    }
    return def;
  }

  getArgValue(arg) {
    var value = arg.substr(arg.indexOf('=') + 1);
    if (value[0] === '"') {
      value = value.substr(1);
      value = value.substr(0, value.length - 1);
    }
    return value;
  }

  setProperty(def) {
    this[def.property] = def.value;
  }
}
exports.AppOptions = AppOptions;
