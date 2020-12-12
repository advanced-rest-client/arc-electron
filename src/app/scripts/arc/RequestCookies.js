/** 
 * @TODO (pawel): This should probably be a part of @advanced-rest-client/request-engine.
 */

import { SessionCookieEvents } from '../../../../web_modules/@advanced-rest-client/arc-events/index.js';
import { Cookies } from '../../../../web_modules/@advanced-rest-client/arc-cookies/index.js';

/** @typedef {import('@advanced-rest-client/arc-types').ArcRequest.ArcEditorRequest} ArcEditorRequest */
/** @typedef {import('@advanced-rest-client/arc-types').ArcRequest.ArcBaseRequest} ArcBaseRequest */
/** @typedef {import('@advanced-rest-client/request-engine/src/types').ExecutionContext} ExecutionContext */
/** @typedef {import('@advanced-rest-client/arc-types').ArcResponse.Response} Response */
/** @typedef {import('@advanced-rest-client/arc-types').ArcResponse.ErrorResponse} ErrorResponse */
/** @typedef {import('@advanced-rest-client/arc-types').ArcResponse.ResponseRedirect} ResponseRedirect */
/** @typedef {import('@advanced-rest-client/arc-types').ArcRequest.TransportRequest} TransportRequest */
/** @typedef {import('@advanced-rest-client/cookie-parser/src/Cookie').Cookie} Cookie */
/** @typedef {import('@advanced-rest-client/arc-types').Cookies.ARCCookie} ARCCookie */

/* global ArcHeaders */

/**
 * Get cookies header value for given URL.
 *
 * @param {EventTarget} eventsTarget
 * @param {string} url An URL for cookies.
 * @return {Promise<string>} Promise that resolves to header value string.
 */
async function getCookiesHeaderValue(eventsTarget, url) {
  const cookies = await SessionCookieEvents.listUrl(eventsTarget, url);
  if (!cookies || !cookies.length) {
    return '';
  }
  return cookies.map((c) => `${c.name}=${c.value}`).join('; ');
}

/**
 * Applies cookie header value to current request headers.
 * If header to be applied is computed then it will alter headers string.
 *
 * Note, this element do not sends `request-headers-changed` event.
 *
 * @param {string} header Computed headers string
 * @param {ArcBaseRequest} request The request object from the event.
 */
function applyCookieHeader(header, request) {
  const trimmed = header.trim();
  if (!trimmed) {
    return;
  }
  const headers = new ArcHeaders(request.headers);
  headers.append('cookie', trimmed);
  request.headers = headers.toString();
}

/**
 * Extracts cookies from the `response` object and returns an object with `cookies` and `expired` properties containing array of cookies, each.
 *
 * @param {Response} response 
 * @param {string} url The request URL.
 * @param {ResponseRedirect[]} redirects List of redirect responses 
 * @return {Object<String, Cookie[]>} An object with `cookies` and `expired` arrays of cookies.
 */
function extract(response, url, redirects) {
  let expired = [];
  let parser;
  let exp;
  const parsers = [];
  if (redirects && redirects.length) {
    redirects.forEach((r) => {
      const headers = new ArcHeaders(r.response.headers);
      if (headers.has('set-cookie')) {
        parser = new Cookies(headers.get('set-cookie'), r.url);
        parser.filter();
        exp = parser.clearExpired();
        if (exp && exp.length) {
          expired = expired.concat(exp);
        }
        parsers.push(parser);
      }
    });
  }
  const headers = new ArcHeaders(response.headers);
  if (headers.has('set-cookie')) {
    parser = new Cookies(headers.get('set-cookie'), url);
    parser.filter();
    exp = parser.clearExpired();
    if (exp && exp.length) {
      expired = expired.concat(exp);
    }
    parsers.push(parser);
  }
  let mainParser = /** @type Cookies */ (null);
  parsers.forEach((item) => {
    if (!mainParser) {
      mainParser = item;
      return;
    }
    mainParser.merge(item);
  });
  return {
    cookies: mainParser ? mainParser.cookies : [],
    expired
  };
}

/**
 * A request engine request module to apply session cookies to a request.
 * It adds stored session cookies when application configuration applies for it (or request configuration, when apply)
 * 
 * Unregister this module when the application settings change to not to use session storage.
 * 
 * In ARC electron the session storage is a chrome persistent partition with a session shared with the "log in to a web service".
 * This way cookies can be acquired in through the browser login and store in the application to use them with the request.
 * 
 * @param {ArcEditorRequest} request 
 * @param {ExecutionContext} context 
 * @param {AbortSignal} signal 
 */
export async function processRequestCookies(request, context, signal) {
  const editorRequest = request.request;
  const { config } = editorRequest;
  const ignore = config && config.enabled === true && config.ignoreSessionCookies === true;
  if (ignore) {
    return;
  }
  const cookie = await getCookiesHeaderValue(context.eventsTarget, editorRequest.url);
  if (signal.aborted) {
    return;
  }
  applyCookieHeader(cookie, editorRequest);
}

/**
 * Processes cookies data from the response and inserts them into the session storage
 * 
 * @param {ArcEditorRequest} request 
 * @param {ExecutionContext} context 
 * @param {TransportRequest} executed The request reported by the transport library
 * @param {Response|ErrorResponse} response ARC response object.
 */
export async function processResponseCookies(request, executed, response, context) {
  const typedError = /** @type ErrorResponse */ (response);
  if (typedError.error) {
    return;
  }
  const editorRequest = request.request;
  const { config } = editorRequest;
  const ignore = config && config.enabled === true && config.ignoreSessionCookies === true;
  if (ignore) {
    return;
  }
  const typedResponse = /** @type Response */ (response);
  const result = extract(typedResponse, executed.url, typedResponse.redirects);
  await SessionCookieEvents.updateBulk(context.eventsTarget, result.cookies);
}
