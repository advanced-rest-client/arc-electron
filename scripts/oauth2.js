const {BrowserWindow} = require('electron');
const fs = require('fs-extra');
const path = require('path');
const {URLSearchParams} = require('url');
const {session} = require('electron');
const filter = {
  urls: ['https://auth.advancedrestclient.com/*']
};
// jscs:disable requireCamelCaseOrUpperCaseIdentifiers
const windowParams = {
  width: 640,
  height: 800,
  alwaysOnTop: true,
  autoHideMenuBar: true,
  title: 'OAuth2 login',
  frame: true,
  webPreferences: {
    nodeIntegration: false
  }
};
/**
 * TokenInfo: Object with cached authorization data
 * - `access_token` {String} The access token.
 * - `expires_at` {Number} Timestamp of the token expiration time.
 * - `expires_in` {Number} Number of seconds when the token expires.
 * - `token_type` {String} A token type. Most often `Bearer`
 * - `scopes` {Array<String>} List of scopes for this token.
 */
class IdentityProvider {
  constructor(id, oauthConfig) {
    this.id = id;
    this.oauthConfig = oauthConfig;
    // Cached token data
    this.tokenInfo = undefined;
    this.cacheKey = '_oauth_cache_' + this.id;
    // Latest generated state parameter for the request.
    this.lastState = undefined;
  }
  /**
   * Gets either cached authorization token or request for new one.
   *
   * If the `interactive` flag is false the authorization prompt window will never
   * be opened and if the authorization scope had changed or user did not
   * authorizaed the application this will result in Promise error.
   *
   * @param {Object} opts Authorization options
   * - `interactive` {Boolean} If the interactive flag is `true`, `getAuthToken`
   * will prompt the user as necessary. When the flag is `false` or omitted,
   * `getAuthToken` will return failure any time a prompt would be required.
   * - `scopes` {Array<String>} List of scopes to authorize
   * @return {Promise} A promise resulted to the auth token. It return undefined
   * if the app is not authorized. The promise will result with error (reject)
   * if there's an authorization error.
   */
  getAuthToken(opts) {
    return this.getTokenInfo()
    .then(info => {
      if (info && this.isTokenAuthorized(info, opts.scopes || this.oauthConfig.scopes)) {
        return info;
      }
      this.requestOptions = opts;
      return this.launchWebAuthFlow(opts);
    })
    .then(tokenInfo => tokenInfo.access_token)
    .catch(cause => {
      if (!opts.interactive) {
        return;
      }
      var err = new Error(cause.message);
      err.code = cause.code;
      throw err;
    });
  }
  /**
   * Runs the web authorization flow.
   * @param {Object} opts Authorization options
   * - `interactive` {Boolean} If the interactive flag is `true`, `launchWebAuthFlow`
   * will prompt the user as necessary. When the flag is `false` or omitted,
   * `launchWebAuthFlow` will return failure any time a prompt would be required.
   * - `scopes` {Array<String>} List of scopes to authorize
   * - `login_hint` -  If your application knows which user is trying to authenticate,
   * it can use this parameter to provide a hint to the Authentication Server.
   * The server uses the hint to simplify the login flow either by prefilling
   * the email field in the sign-in form or by selecting the appropriate
   * multi-login session. Set the parameter value to an email address or `sub`
   * identifier.
   * @return {Promise} A promise with auth result.
   */
  launchWebAuthFlow(opts) {
    try {
      this.assertOAuthOptions(opts);
    } catch (e) {
      return Promise.reject('OAuth2: ' + e.message);
    }
    const url = this.computeAuthorizationUrl(opts);
    const params = Object.assign({}, windowParams);
    if (!opts.interactive) {
      params.show = false;
    }
    const win = new BrowserWindow(params);
    win.loadURL(url);
    this.observeAuthWindowNavigation(win);
    this.currentOAuthWindow = win;
    return new Promise((resolve, reject) => {
      this.__lastPromise = {
        resolve: resolve,
        reject: reject
      };
    });
  }
  /**
   * Adds listeners to a window object.
   *
   * @param {BrowserWindow} win Window object to observe events on.
   */
  observeAuthWindowNavigation(win) {
    if (!this.__awfl) {
      this.__awfl = this._authWindowFailLoadHandler.bind(this);
      this.__awrd = this._authWindowResponseDetailHandler.bind(this);
      this.__awc = this._authWindowCloseHandler.bind(this);
    }
    win.webContents.on('did-fail-load', this.__awfl);
    win.webContents.on('did-get-response-details', this.__awrd);
    win.on('close', this.__awc);
  }
  /**
   * Removes event listeners, closes the window and cleans the property.
   */
  unobserveAuthWindow() {
    const win = this.currentOAuthWindow;
    if (!win) {
      return;
    }
    win.webContents.removeListener('did-fail-load', this.__awfl);
    win.webContents.removeListener('did-get-response-details', this.__awrd);
    win.removeListener('close', this.__awc);
    win.destroy();
    delete this.currentOAuthWindow;
  }
  /**
   * Reports authorization error back to the application.
   *
   * This operation clears the promise object.
   *
   * @param {Object} details Error details to report to the app.
   * It should contain `code` and `message` properties.
   */
  _reportOAuthError(details) {
    this.unobserveAuthWindow();
    if (!this.__lastPromise) {
      return;
    }
    this.__lastPromise.reject(details);
    delete this.__lastPromise;
  }
  /**
   * Parses response URL and reports the result of the request.
   *
   * @param {Strinig} url Redirected response URL
   */
  _reportOAuthResult(url) {
    this.unobserveAuthWindow();
    var params = '';
    if (this.oauthConfig.response_type === 'token') {
      params = url.substr(url.indexOf('#') + 1);
    } else {
      params = url.substr(url.indexOf('?') + 1);
    }
    var oauthParams = new URLSearchParams(params);
    if (oauthParams.has('error')) {
      return this._reportOAuthError(this._createResponseError(oauthParams));
    }
    const state = oauthParams.get('state');
    if (state !== this.lastState) {
      return this._reportOAuthError({
        code: 'invalid_state',
        message: 'The state value returned by the authorization server is invalid'
      });
    }
    var tokenInfo = {
      access_token: oauthParams.get('access_token'),
      token_type: oauthParams.get('token_type'),
      expires_in: oauthParams.get('expires_in')
    };
    var scope = oauthParams.get('scope');
    var requestedScopes = this.requestOptions.scopes || this.oauthConfig.scopes;
    if (scope) {
      scope = scope.split(' ');
      scope = requestedScopes.concat(scope);
    } else {
      scope = requestedScopes.scopes;
    }
    tokenInfo.scopes = scope;
    tokenInfo.expires_at = this.computeExpires(tokenInfo);
    this.tokenInfo = tokenInfo;
    this.storeToken(this.tokenInfo);
    if (!this.__lastPromise) {
      return;
    }
    this.__lastPromise.resolve(Object.assign({}, tokenInfo));
    delete this.__lastPromise;
  }

