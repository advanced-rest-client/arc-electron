import { OAuth2Bindings } from '../../../web_modules/index.js';

/** @typedef {import('@advanced-rest-client/events').Authorization.OAuth2Authorization} OAuth2Authorization */
/** @typedef {import('@advanced-rest-client/events').Authorization.TokenInfo} TokenInfo */
/** @typedef {import('@advanced-rest-client/events').Authorization.OidcTokenInfo} OidcTokenInfo */
/** @typedef {import('@advanced-rest-client/events').Authorization.OidcTokenError} OidcTokenError */
/** @typedef {import('@advanced-rest-client/events').Authorization.TokenRemoveOptions} TokenRemoveOptions */

export class OAuth2BindingsElectron extends OAuth2Bindings {
  get redirectUri() {
    return 'https://auth.advancedrestclient.com/oauth2';
  }

  /**
   * Performs OAuth2 authorization.
   * @param {OAuth2Authorization} config
   * @returns {Promise<TokenInfo>}
   */
  // @ts-ignore
  async oauth2Authorize(config) {
    // config.interactive = true;
    return ArcEnvironment.ipc.invoke('oauth2', 'launchWebFlow', config);
  }

  /**
   * Removes OAuth 2 tokens from the app store.
   * @param {TokenRemoveOptions} config
   * @returns {Promise<void>}
   */
  async oauth2RemoveToken(config) {
    return ArcEnvironment.ipc.invoke('oauth2', 'removeToken', config);
  }

  /**
   * Performs OAuth2 Open ID Connect authorization.
   * @param {OAuth2Authorization} config
   * @returns {Promise<(OidcTokenInfo | OidcTokenError)[]>}
   */
  // @ts-ignore
  async oidcAuthorize(config) {
    return ArcEnvironment.ipc.invoke('oidc', 'getToken', config);
  }

  /**
   * Removes Open ID Connect tokens from the app store.
   * @param {TokenRemoveOptions} config
   * @returns {Promise<void>}
   */
  async oidcRemoveTokens(config) {
    return ArcEnvironment.ipc.invoke('oidc', 'removeTokens', config);
  }
}
