const ipc = require('electron').ipcMain;
const url = require('url');
const {net} = require('electron');
const nodeNet = require('net');

class ElectronMainRequest {
  constructor() {
    this._abortHandler = this._abortHandler.bind(this);
    this._requestHandler = this._requestHandler.bind(this);
    this._pool = {};
  }

  listen() {
    ipc.on('abort-request', this._abortHandler);
    ipc.on('make-request', this._requestHandler);
  }

  unlisten() {
    ipc.removeListener('abort-request', this._abortHandler);
    ipc.removeListener('make-request', this._requestHandler);
  }

  _abortHandler(event, id) {
    var data = this._pool[id];
    if (!data) {
      return;
    }
    data.connection.abort();
    delete this._pool[id];
  }

  _requestHandler(event, request) {
    console.log(nodeNet);
    debugger;
    var id = request.id;
    this._pool[id] = {
      request: request,
      connection: this._makeRequest(request),
      redirects: []
    };
  }

  _makeRequest(data) {
    const requestUrl = url.parse(data.url);
    const request = net.request({
      method: data.method,
      protocol: requestUrl.protocol,
      hostname: requestUrl.hostname,
      port: requestUrl.port,
      path: requestUrl.path,
      redirect: 'manual'
    });
    this._assignListeners(request, data.id);
    this._writeHeaders(request, data.headers);
    this._writePayload(request, data.payload, data.method);
    request.end();
    return request;
  }

  _assignListeners(request, id) {
    request.on('login', this._loginHandler.bind(this));
    request.on('response', this._responseHandler.bind(this, id));
    request.on('error', this._errorHandler.bind(this, id));
    request.on('close', this._closeHandler.bind(this, id));
    request.on('redirect', this._redirectHandler.bind(this, id));
    request.on('socket', this._socketHandler.bind(this, id));
  }

  _writeHeaders(request, headers) {
    if (!headers) {
      return;
    }
    headers = headers.split(/\n(?=[^ \t]+)/gim);
    headers.forEach(line => {
      line = line.trim();
      if (!line) {
        return;
      }
      var pos = line.indexOf(':');
      if (pos === -1) {
        request.setHeader(line, '');
      } else {
        let name = line.substr(0, pos);
        let value = line.substr(pos + 1).trim();
        request.setHeader(name, value);
      }
    });
  }

  _writePayload(request, data, method) {
    if (!data) {
      return;
    }
    if (['get', 'head'].indexOf(method.toLowerCase()) !== -1) {
      return;
    }
    request.write(data);
  }

  _loginHandler(authInfo, callback) {
    // TODO: Create a dialog in the view.
    callback();
  }

  _responseHandler(id, response) {
    console.log('RESPONSE', id, response);
    const statusCode = response.statusCode;
    const statusMessage = response.statusMessage;
    const headers = Object.keys(response.headers).map(name => {
      return name + ': ' + response.headers[name];
    }).join('\n');
    response.pause();
    let rawData = '';
    response.on('data', (chunk) => { rawData += chunk; });
    response.on('end', () => {
      this._pool[id].response = {
        code: statusCode,
        message: statusMessage,
        headers: headers,
        payload: rawData
      };

      this._notifyResponse(id);
    });
    response.resume();
  }

  _errorHandler(id, error) {
    this._pool[id].error = error.message;
  }

  _closeHandler(id) {
    console.log('CLOSE', id);
    console.log(this._pool[id]);
  }

  _socketHandler(id) {
    console.log('socket', id);
  }

  _redirectHandler(id, code, method, url, headers) {
    console.log('redirect', id, code, method, url, headers);
    var obj = {
      statusCode: code,
      method: method,
      url: url,
      headers: this._computeHeadersValue(headers)
    };
    this._pool[id].redirects.push(obj);
    this._pool[id].connection.followRedirect();
  }

  _computeHeadersValue(headers) {
    if (!headers) {
      return '';
    }
    return Object.keys(headers).map(name => {
      return name + ': ' + headers[name].join(', ');
    })
    .join('\n');
  }

  _notifyResponse(id) {
    console.log('READY', id);
    console.log(this._pool[id]);
  }
}
exports.ElectronMainRequest = ElectronMainRequest;