  _createResponseError(oauthParams) {
    let detail = {
      code: oauthParams.get('error')
    };
    let message;
    if (oauthParams.has('error_description')) {
      message = oauthParams.get('error_description');
    } else {
      switch (detail.code) {
        case 'interaction_required':
          message = 'The request requires user interaction.';
          break;
        case 'invalid_request':
          message = 'The request is missing a required parameter.';
          break;
        case 'invalid_client':
          message = 'Client authentication failed.';
          break;
        case 'invalid_grant':
          message = 'The provided authorization grant or refresh token is';
          message += ' invalid, expired, revoked, does not match the redirection';
          message += 'URI used in the authorization request, or was issued to';
          message += 'another client.';
          break;
        case 'unauthorized_client':
          message = 'The authenticated client is not authorized to use this';
          message += ' authorization grant type.';
          break;
        case 'unsupported_grant_type':
          message = 'The authorization grant type is not supported by the';
          message += ' authorization server.';
          break;
        case 'invalid_scope':
          message = 'The requested scope is invalid, unknown, malformed, or';
          message += ' exceeds the scope granted by the resource owner.';
          break;
      }
    }
    detail.message = message;
    return detail;
  }

  _authWindowFailLoadHandler(event, errorCode, errorDescription, validatedURL, isMainFrame) {
    if (!isMainFrame) {
      return;
    }
    if (validatedURL.indexOf(this.oauthConfig.redirect_uri) === 0) {
      this._reportOAuthResult(validatedURL);
    } else {
      this._reportOAuthError({
        code: 'auth_error',
        message: 'Unexpected auth response. Make sure the OAuth2 config is valid'
      });
    }
  }

