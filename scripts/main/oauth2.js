const {BrowserWindow, ipcMain, session} = require('electron');
const fs = require('fs-extra');
const path = require('path');
const {URLSearchParams} = require('url');
const _fetch = require('node-fetch');
// const PERSISTNAME = 'persist:auth-server';
// jscs:disable requireCamelCaseOrUpperCaseIdentifiers
const windowParams = {
  width: 640,
  height: 800,
  alwaysOnTop: true,
  autoHideMenuBar: true,
  webPreferences: {
    nodeIntegration: false,
    // partition: PERSISTNAME
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
  /**
   *
   * @param {String} id ID of the provider.
   * @param {Object} oauthConfig OAuth2 configuration.
   */
  constructor(id, oauthConfig) {
    /**
     * Generated ID of the provider.
     *
     * @type {String}
     */
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
   * If the `interactive` flag is false the authorization prompt
   * window will never be opened and if the authorization scope had
   * changed or user did not authorizaed the application this will
   * result in Promise error.
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
    .then((info) => {
      if (info && this.isTokenAuthorized(info, opts.scopes ||
        this.oauthConfig.scopes)) {
        return info;
      }
      this.requestOptions = opts;
      return this.launchWebAuthFlow(opts);
    })
    .catch((cause) => {
      if (!opts.interactive) {
        return;
      }
      let err = new Error(cause.message);
      err.code = cause.code;
      throw err;
    });
  }
  /**
   * Runs the web authorization flow.
   * @param {Object} opts Authorization options
   * - `interactive` {Boolean} If the interactive flag is `true`,
   * `launchWebAuthFlow` will prompt the user as necessary.
   * When the flag is `false` or omitted, `launchWebAuthFlow`
   * will return failure any time a prompt would be required.
   * - `scopes` {Array<String>} List of scopes to authorize
   * - `login_hint` -  If your application knows which user is trying
   * to authenticate, it can use this parameter to provide
   * a hint to the Authentication Server.
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
    this.requestOptions = opts;
    const url = this.computeAuthorizationUrl(opts);
    const params = Object.assign({}, windowParams);
    params.webPreferences.session = session.fromPartition('persist:oauth2-win');
    if (!opts.interactive) {
      params.show = false;
    }
    const win = new BrowserWindow(params);
    win.loadURL(url);
    this.observeAuthWindowNavigation(win, opts.interactive);
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
  observeAuthWindowNavigation(win, interactive) {
    // win.webContents.on('did-fail-load', this._authWindowFailLoadHandler.bind(this));
    win.webContents.on('did-get-response-details', this._authWindowResponseDetailHandler.bind(this, interactive));
    // win.webContents.on('did-get-redirect-request', (e, old, newUrl) => {
    //   if (old.indexOf('google-analytics') !== -1) {
    //     return;
    //   }
    //   console.log('REDIRECT FROM', old, 'TO' , newUrl);
    // });
    // win.webContents.on('did-navigate', (e, url) => {
    //   console.log('NAVIGATE EVENT TO: ', url);
    // });
    win.on('close', this._authWindowCloseHandler.bind(this));
  }
  /**
   * Removes event listeners, closes the window and cleans the property.
   */
  unobserveAuthWindow() {
    const win = this.currentOAuthWindow;
    if (!win) {
      return;
    }
    // win.webContents.removeAllListeners('did-fail-load');
    win.webContents.removeAllListeners('did-get-response-details');
    win.removeAllListeners('close');
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
    let params = '';
    if (this.oauthConfig.response_type === 'token') {
      params = url.substr(url.indexOf('#') + 1);
    } else {
      params = url.substr(url.indexOf('?') + 1);
    }
    let oauthParams = new URLSearchParams(params);
    if (oauthParams.has('error')) {
      this._reportOAuthError(this._createResponseError(oauthParams));
      return;
    }
    this._processResponseData(oauthParams);
  }
  /**
   * Processes OAuth2 server query string response.
   *
   * @param {URLSearchParams} oauthParams Created from parameters params.
   */
  _processResponseData(oauthParams) {
    const state = oauthParams.get('state');
    if (state !== this.lastState) {
      this._reportOAuthError({
        state: this.requestOptions.state,
        code: 'invalid_state',
        message:
          'The state value returned by the authorization server is invalid'
      });
      return;
    }
    if (this.oauthConfig.response_type === 'code') {
      this._exchangeCodeValue = oauthParams.get('code');
      this._exchangeCode(this._exchangeCodeValue);
      return;
    }
    let tokenInfo = {
      access_token: oauthParams.get('access_token'),
      token_type: oauthParams.get('token_type'),
      expires_in: oauthParams.get('expires_in')
    };
    Object.keys(tokenInfo).forEach((key) => {
      let camelName = this._camel(key);
      if (camelName) {
        tokenInfo[camelName] = tokenInfo[key];
      }
    });
    let scope = oauthParams.get('scope');
    let requestedScopes = this.requestOptions.scopes || this.oauthConfig.scopes;
    if (scope) {
      scope = scope.split(' ');
      if (requestedScopes) {
        scope = requestedScopes.concat(scope);
      }
    } else if (requestedScopes) {
      scope = requestedScopes;
    }
    tokenInfo.scopes = scope;
    tokenInfo.expires_at = this.computeExpires(tokenInfo);
    this.tokenInfo = tokenInfo;
    this.storeToken(this.tokenInfo);
    tokenInfo.state = this.requestOptions.state;
    if (!this.__lastPromise) {
      return;
    }
    this.__lastPromise.resolve(Object.assign({}, tokenInfo));
    delete this.__lastPromise;
  }
  /**
   * Exchange code for token.
   *
   * @param {String} code Returned code from the authorization endpoint.
   */
  _exchangeCode(code) {
    const url = this.requestOptions.token_uri;
    const body = this._getCodeEchangeBody(this.requestOptions, code);
    this._tokenCodeRequest(url, body)
    .then((tokenInfo) => {
      this._exchangeCodeValue = undefined;
      this.tokenInfo = tokenInfo;
      this.storeToken(this.tokenInfo);
      if (!this.__lastPromise) {
        return;
      }
      this.__lastPromise.resolve(Object.assign({}, tokenInfo));
      delete this.__lastPromise;
    })
    .catch((cause) => {
      this._exchangeCodeValue = undefined;
      const detail = {
        message: cause.message,
        code: cause.code || 'unknown_error',
        state: this.requestOptions.state
      };
      this._reportOAuthError(detail);
    });
  }
  /**
   * Creates code exchange request body.
   *
   * @param {Object} settings Initial settings
   * @param {String} code The code to exchange
   * @return {String} Body to send to the server.
   */
  _getCodeEchangeBody(settings, code) {
    let url = 'grant_type=authorization_code&';
    url += 'client_id=' + encodeURIComponent(settings.client_id) + '&';
    if (settings.redirect_uri) {
      url += 'redirect_uri=' + encodeURIComponent(settings.redirect_uri) + '&';
    }
    url += 'code=' + encodeURIComponent(code) + '&';
    url += 'client_secret=' + settings.client_secret;
    return url;
  }
  /**
   * Camel case given name.
   *
   * @param {String} name Value to camel case.
   * @return {String} Camel cased name
   */
  _camel(name) {
    let i = 0;
    let l;
    let changed = false;
    while ((l = name[i])) {
      if ((l === '_' || l === '-') && i + 1 < name.length) {
        name = name.substr(0, i) + name[i + 1].toUpperCase() +
          name.substr(i + 2);
        changed = true;
      }
      i++;
    }
    return changed ? name : undefined;
  }
  /**
   * Makes a request to authorization server to exchange code to access token.
   *
   * @param {String} url Token exchange URL
   * @param {String} body Payload to send to the server.
   * @return {Promise} Promise resolved when the response is received and
   * processed.
   */
  _tokenCodeRequest(url, body) {
    const init = {
      method: 'POST',
      body: body,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    };
    let responseContentType;
    return _fetch(url, init)
    .then((response) => {
      let status = response.status;
      if (status === 404) {
        let err = new Error('Authorization URI is invalid (Error 404).');
        err.code = 'invalid_uri';
        throw err;
      } else if (status >= 400 && status < 500) {
        let err = new Error('Server does not support this method. ' +
          'Response code is ' + status);
        err.code = 'method_not_supported';
        throw err;
      } else if (status >= 500) {
        let err = new Error('Authorization server error. Response code is ' +
          status);
        err.code = 'server_error';
        throw err;
      }
      responseContentType = response.headers.get('content-type');
      return response.text();
    })
    .then((text) => this._processTokenCodeResponse(text, responseContentType));
  }
  /**
   * Processes code exchange data.
   *
   * @param {String} data Data returned from the auth server.
   * @param {String} contentType Response content type.
   * @return {Object} tokenInfo object
   */
  _processTokenCodeResponse(data, contentType) {
    contentType = contentType || '';
    let tokenInfo;
    if (contentType.indexOf('json') !== -1) {
      try {
        tokenInfo = JSON.parse(data);
        Object.keys(tokenInfo).forEach((key) => {
          let camelName = this._camel(key);
          if (camelName) {
            tokenInfo[camelName] = tokenInfo[key];
          }
        });
      } catch (e) {
        let err = new Error('The response could not be parsed. ' + e.message);
        err.code = 'response_parse';
        throw err;
      }
    } else {
      tokenInfo = {};
      data.split('&').forEach((p) => {
        let item = p.split('=');
        let name = item[0];
        let camelName = this._camel(name);
        let value = decodeURIComponent(item[1]);
        tokenInfo[name] = value;
        tokenInfo[camelName] = value;
      });
    }
    if ('error' in tokenInfo) {
      let err = new Error(tokenInfo.errorDescription ||
        'The request is invalid.');
      err.code = tokenInfo.error;
      throw err;
    }
    tokenInfo.scopes = this.requestOptions.scopes;
    tokenInfo.expires_at = this.computeExpires(tokenInfo);
    return tokenInfo;
  }
  /**
   * Creates an error object to be reported back to the app.
   * @param {Object} oauthParams Map of oauth response parameteres
   * @return {Object} Error message:
   * - code {String} - The `error` property returned by the server.
   * - message {String} - Error message returned by the server.
   */
  _createResponseError(oauthParams) {
    let detail = {
      state: this.requestOptions.state,
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
          message += ' invalid, expired, revoked, does not match the ';
          message += 'redirection URI used in the authorization request, ';
          message += 'or was issued to another client.';
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
  // /**
  //  * Handler for the BrowserWindow load error.
  //  * @param {Event} event
  //  * @param {Number} errorCode
  //  * @param {String} errorDescription
  //  * @param {String} validatedURL
  //  * @param {Boolean} isMainFrame
  //  */
  // _authWindowFailLoadHandler(event, errorCode, errorDescription,
  //   validatedURL, isMainFrame) {
  //   if (!isMainFrame) {
  //     return;
  //   }
  //   if (validatedURL.indexOf(this.oauthConfig.redirect_uri) === 0) {
  //     this._reportOAuthResult(validatedURL);
  //   } else {
  //     this._reportOAuthError({
  //       state: this.requestOptions.state,
  //       code: 'auth_error',
  //       message:
  //         'Unexpected auth response. Make sure the OAuth2 config is valid'
  //     });
  //   }
  // }
  /**
   * Handler for the auth window close event.
   * If the response wasn't reported so far it reports error.
   */
  _authWindowCloseHandler() {
    if (this.__lastPromise) {
      this._reportOAuthError({
        state: this.requestOptions.state,
        code: 'user_interrupted',
        message: 'The request has been canceled by the user.'
      });
    }
  }
  /**
   * Handler for the `did-get-response-details` event fired by the auth window.
   *
   * @param {Event} event
   * @param {Number} status
   * @param {String} newURL
   * @param {String} originalURL
   * @param {Number} httpResponseCode
   * @param {String} requestMethod
   * @param {String} referrer
   * @param {Object} headers
   * @param {String} resourceType
   */
  _authWindowResponseDetailHandler(interactive, event, status, newURL, originalURL,
    httpResponseCode, requestMethod, referrer, headers, resourceType) {
    if (resourceType !== 'mainFrame') {
      return;
    }
    if (httpResponseCode >= 400) {
      // This is an error. Redirect URL can be fake and this should catch
      // valid response in 400 status code.
      if (newURL.indexOf(this.oauthConfig.redirect_uri) !== 0) {
        let msg = 'Unable to run authorization flow. Make sure the OAuth2 ';
        msg += 'config is valid.';
        this._reportOAuthError({
          state: this.requestOptions.state,
          code: 'url_error',
          message: msg
        });
        return;
      }
    }
    if (newURL.indexOf(this.oauthConfig.redirect_uri) === 0) {
      if (this.__loadPopupTimeout) {
        clearTimeout(this.__loadPopupTimeout);
      }
      this._reportOAuthResult(newURL);
    } else {
      if (interactive === false) {
        this.__loadPopupTimeout = setTimeout(() => {
          this._reportOAuthError({
            state: this.requestOptions.state,
            code: 'auth_error',
            message:
              'No response from the server.'
          });
        }, 1000);
      }
    }
  }

  /**
   * Computes authorization URL
   * @param {Object} opts See options for `launchWebAuthFlow`
   * @return {String} Complete authorization URL.
   */
  computeAuthorizationUrl(opts) {
    let cnf = this.oauthConfig;
    let url = cnf.auth_uri + '?';
    url += 'client_id=' + encodeURIComponent(cnf.client_id);
    url += '&redirect_uri=' + encodeURIComponent(cnf.redirect_uri);
    url += '&response_type=' + cnf.response_type;
    let scopes = opts.scopes || this.oauthConfig.scopes;
    if (scopes) {
      url += '&scope=' + this.computeScope(scopes);
    }
    url += '&state=' + this.setStateParameter(opts.state);
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
    if (!scopes) {
      return '';
    }
    let scope = scopes.join(' ');
    return encodeURIComponent(scope);
  }
  /**
   * Asserts that the OAuth configuration is valid.
   *
   * This throws an error when configuration is invalid with error message.
   */
  assertOAuthOptions() {
    let cnf = this.oauthConfig;
    let messages = [];
    if (!cnf.client_id) {
      messages.push('"client_id" is required but is missing.');
    }
    if (!cnf.auth_uri) {
      messages.push('"auth_uri" is required but is missing.');
    }
    if (!cnf.redirect_uri) {
      messages.push('"redirect_uri" is required but is missing.');
    }
    if (cnf.response_type === 'code') {
      if (!cnf.client_secret) {
        messages.push(
          '"code" response type requires "client_secret" to be set.'
        );
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
   * @param {Object} tokenInfo A token info object.
   * @param {Array<String>} scopes List of scopes to authorize.
   * @return {Boolean} True if requested scope is already authorized with this
   * token.
   */
  isTokenAuthorized(tokenInfo, scopes) {
    let grantedScopes = tokenInfo.scopes;
    if (!grantedScopes || !grantedScopes.length) {
      return true;
    }
    if (!scopes || !scopes.length) {
      return true;
    }
    grantedScopes = grantedScopes.map((scope) => scope.trim());
    scopes = scopes.map((scope) => scope.trim());
    let missing = scopes.find((scope) => {
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
    let promise;
    if (!this.tokenInfo) {
      promise = this.restoreTokenInfo();
    } else {
      promise = Promise.resolve(this.tokenInfo);
    }
    return promise
    .then((info) => {
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
    let bw = BrowserWindow.getAllWindows()[0]; // All schare the same session.
    let str = `localStorage.getItem('${this.cacheKey}')`;
    return bw.webContents.executeJavaScript(str)
    .then((data) => {
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
   * @return {Promise} Resolved promise when code is executed
   */
  storeToken(tokenInfo) {
    let bw = BrowserWindow.getAllWindows()[0];
    let str = `localStorage.setItem('${this.cacheKey}','`;
    str += JSON.stringify(tokenInfo);
    str += '\')';
    return bw.webContents.executeJavaScript(str);
  }
  /**
   * Checks if the token already expired.
   *
   * @param {Object} tokenInfo Token info object
   * @return {Boolean} True if the token is already expired and should be
   * reneved.
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
    let expiresIn = tokenInfo.expires_in || 3600;
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
   * @param {?String} state A state property if set.
   * @return {String} Generated state parameter.
   */
  setStateParameter(state) {
    if (!state) {
      state = '';
      let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
      possible += '0123456789';
      for (let i = 0; i < 12; i++) {
        state += possible.charAt(Math.floor(Math.random() * possible.length));
      }
    }
    this.lastState = state;
    return state;
  }
}
/**
 * Class that manages OAuth2 identities.
 */
class ArcIdentity {
  /**
   * Listens for the renderer process events related to OAuth provider.
   */
  static listen() {
    ipcMain.on('oauth-2-get-token', ArcIdentity._getTokenHandler);
    ipcMain.on('oauth-2-launch-web-flow', ArcIdentity._launchWebFlowHandler);
  }
  /**
   * Handler for the `oauth-2-get-token` event from the render process.
   * Lunches the default OAuth flow with properties read from the manifest file.
   *
   * @param {Object} event
   * @param {Object} options Oauth options. See `ArcIdentity.getAuthToken`
   * for description
   */
  static _getTokenHandler(event, options) {
    ArcIdentity.getAuthToken(options)
    .then((token) => {
      event.sender.send('oauth-2-token-ready', token);
    })
    .catch((cause) => {
      event.sender.send('oauth-2-token-error', cause);
    });
  }
  /**
   * Handler for the `oauth-2-launch-web-flow` event from the render process.
   * Lunches OAuth flow in browser window.
   *
   * @param {Object} event
   * @param {Object} options Oauth options. See `ArcIdentity.launchWebAuthFlow`
   * for description
   * @param {String} id Id generated in the renderer to recognize the request.
   */
  static _launchWebFlowHandler(event, options, id) {
    ArcIdentity.launchWebAuthFlow(options)
    .then((token) => {
      event.sender.send('oauth-2-token-ready', token, id);
    })
    .catch((cause) => {
      event.sender.send('oauth-2-token-error', cause, id);
    });
  }
  /**
   * Generates a provider ID as an identifier for an identity
   *
   * @param {String} authUrl User authorization URI
   * @param {String} clientId Client ID
   * @return {String} An ID to be used to identity a provider.
   */
  static _generateProviderId(authUrl, clientId) {
    return encodeURIComponent(authUrl) + '/' + encodeURIComponent(clientId);
  }
  /**
   * Adds a provider to the list of existing (cached) providers.
   *
   * @param {IdentityProvider} provider Provider to cache.
   */
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
   * @return {IdentityProvider} An identity provider or `undefined` if
   * not exists.
   */
  static _getProvider(authUrl, clientId) {
    if (!ArcIdentity.__providers) {
      return;
    }
    const id = ArcIdentity._generateProviderId(authUrl, clientId);
    return ArcIdentity.__providers.find((item) => item.id === id);
  }
  /**
   * Runs the web authorization flow.
   * @param {Object} opts Authorization options
   * - `interactive` {Boolean} If the interactive flag is `true`,
   * `launchWebAuthFlow` will prompt the user as necessary. When the flag
   * is `false` or omitted,
   * `launchWebAuthFlow` will return failure any time a prompt would be
   * required.
   * - `response_type` {String} `code` or `token`.
   * - `scopes` {Array<String>} List of scopes to authorize
   * - `client_id` {String} The client ID used for authorization
   * - `auth_uri` {String} Authorization URI
   * - `token_uri` {String} Optional, required if `response_type` is code
   * - `redirect_uri` {String} Auth redirect URI
   * - `client_secret` {String} Optional, required if `response_type` is code
   * - `include_granted_scopes` {Boolean} Optional.
   * - `login_hint` {String} Optional, user email
   * @return {Promise} A promise with auth result.
   */
  static launchWebAuthFlow(opts) {
    let provider = ArcIdentity._getOrCreateProvider(opts);
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
    .then((config) => ArcIdentity._getOrCreateProvider(config))
    .then((provider) => provider.getAuthToken(opts));
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
    return fs.readJson(path.join(__dirname, '..', '..', 'package.json'))
    .then((packageInfo) => packageInfo.oauth2)
    .then((config) => {
      ArcIdentity.__oauthConfig = config;
      return config;
    });
  }
  /**
   * Returns chached provider or creates new provider based on the oauth
   * configuration.
   *
   * @param {Object} oauthConfig OAuth2 configuration object.
   * @return {IdentityProvider} Identity provider for given config.
   */
  static _getOrCreateProvider(oauthConfig) {
    let provider = ArcIdentity._getProvider(
      oauthConfig.auth_uri, oauthConfig.client_id);
    if (!provider) {
      const id = ArcIdentity._generateProviderId(oauthConfig.auth_uri,
        oauthConfig.client_id);
      const cnf = Object.assign({}, oauthConfig);
      if (!cnf.response_type) {
        cnf.response_type = 'token';
        cnf.include_granted_scopes = true;
      }
      provider = new IdentityProvider(id, cnf);
      ArcIdentity._setProvider(provider);
    }
    return provider;
  }
}
exports.ArcIdentity = ArcIdentity;
