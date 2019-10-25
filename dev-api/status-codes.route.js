import express from 'express';
import bodyParser from 'body-parser';
import { BaseApi } from './base-api.js';

const router = express.Router();
export default router;
router.use(bodyParser.json());

class StatusCodesRoute extends BaseApi {
  returnStatus(req, res) {
    const { status } = req.params;
    let parsedStatus = Number(status);
    if (parsedStatus !== parsedStatus) {
      parsedStatus = 200;
    }
    res.status(parsedStatus);
    this.printDefaultResponse(req, res);
    res.end();
  }

  returnMessage(req, res) {
    const { msg } = req.params;
    const message = decodeURIComponent(msg.replace(/\+/g, ' '));
    res.statusMessage = message;
    res.status(200);
    this.printDefaultResponse(req, res);
    res.end();
  }

  returnEmptyMessage(req, res) {
    res.writeHead(200, '', { 'Content-Type': 'text/plain' });
    res.end();
  }
}

const api = new StatusCodesRoute();
api.setCors(router);
api.wrapApi(router, [
  ['/code/:status', 'returnStatus'],
  ['/message/empty', 'returnEmptyMessage'],
  ['/message/:msg', 'returnMessage'],
]);