  _authWindowCloseHandler() {
    if (this.__lastPromise) {
      this._reportOAuthError({
        code: 'user_interrupted',
        message: 'The request has been canceled by the user.'
      });
    }
  }

  _authWindowResponseDetailHandler(event, status, newURL, originalURL,
    httpResponseCode, requestMethod, referrer, headers, resourceType) {
    if (resourceType !== 'mainFrame') {
      return;
    }
    if (httpResponseCode >= 400) {
      // This is an error. Redirect URL can be fake and this should catch
      // valid response in 400 status code.
      if (newURL.indexOf(this.oauthConfig.redirect_uri) !== 0) {
        this._reportOAuthError({
          code: 'url_error',
          message: 'Unable to run authorization flow. Make sure the OAuth2 config is valid'
        });
        return;
      }
    }
    if (newURL.indexOf(this.oauthConfig.redirect_uri) === 0) {
      this._reportOAuthResult(newURL);
    }
  }

  /**
   * Computes authorization URL
   * @param {Object} opts See options for `launchWebAuthFlow`
   * @return {String} Complete authorization URL.
   */
  computeAuthorizationUrl(opts) {
    var cnf = this.oauthConfig;
    var url = cnf.auth_uri + '?';
    url += 'client_id=' + encodeURIComponent(cnf.client_id);
    url += '&redirect_uri=' + encodeURIComponent(cnf.redirect_uri);
    url += '&response_type=' + cnf.response_type;
    url += '&scope=' + this.computeScope(opts.scopes || this.oauthConfig.scopes);
    url += '&state=' + this.setStateParameter();
    if (cnf.include_granted_scopes) {
      url += '&include_granted_scopes=true';
    }
    if (opts.login_hint) {
      url += '&login_hint=' + encodeURIComponent(opts.login_hint);
    }
    if (!opts.interactive) {
      url += '&prompt=none';
    }
    return url;
  }

  /**
   * Computes `scope` URL parameter from scopes array.
   *
   * @param {Array<String>} scopes List of scopes to use with the request.
   * @return {String} Computed scope value.
   */
  computeScope(scopes) {
    var scope = scopes.join(' ');
    return encodeURIComponent(scope);
  }
  /**
   * Asserts that the OAuth configuration is valid.
   *
   * This throws an error when configuration is invalid with error message.
   *
   * @param {Object} opts Request object
   */
  assertOAuthOptions(opts) {
    var cnf = this.oauthConfig;
    var messages = [];
    if (!cnf.client_id) {
      messages.push('"client_id" is required but is missing.');
    }
    if (!(opts.scopes && opts.scopes.length) && !(cnf.scopes && cnf.scopes.length)) {
      messages.push('"scopes" is required but is missing.');
    }
    if (!cnf.auth_uri) {
      messages.push('"auth_uri" is required but is missing.');
    }
    if (!cnf.redirect_uri) {
      messages.push('"redirect_uri" is required but is missing.');
    }
    if (cnf.response_type === 'code') {
      if (!cnf.client_secret) {
        messages.push('"code" response type requires "client_secret" to be set.');
      }
      if (!cnf.token_uri) {
        messages.push('"code" response type requires "token_uri" to be set.');
      }
    }
    if (messages.length) {
      throw new Error(messages.join(' '));
    }
  }
  /**
   * Checks if current token is authorized for given list of scopes.
   *
   * @param {Object} tokenInfo A token info object. Must contain `scopes` property.
   * @param {Array<String>} scopes List of scopes to authorize.
   * @return {Boolean} True if requested scope is already authorized with this
   * token.
   */
  isTokenAuthorized(tokenInfo, scopes) {
    var grantedScopes = tokenInfo.scopes;
    grantedScopes = grantedScopes.map(scope => scope.trim());
    scopes = scopes.map(scope => scope.trim());
    var missing = scopes.find(scope => {
      return grantedScopes.indexOf(scope) === -1;
    });
    return !missing;
  }

