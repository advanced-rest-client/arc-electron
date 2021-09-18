import camelCase from 'camelcase';
import { logger } from './Logger.js';

/** @typedef {import('../types').ApplicationOption} ApplicationOption */
/** @typedef {import('../types').ProcessedApplicationOption} ProcessedApplicationOption */
/** @typedef {import('../types').ApplicationOptionsConfig} ApplicationOptionsConfig */
/** @typedef {import('../types').ProtocolFile} ProtocolFile */

/**
 * A class describing and processing application initial options.
 *
 * All options are camel cased before setting it to as a property
 * of this class.
 * Use `getOptions` to create an object with configuration.
 */
export class ApplicationOptions {
  /**
   * List of command line options with mapping to properties.
   *
   * @return {ApplicationOption[]} List of app config options
   */
  get availableOptions() {
    return [
      {
        // Path to the settings file. Overrides default location.
        name: '--settings-file',
        shortcut: '-s',
        type: String
      }, 
      {
        // Path to the state file. Overrides default location.
        name: '--state-file',
        shortcut: '-S',
        type: String
      }, 
      {
        // Path to the workspace state files path. Overrides default location.
        name: '--workspace-path',
        shortcut: '-w',
        type: String
      }, {
        // Path to the workspace state files path. Overrides default location.
        name: '--themes-path',
        shortcut: '-t',
        type: String
      }, {
        // Opens ARC in dev mode (opened console, verbose log)
        name: '--dev',
        shortcut: '-d',
        type: Boolean
      }, {
        // Debug log level. Default to "debug". Only valid when `--debug` is set
        name: '--debug-level',
        shortcut: '-l',
        type: String
      }, {
        // Opens ARC in dev mode (opened console, verbose log)
        name: '--with-devtools',
        shortcut: '-w',
        type: Boolean
      }, {
        name: '.', // from "npm start" to not print error
        shortcut: '-dot',
        type: String
      }, {
        name: '--port',
        shortcut: '-p',
        type: Number
      }, {
        name: '--open',
        shortcut: '-o',
        type: String,
      }, {
        // Skips application update check for this run
        name: '--skip-app-update',
        shortcut: '-u',
        type: Boolean,
      }, {
        // Skips themes update check for this run.
        name: '--skip-themes-update',
        shortcut: '-x',
        type: Boolean,
      }, {
        name: '--user-data-dir',
        shortcut: '-D',
        type: String,
      }, {
        name: '--release-channel',
        shortcut: '-r',
        type: String,
      }, {
        name: '--skip-cookie-consent',
        type: Boolean,
      }, 
      {
        name: '--skip-database-upgrade',
        type: Boolean,
      }, 
      {
        // the proxy URL.
        name: '--proxy',
        type: String,
      },
      {
        // optional proxy username
        name: '--proxy-username',
        type: String,
      },
      {
        // proxy password
        name: '--proxy-password',
        type: String,
      },
      {
        // when set it applies proxy system settings
        name: '--proxy-system-settings',
        type: Boolean,
      },
      {
        // when set it applies proxy configuration to the entire application,
        // not only to the HTTP requests. This influences telemetry and updates.
        name: '--proxy-all',
        type: Boolean,
      },
    ];
  }

  constructor() {
    /** 
     * @type {ProtocolFile}
     */
    this.openProtocolFile = undefined;
  }

  /**
   * Produces list of startup options.
   * @return {ApplicationOptionsConfig} Map of configured options.
   */
  getOptions() {
    const result = {};
    Object.entries(this).forEach(([key, value]) => {
      result[key] = value;
    });
    return result;
  }

  /**
   * Parses startup options.
   */
  parse() {
    for (let i = 1; i < process.argv.length; i++) {
      const arg = process.argv[i];
      if (arg[0] !== '-') {
        if (this.isDefaultProtocolFile(arg)) {
          this.setDefaultProtocolFile(arg);
        } else if (!this.open && /[a-zA-Z0-9]/.test(arg[0])) {
          this.open = arg;
        } else if (arg[0] !== '.') {
          logger.warn(`Unknown startup option ${arg}`);
        }
        continue;
      }
      const definition = this.findDefinition(arg);
      if (!definition) {
        logger.warn(`Unknown startup option ${arg}`);
        continue;
      }
      const processedDefinition = this.getPropertyDefinition(arg, definition, process.argv[i + 1]);
      this.setProperty(processedDefinition);
      if (processedDefinition.skipNext) {
        i++;
      }
    }
  }

  /**
   * Checks if the argument is default protocol file argument added to the
   * program's options by the OS.
   * @param {string} arg Argument to test
   * @return {boolean} True if passed argument represent default protocol file.
   */
  isDefaultProtocolFile(arg) {
    return !!(arg && arg.indexOf('arc-file://') === 0);
  }

  /**
   * Sets `openProtocolFile` property with passed file path information.
   * The `source` property represents file source (like google-drive).
   * The `action` property represent an action to take (like `open` or `create`).
   * The `id` property if the file identifier.
   * @param {string} url Default protocol file.
   */
  setDefaultProtocolFile(url) {
    const fileData = url.substr(11);
    const parts = fileData.split('/');
    switch (parts[0]) {
      case 'drive':
        // arc-file://drive/open/file-id
        // arc-file://drive/create/file-id
        this.openProtocolFile = /** @type ProtocolFile */ ({
          source: 'google-drive',
          action: parts[1],
          id: parts[2]
        });
        break;
      default: 
    }
  }

  /**
   * Finds an option definition from an argument.
   *
   * @param {string} arg Argument passed to the application.
   * @return {ApplicationOption|undefined} Option definition or undefined if not found.
   */
  findDefinition(arg) {
    let value = arg;
    const eqIndex = arg.indexOf('=');
    if (eqIndex !== -1) {
      value = value.substr(0, eqIndex);
    }
    if (value.indexOf('--') === 0) {
      return this.availableOptions.find((item) => item.name === value);
    }
    if (value.indexOf('-') === 0) {
      return this.availableOptions.find((item) => item.shortcut === value);
    }
    return undefined;
  }

  /**
   * Updates definition object with `value` and `skipNext` properties.
   *
   * @param {string} arg Command line argument
   * @param {ApplicationOption} def Existing command definition.
   * @param {string=} nextValue Next item in the arguments array.
   * @return {ProcessedApplicationOption} Updated `def` object.
   */
  getPropertyDefinition(arg, def, nextValue) {
    const result = /** @type ProcessedApplicationOption */ ({ ...def, skipNext: false });
    if (result.type === Boolean) {
      result.value = true;
      return result;
    }
    let value;
    if (arg.indexOf('=') !== -1) {
      value = this.getArgValue(arg);
    } else {
      value = nextValue;
      result.skipNext = true;
    }
    if (result.type === Number) {
      result.value = Number(value);
    } else {
      result.value = value;
    }
    return result;
  }

  /**
   * Gets a value from an argument line when value is passed as
   * `arg="value"` or `arg=value`
   *
   * @param {string} arg Argument pice
   * @return {string} Value for the argument.
   */
  getArgValue(arg) {
    const index = arg.indexOf('=');
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
   * An option name is set as a property after it's camel cased.
   *
   * @param {ProcessedApplicationOption} def Command definition.
   */
  setProperty(def) {
    const name = camelCase(def.name);
    if (this[name] && def.isArray) {
      let v = this[name];
      if (!Array.isArray(v)) {
        v = [v];
      }
      v.push(def.value);
      this[name] = v;
    } else {
      this[name] = def.value;
    }
  }
}
