const {ipcRenderer} = require('electron');
/**
 * Class responsible for handing OAuth2 related events and to pass them to
 * the main script for futher processing.
 */
class OAuth2Handler {
  /**
   * @constructor
   */
  constructor() {
    this._tokenRequestedHandler = this._tokenRequestedHandler.bind(this);
    this._tokenErrorHandler = this._tokenErrorHandler.bind(this);
    this._tokenReadyHandler = this._tokenReadyHandler.bind(this);
    this._requestId = 0;
    this._activeIds = {};
  }
  /**
   * Generates request ID for the main page.
   * @return {Number} A request ID to the background page.
   */
  nextRequestId() {
    return ++this._requestId;
  }
  /**
   * Attaches listeners on the body element to listen for elements events.
   */
  listen() {
    document.body.addEventListener('oauth2-token-requested',
      this._tokenRequestedHandler);
    ipcRenderer.on('oauth-2-token-ready', this._tokenReadyHandler);
    ipcRenderer.on('oauth-2-token-error', this._tokenErrorHandler);
  }
  /**
   * Handler for the `oauth2-token-requested` custom event.
   *
   * @param {Event} e Request custom event.
   */
  _tokenRequestedHandler(e) {
    e.preventDefault();
    e.stopPropagation();
    let rt;
    if (e.detail.type === 'implicit') {
      rt = 'token';
    } else {
      rt = 'code';
    }
    let interactive;
    if (typeof e.detail.interactive === 'boolean') {
      interactive = e.detail.interactive;
    } else {
      interactive = true;
    }
    let state;
    if (!e.detail.state) {
      state = this.generateState();
    } else {
      state = e.detail.state;
    }
    const opts = {
      interactive: interactive,
      // jscs:disable
      response_type: rt,
      client_id: e.detail.clientId,
      auth_uri: e.detail.authorizationUrl,
      token_uri: e.detail.accessTokenUrl,
      client_secret: e.detail.clientSecret,
      redirect_uri: e.detail.redirectUrl,
      // jscs:enable
      scopes: e.detail.scopes,
      state: state
    };
    let id = this.nextRequestId();
    this._activeIds[id] = opts;
    ipcRenderer.send('oauth-2-launch-web-flow', opts, id);
  }

  /**
   * Generates `state` parameter for the OAuth2 call.
   *
   * @return {String} Generated state string.
   */
  generateState() {
    let text = '';
    let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    for (let i = 0; i < 6; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }
  /**
   * Fires custom event.
   *
   * @param {Strnig} type Event name
   * @param {Object} detail Value of the detail object.
   */
  fire(type, detail) {
    const ev = new CustomEvent(type, {
      bubbles: true,
      detail: detail
    });
    document.body.dispatchEvent(ev);
  }
  /**
   * Checks if given ID is on the active IDs lis, removes the ID from the list
   * and returns initial options for the request.
   *
   * @param {Number} id ID given back from the main process.
   * @return {Object|undefined} Request settings or undefined if not found
   */
  _checkAndRemoveRequestId(id) {
    let data = this._activeIds[id];
    if (data) {
      delete this._activeIds[id];
    }
    return data;
  }
  /**
   * Handler for the token error response.
   *
   * @param {Event} event
   * @param {Object} cause Error info.
   * @param {Number} id Generated and sent to main process ID
   */
  _tokenErrorHandler(event, cause, id) {
    let settings = this._checkAndRemoveRequestId(id);
    if (!settings) {
      return;
    }
    const detail = {
      interactive: settings.interactive,
      message: cause.message || cause || 'Unknown error',
      code: cause.code || 'unknown_error'
    };
    if (cause.state) {
      detail.state = cause.state;
    }
    this.fire('oauth2-error', detail);
  }
  /**
   * Handler for succesful OAuth token request.
   *
   * @param {Event} event
   * @param {Object} tokenInfo Token info object
   * @param {Number} id Generated and sent to main process ID
   */
  _tokenReadyHandler(event, tokenInfo, id) {
    let settings = this._checkAndRemoveRequestId(id);
    if (!settings) {
      return;
    }
    tokenInfo.interactive = settings.interactive;
    this.fire('oauth2-token-response', tokenInfo);
  }
}

exports.OAuth2Handler = OAuth2Handler;