  /**
   * Returns cached token info.
   *
   * @return {Object} Token info ibject or undefined if there's no cached token
   * or cached token expired.
   */
  getTokenInfo() {
    var promise;
    if (!this.tokenInfo) {
      promise = this.restoreTokenInfo();
    } else {
      promise = Promise.resolve(this.tokenInfo);
    }
    return promise
    .then(info => {
      this.tokenInfo = info;
      if (!this.tokenInfo) {
        return;
      }
      if (this.isExpired(this.tokenInfo)) {
        this.tokenInfo = undefined;
        return;
      }
      return this.tokenInfo;
    });
  }
  /**
   * Restores authorization token information from the local store.
   *
   * @return {Object} Token info object or undefined if not set or expired.
   */
  restoreTokenInfo() {
    var bw = BrowserWindow.getAllWindows()[0]; // All schare the same session.
    var str = `localStorage.getItem('${this.cacheKey}')`;
    return bw.webContents.executeJavaScript(str)
    .then(data => {
      if (!data) {
        return;
      }
      try {
        let tokenInfo = JSON.parse(data);
        if (this.isExpired(tokenInfo)) {
          str = `localStorage.removeItem('${this.cacheKey}')`;
          return bw.webContents.executeJavaScript(str);
        }
        return tokenInfo;
      } catch (e) {}
    });
  }
  /**
   * Casches token data in local storage.
   *
   * @param {Object} tokenInfo
   */
  storeToken(tokenInfo) {
    var bw = BrowserWindow.getAllWindows()[0];
    var str = `localStorage.setItem('${this.cacheKey}','`;
    str += JSON.stringify(tokenInfo);
    str += '\')';
    return bw.webContents.executeJavaScript(str);
  }
  /**
   * Checks if the token already expired.
   *
   * @param {Object} tokenInfo Token info object
   * @return {Boolean} True if the token is already expired and should be reneved.
   */
  isExpired(tokenInfo) {
    if (!tokenInfo || !tokenInfo.expires_at) {
      return true;
    }
    if (Date.now() > tokenInfo.expires_at) {
      return true;
    }
    return false;
  }
  /**
   * Computes token expiration time.
   *
   * @param {Object} tokenInfo Token info object
   * @return {Number} Time in the future when when the token expires.
   */
  computeExpires(tokenInfo) {
    var expiresIn = tokenInfo.expires_in || 3600;
    if (typeof expiresIn !== 'number') {
      expiresIn = Number(expiresIn);
      if (expiresIn !== expiresIn) {
        expiresIn = 3600;
      }
    }
    expiresIn = Date.now() + (expiresIn * 1000);
    return expiresIn;
  }
  /**
   * Generates a random string to be used as a `state` parameter, sets the
   * `lastState` property to generated text and returns the value.
   */
  setStateParameter() {
    var text = '';
    var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 12; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    this.lastState = text;
    return text;
  }
}

