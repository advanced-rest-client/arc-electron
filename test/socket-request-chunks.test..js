const assert = require('chai').assert;
const {SocketRequest} = require('../scripts/renderer/socket-request.js');

global.performance = {
  now: function() {
    return Date.now();
  }
};
global.Headers = require('node-fetch').Headers;
global.Request = require('node-fetch').Request;
global.Response = require('node-fetch').Response;

describe('Data buffer responses', function() {
  const requests = [{
    url: `http://localhost:8080/api/endpoint?query=param`,
    method: 'GET',
    headers: 'Host: test.com\nContent-Length: 0',
    payload: 'abc'
  }];

  const opts = [{
    timeout: 50000,
    followRedirects: false,
    hosts: [{
      from: 'domain.com',
      to: 'test.com'
    }]
  }];

  describe('Issue #75', function() {
    // https://github.com/advanced-rest-client/arc-electron/issues/75#issuecomment-399204512
    const parts = [
      Buffer.from([72,84,84,80,47,49,46,48,32,50,48,48,32,79,75,13,10,67,111,110,116,101,110,116,45,84,121,112,101,58,32,97,112,112,108,105,99,97,116,105,111,110,47,106,115,111,110,13,10,67,111,110,116,101,110,116,45,76,101,110,103,116,104,58,32,49,49,52,13,10]),
      Buffer.from([83,101,114,118,101,114,58,32,87,101,114,107,122,101,117,103,47,48,46,49,52,46,49,32,80,121,116,104,111,110,47,50,46,55,46,49,52,13,10,68,97,116,101,58,32,84,104,117,44,32,50,49,32,74,117,110,32,50,48,49,56,32,49,56,58,51,48,58,53,49,32,71,77,84,13,10,13,10,123,34,105,110,115,116,114,117,109,101,110,116,95,105,100,34,58,32,50,52,49,56,54,44,32,34,117,115,101,114,95,105,100,34,58,32,53,57,44,32,34,112,114,111,100,117,99,116,95,105,100,34,58,32,51,50,54,57,44,32,34,112,114,105,99,101,34,58,32,50,46,48,44,32,34,115,105,100,101,34,58,32,34,83,101,108,108,34,44,32,34,105,100,34,58,32,50,44,32,34,113,117,97,110,116,105,116,121,34,58,32,48,125,10]),

      // After processing status line
      Buffer.from([67,111,110,116,101,110,116,45,84,121,112,101,58,32,97,112,112,108,105,99,97,116,105,111,110,47,106,115,111,110,13,10,67,111,110,116,101,110,116,45,76,101,110,103,116,104,58,32,49,49,52,13,10])
    ];
    const headersMap = {
      'content-type': 'application/json',
      'content-length': '114',
      server: 'Werkzeug/0.14.1 Python/2.7.14',
      date: 'Thu, 21 Jun 2018 18:30:51 GMT'
    };
    let request;
    beforeEach(function() {
      request = new SocketRequest(requests[0], opts[0]);
      // console.log(parts[0].toString());
      // console.log('=======================');
      // console.log(parts[1].toString());
    });

    it('_processStatus returns data', function() {
      const result = request._processStatus(parts[0]);
      assert.equal(result.compare(parts[2]), 0);
    });

    it('Reads status line', function() {
      request._processSocketMessage(parts[0]);
      assert.equal(request._response.status, 200, 'Status code is set');
      assert.equal(request._response.statusMessage, 'OK', 'Status message is set');
    });

    it('Puts headers from part #1 after processing status to temp variable', () => {
      request._processHeaders(parts[2]);
      assert.equal(request._rawHeaders.compare(parts[2]), 0);
    });

    it('State is HEADERS after first part', function() {
      request._processSocketMessage(parts[0]);
      assert.equal(request.state, SocketRequest.HEADERS);
    });

    function processMessages() {
      request._processSocketMessage(parts[0]);
      request._processSocketMessage(parts[1]);
    }

    it('Processes both messages', function() {
      processMessages();
      assert.equal(request.state, SocketRequest.DONE);
    });

    it('Status is set', function() {
      processMessages();
      assert.equal(request._response.status, 200, 'Status code is set');
      assert.equal(request._response.statusMessage, 'OK', 'Status message is set');
    });

    it('Headers are set', function() {
      processMessages();
      assert.typeOf(request._response.headers, 'object');
      request._response.headers.forEach((value, name) => {
        assert.equal(headersMap[name], value);
      });
    });

    it('Body is set', function() {
      processMessages();
      assert.isTrue(request._rawBody instanceof Buffer);
    });
  });
});
