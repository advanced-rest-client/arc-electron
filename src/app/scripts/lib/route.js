/**
 * @typedef Route
 * @property {string} name The name of the route
 * @property {string} pattern The pattern to evaluate
 */
/**
 * @typedef RouteResult
 * @property {Route} route The matched route
 * @property {object=} params Captured parameters
 */

/**
 * @param {string} value The pattern to evaluate
 * @return {RegExp}
 */
function getPattern(value) {
  return new RegExp(`^${value}$`);
}

/**
 * @param {string} uri The path value of the current URL.
 * @param {string} pattern The pattern to evaluate
 * @return {boolean}
 */
export function testRoute(uri, pattern) {
  return getPattern(pattern).test(uri);
}

/**
 * @param {string} pattern The pattern to evaluate
 * @param {string} uri The path value of the current URL.
 * @return {object}
 */
export function parseParams(pattern, uri) {
  const r = getPattern(pattern);
  const match = r.exec(uri);
  // @ts-ignore
  const { groups } = match;
  const result = {};
  if (groups) {
    Object.keys(groups).forEach((key) => {
      let value = /** @type String */ (groups[key]);
      if (value[0] === '/') {
        value = value.substr(1);
      }
      if (value.includes('/')) {
        result[key] = value.split('/').map((i) => decodeURIComponent(i));
      } else {
        result[key] = decodeURIComponent(value);
      }
    });
  }
  return result
}

/**
 * @param {Route[]} routes List of routes to evaluate
 * @param {string} path Current path
 * @return {RouteResult|null}
 */
export function findRoute(routes, path) {
  const activeRoute = routes.find((route) => route.pattern !== '*' && testRoute(path, route.pattern));
  if (activeRoute) {
    const params = parseParams(activeRoute.pattern, path);
    return {
      route: activeRoute,
      params,
    }
  }
  const notFoundRoute = routes.find((route) => route.pattern === '*');
  if (notFoundRoute) {
    return {
      route: notFoundRoute,
    };
  }
  return null;
}

/**
 * Navigates to another page.
 * 
 * @param {string} htmlFile The relative location of the target HTML file.
 * @param {...string} route Optional route params to add to the has part of the url.
 */
export function navigatePage(htmlFile, ...route) {
  const hash = route.map(encodeURIComponent).join('/');
  const url = new URL(htmlFile, window.location.href);
  url.hash = hash;
  window.location.href = url.toString();
}

/**
 * Navigates to a route.
 * 
 * @param {...string} route Optional route params to add to the has part of the url.
 */
export function navigate(...route) {
  const hash = route.map(encodeURIComponent).join('/');
  const url = new URL(window.location.href);
  url.hash = hash;
  window.location.href = url.toString();
}