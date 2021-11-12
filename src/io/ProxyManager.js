import { session, app } from 'electron';
import { autoUpdater } from 'electron-updater';
import { logger } from './Logger.js';
import { MainWindowPersist } from '../common/Constants.js';
import { ProxySettings } from './lib/ProxySettings.js';
import { ProxyDiscovery } from './lib/ProxyDiscovery.js';

/** @typedef {import('@advanced-rest-client/events').Config.ARCConfig} ARCConfig */
/** @typedef {import('../types').ApplicationOptionsConfig} ApplicationOptionsConfig */

/**
 * A class that configures proxy settings for this electron instance.
 * Enables communication ports to the renderer process to manipulate the proxy settings.
 */
export class ProxyManager {
  /**
   * @returns {boolean} true when a proxy has been set.
   */
  get isConfigured() {
    return !!this.isArcConfigured || !!this.isDefaultConfigured;
  }

  constructor() {
    this.isArcConfigured = false;
    this.isDefaultConfigured = false;
    /** @type string */
    this.currentUsername = undefined;
    /** @type string */
    this.currentPassword = undefined;
  }

  listen() {
    app.on('login', (event, webContents, request, authInfo, callback) => {
      if (this.isConfigured && this.currentUsername && authInfo.isProxy) {
        event.preventDefault();
        callback(this.currentUsername, this.currentPassword);
      } else {
        callback();
      }
    });
    autoUpdater.on('login', async (authInfo, callback) => {
      if (this.isConfigured && this.currentUsername && authInfo.isProxy) {
        callback(this.currentUsername, this.currentPassword);
      } else {
        callback();
      }
    });
  }
  
  /**
   * Applies proxy settings to the passed session defined by the partition.
   * 
   * @param {Electron.Config} config The configuration to apply.
   * @param {string=} partition The name of the partition to use. Default to the main partition name used by most window.
   * @returns {Promise<void>}
   */
  async apply(config, partition=MainWindowPersist) {
    logger.info(`Applying proxy configuration to the ${partition} partition`);
    const ses = session.fromPartition(partition);
    await ses.setProxy(config);
    await ses.forceReloadProxyConfig();
    await ses.closeAllConnections();
    this.isArcConfigured = true;
  }

  /**
   * Applies proxy settings to the default session. This is to make IO thread request to be proxied by the proxy.
   * 
   * @param {Electron.Config} config The configuration to apply.
   * @returns {Promise<void>}
   */
  async applyElectron(config) {
    logger.info(`Applying proxy configuration to the default partition`);
    await session.defaultSession.setProxy(config);
    await session.defaultSession.forceReloadProxyConfig();
    await session.defaultSession.closeAllConnections();
    this.isDefaultConfigured = true;
  }

  /**
   * Applies proxy configuration from the http and https server setting.
   * 
   * @param {string} proxyUrl The proxy URL.
   * @param {string=} username The proxy username. Optional.
   * @param {string=} password The proxy password. Optional.
   * @returns {Promise<void>}
   */
  async applyFromUrl(proxyUrl, username, password) {
    const settings = new ProxySettings(proxyUrl);

    // chromium doesn't support username:password@hostname scheme for proxies.
    // instead supply the credentials on the login event.
    const uName = (settings.credentials && settings.credentials.username) || username;
    const pwd = (settings.credentials && settings.credentials.password) || password;
    delete settings.credentials;

    this.currentUsername = uName;
    this.currentPassword = pwd;

    const config = /** @type Electron.Config */ ({
      mode: 'fixed_servers',
      proxyRules: settings.toString(),
    });
    await this.apply(config);
    await this.applyElectron(config);
  }

  /**
   * Removes proxy settings.
   */
  async clearSettings() {
    logger.debug('Clearing proxy settings.');
    const config = /** @type Electron.Config */ ({
      mode: 'direct',
    });
    await this.apply(config);
    await this.applyElectron(config);
    this.isArcConfigured = false;
    this.isDefaultConfigured = false;
  }

  /**
   * Applies the proxy settings from the CLI parameters.
   * @param {ApplicationOptionsConfig} initParams
   * @returns {Promise<void>} 
   */
  async applyInitOptionsProxy(initParams) {
    logger.silly('Determining proxy setting from the CLI...');
    const { proxyAll=false, proxySystemSettings=false, proxy, proxyPassword, proxyUsername} = initParams;
    if (!proxyAll) {
      logger.silly('No CLI proxy settings detected.');
      return;
    }
    logger.debug('Applying CLI proxy settings.');
    if (proxySystemSettings) {
      await this.applyProxySystemSettings();
    } else if (proxy) {
      logger.info('Applying proxy configuration from the CLI params...');
      await this.applyFromUrl(proxy, proxyUsername, proxyPassword);
    }
  }

  /**
   * Applies proxy settings from the application configuration
   * @param {ARCConfig} initConfig
   * @returns {Promise<void>} 
   */
  async applyConfigProxy(initConfig={}) {
    logger.silly('Determining proxy setting from the application configuration...');
    if (!initConfig.proxy) {
      logger.silly('No proxy configuration detected.');
      return;
    }
    const { applyToApp, useSystemSettings, url, username, password, enabled } = initConfig.proxy;
    if (!applyToApp || enabled === false) {
      logger.silly('Ignoring proxy configuration. Not applicable to the session.');
      return;
    }
    logger.debug('Applying configured proxy settings.');
    if (useSystemSettings) {
      await this.applyProxySystemSettings();
    } else if (url) {
      logger.info('Applying proxy configuration from the CLI params...');
      await this.applyFromUrl(url, username, password);
    }
  }

  /**
   * Finds system proxy settings and applies them.
   * @returns {Promise<void>} 
   */
  async applyProxySystemSettings() {
    logger.info('Discovering system proxy configuration...');
    const discovery = new ProxyDiscovery();
    const settings = await discovery.read();
    if (!settings) {
      return;
    }
    let url = settings.host;
    if (settings.port) {
      url += `:${settings.port}`;
    }
    if (settings.protocol) {
      url = `${settings.protocol}//${url}`;
    }
    const { credentials={} } = settings;
    await this.applyFromUrl(url, credentials.username, credentials.password);
  }
}
