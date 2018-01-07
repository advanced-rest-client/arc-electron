const http = require('http');
const https = require('https');
const path = require('path');
const fs = require('fs');

const Chance = require('chance');
const chance = new Chance();

var srv;
var ssl;

require('ssl-root-cas')
.inject()
.addFile(path.join('test', 'certs', 'ca.cert.pem'));

function writeChunk(res) {
  res.write(chance.word({length: 128}) + '\n');
}

function writeChunkedResponse(res) {
  res.writeHead(200, {
    'Content-Type': 'text/plain; charset=UTF-8',
    'Transfer-Encoding': 'chunked'
  });
  writeChunk(res);
  var time = 0;
  for (var i = 0; i < 4; i++) {
    let timeout = chance.integer({min: 1, max: 10});
    time += timeout;
    setTimeout(writeChunk.bind(this, res), timeout);
  }
  time += 5;
  setTimeout(function() {
    res.end('END');
  }, time);
}

function connectedCallback(req, res) {
  writeChunkedResponse(res);
  console.log('Responding to a request.');
}

function connectedSslCallback(req, res) {
  writeChunkedResponse(res);
  console.log('Responding to an SSL request.');
}

exports.startServer = function(httpPort, sslPort) {
  srv = http.createServer(connectedCallback);
  srv.listen(httpPort);
  var options = {
    key: fs.readFileSync(path.join('test', 'certs', 'privkey.pem')),
    cert: fs.readFileSync(path.join('test', 'certs', 'fullchain.pem'))
  };
  ssl = https.createServer(options, connectedSslCallback);
  ssl.listen(sslPort);
};

exports.stopServer = function() {
  srv.close();
  ssl.close();
};
