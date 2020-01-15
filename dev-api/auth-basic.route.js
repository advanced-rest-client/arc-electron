import express from 'express';
import { BaseApi } from './base-api.js';

const router = express.Router();
export default router;

class AuthBaiscRoute extends BaseApi {
  sendUnauthorized(res) {
    res.status(401);
    res.set('WWW-Authenticate', 'Basic realm="This resource is protected"');
    res.send('Auth required');
  }

  requireAuthorized(req, res) {
    const auth = req.headers['authorization'];
    if (!auth) {
      this.sendUnauthorized(res);
      return;
    }
    const { username, password } = req.params;
    try {
      const parsed = auth.replace(/basic| /ig).trim();
      const buff = new Buffer(parsed, 'base64');
      const str = buff.toString('ascii');
      const [aUname, aPasswd] = str.split(':');
      if (username !== aUname || password !== aPasswd) {
        this.sendUnauthorized(res);
        return;
      }
    } catch (e) {
      this.sendUnauthorized(res);
      return;
    }
    this.printDefaultResponse(req, res);
  }
}

const api = new AuthBaiscRoute();
api.setCors(router);
api.wrapApi(router, [
  ['/:username/:password', 'requireAuthorized'],
]);
