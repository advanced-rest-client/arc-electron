const http = require('http');
const https = require('https');
const path = require('path');
const fs = require('fs');

const Chance = require('chance');
const chance = new Chance();

const srvs = {
  srv: undefined,
  ssl: undefined
};

require('ssl-root-cas')
.inject()
.addFile(path.join('test', 'certs', 'ca.cert.pem'));
/**
 * Writes a chaunk of data to the response.
 *
 * @param {Object} res Node's response object
 */
function writeChunk(res) {
  res.write(chance.word({length: 128}) + '\n');
}
/**
 * Writes chunk type response to the client.
 *
 * @param {Object} res Node's response object
 */
function writeChunkedResponse(res) {
  res.writeHead(200, {
    'Content-Type': 'text/plain; charset=UTF-8',
    'Transfer-Encoding': 'chunked'
  });
  writeChunk(res);
  let time = 0;
  for (let i = 0; i < 4; i++) {
    let timeout = chance.integer({min: 1, max: 10});
    time += timeout;
    setTimeout(writeChunk.bind(this, res), timeout);
  }
  time += 5;
  setTimeout(function() {
    res.end('END');
  }, time);
}
/**
 * Callback for client connection.
 *
 * @param {[type]} req Node's request object
 * @param {Object} res Node's response object
 */
function connectedCallback(req, res) {
  writeChunkedResponse(res);
}
/**
 * Callback for client connection over SSL.
 *
 * @param {[type]} req Node's request object
 * @param {Object} res Node's response object
 */
function connectedSslCallback(req, res) {
  writeChunkedResponse(res);
}

exports.startServer = function(httpPort, sslPort) {
  srvs.srv = http.createServer(connectedCallback);
  srvs.srv.listen(httpPort);
  let options = {
    key: fs.readFileSync(path.join('test', 'certs', 'privkey.pem')),
    cert: fs.readFileSync(path.join('test', 'certs', 'fullchain.pem'))
  };
  srvs.ssl = https.createServer(options, connectedSslCallback);
  srvs.ssl.listen(sslPort);
};

exports.stopServer = function() {
  srvs.srv.close();
  srvs.ssl.close();
};
