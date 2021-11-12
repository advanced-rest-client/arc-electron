import { ProxySettings } from './ProxySettings.js';
import { WinReg } from './WinReg.js';

export class ProxyDiscovery {
  /** 
   * Reads the system proxy settings.
   * @returns {Promise<ProxySettings|null>}
   */
  async read() {
    const envProxy = this.envSettings();
    if (envProxy) {
      return envProxy;
    }
    if (process.platform === "win32") {
      return this.registrySettings();
    }
    return null;
  }

  /** 
   * Reads the settings from the environment.
   * This works with linux systems.
   * @returns {ProxySettings|null}
   */
  envSettings() {
    const httpProxy = process.env.HTTP_PROXY || process.env.http_proxy;
    if (!httpProxy) {
      return null;
    }
    return new ProxySettings(httpProxy);
  }

  /** 
   * Reads the system proxy settings form the Windows registry.
   * @returns {Promise<ProxySettings|null>}
   */
  async registrySettings() {
    // https://docs.microsoft.com/en-us/troubleshoot/windows-client/networking/configure-client-proxy-server-settings-by-registry-file
    const reg = new WinReg();
    const values = await reg.readKey('HKCU', "Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings");
    const proxy = values.ProxyServer;
    const enable = values.ProxyEnable;
    if (!proxy || !proxy.value || !enable) {
      return null;
    }
    const enableValue = Number(enable.value);
    if (enableValue === 0) {
      return null;
    }
    let settings;
    try {
      // eslint-disable-next-line no-new
      new URL(proxy.value);
      settings = new ProxySettings(proxy.value);
    } catch (e) {
      const parts = proxy.value.split(';').map(item => item.split('=', 2));
      let http;
      let https;
      for (const [key, value] of parts) {
        if (key === 'http') {
          http = value;
        } else if (key === 'https') {
          https = value;
        }
      }
      if (http) {
        settings = new ProxySettings(http);
      } else if (https) {
        settings = new ProxySettings(https);
      }
    }
    return settings || null;
  }
}
