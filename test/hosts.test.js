const assert = require('chai').assert;
const {SocketRequest} = require('../scripts/renderer/socket-request.js');
const http = require('http');

global.performance = {
  now: function() {
    return Date.now();
  }
};
global.Headers = require('node-fetch').Headers;
global.Request = require('node-fetch').Request;
global.Response = require('node-fetch').Response;

describe('Hosts', function() {
  const hosts = [{
    from: 'domain.com/api',
    to: '127.0.0.1:8123/test'
  }];

  const requests = [{
    url: 'http://domain.com/api/endpoint?query=param',
    method: 'GET',
    headers: ''
  }];

  it('Should set hosts property', function() {
    const request = new SocketRequest(requests[0], {
      hosts: hosts
    });
    assert.equal(request.hosts === hosts, true);
  });

  it('Should set uri with changed url', function() {
    const request = new SocketRequest(requests[0], {
      hosts: hosts
    });
    assert.equal(request.uri.href, 'http://127.0.0.1:8123/test/endpoint?query=param');
  });

  it('Should set hostHeader property', function() {
    const request = new SocketRequest(requests[0], {
      hosts: hosts
    });
    assert.equal(request.hostHeader, 'domain.com');
  });

  it('Should add original host header value', function() {
    const request = new SocketRequest(requests[0], {
      hosts: hosts
    });
    let message = request._prepareMessage().toString();
    assert.isAbove(message.indexOf('Host: domain.com'), 1);
  });

  it('Should redirect the request', function(done) {
    const server = http.createServer(function(req, res) {
      res.writeHead(200, {
        'Content-Type': 'text/plain'
      });
      res.end('okay');
      server.close();
      assert.equal(req.headers.host, 'domain.com');
      done();
    });
    server.listen(8123);
    const request = new SocketRequest(requests[0], {
      hosts: hosts
    });
    let errorReported;
    request.send()
    .catch((error) => errorReported = error)
    .then(function() {
      if (errorReported) {
        server.close(function() {
          done(errorReported);
        });
      }
    });
  });
});
