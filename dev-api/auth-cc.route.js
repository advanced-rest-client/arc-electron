import express from 'express';
import { BaseApi } from './base-api.js';

const router = express.Router();
export default router;

class AuthCcRoute extends BaseApi {
  sendUnauthorized(res) {
    res.status(401);
    res.set('WWW-Authenticate', 'Basic realm="This resource is protected"');
    res.send('Auth required');
  }

  requireAuthorized(req, res) {
    if (typeof req.socket.getPeerCertificate !== 'function') {
      this.sendError(res, 'SSL connection is required.');
      return;
    }
    const cert = req.socket.getPeerCertificate();
    let status;
    let message;
    if (req.client.authorized) {
      status = 200;
      message = {
        authenticated: true,
        name: cert.subject.CN,
        issuer: cert.issuer.CN,
      };
    } else if (cert.subject) {
      status = 403;
      message = {
        authenticated: false,
        name: cert.subject.CN,
        issuer: cert.issuer.CN,
      };
    } else {
      status = 401;
      message = {
        authenticated: false,
        name: 'Unknown',
        issuer: 'Unknown',
      };
    }
    res.writeHead(status, {
      'Content-Type': 'application/json; charset=UTF-8',
    });
    res.end(JSON.stringify(message));
  }
}

const api = new AuthCcRoute();
api.setCors(router);
api.wrapApi(router, [
  ['/', 'requireAuthorized'],
]);
