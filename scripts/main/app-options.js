const log = require('electron-log');
const camelCase = require('camelcase');
log.transports.file.level = 'info';

/**
 * A class describing and processing application initial options.
 *
 * All options are camel cased before setting it to as a property
 * of this class.
 * Use `getOptions` to create an object with configuration.
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
      type: String
    }, {
      // Path to the workspace state file. Overrides default location.
      name: '--workspace-file',
      shortcut: '-w',
      type: String
    }, {
      // Disables console info output
      name: '--disable-log',
      shortcut: '-l',
      type: Boolean
    }];
  }
  /**
   * Produces list of startup options.
   * @return {Object} Map of configured options.
   */
  getOptions() {
    let result = {};
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
      if (def.skipNext) {
        i++;
      }
    }
  }
  /**
   * Finds an option definition from an argument.
   *
   * @param {String} arg Argument passed to the application.
   * @return {Object} Option definition or undefined if not found.
   */
  findDefinnition(arg) {
    let eqIndex = arg.indexOf('=');
    if (eqIndex !== -1) {
      arg = arg.substr(0, eqIndex);
    }
    if (arg.indexOf('--') === 0) {
      return this.availableOptions.find(item => item.name === arg);
    } else if (arg.indexOf('-') === 0) {
      return this.availableOptions.find(item => item.shortcut === arg);
    }
  }
  /**
   * Updates definition object with `value` and `skipNext` properties.
   *
   * @param {String} arg Command line argument
   * @param {Object} def Existing command definition.
   * @param {?String} nextValue Next item in the arguments array.
   * @return {Object} Updated `def` object.
   */
  getPropertyDefinition(arg, def, nextValue) {
    def.skipNext = false;
    if (def.type === Boolean) {
      def.value = true;
      return def;
    }
    let value;
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
  /**
   * Gets a value from an argument line when value is passed as
   * `arg="value"` or `arg=value`
   *
   * @param {String} arg Argument pice
   * @return {String} Value for the argument.
   */
  getArgValue(arg) {
    let index = arg.indexOf('=');
    if (index === -1) {
      return '';
    }
    let value = arg.substr(index + 1);
    if (value[0] === '"') {
      value = value.substr(1);
      value = value.substr(0, value.length - 1);
    }
    return value;
  }
  /**
   * Sets a property value on this object.
   * An option name is set as a property aftr it's camel cased.
   *
   * @param {Object} def Command definition.
   */
  setProperty(def) {
    const name = camelCase(def.name);
    this[name] = def.value;
  }
}
exports.AppOptions = AppOptions;
