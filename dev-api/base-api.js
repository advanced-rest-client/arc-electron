import cors from 'cors';

export class BaseApi {
  constructor() {
    this._processCors = this._processCors.bind(this);
  }
  /**
   * Sets CORS on all routes for `OPTIONS` HTTP method.
   * @param {Object} router Express app.
   */
  setCors(router) {
    router.options('*', cors(this._processCors));
  }
  /**
   * Shorthand function to register a route on this class.
   * @param {Object} router Express app.
   * @param {Array<Array<String>>} routes List of routes. Each route is an array
   * where:
   * - index `0` is the API route, eg, `/api/models/:modelId`
   * - index `1` is the function name to call
   * - index `2` is optional and describes HTTP method. Defaults to 'get'.
   * It must be lowercase.
   */
  wrapApi(router, routes) {
    for (let i = 0, len = routes.length; i < len; i++) {
      const route = routes[i];
      const method = route[2] || 'get';
      const clb = this[route[1]].bind(this);
      router[method](route[0], cors(this._processCors), clb);
    }
  }
  /**
   * Sends error to the client in a standarized way.
   * @param {Object} res HTTP response object
   * @param {String} message Error message to send.
   * @param {?Number} status HTTP status code, default to 400.
   */
  sendError(res, message, status) {
    res.status(status || 400).send({
      error: true,
      message
    });
  }

  _processCors(req, callback) {
    const whitelist = [];
    const origin = req.header('Origin');
    let corsOptions;
    if (!origin) {
      corsOptions = { origin: false };
    } else if (origin.indexOf('http://localhost:') === 0 || origin.indexOf('http://127.0.0.1:') === 0) {
      corsOptions = { origin: true };
    } else if (whitelist.indexOf(origin) !== -1) {
      corsOptions = { origin: true };
    }
    if (corsOptions) {
      corsOptions.credentials = true;
      corsOptions.allowedHeaders = ['Content-Type', 'Authorization'];
      corsOptions.origin = origin;
    }
    callback(null, corsOptions);
  }
  /**
   * Creates a default response message and writes it to the response.
   * @param {Object} req
   * @param {Object} res
   */
  printDefaultResponse(req, res) {
    const result = {
      header: req.headers,
      url: req.url
    };
    if (req.body) {
      result.body = req.body;
    }
    res.send(result);
  }
}