class ArcIdentity {
  static _generateProviderId(authUrl, clientId) {
    return encodeURIComponent(authUrl) + '/' + encodeURIComponent(clientId);
  }
  static _setProvider(provider) {
    if (!ArcIdentity.__providers) {
      ArcIdentity.__providers = [];
    }
    ArcIdentity.__providers.push(provider);
  }
  /**
   * Looks for existing OAuth provider with (possibly) cached auth data.
   *
   * @param {String} authUrl Authorization URL
   * @param {String} clientId Client ID used to authenticate.
   * @return {IdentityProvider} An identity provider or `undefined` if not exists.
   */
  static _getProvider(authUrl, clientId) {
    if (!ArcIdentity.__providers) {
      return;
    }
    const id = ArcIdentity._generateProviderId(authUrl, clientId);
    return ArcIdentity.__providers.find(item => item.id === id);
  }
  /**
   * Runs the web authorization flow.
   * @param {Object} opts Authorization options
   * - `interactive` {Boolean} If the interactive flag is `true`, `launchWebAuthFlow`
   * will prompt the user as necessary. When the flag is `false` or omitted,
   * `launchWebAuthFlow` will return failure any time a prompt would be required.
   * - `response_type` {String} `code` or `token`.
   * - `scopes` {Array<String>} List of scopes to authorize
   * - `client_id` {String} The client ID used for authorization
   * - `auth_uri` {String} Authorization URI
   * - `token_uri` {String} Optional, required if `response_type` is code
   * - `client_secret` {String} Optional, required if `response_type` is code
   * - `include_granted_scopes` {Boolean} Optional.
   * - `login_hint` {String} Optiona, user email
   * @return {Promise} A promise with auth result.
   */
  static launchWebAuthFlow(opts) {
    var provider = ArcIdentity._getOrCreateProvider(opts);
    return provider.launchWebAuthFlow(opts);
  }
  /**
   * A method to call to authorize the user in Google authorization services.
   *
   * @param {Object} opts Authorization options
   * - `interactive` {Boolean} If the interactive flag is `true`, `getAuthToken`
   * will prompt the user as necessary. When the flag is `false` or omitted,
   * `getAuthToken` will return failure any time a prompt would be required.
   * - `scopes` {Array<String>} List of scopes to authorize
   * @return {Promise} A promise resulted to the auth token.
   */
  static getAuthToken(opts) {
    return ArcIdentity.getOAuthConfig()
    .then(config => ArcIdentity._getOrCreateProvider(config))
    .then(provider => provider.getAuthToken(opts));
  }
  /**
   * Reads the default OAuth configuration for the app from package file.
   *
   * @return {Promise} A promise resolved to OAuth2 configuration object
   */
  static getOAuthConfig() {
    if (ArcIdentity.__oauthConfig) {
      return Promise.resolve(ArcIdentity.__oauthConfig);
    }
    return fs.readJson(path.join(__dirname, '..', 'package.json'))
    .then(packageInfo => packageInfo.oauth2)
    .then(config => {
      ArcIdentity.__oauthConfig = config;
      return config;
    });
  }
  /**
   * Returns chached provider or creates new provider based on the oauth
   * configuration.
   *
   * @param {Object} oauthConfig OAuth2 configuration object.
   */
  static _getOrCreateProvider(oauthConfig) {
    var provider = ArcIdentity._getProvider(oauthConfig.auth_uri, oauthConfig.client_id);
    if (!provider) {
      const id = ArcIdentity._generateProviderId(oauthConfig.auth_uri, oauthConfig.client_id);
      const cnf = Object.assign({}, oauthConfig);
      cnf.response_type = 'token';
      cnf.include_granted_scopes = true;
      provider = new IdentityProvider(id, cnf);
      ArcIdentity._setProvider(provider);
    }
    return provider;
  }
}
exports.ArcIdentity = ArcIdentity;
