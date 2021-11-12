/** @typedef {import('../../types').ProxyCredentials} ProxyCredentials */

export class ProxySettings {
  /**
   * @param {string} url The proxy URL.
   */
  constructor(url) {
    /** @type string */
    this.host = undefined;
    /** @type string */
    this.port = undefined;
    /** @type string */
    this.protocol = 'http:';
    /** @type ProxyCredentials */
    this.credentials = undefined;
    this.parseUrl(url);
  }

  /** 
   * Parses the passed URL into its components.
   * @param {string} value;
   */
  parseUrl(value) {
    let fullUrl = value;
    if (!fullUrl.startsWith('http')) {
      fullUrl = `http://${fullUrl}`;
    }
    const url = new URL(fullUrl);
    this.host = url.hostname;
    this.port = url.port;
    if (url.protocol === 'https:') {
      this.protocol = 'https:';
    } else {
      this.protocol = 'http:';
    }
    if (!this.port) {
      this.port = this.protocol === 'https:' ? '443' : '80';
    }
    if (url.username) {
      this.credentials = {
        username: url.username,
        password: url.password,
      };
    }
  }

  /**
   * @returns {string} The proxy URL.
   */
  toString() {
    let credentials = '';
    if (this.credentials) {
      credentials = `${this.credentials.username}`;
      if (this.credentials.password) {
        credentials += `:${this.credentials.password}`;
      }
      credentials += '@';
    }
    return `${this.protocol}//${credentials}${this.host}:${this.port}`;
  }
}
